import os
import sys

# Set up path to include PAE root for utils import
current_dir = os.path.dirname(os.path.abspath(__file__))
pae_root_dir = os.path.dirname(current_dir)  # Go up one level to PAE root
pae_root_dir = os.path.dirname(pae_root_dir)  # Go up second level to PAE root

if pae_root_dir not in sys.path:
    sys.path.insert(0, pae_root_dir)


from utils.detective.ta_detective import TADetective

def main():
    detective = TADetective()
    emails = [
        'xavier.hita'
    ]
    for email in emails:
        detective.investigate_employee(email)

if __name__ == "__main__":
    main()