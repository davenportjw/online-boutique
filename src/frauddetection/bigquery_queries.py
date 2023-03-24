from helpers import run_bq_query

def create_customer_features_table(CUSTOMERS_BQ_TABLE_URI,
                                  RAW_BQ_TRANSACTION_TABLE_URI,
                                  DATAPROCESSING_START_DATE,
                                  DATAPROCESSING_END_DATE,
                                  RAW_BQ_LABELS_TABLE_URI):
    '''
    Creates a BigQuery table based on customer_id and their historical behavior for 1, 7, 14-days
    '''
    
    query = f"""
    CREATE OR REPLACE TABLE `{CUSTOMERS_BQ_TABLE_URI}` AS
    WITH
      -- query to join labels with features -------------------------------------------------------------------------------------------
      get_raw_table AS (
      SELECT
        raw_tx.tx_ts,
        raw_tx.tx_id,
        raw_tx.customer_id,
        raw_tx.location_id,
        raw_tx.tx_amount,
        IF(raw_lb.fraudulent, 1, 0) fraudulent
      FROM (
        SELECT
          *
        FROM
          `{RAW_BQ_TRANSACTION_TABLE_URI}`
        WHERE
          DATE(TX_TS) BETWEEN DATE_SUB("{DATAPROCESSING_START_DATE}", INTERVAL 15 DAY) AND "{DATAPROCESSING_END_DATE}"
        ) raw_tx
      LEFT JOIN 
        `{RAW_BQ_LABELS_TABLE_URI}` as raw_lb
      ON raw_tx.TX_ID = raw_lb.TX_ID),

      -- query to calculate CUSTOMER spending behaviour --------------------------------------------------------------------------------
      get_customer_spending_behaviour AS (
      SELECT
        tx_ts,
        tx_id,
        customer_id,
        location_id,
        tx_amount,
        fraudulent,

        # calc the number of customer tx over daily windows per customer (1, 7 and 15 days, expressed in seconds)
        COUNT(fraudulent) OVER (PARTITION BY customer_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 86400 PRECEDING
          AND CURRENT ROW ) AS CUSTOMER_ID_NB_TX_1DAY_WINDOW,
        COUNT(fraudulent) OVER (PARTITION BY customer_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 604800 PRECEDING
          AND CURRENT ROW ) AS CUSTOMER_ID_NB_TX_7DAY_WINDOW,
        COUNT(fraudulent) OVER (PARTITION BY customer_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 1209600 PRECEDING
          AND CURRENT ROW ) AS CUSTOMER_ID_NB_TX_14DAY_WINDOW,

        # calc the customer average tx amount over daily windows per customer (1, 7 and 15 days, expressed in seconds, in dollars ($))
        AVG(fraudulent) OVER (PARTITION BY customer_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 86400 PRECEDING
          AND CURRENT ROW ) AS CUSTOMER_ID_AVG_AMOUNT_1DAY_WINDOW,
        AVG(fraudulent) OVER (PARTITION BY customer_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 604800 PRECEDING
          AND CURRENT ROW ) AS CUSTOMER_ID_AVG_AMOUNT_7DAY_WINDOW,
        AVG(fraudulent) OVER (PARTITION BY customer_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 1209600 PRECEDING
          AND CURRENT ROW ) AS CUSTOMER_ID_AVG_AMOUNT_14DAY_WINDOW,
      FROM get_raw_table)

    # Create the table with CUSTOMER and LOCATION features ----------------------------------------------------------------------------
    SELECT
      tx_id,
      PARSE_TIMESTAMP("%Y-%m-%d %H:%M:%S", FORMAT_TIMESTAMP("%Y-%m-%d %H:%M:%S", TX_TS, "UTC")) AS feature_ts,
      CUSTOMER_ID AS customer_id,
      CAST(CUSTOMER_ID_NB_TX_1DAY_WINDOW AS INT64) AS customer_id_nb_tx_1day_window,
      CAST(CUSTOMER_ID_NB_TX_7DAY_WINDOW AS INT64) AS customer_id_nb_tx_7day_window,
      CAST(CUSTOMER_ID_NB_TX_14DAY_WINDOW AS INT64) AS customer_id_nb_tx_14day_window,
      CAST(CUSTOMER_ID_AVG_AMOUNT_1DAY_WINDOW AS FLOAT64) AS customer_id_avg_amount_1day_window,
      CAST(CUSTOMER_ID_AVG_AMOUNT_7DAY_WINDOW AS FLOAT64) AS customer_id_avg_amount_7day_window,
      CAST(CUSTOMER_ID_AVG_AMOUNT_14DAY_WINDOW AS FLOAT64) AS customer_id_avg_amount_14day_window,
    FROM
      get_customer_spending_behaviour
    """
    print(query)
    
    return run_bq_query(query)


