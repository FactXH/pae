import os
import sys

# Add PAE project root to Python path to access utils modules
PAE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if PAE_ROOT not in sys.path:
    sys.path.append(PAE_ROOT)

# Import utils modules now that path is set up
try:
    from utils.query_runner.query_runner import QueryRunner
    from utils.data_loader.loader import Loader
    from utils.dbt.dbt_runner import DBTRunner
    from utils.airtable.airtable_client import AirtableClient

except ImportError as e:
    print(f"Warning: Could not import utils modules: {e}")
    QueryRunner = None
    Loader = None
    DBTRunner = None

from ..models import Employee, PerformanceReview

class TairtableExporter:
    def __init__(self):
        self.tair_client = AirtableClient()

        self.employee_table_url = "https://airtable.com/app82aWzFKUVNZa3m/tbl8oOJfPgxSFmwq7"
        self.performance_review_table_url = "https://airtable.com/app82aWzFKUVNZa3m/tblkqCuQjkSYH83gd"

    def delete_everything(self):
        """
        Delete all employee records from the Tairtable employee table.
        """
        self.tair_client.delete_all_records(self.employee_table_url)
        self.tair_client.delete_all_records(self.performance_review_table_url)

    def delete_performance_reviews(self):
        """
        Delete all performance review records from the Tairtable performance review table.
        """
        self.tair_client.delete_all_records(self.performance_review_table_url)

    def _update_employee_from_tairtable(self, employee):
        employee_record_id = employee.tair_id
        if not employee_record_id:
            print(f"Employee {employee.full_name} does not have a tair_id. Skipping update.")
            return
        # Fetch record from Tairtable
        record = self.tair_client.get_record(self.employee_table_url, employee_record_id)
        if record:
            data = record.get('fields', {})
            # Update employee fields from Tairtable record
            employee.first_name = data.get('first_name', employee.first_name)
            employee.last_name = data.get('last_name', employee.last_name)
            employee.email = data.get('email', employee.email)
            employee.save()

    def _export_performance_review(self, review: PerformanceReview):
        """
        Export a single performance review to Tairtable.
        """
        fields = {
            "name": review.employee.full_name + ' ' + review.performance_name,
            "manager_score": review.overall_score,
            "self_score": review.self_score,
            "own_questionary": review.return_self_questionarie_markdown(),
            "manager_questionary": review.return_manager_questionarie_markdown(),
            "employees": [review.employee.tair_id],
        }

        if review.manager:
            fields["manager"] = [review.manager.tair_id]


        record = self.tair_client.create_record(self.performance_review_table_url, fields)

        if record and 'id' in record:
            review.tair_id = record['id']
            review.save()
            print(f"✅ Exported Performance Review '{review.performance_name}' with tair_id: {review.tair_id}")

    def _update_performance_review(self, review: PerformanceReview):
        """
        Update an existing performance review record in Tairtable.
        """
        if not review.tair_id:
            print(f"Performance Review '{review.performance_name}' does not have a tair_id. Cannot update.")
            return
        
        fields = {
            "name": review.employee.full_name + ' ' + review.performance_name,
            "manager_score": review.overall_score,
            "self_score": review.self_score,
            "own_questionary": review.return_self_questionarie_markdown(),
            "manager_questionary": review.return_manager_questionarie_markdown(),
            "employees": [review.employee.tair_id]
        }

        if review.manager:
            fields["manager"] = [review.manager.tair_id]
        
        self.tair_client.update_record(self.performance_review_table_url, review.tair_id, fields)
        print(f"🔄 Updated Performance Review '{review.performance_name}' in Tairtable.")

    def _export_employee(self, employee: Employee):
        """
        Export a single employee to Tairtable.
        """
        employee_data = {
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "full_name": employee.full_name,
            "employee_info": employee.get_all_info_markdown()
        }
        
        # print(f"Exporting employee: {employee.full_name}")
        record = self.tair_client.create_record(self.employee_table_url, employee_data)
        
        # Store the Airtable record ID back to the employee model
        if record and 'id' in record:
            employee.tair_id = record['id']
            employee.save()
            print(f"✅ Exported {employee.full_name} with tair_id: {employee.tair_id}")

    def _update_employee(self, employee: Employee):
        """
        Update an existing employee record in Tairtable.
        """
        if not employee.tair_id:
            print(f"Employee {employee.full_name} does not have a tair_id. Cannot update.")
            return
        
        employee_data = {
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "full_name": employee.full_name,
            "employee_info": employee.get_all_info_markdown(),
            "onboarding_date": employee.onboarding_date.isoformat() if employee.onboarding_date else None,
            "offboarding_date": employee.offboarding_date.isoformat() if employee.offboarding_date else None
        }
        
        self.tair_client.update_record(self.employee_table_url, employee.tair_id, employee_data)
        print(f"🔄 Updated {employee.full_name} in Tairtable.")