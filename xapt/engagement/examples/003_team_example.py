#!/usr/bin/env python3
"""
Example script: Team and TeamMembership management demonstration

This script demonstrates how to:
1. Create Employee instances
2. Create Team instances with hierarchical structure
3. Manage TeamMembership relationships over time
4. Show team transitions and leadership assignments

Scenario:
- Create 3 employees and 4 teams
- Initially all employees are in a single team
- On December 1st, move each employee to distinct teams

Run this script from anywhere by executing:
python3 003_team_example.py
"""

import os
import sys
from datetime import date, datetime, timedelta
import pandas as pd

# === PATH SETUP ===
script_dir = os.path.dirname(os.path.abspath(__file__))
xapt_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
pae_root = os.path.abspath(os.path.join(xapt_root, '..'))

for path in [pae_root, xapt_root]:
    if path not in sys.path:
        sys.path.insert(0, path)

print(f"🚀 Team Management Example Script")
print(f"📁 XAPT root: {xapt_root}")
print(f"🔧 PAE root: {pae_root}")

# === DJANGO SETUP ===
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xapt.settings')

import django
django.setup()

# === IMPORT MODELS ===
try:
    from utils.query_runner.query_runner import QueryRunner
    from engagement.models import Employee, Team, TeamMembership, Role, Contract, Manager, PerformanceReview
    print("✅ Successfully imported Employee, Team, and TeamMembership models")
except ImportError as e:
    print(f"❌ Failed to import: {e}")
    sys.exit(1)


def cleanup_previous_data():
    """Clean up all previous data to ensure fresh runs"""
    
    print("\n🧹 Cleaning up previous data...")
    
    try:
        # Delete in proper order (relationships first, then parent objects)
        
        # 1. Delete all team memberships first (has FKs to both Employee and Team)
        membership_count = TeamMembership.objects.count()
        if membership_count > 0:
            TeamMembership.objects.all().delete()
            print(f"  🗑️ Deleted {membership_count} team memberships")
        
        # 2. Delete all teams (may have parent-child relationships)
        team_count = Team.objects.count()
        if team_count > 0:
            # Delete child teams first, then parents
            child_teams = Team.objects.exclude(parent_team=None)
            child_count = child_teams.count()
            if child_count > 0:
                child_teams.delete()
                print(f"  🗑️ Deleted {child_count} child teams")
            
            # Delete parent/root teams
            root_teams = Team.objects.filter(parent_team=None)
            root_count = root_teams.count()
            if root_count > 0:
                root_teams.delete()
                print(f"  🗑️ Deleted {root_count} root teams")
        
        # # 3. Delete all employees
        # employee_count = Employee.objects.count()
        # if employee_count > 0:
        #     Employee.objects.all().delete()
        #     print(f"  🗑️ Deleted {employee_count} employees")
        
        print(f"  ✅ Cleanup completed successfully!")
        
    except Exception as e:
        print(f"  ⚠️ Cleanup encountered an issue: {e}")
        print(f"  📝 Continuing anyway - script will handle existing records...")


def create_employees_with_query():
    """Create 3 employees using Employee.load_from_query() method"""
    
    print("\n👥 Creating 3 employees using load_from_query...")
    
    # SQL query to create 3 employees
    employees_query = """
    SELECT 
        first_name as first_name,
        last_name as last_name,
        email as email,
        employee_id as factorial_id,
        onboarding_date,
        offboarding_date
    FROM dim_employees
    """
    
    print("📝 Using SQL UNION query to create all employees at once")
    print("🔧 Executing Employee.load_from_query()...")
    
    # Use BaseModel.load_from_query method (should create all since we cleaned up)
    result = Employee.load_from_query(
        query=employees_query,
        unique_fields=['email'],
        create_if_not_exists=True,
        update_existing=True
    )
    
    print(f"\n📊 Query Results:")
    if result.get('success'):
        print(f"  ✅ Success: {result.get('success')}")
        print(f"  📈 Created: {result.get('created', 0)} employees")
        print(f"  🔄 Updated: {result.get('updated', 0)} employees")
        print(f"  ⏭️ Existing: {result.get('total_rows', 0) - result.get('created', 0)} employees")
        
        # Show created employees
        instances = result.get('instances', [])
        for i, employee in enumerate(instances, 1):
            print(f"  {i}. 👤 {employee.full_name}")
            print(f"     📧 {employee.email}")
            print(f"     📝 {employee.description}")
        
        return instances
    else:
        print(f"  ❌ Error: {result.get('error')}")
        return []


