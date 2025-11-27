"""
Example usage of TrinoLoader - Creating and loading tables into Trino/Starburst Galaxy
"""

import os
import sys

# Set up path to include PAE root for utils import
current_dir = os.path.dirname(os.path.abspath(__file__))
pae_root_dir = os.path.dirname(current_dir)  # Go up one level to PAE root

if pae_root_dir not in sys.path:
    sys.path.insert(0, pae_root_dir)

import pandas as pd
from utils.trino.trino_loader import TrinoLoader

# ==================== EXAMPLE 1: Simple Table Creation ====================
def example_simple_table():
    """Create a simple table with employee matching data"""
    
    # Create sample data
    data = {
        'position_id': ['POS001', 'POS002', 'POS003'],
        'application_id': ['APP100', 'APP200', 'APP300'],
        'application_updated_at': pd.to_datetime(['2024-01-15', '2024-02-20', '2024-03-10']),
        'employee_id': ['EMP001', 'EMP002', 'EMP003']
    }
    df = pd.DataFrame(data)
    
    print("📊 Sample data:")
    print(df)
    
    # Initialize loader
    loader = TrinoLoader(
        schema='data_lake_dev_xavi_silver'
    )
    
    # Create table (replace if exists)
    loader.create_table_from_dataframe(
        df=df,
        table_name='aux_job_position_matching',
        if_exists='replace'
    )
    
    print("✅ Table created successfully!")


# ==================== EXAMPLE 2: Custom Column Types ====================
def example_custom_types():
    """Create a table with custom column types"""
    
    # Create sample data with various types
    data = {
        'employee_id': [1, 2, 3],
        'full_name': ['John Doe', 'Jane Smith', 'Bob Johnson'],
        'salary': [50000.50, 60000.75, 55000.25],
        'hire_date': pd.to_datetime(['2023-01-15', '2023-06-20', '2023-09-10']),
        'is_active': [True, True, False]
    }
    df = pd.DataFrame(data)
    
    # Initialize loader
    loader = TrinoLoader(schema='data_lake_dev_xavi_silver')
    
    # Create table with custom column types
    loader.create_table_from_dataframe(
        df=df,
        table_name='aux_employees_test',
        if_exists='replace',
        column_types={
            'employee_id': 'BIGINT',
            'full_name': 'VARCHAR',
            'salary': 'DECIMAL(10, 2)',
            'hire_date': 'DATE',
            'is_active': 'BOOLEAN'
        }
    )
    
    print("✅ Table with custom types created!")


# ==================== EXAMPLE 3: Append Data to Existing Table ====================
def example_append_data():
    """Append new rows to an existing table"""
    
    # Create initial data
    initial_data = {
        'position_id': ['POS001', 'POS002'],
        'application_id': ['APP100', 'APP200'],
        'employee_id': ['EMP001', 'EMP002']
    }
    df_initial = pd.DataFrame(initial_data)
    
    loader = TrinoLoader(schema='data_lake_dev_xavi_silver')
    
    # Create table
    print("📊 Creating initial table...")
    loader.create_table_from_dataframe(
        df=df_initial,
        table_name='aux_test_append',
        if_exists='replace'
    )
    
    # Create new data to append
    new_data = {
        'position_id': ['POS003', 'POS004'],
        'application_id': ['APP300', 'APP400'],
        'employee_id': ['EMP003', 'EMP004']
    }
    df_new = pd.DataFrame(new_data)
    
    # Append to existing table
    print("\n📊 Appending new rows...")
    loader.create_table_from_dataframe(
        df=df_new,
        table_name='aux_test_append',
        if_exists='append'
    )
    
    print("✅ Data appended successfully!")


# ==================== EXAMPLE 4: Large Dataset with Batching ====================
def example_large_dataset():
    """Create a table with many rows (batching handled automatically)"""
    
    # Create a large dataset
    num_rows = 5000
    data = {
        'id': range(1, num_rows + 1),
        'name': [f'Employee_{i}' for i in range(1, num_rows + 1)],
        'value': [i * 10.5 for i in range(1, num_rows + 1)],
        'created_at': pd.date_range(start='2024-01-01', periods=num_rows, freq='h')
    }
    df = pd.DataFrame(data)
    
    print(f"📊 Creating table with {len(df)} rows...")
    
    loader = TrinoLoader(schema='data_lake_dev_xavi_silver')
    
    # Create table (batching is automatic, default 1000 rows per batch)
    loader.create_table_from_dataframe(
        df=df,
        table_name='aux_large_dataset_test',
        if_exists='replace'
    )
    
    print("✅ Large table created successfully!")


