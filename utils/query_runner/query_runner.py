
# Import the Athena query function from aws_client
from utils.clients.aws_client import query_athena
from typing import List, Optional
import pandas as pd
import os

from dotenv import load_dotenv

class QueryRunner:
    def __init__(self):
        pass

    def run_query(self, query: str, source: str = 'athena', dataframe: bool = True, **kwargs):
        if source == 'sqlite':
            import sqlite3
            import pandas as pd
            
            # Get database path from kwargs or use default
            db_path = kwargs.get('db_path', 'db.sqlite3')
            
            if not os.path.exists(db_path):
                raise FileNotFoundError(f"SQLite database not found at {db_path}")
            
            print(f"🔍 Executing SQLite query: {query}")
            
            conn = sqlite3.connect(db_path, timeout=60.0)
            try:
                df = pd.read_sql_query(query, conn)
                print(f"📊 Retrieved {len(df)} rows")
            finally:
                conn.close()
            
            if dataframe:
                return df
            else:
                return {'columns': list(df.columns), 'results': df.values.tolist()}
        elif source == 'athena':
            df = query_athena(query, **kwargs)
            if dataframe:
                return df
            else:
                return {'columns': list(df.columns), 'results': df.values.tolist()}
        elif source == 'postgres':
            from sqlalchemy import create_engine, text
            import pandas as pd
            
            connection_strin = "postgresql+psycopg2://pae_usr:pae_pwd@localhost:5432/pae"
            engine = create_engine(connection_strin)
            
            try:
                # Execute query with SQLAlchemy and handle immutabledict issues
                print(f"🔍 Executing PostgreSQL query: {query}")
                
                with engine.connect() as connection:
                    result = connection.execute(text(query))
                    
                    # Convert SQLAlchemy rows to regular dictionaries
                    rows = []
                    columns = list(result.keys())
                    
                    print(f"📋 Found columns: {columns}")
                    
                    for row in result:
                        # Convert each row to a regular dict to avoid immutabledict issues
                        row_dict = {}
                        for i, col in enumerate(columns):
                            row_dict[col] = row[i]
                        rows.append(row_dict)
                    
                    print(f"📊 Processed {len(rows)} rows")
                    
                    # Create DataFrame from clean Python dictionaries
                    df = pd.DataFrame(rows, columns=columns)
                    
            except Exception as e:
                print(f"⚠️ Error with manual row conversion, falling back to pd.read_sql_query: {e}")
                # Fallback to original method if our custom approach fails
                df = pd.read_sql_query(query, engine)
            
            if dataframe:
                return df
            else:
                return {'columns': list(df.columns), 'results': df.values.tolist()}
        elif source == 'galaxy':
            import trino
            import pandas as pd
            
            load_dotenv()
            # Get credentials from environment variables
            galaxy_username = os.getenv('galaxy_username')
            galaxy_password = os.getenv('galaxy_password')
            
            if not galaxy_username or not galaxy_password:
                raise ValueError("GALAXY_USERNAME and GALAXY_PASSWORD environment variables must be set")
            
            # Trino connection parameters
            trino_host = kwargs.get('host', 'factorial-aws-dev-data-dbt-galaxy.trino.galaxy.starburst.io')
            trino_port = kwargs.get('port', 443)
            trino_catalog = kwargs.get('catalog', 'aws_dev_data_glue_catalog')
            trino_schema = kwargs.get('schema', 'data_lake_dev_xavi_silver')
            
            print(f"🔍 Connecting to Trino (Galaxy) at https://{trino_host}:{trino_port}")
            
            # Use direct trino connection
            conn = trino.dbapi.connect(
                host=trino_host,
                port=trino_port,
                user=galaxy_username,
                http_scheme='https',
                auth=trino.auth.BasicAuthentication(galaxy_username, galaxy_password),
                catalog=trino_catalog,
                schema=trino_schema
            )
            
            try:
                print(f"🔍 Executing Trino query: {query}")
                cur = conn.cursor()
                cur.execute(query)
                
                # Fetch column names and data
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                
                # Create DataFrame
                df = pd.DataFrame(rows, columns=columns)
                print(f"📊 Retrieved {len(df)} rows")
            except Exception as e:
                print(f"❌ Error executing Trino query: {e}")
                raise
            finally:
                conn.close()
            
            if dataframe:
                return df
            else:
                return {'columns': list(df.columns), 'results': df.values.tolist()}
        else:
            raise ValueError(f"Unknown source: {source}")
    
    def run_fuzzy_match(
        self,
        source_query: str,
        target_query: str,
        match_configs: List,
        source: str = 'postgres',
        score_threshold: float = 60.0,
        return_top_n: int = 1,
        **kwargs
    ) -> pd.DataFrame:
        """
        Run fuzzy matching between results of two queries
        
        Args:
            source_query: SQL query to fetch source records
            target_query: SQL query to fetch target records
            match_configs: List of MatchConfig objects for FuzzyMatcher
            source: Database source ('postgres' or 'athena')
            score_threshold: Minimum match score (0-100)
            return_top_n: Number of top matches per source record
            **kwargs: Additional arguments for run_query
            
        Returns:
            DataFrame with fuzzy match results
            
        Example:
            from utils.data_matcher.matcher import MatchConfig
            from rapidfuzz import fuzz
            
            qr = QueryRunner()
            matches = qr.run_fuzzy_match(
                source_query="SELECT * FROM positions",
                target_query="SELECT * FROM postings",
                match_configs=[
                    MatchConfig('title', 'job_title', weight=0.7, scorer=fuzz.token_sort_ratio),
                    MatchConfig('team', 'team_name', weight=0.3)
                ],
                score_threshold=70.0,
                return_top_n=3
            )
        """
        from utils.data_matcher.matcher import FuzzyMatcher

        
        print(f"🔍 Fetching source records...")
        source_df = self.run_query(source_query, source=source, dataframe=True, **kwargs)
        print(f"✅ Loaded {len(source_df)} source records")
        
        print(f"🔍 Fetching target records...")
        target_df = self.run_query(target_query, source=source, dataframe=True, **kwargs)
        print(f"✅ Loaded {len(target_df)} target records")
        
        print(f"⚙️ Initializing fuzzy matcher...")
        matcher = FuzzyMatcher(
            match_configs=match_configs,
            score_threshold=score_threshold,
            combine_method='weighted'
        )
        
        print(f"🎯 Performing fuzzy matching...")
        matches_df = matcher.match(
            source_df=source_df,
            target_df=target_df,
            return_top_n=return_top_n
        )
        
        print(f"✅ Generated {len(matches_df)} matches")
        return matches_df