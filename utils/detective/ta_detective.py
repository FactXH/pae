# Class to store all gathered employee data
class InvestigatedEmployee:
  def __init__(self, factorial_employee_id=None, email=None, first_name=None, last_name=None, candidate_id=None, application_id=None):
    self.factorial_employee_id = factorial_employee_id
    self.email = email
    self.first_name = first_name
    self.last_name = last_name
    self.candidate_id = candidate_id
    self.application_id = application_id
    self.found_in_factorial = False

# TA Detective class for employee data tracing
from utils.query_runner.query_runner import QueryRunner

class TADetective:
  def __init__(self, results_folder="/home/xavier/Documents/pae/atickets/talend_dashboard/data/detective_results"):
    self.qr = QueryRunner()
    self.results_folder = results_folder

  def investigate_employee(self, email):
    print(f"\n--- TA Detective Report for {email} ---")
    emp = self.find_in_airtable(email)
    if emp.factorial_employee_id:
        emp = self.find_in_factorial(emp)
        if emp and emp.first_name is not None:
            emp.found_in_factorial = True
    else:
      print("No employee found in Airtable, skipping Factorial search.")
    # Continue passing emp to next steps if needed
    self.find_in_hires(email)
    self.find_applications(email)
    self.find_job_postings(email)

  def find_in_airtable(self, email):
    # Query Athena for id_empleado in Airtable
    query = f"""
      SELECT id_empleado
      FROM data_lake_bronze.airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7
      WHERE lower(email) like '{email}%'
    """
    df = self.qr.run_query(query, source='athena')
    if not df.empty:
      factorial_employee_id = df.iloc[0].get('id_empleado')
      emp = InvestigatedEmployee(factorial_employee_id=factorial_employee_id, email=email)
      print(f"Found in Airtable: id_empleado={emp.factorial_employee_id}")
      return emp
    else:
      print("Not found in Airtable.")
      return None

  def find_in_factorial(self, emp: 'InvestigatedEmployee'):
    # Query Athena for employee details by id
    if not emp or not emp.factorial_employee_id:
      print("No factorial_employee_id to search in Factorial.")
      return emp
    query = f"""
      WITH source_data AS (
        SELECT *, row_number() OVER (PARTITION BY id ORDER BY _event_ts DESC) rn
        FROM "data_lake_bronze"."employees"
        WHERE company_id = 1
      ),
      dedup_employees AS (
        SELECT * FROM source_data WHERE rn = 1 AND (_cdc IS NULL OR _cdc.op != 'D')
      )
      SELECT
        id AS employee_id,
        access_id,
        country,
        nationality,
        gender,
        termination_reason,
        tenure_start_date,
        terminated_on,
        termination_reason_type,
        manager_id
      FROM dedup_employees
      WHERE id = {emp.factorial_employee_id}
    """
    breakpoint()
    df = self.qr.run_query(query, source='athena')
    if not df.empty:
      row = df.iloc[0]
      emp.found_in_factorial = True
      print(f"Found in Factorial: employee_id={row.get('employee_id')}")
    else:
      print("Not found in Factorial.")
    return emp


  def find_in_hires(self, email):
    # Placeholder: implement candidate search by email
    pass

  def find_applications(self, email):
    # Placeholder: implement applications search by email
    pass

  def find_job_postings(self, email):
    # Placeholder: implement job posting search by email
    pass
