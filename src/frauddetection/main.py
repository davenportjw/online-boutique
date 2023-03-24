# Data Engineering
import numpy as np
import pandas as pd

# Vertex AI and Vertex AI Feature Store
from google.cloud import aiplatform as vertex_ai
from google.cloud import bigquery      

from helpers import run_bq_query
from bigquery_queries import create_customer_features_table,\
                            create_location_features_table,\
                            create_training_data_table,\
                            create_bqml_model

PROJECT_ID = "cymbal-retail"
MODEL_NAME = "ff_model"
VERTEX_AI_MODEL_ID = "bqml_fraud_classifier"
ENDPOINT_NAME = "ff_endpoint"
REGION = "us-central1"

# Define the date range of transactions for feature engineering 
DATAPROCESSING_START_DATE = "2023-01-01" 
DATAPROCESSING_END_DATE = "2023-01-31" 

# Define BiqQuery dataset and tables to calculate features.
RAW_BQ_TRANSACTION_TABLE_URI = f"{PROJECT_ID}.ds_public.transactions"
RAW_BQ_LABELS_TABLE_URI = f"{PROJECT_ID}.ds_public.fraud_transactions"

# Set BigQuery table names
CUSTOMERS_TABLE_NAME = f"customers_{DATAPROCESSING_END_DATE.replace('-', '')}"
CUSTOMERS_BQ_TABLE_URI = f"{PROJECT_ID}.tx.{CUSTOMERS_TABLE_NAME}"
LOCATIONS_TABLE_NAME = f"locations_{DATAPROCESSING_END_DATE.replace('-', '')}"                    
LOCATIONS_BQ_TABLE_URI = f"{PROJECT_ID}.tx.{LOCATIONS_TABLE_NAME}"
TRAINING_DATA_TABLE_NAME = f"training_{DATAPROCESSING_END_DATE.replace('-', '')}"             
TRAINING_DATA_BQ_TABLE_URI = f"{PROJECT_ID}.tx.{TRAINING_DATA_TABLE_NAME}"

    
# Create a dataset called "tx"
run_bq_query(f"CREATE SCHEMA IF NOT EXISTS `{PROJECT_ID}.tx`")

# Create table for customer features
create_customer_features_table(CUSTOMERS_BQ_TABLE_URI,
                                  RAW_BQ_TRANSACTION_TABLE_URI,
                                  DATAPROCESSING_START_DATE,
                                  DATAPROCESSING_END_DATE,
                                  RAW_BQ_LABELS_TABLE_URI)

# # Create table for location features
create_location_features_table(LOCATIONS_BQ_TABLE_URI,
                                  RAW_BQ_TRANSACTION_TABLE_URI,
                                  DATAPROCESSING_START_DATE,
                                  DATAPROCESSING_END_DATE,
                                  RAW_BQ_LABELS_TABLE_URI)

# Create table for training data
create_training_data_table(TRAINING_DATA_BQ_TABLE_URI,
                                  RAW_BQ_TRANSACTION_TABLE_URI,
                                  RAW_BQ_LABELS_TABLE_URI,
                                  CUSTOMERS_BQ_TABLE_URI,
                                  LOCATIONS_BQ_TABLE_URI,
                                  DATAPROCESSING_START_DATE,
                                  DATAPROCESSING_END_DATE)

# Train a BQML model to predict fraud
create_bqml_model(PROJECT_ID,
                     MODEL_NAME,
                     VERTEX_AI_MODEL_ID,
                     TRAINING_DATA_BQ_TABLE_URI)


# Create a Vertex AI endpoint
endpoint = vertex_ai.Endpoint.create(
    display_name=ENDPOINT_NAME,
    project=PROJECT_ID,
    location=REGION,
)
print(endpoint.display_name)
print(endpoint.resource_name)

# Retrieve model in Model Registry
registry = vertex_ai.models.ModelRegistry(VERTEX_AI_MODEL_ID) # instantiate Model Registry
model = registry.get_model(version="logit") # get model trained earlier
print(model)

# Deploy model to a Vertex AI endpoint
model.deploy(endpoint=endpoint) # may take 10-15 minutes

