
from load_data import load_airtable_tables, load_basics_tables, load_levels
from utils.dbt.dbt_runner import DBTRunner

if __name__ == "__main__":
    # load_airtable_tables()
    # load_basics_tables()
    load_levels()
    # dbt_runner = DBTRunner()
    # dbt_runner.run_dbt_command("run --select +slv_memberships_cdc +br_athena_employee_managers_cdc")