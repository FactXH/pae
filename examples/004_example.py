
import os
import sys

# Set up path to include PAE root for utils import
current_dir = os.path.dirname(os.path.abspath(__file__))
pae_root_dir = os.path.dirname(current_dir)  # Go up one level to PAE root

if pae_root_dir not in sys.path:
    sys.path.insert(0, pae_root_dir)

from utils.query_runner.query_runner import QueryRunner


query = """
CREATE TABLE data_lake_dev_xavi_silver.test_python_query_runner AS
SELECT *
FROM data_lake_dev_xavi_silver.employees
LIMIT 10
"""

query_runner = QueryRunner()
df = query_runner.run_query(
    query,
    source='galaxy'
)

print(df)