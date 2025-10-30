import os
import sys

sys.path.append("/home/xavier/Documents/PAE/Projectes/pae")


from utils.data_loader.loader import Loader

loader = Loader()
loader.print_name()


# from utils.load_file_to_database import load_file_to_database
# csv_path = os.path.join(root_dir, '_aprivate', 'source_data', 'Climate Survey Raw Answers.csv')

