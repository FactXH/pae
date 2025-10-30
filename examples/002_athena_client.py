
import os
import sys

# Set up path to include PAE root for utils import
current_dir = os.path.dirname(os.path.abspath(__file__))
pae_root_dir = os.path.dirname(current_dir)  # Go up one level to PAE root

if pae_root_dir not in sys.path:
    sys.path.insert(0, pae_root_dir)

from utils.clients.aws_client import query_athena


if __name__ == "__main__":
    sample_query = """
    SELECT *
    FROM employees
    LIMIT 10;
    """
    df = query_athena(sample_query, workgroup='primary')
    print(df)