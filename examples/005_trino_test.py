"""
Test direct Trino connection to debug the issue
"""
import os
from dotenv import load_dotenv
import trino

load_dotenv()

galaxy_username = os.getenv('galaxy_username')
galaxy_password = os.getenv('galaxy_password')

print(f"Username: {galaxy_username}")
print(f"Password: {'*' * len(galaxy_password) if galaxy_password else 'NOT SET'}")

# Try direct trino connection
conn = trino.dbapi.connect(
    host='factorial-dbt-test-cluster.trino.galaxy.starburst.io',
    port=443,
    user=galaxy_username,
    http_scheme='https',
    auth=trino.auth.BasicAuthentication(galaxy_username, galaxy_password),
    catalog='factorial_datalake_production',
    schema='data_lake_dev_xavi_silver'
)

cur = conn.cursor()
cur.execute('SELECT * FROM test_xavier LIMIT 10')
rows = cur.fetchall()
print(f"Got {len(rows)} rows")
print(rows)