# ==================== EXAMPLE 5: Query the Created Table ====================
def example_query_table():
    """Query data from a created table"""
    
    loader = TrinoLoader(schema='data_lake_dev_xavi_silver')
    
    # Query the table
    query = """
    SELECT *
    FROM data_lake_dev_xavi_silver.aux_job_position_matching
    LIMIT 10
    """
    
    print("🔍 Querying table...")
    df = loader.execute_query(query)
    
    print("\n📊 Query results:")
    print(df)
    
    return df


# ==================== EXAMPLE 6: Drop a Table ====================
def example_drop_table():
    """Drop a table from Trino"""
    
    loader = TrinoLoader(schema='data_lake_dev_xavi_silver')
    
    # Drop table
    loader.drop_table(
        table_name='aux_test_append',
        schema='data_lake_dev_xavi_silver'
    )
    
    print("✅ Table dropped!")


# ==================== EXAMPLE 7: Real-World Use Case - Detective Results ====================
def example_detective_results():
    """
    Real-world example: Create matching table from detective investigation results
    Similar to what TADetectiveV2.create_matching_table_in_trino() does
    """
    
    # Simulate detective matching results
    matching_data = [
        {
            'position_id': 'POS_12345',
            'application_id': 'APP_98765',
            'application_updated_at': pd.Timestamp('2024-06-15 14:30:00'),
            'employee_id': 'EMP_001'
        },
        {
            'position_id': 'POS_12346',
            'application_id': 'APP_98766',
            'application_updated_at': pd.Timestamp('2024-07-20 09:15:00'),
            'employee_id': 'EMP_002'
        },
        {
            'position_id': 'POS_12347',
            'application_id': 'APP_98767',
            'application_updated_at': pd.Timestamp('2024-08-10 16:45:00'),
            'employee_id': 'EMP_003'
        }
    ]
    
    df = pd.DataFrame(matching_data)
    
    print("📊 Detective matching results:")
    print(df)
    print(f"\nData types:\n{df.dtypes}")
    
    # Initialize loader
    loader = TrinoLoader(schema='data_lake_dev_xavi_silver')
    
    # Create matching table with explicit column types
    loader.create_table_from_dataframe(
        df=df,
        table_name='aux_job_position_matching',
        schema='data_lake_dev_xavi_silver',
        if_exists='replace',
        column_types={
            'position_id': 'VARCHAR',
            'application_id': 'VARCHAR',
            'application_updated_at': 'TIMESTAMP',
            'employee_id': 'VARCHAR'
        }
    )
    
    print("\n✅ Matching table created in Trino!")
    
    # Query to verify
    verify_query = """
    SELECT 
        position_id,
        application_id,
        application_updated_at,
        employee_id,
        COUNT(*) as record_count
    FROM data_lake_dev_xavi_silver.aux_job_position_matching
    GROUP BY position_id, application_id, application_updated_at, employee_id
    """
    
    print("\n🔍 Verifying table contents...")
    result = loader.execute_query(verify_query)
    print(result)


# ==================== RUN EXAMPLES ====================
if __name__ == "__main__":
    print("=" * 80)
    print("TRINO LOADER EXAMPLES")
    print("=" * 80)
    
    # Choose which example to run:
    
    # Example 1: Simple table creation
    # example_simple_table()
    
    # Example 2: Custom column types
    # example_custom_types()
    
    # Example 3: Append data
    # example_append_data()
    
    # Example 4: Large dataset
    # example_large_dataset()
    
    # Example 5: Query table
    # example_query_table()
    
    # Example 6: Drop table
    # example_drop_table()
    
    # Example 7: Real-world detective results (RECOMMENDED TO START)
    example_detective_results()
    
    print("\n" + "=" * 80)
    print("✅ Example completed!")
    print("=" * 80)
