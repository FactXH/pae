import os
import sys

sys.path.append("/home/xavier/Documents/PAE/Projectes/pae")


from utils.data_loader.loader import Loader
from utils.clients.aws_client import query_athena
from utils.query_builder.query_builder import QueryBuilder

def load_data_from_athena():
    tables = ["teams", "memberships", "contracts_contract_versions", "employees"]

    loader = Loader()
    for table in tables:
        loader.load_from_athena(table)
        
    loader.load_from_athena_not_factorial("airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7", "airtable_people_todo")




def main():
    load_data_from_athena()


if __name__ == "__main__":
    main()