def create_location_features_table(LOCATIONS_BQ_TABLE_URI,
                                  RAW_BQ_TRANSACTION_TABLE_URI,
                                  DATAPROCESSING_START_DATE,
                                  DATAPROCESSING_END_DATE,
                                  RAW_BQ_LABELS_TABLE_URI):
    query = f"""
    CREATE OR REPLACE TABLE `{LOCATIONS_BQ_TABLE_URI}` AS
    WITH
      -- query to join labels with features -------------------------------------------------------------------------------------------
      get_raw_table AS (
      SELECT
        raw_tx.tx_ts,
        raw_tx.tx_id,
        raw_tx.customer_id,
        raw_tx.location_id,
        raw_tx.tx_amount,
        IF(raw_lb.fraudulent, 1, 0) fraudulent
      FROM (
        SELECT
          *
        FROM
          `{RAW_BQ_TRANSACTION_TABLE_URI}`
        WHERE
          DATE(TX_TS) BETWEEN DATE_SUB("{DATAPROCESSING_START_DATE}", INTERVAL 15 DAY) AND "{DATAPROCESSING_END_DATE}"
        ) raw_tx
      LEFT JOIN 
        `{RAW_BQ_LABELS_TABLE_URI}` as raw_lb
      ON raw_tx.TX_ID = raw_lb.TX_ID),

      # query to calculate LOCATION spending behaviour --------------------------------------------------------------------------------
      get_variables_delay_window AS (
      SELECT
        tx_ts,
        tx_id,
        customer_id,
        location_id,

        # calc total amount of fraudulent tx and the total number of tx over the delay period per location (7 days - delay, expressed in seconds)
        SUM(fraudulent) OVER (PARTITION BY location_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 604800 PRECEDING
          AND CURRENT ROW ) AS NB_FRAUD_DELAY,
        COUNT(fraudulent) OVER (PARTITION BY location_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 604800 PRECEDING
          AND CURRENT ROW ) AS NB_TX_DELAY,

        # calc total amount of fraudulent tx and the total number of tx over the delayed window per location (window + 7 days - delay, expressed in seconds)
        SUM(fraudulent) OVER (PARTITION BY location_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 691200 PRECEDING
          AND CURRENT ROW ) AS NB_FRAUD_1_DELAY_WINDOW,
        SUM(fraudulent) OVER (PARTITION BY location_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 1209600 PRECEDING
          AND CURRENT ROW ) AS NB_FRAUD_7_DELAY_WINDOW,
        SUM(fraudulent) OVER (PARTITION BY location_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 1814400 PRECEDING
          AND CURRENT ROW ) AS NB_FRAUD_14_DELAY_WINDOW,
        COUNT(fraudulent) OVER (PARTITION BY location_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 691200 PRECEDING
          AND CURRENT ROW ) AS NB_TX_1_DELAY_WINDOW,
        COUNT(fraudulent) OVER (PARTITION BY location_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 1209600 PRECEDING
          AND CURRENT ROW ) AS NB_TX_7_DELAY_WINDOW,
        COUNT(fraudulent) OVER (PARTITION BY location_id ORDER BY UNIX_SECONDS(TX_TS) ASC RANGE BETWEEN 1814400 PRECEDING
          AND CURRENT ROW ) AS NB_TX_14_DELAY_WINDOW,
      FROM get_raw_table),

      # query to calculate LOCATION risk factors ---------------------------------------------------------------------------------------
      get_risk_factors AS (
      SELECT
        tx_ts,
        tx_id,
        customer_id,
        location_id,
        # calculate numerator of risk index
        NB_FRAUD_1_DELAY_WINDOW - NB_FRAUD_DELAY AS LOCATION_ID_NB_FRAUD_1DAY_WINDOW,
        NB_FRAUD_7_DELAY_WINDOW - NB_FRAUD_DELAY AS LOCATION_ID_NB_FRAUD_7DAY_WINDOW,
        NB_FRAUD_14_DELAY_WINDOW - NB_FRAUD_DELAY AS LOCATION_ID_NB_FRAUD_14DAY_WINDOW,
        # calculate denominator of risk index
        NB_TX_1_DELAY_WINDOW - NB_TX_DELAY AS LOCATION_ID_NB_TX_1DAY_WINDOW,
        NB_TX_7_DELAY_WINDOW - NB_TX_DELAY AS LOCATION_ID_NB_TX_7DAY_WINDOW,
        NB_TX_14_DELAY_WINDOW - NB_TX_DELAY AS LOCATION_ID_NB_TX_14DAY_WINDOW,
          FROM
        get_variables_delay_window),

      # query to calculate the LOCATION risk index -------------------------------------------------------------------------------------
      get_risk_index AS (
        SELECT
        tx_ts,
        tx_id,
        customer_id,
        location_id,
        LOCATION_ID_NB_TX_1DAY_WINDOW,
        LOCATION_ID_NB_TX_7DAY_WINDOW,
        LOCATION_ID_NB_TX_14DAY_WINDOW,
        # calculate the risk index
        (LOCATION_ID_NB_FRAUD_1DAY_WINDOW/(LOCATION_ID_NB_TX_1DAY_WINDOW+0.0001)) AS location_id_RISK_1DAY_WINDOW,
        (LOCATION_ID_NB_FRAUD_7DAY_WINDOW/(LOCATION_ID_NB_TX_7DAY_WINDOW+0.0001)) AS location_id_RISK_7DAY_WINDOW,
        (LOCATION_ID_NB_FRAUD_14DAY_WINDOW/(LOCATION_ID_NB_TX_14DAY_WINDOW+0.0001)) AS location_id_RISK_14DAY_WINDOW
        FROM get_risk_factors 
      )

    # Create the table with CUSTOMER and LOCATION features ----------------------------------------------------------------------------
    SELECT
      tx_id,
      PARSE_TIMESTAMP("%Y-%m-%d %H:%M:%S", FORMAT_TIMESTAMP("%Y-%m-%d %H:%M:%S", TX_TS, "UTC")) AS feature_ts,
      location_id AS location_id,
      CAST(LOCATION_ID_NB_TX_1DAY_WINDOW AS INT64) AS location_id_nb_tx_1day_window,
      CAST(LOCATION_ID_NB_TX_7DAY_WINDOW AS INT64) AS location_id_nb_tx_7day_window,
      CAST(LOCATION_ID_NB_TX_14DAY_WINDOW AS INT64) AS location_id_nb_tx_14day_window,
      CAST(location_id_RISK_1DAY_WINDOW AS FLOAT64) AS location_id_risk_1day_window,
      CAST(location_id_RISK_7DAY_WINDOW AS FLOAT64) AS location_id_risk_7day_window,
      CAST(location_id_RISK_14DAY_WINDOW AS FLOAT64) AS location_id_risk_14day_window,
    FROM
      get_risk_index
    """
    # print(query)
    
    return run_bq_query(query)

