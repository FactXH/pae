import sys
import os
from django.db import models
from django.core.validators import EmailValidator, RegexValidator
from .base_model import BaseModel

# Add PAE project root to Python path to access utils modules
PAE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if PAE_ROOT not in sys.path:
    sys.path.append(PAE_ROOT)

# Import utils modules now that path is set up
try:
    from utils.query_runner.query_runner import QueryRunner
    from utils.data_loader.loader import Loader
    from utils.dbt.dbt_runner import DBTRunner
except ImportError as e:
    print(f"Warning: Could not import utils modules: {e}")
    QueryRunner = None
    Loader = None
    DBTRunner = None


class Employee(BaseModel):
    """
    Employee model that inherits from BaseModel.
    Represents employees in the engagement system.
    """
    
    # Personal Information
    first_name = models.CharField(max_length=50, help_text="Employee's first name")
    last_name = models.CharField(max_length=50, help_text="Employee's last name")
    email = models.EmailField(unique=True, validators=[EmailValidator()], help_text="Employee's email address")
    
    class Meta:
        verbose_name = "Employee"
        verbose_name_plural = "Employees"
        ordering = ['last_name', 'first_name']
        
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
        
    @property
    def full_name(self):
        """Return the employee's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def run_dbt(self, command="check"):
        """
        Run DBT command using the PAE DBTRunner utility.
        
        Args:
            command (str): DBT command to run (default: "check")
            
        Returns:
            dict: Result information about the DBT run
        """
        if DBTRunner is None:
            return {
                "success": False,
                "error": "DBTRunner not available - PAE utils could not be imported"
            }
        
        try:
            print(f"🔧 Employee {self.full_name} initiating DBT command: {command}")
            
            # Initialize DBT runner
            dbt_runner = DBTRunner()
            
            # Execute the command
            print(f"📁 DBT Project Directory: {dbt_runner.project_dir}")
            dbt_runner.run_dbt_command(command)
            
            return {
                "success": True,
                "command": command,
                "project_dir": dbt_runner.project_dir,
                "initiated_by": self.full_name,
                "employee_id": self.id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"DBT command failed: {str(e)}",
                "command": command,
                "initiated_by": self.full_name
            }
    
    @classmethod
    def run_dbt_check_all(cls):
        """
        Class method to run DBT check from any Employee context.
        Useful for running DBT operations without a specific employee instance.
        """
        if DBTRunner is None:
            return {
                "success": False,
                "error": "DBTRunner not available - PAE utils could not be imported"
            }
        
        try:
            print("🏢 Running DBT check from Employee model (organization-wide)")
            
            dbt_runner = DBTRunner()
            dbt_runner.run_dbt_command("check")
            
            return {
                "success": True,
                "command": "check",
                "project_dir": dbt_runner.project_dir,
                "initiated_by": "Employee Model (Class Method)"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"DBT check failed: {str(e)}",
                "initiated_by": "Employee Model (Class Method)"
            }
     