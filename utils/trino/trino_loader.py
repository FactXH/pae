"""
Trino Data Loader - Utilities for loading data into Trino/Starburst Galaxy
"""

import os
import pandas as pd
import trino
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List


class TrinoLoader:
    """
    Utility class for loading DataFrames into Trino tables
    """
    
    def __init__(
        self, 
        host: str = 'factorial-aws-dev-data-dbt-galaxy.trino.galaxy.starburst.io',
        port: int = 443,
        catalog: str = 'aws_dev_data_glue_catalog',
        schema: str = 'data_lake_dev_xavi_silver'
    ):
        """
        Initialize Trino connection
        
        Args:
            host: Trino host URL
            port: Trino port (default 443 for HTTPS)
            catalog: Trino catalog name
            schema: Default schema for operations
        """
        load_dotenv()
        
        self.host = host
        self.port = port
        self.catalog = catalog
        self.schema = schema
        
        # Get credentials from environment
        self.username = os.getenv('galaxy_username')
        self.password = os.getenv('galaxy_password')
        
        if not self.username or not self.password:
            raise ValueError("galaxy_username and galaxy_password environment variables must be set")
        
        print(f"🔌 Initialized TrinoLoader for {host}:{port}/{catalog}/{schema}")
    
    
    def _get_connection(self):
        """Create a new Trino connection"""
        return trino.dbapi.connect(
            host=self.host,
            port=self.port,
            user=self.username,
            http_scheme='https',
            auth=trino.auth.BasicAuthentication(self.username, self.password),
            catalog=self.catalog,
            schema=self.schema
        )
    
    
    def _infer_trino_type(self, dtype) -> str:
        """
        Infer Trino SQL type from pandas dtype
        
        Args:
            dtype: Pandas dtype
            
        Returns:
            Trino SQL type as string
        """
        dtype_str = str(dtype)
        
        if 'int' in dtype_str:
            return 'BIGINT'
        elif 'float' in dtype_str:
            return 'DOUBLE'
        elif 'bool' in dtype_str:
            return 'BOOLEAN'
        elif 'datetime' in dtype_str or 'timestamp' in dtype_str:
            return 'TIMESTAMP'
        elif 'date' in dtype_str:
            return 'DATE'
        else:
            return 'VARCHAR'
    
    
    def create_table_from_dataframe(
        self,
        df: pd.DataFrame,
        table_name: str,
        schema: Optional[str] = None,
        if_exists: str = 'fail',
        column_types: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Create a table in Trino from a pandas DataFrame
        
        Args:
            df: Pandas DataFrame with data to load
            table_name: Name of the table to create
            schema: Schema name (if None, uses default from __init__)
            if_exists: What to do if table exists: 'fail', 'replace', 'append'
            column_types: Optional dict mapping column names to Trino types
            
        Returns:
            True if successful, False otherwise
            
        Example:
            loader = TrinoLoader()
            df = pd.DataFrame({
                'position_id': [1, 2, 3],
                'application_id': [100, 200, 300],
                'employee_id': ['E001', 'E002', 'E003']
            })
            loader.create_table_from_dataframe(
                df, 
                'aux_job_position_matching',
                schema='data_lake_dev_xavi_silver'
            )
        """
        schema = schema or self.schema
        full_table_name = f"{schema}.{table_name}"
        
        print(f"📊 Creating table {full_table_name} from DataFrame with {len(df)} rows...")
        
        # Handle if_exists logic
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            # Check if table exists
            check_query = f"""
            SELECT COUNT(*) as cnt 
            FROM information_schema.tables 
            WHERE table_schema = '{schema}' 
            AND table_name = '{table_name}'
            """
            cur.execute(check_query)
            table_exists = cur.fetchone()[0] > 0
            
            if table_exists:
                if if_exists == 'fail':
                    raise ValueError(f"Table {full_table_name} already exists and if_exists='fail'")
                elif if_exists == 'replace':
                    print(f"🗑️ Dropping existing table {full_table_name}...")
                    cur.execute(f"DROP TABLE {full_table_name}")
                elif if_exists == 'append':
                    print(f"➕ Appending to existing table {full_table_name}...")
                    self._insert_data(cur, df, full_table_name)
                    conn.commit()
                    print(f"✅ Successfully appended {len(df)} rows to {full_table_name}")
                    return True
            
            # Create table schema
            print(f"🔨 Creating table schema...")
            columns_sql = []
            for col in df.columns:
                if column_types and col in column_types:
                    col_type = column_types[col]
                else:
                    col_type = self._infer_trino_type(df[col].dtype)
                columns_sql.append(f"{col} {col_type}")
            
            create_table_sql = f"""
            CREATE TABLE {full_table_name} (
                {', '.join(columns_sql)}
            )
            """
            
            print(f"📝 Executing: {create_table_sql}")
            cur.execute(create_table_sql)
            
            # Insert data
            print(f"💾 Inserting {len(df)} rows...")
            self._insert_data(cur, df, full_table_name)
            
            conn.commit()
            print(f"✅ Successfully created {full_table_name} with {len(df)} rows")
            return True
            
        except Exception as e:
            print(f"❌ Error creating table: {e}")
            conn.rollback()
            raise
        finally:
            cur.close()
            conn.close()
    
    
    def _insert_data(self, cursor, df: pd.DataFrame, full_table_name: str, batch_size: int = 1000):
        """
        Insert data from DataFrame into existing table using bulk INSERT
        
        Args:
            cursor: Trino cursor
            df: DataFrame with data
            full_table_name: Fully qualified table name (schema.table)
            batch_size: Number of rows per INSERT batch
        """
        # Replace NaN/None with NULL
        df_clean = df.where(pd.notnull(df), None)
        
        # Build column list
        columns = list(df.columns)
        columns_str = ', '.join(columns)
        
        # Insert in batches
        total_rows = len(df_clean)
        for start_idx in range(0, total_rows, batch_size):
            end_idx = min(start_idx + batch_size, total_rows)
            batch = df_clean.iloc[start_idx:end_idx]
            
            # Convert batch to list of tuples
            rows = [tuple(row) for row in batch.values]
            
            # Build VALUES clause for bulk insert
            values_parts = []
            for row in rows:
                # Format each value properly (handle strings, None, numbers, timestamps)
                formatted_values = []
                for val in row:
                    if val is None:
                        formatted_values.append('NULL')
                    elif isinstance(val, str):
                        # Escape single quotes
                        escaped_val = val.replace("'", "''")
                        formatted_values.append(f"'{escaped_val}'")
                    elif isinstance(val, pd.Timestamp):
                        formatted_values.append(f"TIMESTAMP '{val}'")
                    else:
                        formatted_values.append(str(val))
                
                values_parts.append(f"({', '.join(formatted_values)})")
            
            # Build single INSERT with all rows
            values_str = ', '.join(values_parts)
            bulk_insert_sql = f"INSERT INTO {full_table_name} ({columns_str}) VALUES {values_str}"
            
            # Execute bulk insert for this batch
            cursor.execute(bulk_insert_sql)
            
            print(f"   Inserted rows {start_idx + 1}-{end_idx} / {total_rows}")
    
    
    def execute_query(self, query: str) -> pd.DataFrame:
        """
        Execute a SELECT query and return results as DataFrame
        
        Args:
            query: SQL query to execute
            
        Returns:
            DataFrame with query results
        """
        print(f"🔍 Executing query...")
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            cur.execute(query)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            df = pd.DataFrame(rows, columns=columns)
            print(f"📊 Retrieved {len(df)} rows")
            return df
        finally:
            cur.close()
            conn.close()
    
    
    def drop_table(self, table_name: str, schema: Optional[str] = None):
        """
        Drop a table from Trino
        
        Args:
            table_name: Name of table to drop
            schema: Schema name (if None, uses default)
        """
        schema = schema or self.schema
        full_table_name = f"{schema}.{table_name}"
        
        print(f"🗑️ Dropping table {full_table_name}...")
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            cur.execute(f"DROP TABLE IF EXISTS {full_table_name}")
            conn.commit()
            print(f"✅ Table {full_table_name} dropped successfully")
        except Exception as e:
            print(f"❌ Error dropping table: {e}")
            raise
        finally:
            cur.close()
            conn.close()
