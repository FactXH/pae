

import boto3
import time
import pandas as pd

def query_athena(query, database='data_lake_bronze', workgroup='primary', sleep_time=2):
	"""
	Executes an Athena query and returns the results as a pandas DataFrame.
	Args:
		query (str): SQL query to execute
		database (str): Athena database name
		workgroup (str): Athena workgroup name
		sleep_time (int): Seconds to wait between status checks
	Returns:
		pd.DataFrame: Query results as DataFrame (no column renaming)
	"""
	print(f"Executing query on Athena database '{database}':\n{query}")
	athena = boto3.client('athena')
	response = athena.start_query_execution(
		QueryString=query,
		QueryExecutionContext={'Database': database},
		WorkGroup=workgroup
	)
	query_execution_id = response['QueryExecutionId']

	# Wait for the query to complete
	while True:
		result = athena.get_query_execution(QueryExecutionId=query_execution_id)
		status = result['QueryExecution']['Status']['State']
		if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
			break
		time.sleep(sleep_time)

	if status == 'SUCCEEDED':
		# Pagination for large result sets
		results = athena.get_query_results(QueryExecutionId=query_execution_id)
		columns = [col['Name'] for col in results['ResultSet']['ResultSetMetadata']['ColumnInfo']]
		rows = results['ResultSet']['Rows'][1:]
		data = []
		# Process first page
		for row in rows:
			data.append([col.get('VarCharValue', '') for col in row['Data']])
		# Paginate if necessary
		next_token = results.get('NextToken')
		while next_token:
			results = athena.get_query_results(QueryExecutionId=query_execution_id, NextToken=next_token)
			rows = results['ResultSet']['Rows']
			for row in rows:
				data.append([col.get('VarCharValue', '') for col in row['Data']])
			next_token = results.get('NextToken')
		df = pd.DataFrame(data, columns=columns)
		return df
	else:
		print(f"Query failed with status: {status}")
		breakpoint()
		raise Exception(f"Query failed with status: {status}")
