from typing import List, Union
import pandas as pd

def run_bq_query(sql: str, show=False) -> Union[str, pd.DataFrame]:
    """
    Run a BigQuery query and return the job ID or result as a DataFrame
    Args:
        sql: SQL query, as a string, to execute in BigQuery
        show: A flag to show query result in a Pandas Dataframe
    Returns:
        df: DataFrame of results from query,  or error, if any
    """
    from google.cloud import bigquery
    
    bq_client = bigquery.Client()
    
    # Try dry run before executing query to catch any errors
    job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
    bq_client.query(sql, job_config=job_config)

    # If dry run succeeds without errors, proceed to run query
    job_config = bigquery.QueryJobConfig()
    client_result = bq_client.query(sql, job_config=job_config)

    job_id = client_result.job_id

    # Wait for query/job to finish running. then get & return data frame
    result = client_result.result()
    print(f"Finished job_id: {job_id}")
    
    if show:
        df = result.to_arrow().to_pandas()
        return df
    
    
