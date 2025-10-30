import os

from sqlalchemy import create_engine
from utils.query_builder.query_builder import QueryBuilder
from utils.clients.aws_client import query_athena

class Loader:
    def __init__(self):
        self.filepath = "filepath"

    def get_sqlalchemy_engine(self):
        connection_strin = "postgresql+psycopg2://pae_usr:pae_pwd@localhost:5432/pae"
        
        engine = create_engine(connection_strin)
        return engine
    
    def load_file_to_database(self, file_path, harcode_table_name=None):

        """
        Reads a CSV or Excel file using pandas and loads it into a PostgreSQL database using SQLAlchemy.
        Table names are prefixed with 'file_' and column names are cleaned (lowercase, spaces to underscores).
        Args:
            file_path (str): Path to the file.
        """
        extension = file_path.split('.')[-1].lower()
        import pandas as pd
        file_name = os.path.basename(file_path)
        table_name, _ = os.path.splitext(file_name)
        table_name = f"file_{table_name.lower().replace(' ', '_')}"
        engine = self.get_sqlalchemy_engine()

        if harcode_table_name:
            table_name = "file_" + harcode_table_name

        if extension == 'csv':
            df = pd.read_csv(file_path)
            # Clean DataFrame column names
            df.columns = [col.lower().replace(' ', '_') for col in df.columns]
            df.to_sql(table_name, engine, if_exists='replace', index=False)
            print(f"Data loaded into table '{table_name}' successfully.")

        elif extension in ['xlsx', 'xls']:
            xls = pd.ExcelFile(file_path)
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(xls, sheet_name=sheet_name)
                # Clean DataFrame column names
                df.columns = [col.lower().replace(' ', '_') for col in df.columns]
                # Create a table name based on file and sheet name, with 'file_' prefix
                table_name_sheet = f"{table_name}_{sheet_name}".lower().replace(' ', '_')
                df.to_sql(table_name_sheet, engine, if_exists='replace', index=False)
                print(f"Data from sheet '{sheet_name}' loaded into table '{table_name_sheet}' successfully.")

    def load_from_athena(self, table_name):
        print(f"Loading table: {table_name}")
        query_builder = QueryBuilder()
        query = query_builder.build_simple_extraction_query(table_name, 1)
        df = query_athena(query)
        if '.' in table_name:
            if 'gold' in table_name:
                database = 'gold'
            table_name = table_name.split('.')[-1] + '_' + database
        else:
            table_name = f"athena_{table_name}"

        df = df.applymap(lambda x: x.replace('\x00', '') if isinstance(x, str) else x)
        df.to_sql(table_name, self.get_sqlalchemy_engine(), if_exists='replace', index=False)
        print(f"Loaded {len(df)} rows into table '{table_name}'")

    def load_from_athena_not_factorial(self, table_name, hardcode_table_name=None):
        query = f"SELECT * FROM {table_name}"
        df = query_athena(query)
        table_name = f"athena_{hardcode_table_name}" if hardcode_table_name else f"athena_{table_name}"
        df.to_sql(table_name, self.get_sqlalchemy_engine(), if_exists='replace', index=False)

    def load_from_athena_custom_query(self, query, hardcode_table_name):
        df = query_athena(query)
        table_name = f"athena_{hardcode_table_name}" if hardcode_table_name else f"athena_{table_name}"
        df.to_sql(table_name, self.get_sqlalchemy_engine(), if_exists='replace', index=False)

    def load_from_dataframe(self, df, table_name):
        df.to_sql(table_name, self.get_sqlalchemy_engine(), if_exists='replace', index=False)
