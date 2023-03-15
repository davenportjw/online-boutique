if [ -z $1 ]
then
	echo "You need to pass in a project id as the first argument for the rest of the script."
	exit 1
fi
if [ -z $2 ]
then
	echo "You need to pass in a region as the first argument for the rest of the script."
	echo "Be sure that whichever region you select has AlloyDB available."
	exit 1
fi
if [ -z $3 ]
then
	echo "You need to specify a password for the AlloyDB instance. Be sure to take note of the password you set as the environment won't persist beyond the script."
	exit 1
fi

echo "Setting environment"

export PROJECT_ID=$1
export REGION=$2
export PGPASSWORD=$3

export USE_GKE_CLOUD_AUTH_PLUGIN=True
export ALLOYDB_NETWORK=default
export ALLOYDB_SERVICE_NAME=onlineboutique-network-range
export ALLOYDB_CLUSTER_NAME=onlineboutique-cluster
export ALLOYDB_INSTANCE_NAME=onlineboutique-instance

export ALLOYDB_DATABASE_NAME=carts
export ALLOYDB_TABLE_NAME=cart_items
export ALLOYDB_USER_GSA_NAME=alloydb-user-sa
export ALLOYDB_USER_GSA_ID=${ALLOYDB_USER_GSA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com
export CARTSERVICE_KSA_NAME=cartservice
export ALLOYDB_SECRET_NAME=alloydb-secret

echo "Enabling Google Cloud services"

gcloud services enable alloydb.googleapis.com > /dev/null 2>&1
gcloud services enable servicenetworking.googleapis.com > /dev/null 2>&1
gcloud services enable secretmanager.googleapis.com > /dev/null 2>&1


echo "Creating secret with database password."

echo ${PGPASSWORD} | gcloud secrets create ${ALLOYDB_SECRET_NAME} --data-file=- > /dev/null 2>&1

if [ $? -ne 0 ]; then
	echo "There was a problem creating the Secret in the project."
	exit 1
fi

echo "Creating network infrastructure."

gcloud compute addresses create ${ALLOYDB_SERVICE_NAME} \
--global \
--purpose=VPC_PEERING \
--prefix-length=16 \
--description="Online Boutique Private Services" \
--network=${ALLOYDB_NETWORK} \
 > /dev/null 2>&1

if [ $? -ne 0 ]; then
	echo "Unable to create the ip address allocation."
	exit 1
fi

gcloud services vpc-peerings connect \
--service=servicenetworking.googleapis.com \
--ranges=${ALLOYDB_SERVICE_NAME} \
--network=${ALLOYDB_NETWORK} \
 > /dev/null 2>&1

if [ $? -ne 0 ]; then
	echo "Unable to create the VPC-peering connection for private services."
	exit 1
fi

echo "Creating AlloyDB cluster."

gcloud alloydb clusters create ${ALLOYDB_CLUSTER_NAME} \
--region=${REGION} \
--password=${PGPASSWORD} \
--disable-automated-backup \
--network=${ALLOYDB_NETWORK} \
 > /dev/null 2>&1

if [ $? -ne 0 ]; then
	echo "Wasn't able to create the AlloyDB cluster."
	exit 1
fi

gcloud alloydb instances create ${ALLOYDB_INSTANCE_NAME} \
--cluster=${ALLOYDB_CLUSTER_NAME} \
--region=${REGION} \
--cpu-count=4 \
--instance-type=PRIMARY \
 > /dev/null 2>&1

if [ $? -ne 0 ]; then
	echo "Wasn't able to create the AlloyDB primary instance."
	exit 1
fi

gcloud alloydb instances create ${ALLOYDB_INSTANCE_NAME}-replica \
--cluster=${ALLOYDB_CLUSTER_NAME} \
--region=${REGION} \
--cpu-count=8 \
--instance-type=READ_POOL \
--read-pool-node-count=2

if [ $? -ne 0 ]; then
	echo "Wasn't able to create the AlloyhDB read pool."
	exit 1
fi

export ALLOYDB_PRIMARY_IP=$(gcloud alloydb instances list --region=${REGION} --cluster=${ALLOYDB_CLUSTER_NAME} --filter="INSTANCE_TYPE:PRIMARY" --format=flattened | sed -nE "s/ipAddress:\s*(.*)/\1/p")
export ALLOYDB_READ_IP=$(gcloud alloydb instances list --region=${REGION} --cluster=${ALLOYDB_CLUSTER_NAME} --filter="INSTANCE_TYPE:READ_POOL" --format=flattened | sed -nE "s/ipAddress:\s*(.*)/\1/p")

if [ $? -ne 0 ]; then
	echo "Problem fetching the IP addresses for our AlloyDB instances."
	exit 1
fi

echo "Configuring our AlloyDB instance."

psql -h ${ALLOYDB_PRIMARY_IP} -U postgres -c "CREATE DATABASE ${ALLOYDB_DATABASE_NAME}"

# If the first one of these fails, it means we have a problem on the database itself
if [ $? -ne 0 ]; then
	echo "There was a problem interacting with the AlloyDB instance."
	exit 1
fi

psql -h ${ALLOYDB_PRIMARY_IP} -U postgres -d ${ALLOYDB_DATABASE_NAME} -c "CREATE TABLE ${ALLOYDB_TABLE_NAME} (userId text, productId text, quantity int, PRIMARY KEY(userId, productId))"
psql -h ${ALLOYDB_PRIMARY_IP} -U postgres -d ${ALLOYDB_DATABASE_NAME} -c "CREATE INDEX cartItemsByUserId ON ${ALLOYDB_TABLE_NAME}(userId)"
psql -h ${ALLOYDB_PRIMARY_IP} -U postgres -d ${ALLOYDB_DATABASE_NAME} -c "CREATE EXTENSION IF NOT EXISTS google_ml_integration"

echo "Creating the service account for the GKE deployment."

gcloud iam service-accounts create ${ALLOYDB_USER_GSA_NAME} --display-name=${ALLOYDB_USER_GSA_NAME}

if [ $? -ne 0 ]; then
	echo "Couldn't create a service account"
	exit 1
fi

gcloud projects add-iam-policy-binding ${PROJECT_ID} --member=serviceAccount:${ALLOYDB_USER_GSA_ID} --role=roles/alloydb.client
gcloud projects add-iam-policy-binding ${PROJECT_ID} --member=serviceAccount:${ALLOYDB_USER_GSA_ID} --role=roles/secretmanager.secretAccessor

gcloud iam service-accounts add-iam-policy-binding ${ALLOYDB_USER_GSA_ID} \
--member "serviceAccount:${PROJECT_ID}.svc.id.goog[default/${CARTSERVICE_KSA_NAME}]" \
--role roles/iam.workloadIdentityUser

if [ $? -ne 0 ]; then
	echo "Couldn't grant the needed roles to the service account."
	exit 1
fi

echo "Customizing the k8s deployment with our AlloyDB pieces."

# Move into the kustomize directory
cd ../..

kustomize edit add component components/service-accounts
kustomize edit add component components/alloydb

if [ $? -ne 0 ]; then
	echo "Wasn't able to kustomize the components."
	exit 1
fi

echo "Customize the manifest to target our AlloyDB instance."

sed -i "s/PROJECT_ID_VAL/${PROJECT_ID}/g" components/alloydb/kustomization.yaml
sed -i "s/ALLOYDB_PRIMARY_IP_VAL/${ALLOYDB_PRIMARY_IP}/g" components/alloydb/kustomization.yaml
sed -i "s/ALLOYDB_USER_GSA_ID/${ALLOYDB_USER_GSA_ID}/g" components/alloydb/kustomize.yaml
sed -i "s/ALLOYDB_DATABASE_NAME_VAL/${ALLOYDB_DATABASE_NAME}/g" components/alloydb/kustomization.yaml
sed -i "s/ALLOYDB_TABLE_NAME_VAL/${ALLOYDB_TABLE_NAME}/g" components/alloydb/kustomization.yaml
sed -i "s/ALLOYDB_SECRET_NAME_VAL/${ALLOYDB_SECRET_NAME}/g" components/alloydb/kustomization.yaml

if [ $? -ne 0 ]; then
	echo "Wasn't able to customize our kustomization manifest."
	exit 1
fi

echo "Apply the AlloyDB kustomization over top the Online Boutique deployment."

kubectl apply -k .

exit 0