def create_teams_with_query():
    """Create 4 teams using Team.load_from_query() method"""
    
    print("\n🏢 Creating 4 teams using load_from_query...")
    
    # First create root teams (no parent dependencies)
    root_teams_query = """
    SELECT
        team_id as factorial_id,
        team_name,
        team_level as level,
        team_type as nature
    from dim_teams
    """
    
    print("📝 Step 1: Creating root teams (Engineering & European Market)")
    print("🔧 Executing Team.load_from_query() for root teams...")
    
    result = Team.load_from_query(
        query=root_teams_query,
        unique_fields=['team_name'],
        create_if_not_exists=True,
        update_existing=False
    )
    print(result)
    result_teams = result.get('instances', [])
    for team in result_teams:
        print(f"  🏠 {team.team_name} ({team.get_nature_display()}) - Level {team.level}")
    
    return result_teams


def create_job_roles_with_query():
    """Create job roles using JobRole.load_from_query() method"""
    
    print("\n💼 Creating job roles using load_from_query...")
    
    job_roles_query = """
    SELECT
        job_catalog_level_id as factorial_id,
        level_name,
        role_name,
        role_level_name
    from dim_job_catalog
    """
    
    print("🔧 Executing Role.load_from_query()...")
    
    result = Role.load_from_query(
        query=job_roles_query,
        unique_fields=['role_name'],
        create_if_not_exists=True,
        update_existing=False
    )
    
    print(f"\n📊 Query Results:")
    if result.get('success'):
        print(f"  ✅ Success: {result.get('success')}")
        print(f"  📈 Created: {result.get('created', 0)} job roles")
        print(f"  🔄 Updated: {result.get('updated', 0)} job roles")
        print(f"  ⏭️ Existing: {result.get('total_rows', 0) - result.get('created', 0)} job roles")
        
        # Show created job roles
        instances = result.get('instances', [])

        return instances
    else:
        print(f"  ❌ Error: {result.get('error')}")
        return []


def set_parent_teams():
    query = """
    SELECT
        team_id as factorial_id,
        parent_team_id as factorial_parent_team_id
    from dim_teams
    where parent_team_id is not null
    """
    
    query_runner = QueryRunner()
    result = query_runner.run_query(query, source='postgres', dataframe=True)
    
    teams = Team.objects.all()


    for _, row in result.iterrows():
        # Convert row to dict to ensure we have clean Python values
        row_dict = row.to_dict()
        
        # Find the team and parent team
        team = next((team for team in teams if team.factorial_id == row_dict['factorial_id']), None)
        parent_team = next((team for team in teams if team.factorial_id == row_dict['factorial_parent_team_id']), None)
        
        if team is None:
            print(f"  ⚠️  Team with factorial_id {row_dict['factorial_id']} not found")
            continue
            
        if parent_team is None:
            print(f"  ⚠️  Parent team with factorial_id {row_dict['factorial_parent_team_id']} not found")
            continue
        
        team.parent_team = parent_team
        team.save()
        print(f"  🔗 Linked {team.team_name} to {parent_team.team_name}")
    

