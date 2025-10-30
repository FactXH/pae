import os
import sys
from pprint import pprint

sys.path.append("/home/xavier/Documents/PAE/Projectes/pae")

from manager_report_creator import ManagerAssessmentReportCreator, Manager
from utils.query_runner.query_runner import QueryRunner


def run_manager_assessment():
    # report_creator = ManagerAssessmentReportCreator()
    # report_creator.load_manager_assessment_data()
    # report_creator.process_manager_assessment_data()
    # report_creator.generate_report()

    manager = 'marc.castells@factorial.co'
    marc = Manager(manager)
    marc.do_everything()

    query_runner = QueryRunner()
    query = '''select distinct target_email from slv_manager_assessment_results;'''
    results = query_runner.run_query(query, source = 'postgres')
    
    for _,row in results.iterrows():
        email = row.to_dict()['target_email']
        mgr = Manager(email)
        print(f"Processing manager: {email}")
        mgr.do_everything()


def main():
    run_manager_assessment()

if __name__ == "__main__":
    main()
