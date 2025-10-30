import os
import sys

sys.path.append("/home/xavier/Documents/PAE/Projectes/pae")


from utils.data_loader.loader import Loader
from utils.clients.aws_client import query_athena
from utils.query_builder.query_builder import QueryBuilder

data_file = "/home/xavier/Documents/PAE/Projectes/pae/atickets/climate_survey/data/test_file.xlsx"

loader = Loader()
loader.load_from_athena("teams")

# loader.load_file_to_database(data_file)
# query_builder = QueryBuilder()
# query = query_builder.build_simple_extraction_query("teams", 1)
# df = query_athena(query)
