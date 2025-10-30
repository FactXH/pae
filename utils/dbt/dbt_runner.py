import os


class DBTRunner:
    def __init__(self, project_dir = None, profiles_dir = None):
        self.project_dir = project_dir if project_dir else '/home/xavier/Documents/PAE/Projectes/pae/dbtt'
        # self.profiles_dir = profiles_dir if profiles_dir else '/home/xavier/.dbt/profiles.yml'

    def run_dbt_command(self, command):
        full_command = f"dbt {command} --project-dir {self.project_dir}"
        print(f"Running DBT command: {full_command}")
        os.system(full_command)
    
    def run_dbt_model_upstream(self, model_name):
        command = f"run --select +{model_name}"
        self.run_dbt_command(command)