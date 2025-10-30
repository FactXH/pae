#!/usr/bin/env python3
"""
004 - Delete All Records Example

This script demonstrates how to delete all records from the engagement models.
It shows proper deletion order to handle foreign key constraints and provides
detailed feedback about the deletion process.

Models involved:
- TeamMembership (has FKs to Employee and Team)
- Team (has self-referential FK to parent_team)
- Employee (inherits from BaseModel)

Key concepts:
- Proper deletion order to avoid constraint violations
- Cascade deletion behavior
- Record counting before/after deletion
- Transaction safety
"""

import os
import sys
from datetime import date
import django

# Set up the path to include both xapt project and PAE root
current_dir = os.path.dirname(os.path.abspath(__file__))
xapt_project_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
pae_root_dir = os.path.abspath(os.path.join(xapt_project_dir, '..'))

# Add paths if they're not already in sys.path
for path in [xapt_project_dir, pae_root_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

print(f"🔧 XAPT Project Directory: {xapt_project_dir}")
print(f"🔧 PAE Root Directory: {pae_root_dir}")

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xapt.settings')
django.setup()

# Import models after Django setup
from engagement.models import Employee, Team, TeamMembership
from django.db import transaction

def show_current_counts():
    """Display current record counts for all models"""
    
    print("\n📊 Current Database State:")
    print("=" * 40)
    
    # TeamMembership counts
    total_memberships = TeamMembership.objects.count()
    active_memberships = TeamMembership.objects.filter(effective_to__gte=date.today()).count()
    lead_memberships = TeamMembership.objects.filter(is_lead=True).count()
    
    print(f"👥 TeamMemberships: {total_memberships} total")
    if total_memberships > 0:
        print(f"   📈 Active: {active_memberships}")
        print(f"   👑 Leadership roles: {lead_memberships}")
    
    # Team counts
    total_teams = Team.objects.count()
    team_nature_counts = {}
    if total_teams > 0:
        for choice_value, choice_label in Team.TEAM_NATURE_CHOICES:
            count = Team.objects.filter(nature=choice_value).count()
            if count > 0:
                team_nature_counts[choice_label] = count
    
    print(f"🏢 Teams: {total_teams} total")
    for nature, count in team_nature_counts.items():
        print(f"   🔹 {nature}: {count}")
    
    # Employee counts
    total_employees = Employee.objects.count()
    active_employees = Employee.objects.filter(is_active=True).count()
    
    print(f"👤 Employees: {total_employees} total")
    if total_employees > 0:
        print(f"   ✅ Active: {active_employees}")
        print(f"   ❌ Inactive: {total_employees - active_employees}")

def delete_all_memberships():
    """Delete all TeamMembership records"""
    
    print("\n🗑️ Deleting TeamMemberships...")
    print("-" * 30)
    
    # Get counts before deletion
    initial_count = TeamMembership.objects.count()
    
    if initial_count == 0:
        print("   📭 No team memberships to delete")
        return 0
    
    # Show some examples before deletion
    print(f"   📋 Found {initial_count} team memberships to delete")
    
    # Show first few records as examples
    sample_memberships = TeamMembership.objects.select_related('employee', 'team')[:3]
    for membership in sample_memberships:
        role = " (Lead)" if membership.is_lead else " (Member)"
        print(f"   📝 {membership.employee.first_name} {membership.employee.last_name} → {membership.team.team_name}{role}")
        print(f"      📅 {membership.effective_from} to {membership.effective_to or 'ongoing'}")
    
    if initial_count > 3:
        print(f"   ... and {initial_count - 3} more")
    
    # Perform deletion
    try:
        deleted_count, deleted_details = TeamMembership.objects.all().delete()
        print(f"   ✅ Successfully deleted {deleted_count} team memberships")
        return deleted_count
    except Exception as e:
        print(f"   ❌ Error deleting team memberships: {e}")
        return 0

def delete_all_teams():
    """Delete all Team records"""
    
    print("\n🗑️ Deleting Teams...")
    print("-" * 20)
    
    # Get counts before deletion
    initial_count = Team.objects.count()
    
    if initial_count == 0:
        print("   📭 No teams to delete")
        return 0
    
    print(f"   📋 Found {initial_count} teams to delete")
    
    # Show team hierarchy before deletion
    root_teams = Team.objects.filter(parent_team=None)
    for root_team in root_teams:
        print(f"   🏢 {root_team.team_name} ({root_team.nature})")
        
        # Show child teams
        child_teams = Team.objects.filter(parent_team=root_team)
        for child_team in child_teams:
            print(f"      └── {child_team.team_name} ({child_team.nature})")
    
    # Perform deletion (cascade will handle child teams)
    try:
        deleted_count, deleted_details = Team.objects.all().delete()
        print(f"   ✅ Successfully deleted {deleted_count} teams")
        return deleted_count
    except Exception as e:
        print(f"   ❌ Error deleting teams: {e}")
        return 0

def delete_all_employees():
    """Delete all Employee records"""
    
    print("\n🗑️ Deleting Employees...")
    print("-" * 25)
    
    # Get counts before deletion
    initial_count = Employee.objects.count()
    
    if initial_count == 0:
        print("   📭 No employees to delete")
        return 0
    
    print(f"   📋 Found {initial_count} employees to delete")
    
    # Show employee details before deletion
    employees = Employee.objects.all()
    for employee in employees:
        status = "✅ Active" if employee.is_active else "❌ Inactive"
        print(f"   👤 {employee.first_name} {employee.last_name} ({employee.email}) - {status}")
    
    # Perform deletion
    try:
        deleted_count, deleted_details = Employee.objects.all().delete()
        print(f"   ✅ Successfully deleted {deleted_count} employees")
        return deleted_count
    except Exception as e:
        print(f"   ❌ Error deleting employees: {e}")
        return 0

def delete_all_records():
    """Delete all records from all models in proper order"""
    
    print("\n🧹 BULK DELETION - All Models")
    print("=" * 50)
    
    total_deleted = 0
    
    # Step 1: Delete TeamMemberships (has FKs to both Employee and Team)
    memberships_deleted = delete_all_memberships()
    total_deleted += memberships_deleted
    
    # Step 2: Delete Teams (may have self-referential FKs)
    teams_deleted = delete_all_teams()
    total_deleted += teams_deleted
    
    # Step 3: Delete Employees (only has FKs from other models, not to)
    employees_deleted = delete_all_employees()
    total_deleted += employees_deleted
    
    return {
        'total': total_deleted,
        'memberships': memberships_deleted,
        'teams': teams_deleted,
        'employees': employees_deleted
    }

def delete_with_confirmation():
    """Interactive deletion with user confirmation"""
    
    print("\n⚠️  INTERACTIVE DELETION MODE")
    print("=" * 40)
    print("This will show you what will be deleted and ask for confirmation.")
    
    # Show current state
    show_current_counts()
    
    # Check if there's anything to delete
    total_records = (TeamMembership.objects.count() + 
                    Team.objects.count() + 
                    Employee.objects.count())
    
    if total_records == 0:
        print("\n✨ Database is already clean - nothing to delete!")
        return
    
    print(f"\n📝 Total records that will be deleted: {total_records}")
    print("\n🚨 WARNING: This action cannot be undone!")
    
    # In a real interactive script, you'd use input() here
    # For this example, we'll simulate confirmation
    print("\n🤖 [Simulated] Are you sure you want to delete all records? (y/N)")
    print("🤖 [Simulated] User response: y")
    
    confirmation = "y"  # Simulated user input
    
    if confirmation.lower() == 'y':
        print("\n🚀 Proceeding with deletion...")
        
        with transaction.atomic():
            results = delete_all_records()
            
        print(f"\n✅ Deletion completed successfully!")
        print(f"   📊 Total records deleted: {results['total']}")
        print(f"   👥 Team memberships: {results['memberships']}")
        print(f"   🏢 Teams: {results['teams']}")
        print(f"   👤 Employees: {results['employees']}")
        
    else:
        print("\n❌ Deletion cancelled by user")

def main():
    """Main execution function"""
    
    print("🗑️ Model Deletion Example Script")
    print("=" * 60)
    print("This script demonstrates different ways to delete all records")
    print("from the engagement models.\n")
    
    try:
        # Option 1: Show current state
        print("📋 STEP 1: Current Database State")
        show_current_counts()
        
        # Option 2: Demonstrate individual model deletion methods
        print("\n🔧 STEP 2: Available Deletion Methods")
        print("-" * 40)
        print("1. delete_all_memberships() - Deletes all team memberships")
        print("2. delete_all_teams() - Deletes all teams")
        print("3. delete_all_employees() - Deletes all employees")
        print("4. delete_all_records() - Deletes everything in proper order")
        print("5. delete_with_confirmation() - Interactive deletion with confirmation")
        
        # Option 3: Execute the comprehensive deletion
        print(f"\n🚀 STEP 3: Executing Comprehensive Deletion")
        
        # Use transaction for safety
        with transaction.atomic():
            results = delete_all_records()
        
        print(f"\n📈 DELETION SUMMARY:")
        print(f"   🔢 Total records deleted: {results['total']}")
        print(f"   👥 Team memberships: {results['memberships']}")
        print(f"   🏢 Teams: {results['teams']}")
        print(f"   👤 Employees: {results['employees']}")
        
        # Option 4: Verify deletion
        print(f"\n✅ STEP 4: Verification")
        show_current_counts()
        
        final_count = (TeamMembership.objects.count() + 
                      Team.objects.count() + 
                      Employee.objects.count())
        
        if final_count == 0:
            print(f"\n🎉 SUCCESS: All records have been deleted!")
        else:
            print(f"\n⚠️ WARNING: {final_count} records still remain")
        
        print("\n" + "=" * 60)
        print("🎯 Script completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Script failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
