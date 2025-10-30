import os
import sys

sys.path.append("/home/xavier/Documents/PAE/Projectes/pae")

from utils.data_files.change_decimal_separator import convert_decimal_separator

data_file = "/home/xavier/Documents/PAE/Projectes/pae/atickets/exits/data/exists.csv"
convert_decimal_separator(data_file)