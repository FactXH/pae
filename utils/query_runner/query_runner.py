
# Import the Athena query function from aws_client
from utils.clients.aws_client import query_athena


class QueryRunner:
    def __init__(self):
        pass

    def run_query(self, query: str, source: str = 'athena', dataframe: bool = True, **kwargs):
        if source == 'athena':
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
        else:
            raise ValueError(f"Unknown source: {source}")