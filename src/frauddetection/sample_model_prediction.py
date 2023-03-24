import json
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

vertex_ai.init(project=PROJECT_ID, location=REGION)

# Sample test data
sample_payload = {'tx_amount': 100.6,
                'customer_id_nb_tx_1day_window': 1,
                'customer_id_nb_tx_7day_window': 1,
                'customer_id_nb_tx_14day_window': 1,
                'customer_id_avg_amount_1day_window': 0.0,
                'customer_id_avg_amount_7day_window': 0.0,
                'customer_id_avg_amount_14day_window': 0.0,
                'location_id_nb_tx_1day_window': 0,
                'location_id_nb_tx_7day_window': 0,
                'location_id_nb_tx_14day_window': 0,
                'location_id_risk_1day_window': 0.0,
                'location_id_risk_7day_window': 0.0,
                'location_id_risk_14day_window': 0.0}


# Fetch endpoint
# Retrieve your Vertex AI endpoint name
endpoints = vertex_ai.Endpoint.list(
    filter=f"display_name={ENDPOINT_NAME}", # optional: filter by specific endpoint name
    order_by="update_time"
)

endpoint_id = endpoints[-1].name
endpoint = vertex_ai.Endpoint(endpoint_id)


# Make prediction
result = endpoint.predict(instances=[sample_payload])

print(result.predictions)

'''
[{'fraudulent_values': ['1', '0'],
  'predicted_fraudulent': ['0'],
  'fraudulent_probs': [0.002686789914452144, 0.9973132100855479]}]
'''