def create_memberships_with_query():
    """Create team memberships using direct QueryRunner (since TeamMembership doesn't inherit from BaseModel)"""
    
    print("\n📋 Creating team memberships using QueryRunner...")
    
    try:
        # Import PAE QueryRunner directly
        from utils.query_runner.query_runner import QueryRunner

        query = """
        select
            employee_id as employee_factorial_id,
            team_id as team_factorial_id,
            is_lead as is_lead,
            effective_from as effective_from,
            effective_to as effective_to
        from dim_memberships_cdc        
        """

        query_runner = QueryRunner()
        result = query_runner.run_query(query, source='postgres', dataframe=True)
        

        employees = Employee.objects.all()
        teams = Team.objects.all()
        
        memberships = []

        for _, row in result.iterrows():
            # Convert row to dict to ensure we have clean Python values
            row_dict = row.to_dict()
            
            # Find the employee and team
            employee = next((emp for emp in employees if emp.factorial_id == row_dict['employee_factorial_id']), None)
            team = next((team for team in teams if team.factorial_id == row_dict['team_factorial_id']), None)

            if employee is None:
                print(f"  ⚠️  Employee with factorial_id {row_dict['employee_factorial_id']} not found")
                continue
            if team is None:
                print(f"  ⚠️  Team with factorial_id {row_dict['team_factorial_id']} not found")
                continue
            
            try:
                membership, created = TeamMembership.objects.get_or_create(
                    employee=employee,
                    team=team,
                    effective_from=row_dict['effective_from'],
                    defaults={
                        'effective_to': row_dict['effective_to'],
                        'is_lead': row_dict['is_lead']
                    }
                )
                memberships.append(membership)
                
                if created:
                    role = " (Lead)" if row_dict['is_lead'] else " (Member)"
                    print(f"  ✅ Created {employee.full_name} → {team.team_name}{role}")
                else:
                    print(f"  ⏭️  Skipped existing membership: {employee.full_name} → {team.team_name}")
                    
            except Exception as e:
                print(f"  ⚠️  Failed to create membership for {employee.full_name} → {team.team_name}: {str(e)}")
                print(f"     Continuing with next membership...")
                continue
        return memberships
    except ImportError as e:
        print(f"❌ QueryRunner not available: {e}")
        print("📝 Falling back to regular Django ORM creation...")
        
        # Fallback to original method if QueryRunner not available
        return create_memberships_fallback(employees, teams)
    
    except Exception as e:
        print(f"❌ Query execution failed: {e}")

def create_contracts_with_query():
    query = """
    select
        contract_id as contract_factorial_id,
        employee_id as employee_factorial_id,
        job_title as public_job_title,
        effective_date as effective_from,
        effective_to_date as effective_to,
        salary_amount,
        job_catalog_level_id as job_catalog_level_factorial_id

    from dim_contracts
    """

    delete_contracts = Contract.objects.all().delete()

    query_runner = QueryRunner()
    result = query_runner.run_query(query, source='postgres', dataframe=True)

    for _, row in result.iterrows():
        # Convert row to dict to ensure we have clean Python values
        row_dict = row.to_dict()
        
        # Find the employee and role
        employee = Employee.objects.filter(factorial_id=row_dict['employee_factorial_id']).first()
        role = Role.objects.filter(factorial_id=row_dict['job_catalog_level_factorial_id']).first()

        if employee is None:
            print(f"  ⚠️  Employee with factorial_id {row_dict['employee_factorial_id']} not found")
            continue
        if role is None:
            print(f"  ⚠️  Role with factorial_id {row_dict['job_catalog_level_factorial_id']} not found")
            continue
        
        try:
            contract, created = Contract.objects.get_or_create(
                employee=employee,
                role=role,
                effective_from=row_dict['effective_from'],
                defaults={
                    'effective_to': row_dict['effective_to'],
                    'salary_amount': row_dict['salary_amount'],
                    'job_title': row_dict['public_job_title']
                }
            )
            
            if created:
                print(f"  ✅ Created contract for {employee.full_name} - {role.role_name}")
            else:
                print(f"  ⏭️  Skipped existing contract for {employee.full_name} - {role.role_name}")
                
        except Exception as e:
            print(f"  ⚠️  Failed to create contract for {employee.full_name} - {role.role_name}: {str(e)}")
            print(f"     Continuing with next contract...")
            continue

