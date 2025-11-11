import sys
import os
from datetime import date
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
    onboarding_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when the employee was onboarded"
    )
    offboarding_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when the employee was offboarded"
    )

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
    
    def get_all_info(self):
        """
        Get all relevant information about the employee.
        Returns a comprehensive dictionary with employee details, teams, managers, contracts, and performance reviews.
        """
        from datetime import date
        
        info = {
            "personal_info": {
                "full_name": self.full_name,
                "first_name": self.first_name,
                "last_name": self.last_name,
                "email": self.email,
                "is_active": self.is_active,
                "created_at": str(self.created_at),
                "updated_at": str(self.updated_at)
            },
            "teams": self._get_team_info(),
            "managers": self._get_manager_info(),
            "contracts": self._get_contract_info(),
            # "performance_reviews": self._get_performance_review_info()
        }
        
        return info
    
    def get_all_info_markdown(self):
        """
        Get all relevant information about the employee formatted as markdown.
        Returns a rich text string with headings, bullet points, and formatting.
        Perfect for pasting into markdown documents or note-taking apps.
        """
        info = self.get_all_info()
        
        md = []
        
        # Header
        md.append(f"# 👤 {info['personal_info']['full_name']}")
        md.append("")
        
        # Personal Information
        md.append("## 📋 Personal Information")
        md.append("")
        md.append(f"- **Email**: {info['personal_info']['email']}")
        md.append(f"- **Status**: {'✅ Active' if info['personal_info']['is_active'] else '❌ Inactive'}")
        md.append(f"- **Created**: {info['personal_info']['created_at']}")
        md.append(f"- **Last Updated**: {info['personal_info']['updated_at']}")
        md.append("")
        
        # Teams
        md.append("## 🏢 Team Memberships")
        md.append("")
        teams_summary = info['teams']['summary']
        md.append(f"**Summary**: {teams_summary['active_teams']} active teams, "
                 f"{teams_summary['historical_teams']} historical teams, "
                 f"{teams_summary['leadership_roles']} leadership roles")
        md.append("")
        
        if info['teams']['current_teams']:
            md.append("### Current Teams")
            md.append("")
            for team in info['teams']['current_teams']:
                lead_badge = " 👑 **LEAD**" if team['is_lead'] else ""
                start_date = team['effective_from'] or "N/A"
                md.append(f"- **{team['team_name']}**{lead_badge}")
                md.append(f"  - Started: {start_date}")
        else:
            md.append("### Current Teams")
            md.append("")
            md.append("*No active team memberships*")
        
        md.append("")
        
        if info['teams']['historical_teams']:
            md.append("### Team History")
            md.append("")
            for team in info['teams']['historical_teams'][:10]:  # Limit to 10
                lead_badge = " 👑 **LEAD**" if team['is_lead'] else ""
                start = team['effective_from'] or "N/A"
                end = team['effective_to'] or "ongoing"
                md.append(f"- **{team['team_name']}**{lead_badge}")
                md.append(f"  - Period: {start} → {end}")
        
        md.append("")
        
        # Managers
        md.append("## 👥 Manager Relationships")
        md.append("")
        manager_summary = info['managers']['summary']
        md.append(f"**Summary**: {manager_summary['current_manager']} current manager, "
                 f"{manager_summary['historical_managers']} historical managers, "
                 f"{manager_summary['total_changes']} total changes")
        md.append("")
        
        if info['managers']['current_manager']:
            md.append("### Current Manager")
            md.append("")
            for mgr in info['managers']['current_manager']:
                start_date = mgr['effective_from'] or "N/A"
                md.append(f"- **{mgr['manager_name']}** ({mgr['manager_email']})")
                md.append(f"  - Since: {start_date}")
        else:
            md.append("### Current Manager")
            md.append("")
            md.append("*No current manager assigned*")
        
        md.append("")
        
        if info['managers']['historical_managers']:
            md.append("### Manager History")
            md.append("")
            for mgr in info['managers']['historical_managers'][:10]:  # Limit to 10
                start = mgr['effective_from'] or "N/A"
                end = mgr['effective_to'] or "ongoing"
                md.append(f"- **{mgr['manager_name']}** ({mgr['manager_email']})")
                md.append(f"  - Period: {start} → {end}")
        
        md.append("")
        
        # Contracts
        md.append("## 💼 Contracts")
        md.append("")
        contract_summary = info['contracts']['summary']
        total_comp = contract_summary['total_active_compensation']
        comp_str = f"${total_comp:,.2f}" if total_comp else "N/A"
        md.append(f"**Summary**: {contract_summary['active_contracts']} active contracts, "
                 f"{contract_summary['historical_contracts']} historical contracts")
        md.append(f"**Total Active Compensation**: {comp_str}")
        md.append("")
        
        if info['contracts']['current_contracts']:
            md.append("### Current Contracts")
            md.append("")
            for contract in info['contracts']['current_contracts']:
                salary = f"${contract['salary_amount']:,.2f}" if contract['salary_amount'] else "N/A"
                start_date = contract['effective_from'] or "N/A"
                md.append(f"- **{contract['role']}** - {salary}")
                md.append(f"  - Since: {start_date}")
        else:
            md.append("### Current Contracts")
            md.append("")
            md.append("*No active contracts*")
        
        md.append("")
        
        if info['contracts']['historical_contracts']:
            md.append("### Contract History")
            md.append("")
            for contract in info['contracts']['historical_contracts'][:10]:  # Limit to 10
                salary = f"${contract['salary_amount']:,.2f}" if contract['salary_amount'] else "N/A"
                start = contract['effective_from'] or "N/A"
                end = contract['effective_to'] or "ongoing"
                md.append(f"- **{contract['role']}** - {salary}")
                md.append(f"  - Period: {start} → {end}")
        
        md.append("")
        md.append("---")
        md.append(f"*Generated on {date.today()}*")
        
        return "\n".join(md)
    
    def _get_team_info(self):
        """Get team membership information"""
        from .team import TeamMembership
        
        today = date.today()
        all_memberships = TeamMembership.objects.filter(employee=self)
        active_memberships = [m for m in all_memberships if m.is_active]
        historical_memberships = [m for m in all_memberships if not m.is_active]
        
        return {
            "summary": {
                "active_teams": len(active_memberships),
                "historical_teams": len(historical_memberships),
                "total_memberships": len(all_memberships),
                "leadership_roles": sum(1 for m in all_memberships if m.is_lead)
            },
            "current_teams": [
                {
                    "team_name": m.team.team_name,
                    "is_lead": m.is_lead,
                    "effective_from": str(m.effective_from) if m.effective_from else None,
                    "effective_to": str(m.effective_to) if m.effective_to else None
                }
                for m in active_memberships
            ],
            "historical_teams": [
                {
                    "team_name": m.team.team_name,
                    "is_lead": m.is_lead,
                    "effective_from": str(m.effective_from) if m.effective_from else None,
                    "effective_to": str(m.effective_to) if m.effective_to else None
                }
                for m in historical_memberships
            ]
        }
    
    def _get_manager_info(self):
        """Get manager relationship information"""
        from .manager import Manager
        
        today = date.today()
        all_relationships = Manager.objects.filter(employee=self).order_by('-effective_from')
        active_relationships = [r for r in all_relationships if r.is_active_relationship]
        historical_relationships = [r for r in all_relationships if not r.is_active_relationship]
        
        return {
            "summary": {
                "current_manager": len(active_relationships),
                "historical_managers": len(historical_relationships),
                "total_changes": len(all_relationships)
            },
            "current_manager": [
                {
                    "manager_name": r.manager.full_name,
                    "manager_email": r.manager.email,
                    "effective_from": str(r.effective_from) if r.effective_from else None,
                    "effective_to": str(r.effective_to) if r.effective_to else None
                }
                for r in active_relationships
            ],
            "historical_managers": [
                {
                    "manager_name": r.manager.full_name,
                    "manager_email": r.manager.email,
                    "effective_from": str(r.effective_from) if r.effective_from else None,
                    "effective_to": str(r.effective_to) if r.effective_to else None
                }
                for r in historical_relationships
            ]
        }
    
    def _get_contract_info(self):
        """Get contract information"""
        from .contract import Contract
        
        today = date.today()
        all_contracts = Contract.objects.filter(employee=self).order_by('-effective_from')
        active_contracts = [c for c in all_contracts if c.is_active_contract]
        historical_contracts = [c for c in all_contracts if not c.is_active_contract]
        
        # Calculate total compensation from active contracts
        total_compensation = sum(
            float(c.salary_amount) for c in active_contracts if c.salary_amount
        )
        
        return {
            "summary": {
                "active_contracts": len(active_contracts),
                "historical_contracts": len(historical_contracts),
                "total_contracts": len(all_contracts),
                "total_active_compensation": total_compensation
            },
            "current_contracts": [
                {
                    "role": c.role.role_level_name,
                    "salary_amount": float(c.salary_amount) if c.salary_amount else None,
                    "effective_from": str(c.effective_from) if c.effective_from else None,
                    "effective_to": str(c.effective_to) if c.effective_to else None
                }
                for c in active_contracts
            ],
            "historical_contracts": [
                {
                    "role": c.role.role_level_name,
                    "salary_amount": float(c.salary_amount) if c.salary_amount else None,
                    "effective_from": str(c.effective_from) if c.effective_from else None,
                    "effective_to": str(c.effective_to) if c.effective_to else None
                }
                for c in historical_contracts
            ]
        }
    
    def _get_performance_review_info(self):
        """Get performance review information"""
        from .performance_review import PerformanceReview
        
        all_reviews = PerformanceReview.objects.filter(employee=self).order_by('-performance_date')
        
        # Calculate average score
        reviews_with_scores = [r for r in all_reviews if r.overall_score is not None]
        avg_score = (
            sum(r.overall_score for r in reviews_with_scores) / len(reviews_with_scores)
            if reviews_with_scores else None
        )
        
        return {
            "summary": {
                "total_reviews": len(all_reviews),
                "reviews_with_scores": len(reviews_with_scores),
                "average_score": round(avg_score, 2) if avg_score else None
            },
            "recent_reviews": [
                {
                    "performance_name": r.performance_name,
                    "performance_date": str(r.performance_date),
                    "overall_score": r.overall_score
                }
                for r in all_reviews[:5]  # Last 5 reviews
            ],
            "all_reviews": [
                {
                    "performance_name": r.performance_name,
                    "performance_date": str(r.performance_date),
                    "overall_score": r.overall_score
                }
                for r in all_reviews
            ]
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
        
    def update_from_airtable(self):
        """
        Update this employee's data from Airtable using the TairtableExporter utility.
        
        Returns:
            dict: Result information about the update operation
        """
        try:
            from engagement.utils.tairtable_exporter import TairtableExporter

            print(f"📥 Updating employee {self.full_name} from Airtable")
            exporter = TairtableExporter()
            exporter._update_employee_from_tairtable(self)
            
            return {
                "success": True,
                "employee": self.full_name,
                "employee_id": self.id,
                "tair_id": self.tair_id
            }
            
        except ImportError as e:
            return {
                "success": False,
                "error": f"TairtableExporter not available: {str(e)}",
                "employee": self.full_name
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Update from Airtable failed: {str(e)}",
                "employee": self.full_name
            }

    def post_or_update_to_airtable(self):
        """
        Export this employee's data to Airtable using the TairtableExporter utility.
        
        Returns:
            dict: Result information about the export operation
        """
        try:
            from engagement.utils.tairtable_exporter import TairtableExporter
            exporter = TairtableExporter()

            if self.tair_id is None:
                print(f"📤 Exporting employee {self.full_name} to Airtable")
                new_tair_id = exporter._export_employee(self)
            
            else:
                exporter._update_employee_v2(self)
                new_tair_id = self.tair_id
            
            return {
                "success": True,
                "employee": self.full_name,
                "employee_id": self.id,
                "tair_id": new_tair_id
            }
            
        except ImportError as e:
            return {
                "success": False,
                "error": f"TairtableExporter not available: {str(e)}",
                "employee": self.full_name
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Export to Airtable failed: {str(e)}",
                "employee": self.full_name
            }