def create_training_data_table(TRAINING_DATA_BQ_TABLE_URI,
                                  RAW_BQ_TRANSACTION_TABLE_URI,
                                  RAW_BQ_LABELS_TABLE_URI,
                                  CUSTOMERS_BQ_TABLE_URI,
                                  LOCATIONS_BQ_TABLE_URI,
                                  DATAPROCESSING_START_DATE,
                                  DATAPROCESSING_END_DATE):
    query = f"""
    CREATE OR REPLACE TABLE `{TRAINING_DATA_BQ_TABLE_URI}` as (
        SELECT
            raw_tx.tx_ts,
            raw_tx.tx_id,
            raw_tx.customer_id,
            raw_tx.location_id,
            raw_tx.tx_amount,
            IF(raw_lb.fraudulent, 1, 0) fraudulent,        
            customer_features.* EXCEPT(feature_ts, tx_id, customer_id),
            location_features.* EXCEPT(feature_ts, tx_id, location_id)
        FROM 
            `{RAW_BQ_TRANSACTION_TABLE_URI}` as raw_tx
        LEFT JOIN 
            `{RAW_BQ_LABELS_TABLE_URI}` as raw_lb
        ON raw_tx.TX_ID = raw_lb.TX_ID 
        LEFT JOIN
            `{CUSTOMERS_BQ_TABLE_URI}` as customer_features
        ON raw_tx.TX_ID = customer_features.TX_ID
        LEFT JOIN
            `{LOCATIONS_BQ_TABLE_URI}` as location_features
        ON raw_tx.TX_ID = location_features.TX_ID
        WHERE
            DATE(raw_tx.TX_TS) BETWEEN DATE_SUB("{DATAPROCESSING_START_DATE}", INTERVAL 15 DAY) AND "{DATAPROCESSING_END_DATE}"
    );
    """
    print(query)
    
    return run_bq_query(query)

def create_bqml_model(PROJECT_ID,
                     MODEL_NAME,
                     VERTEX_AI_MODEL_ID,
                     TRAINING_DATA_BQ_TABLE_URI):

    sql_train_model_bqml = f"""
    CREATE OR REPLACE MODEL `{PROJECT_ID}.tx.{MODEL_NAME}` 
    OPTIONS(
      MODEL_TYPE="LOGISTIC_REG",
      INPUT_LABEL_COLS=["fraudulent"],
      EARLY_STOP=TRUE,
      MIN_REL_PROGRESS=0.01,
      model_registry="vertex_ai", 
      vertex_ai_model_id='{VERTEX_AI_MODEL_ID}',
      vertex_ai_model_version_aliases=['logit', 'experimental']
    ) AS

    SELECT
      * EXCEPT(customer_id, location_id, tx_id, tx_ts)
    FROM
       `{TRAINING_DATA_BQ_TABLE_URI}`
    """

    print(sql_train_model_bqml)

    res = run_bq_query(sql_train_model_bqml)

    print(f"Training job finished for: `{PROJECT_ID}.tx.{MODEL_NAME}`")
    
    return res