def create_managers_with_query():
    query = """
    select
    employee_id as factorial_employee_id,
    manager_id as factorial_manager_id,
    effective_from,
    effective_to
from
    br_athena_employee_managers_cdc
    """

    query_runner = QueryRunner()
    result = query_runner.run_query(query, source='postgres', dataframe=True)
    
    for _, row in result.iterrows():
        # Convert row to dict to ensure we have clean Python values
        row_dict = row.to_dict()
        
        # Find the employee and manager
        employee = Employee.objects.filter(factorial_id=row_dict['factorial_employee_id']).first()
        manager = Employee.objects.filter(factorial_id=row_dict['factorial_manager_id']).first()

        if employee is None:
            print(f"  ⚠️  Employee with factorial_id {row_dict['factorial_employee_id']} not found")
            continue
        if manager is None:
            print(f"  ⚠️  Manager with factorial_id {row_dict['factorial_manager_id']} not found")
            continue
        
        try:
            manager_record, created = Manager.objects.get_or_create(
                employee=employee,
                effective_from=row_dict['effective_from'],
                defaults={
                    'manager': manager,
                    'effective_to': row_dict['effective_to']
                }
            )
            
            if created:
                print(f"  ✅ Created manager {manager.full_name} for {employee.full_name}")
            else:
                print(f"  ⏭️  Skipped existing manager record for {employee.full_name}")
                
        except Exception as e:
            print(f"  ⚠️  Failed to create manager record for {employee.full_name}: {str(e)}")
            print(f"     Continuing with next record...")
            continue


def create_performance_reviews_with_query():
    query = '''
    select
        performance_review_name,
        employee_id,
        performance_review_start_date,
        manager_employee_id,
        concat(self_employee_score_questionnaire_answered, '/', self_review_questionnaire_answered) as employee_answers,
        concat(manager_employee_score_questionnaire_answered, '/', manager_review_questionnaire_answered) as manager_answers,
        self_score,
        manager_score,
        final_employee_score,
        final_score_calculated_at
    from 
        slv_performance_reviews
    where
        lower(performance_review_name) like 'perfo%'
    '''

    performance_reviews = PerformanceReview.objects.all().delete()

    query_runner = QueryRunner()
    result = query_runner.run_query(query, source='postgres', dataframe=True)

    for _, row in result.iterrows():
        # Convert row to dict to ensure we have clean Python values
        row_dict = row.to_dict()
        
        # Find the employee
        employee = Employee.objects.filter(factorial_id=row_dict['employee_id']).first()
        manager = Employee.objects.filter(factorial_id=row_dict['manager_employee_id']).first()

        if employee is None:
            print(f"  ⚠️  Employee with factorial_id {row_dict['employee_id']} not found")
            continue
        if manager is None:
            print(f"  ⚠️  Manager with factorial_id {row_dict['manager_employee_id']} not found")
            continue

        try:
            self_score = row_dict['self_score']
            manager_score = row_dict['final_employee_score']

            if pd.isna(self_score):
                self_score = None
            if pd.isna(manager_score):
                manager_score = None

            review, created = PerformanceReview.objects.update_or_create(
                employee=employee,
                performance_name=row_dict['performance_review_name'],
                performance_date=row_dict['performance_review_start_date'],
                defaults={
                    'self_questionary': row_dict['employee_answers'],
                    'manager_questionary': row_dict['manager_answers'],
                    'overall_score': manager_score,
                    'self_score': self_score,
                    'manager': manager
                }
            )
            
            if created:
                print(f"  ✅ Created performance review '{row_dict['performance_review_name']}' for {employee.full_name}")
            else:
                print(f"  ⏭️  Updated existing performance review '{row_dict['performance_review_name']}' for {employee.full_name}")
                
        except Exception as e:
            print(f"  ⚠️  Failed to create performance review for {employee.full_name}: {str(e)}")
            print(f"     Continuing with next record...")
            continue




def main():
    """Main execution function"""
    
    print("🚀 Starting Team Management Example Script")
    print("=" * 60)
    
    try:
        # Step 0: Clean up previous data
        # cleanup_previous_data()
        
        # employees = create_employees_with_query()
        
        # teams = create_teams_with_query()
        # set_parent_teams()

        # memberships = create_memberships_with_query()
        
        # roles = create_job_roles_with_query()
        # contracts = create_contracts_with_query()
        performance = create_performance_reviews_with_query()

        # managers = create_managers_with_query()
        # Step 5: Demonstrate functionality
    except Exception as e:
        print(f"\n❌ Script failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
