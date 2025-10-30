#!/usr/bin/env python3
"""
Example script: Creating and managing Employee instances with DBT integration

This script demonstrates how to:
1. Properly set up Django environment
2. Create Employee instances with all fields
3. Use BaseModel inherited functionality
4. Leverage PAE utils integration including DBT runner
5. Perform database operations

Run this script from anywhere by executing:
python3 001_example_employee.py
"""

import os
import sys
from datetime import date, datetime
from decimal import Decimal

# === PATH SETUP ===
# Add both PAE root and xapt project to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
xapt_root = os.path.abspath(os.path.join(script_dir, '..', '..'))  # /path/to/xapt/
pae_root = os.path.abspath(os.path.join(xapt_root, '..'))  # /path/to/pae/

# Add paths if not already present
for path in [pae_root, xapt_root]:
    if path not in sys.path:
        sys.path.insert(0, path)

print(f"📁 Script directory: {script_dir}")
print(f"🚀 XAPT root: {xapt_root}")
print(f"🔧 PAE root: {pae_root}")
print(f"🐍 Python path updated: {len(sys.path)} paths")

# === DJANGO SETUP ===
print("\n🔧 Setting up Django environment...")

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xapt.settings')

# Configure Django
import django
from django.conf import settings

print(f"⚙️ Using Django settings: {settings.SETTINGS_MODULE}")

# Initialize Django
django.setup()
print("✅ Django setup complete!")

# === IMPORT MODELS ===
try:
    from engagement.models import Employee, BaseModel
    print("✅ Successfully imported Employee and BaseModel")
except ImportError as e:
    print(f"❌ Failed to import models: {e}")
    sys.exit(1)

# === PAE UTILS SETUP ===
try:
    from utils.query_runner.query_runner import QueryRunner
    from utils.dbt.dbt_runner import DBTRunner
    print("✅ PAE utils available")
    pae_utils_available = True
except ImportError as e:
    print(f"⚠️ PAE utils not available: {e}")
    pae_utils_available = False


def create_example_employees():
    """Create example employees with comprehensive data"""
    
    print("\n👥 Creating example employees...")
    
    employees_data = [
        {
            # BaseModel inherited fields
            'name': 'John Doe Profile',
            'description': 'Senior Software Engineer specializing in backend development',
            'is_active': True,
            
            # Employee specific fields (matching actual model)
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@xapt.com',
        },
        {
            'name': 'Jane Smith Profile',
            'description': 'Engineering Manager with team leadership experience',
            'is_active': True,
            
            'first_name': 'Jane',
            'last_name': 'Smith',
            'email': 'jane.smith@xapt.com',
        },
        {
            'name': 'Bob Johnson Profile',
            'description': 'Junior Developer learning the ropes',
            'is_active': True,
            
            'first_name': 'Bob',
            'last_name': 'Johnson',
            'email': 'bob.johnson@xapt.com',
        }
    ]
    
    created_employees = []
    
    for i, emp_data in enumerate(employees_data, 1):
        try:
            # Check if employee already exists (by email since no employee_id field)
            existing = Employee.objects.filter(email=emp_data['email']).first()
            if existing:
                print(f"  {i}. Employee {emp_data['email']} already exists: {existing.full_name}")
                created_employees.append(existing)
                continue
            
            # Create new employee
            employee = Employee.objects.create(**emp_data)
            created_employees.append(employee)
            
            print(f"  {i}. ✅ Created: {employee.full_name}")
            print(f"     📧 Email: {employee.email}")
            print(f"     📝 Description: {employee.description}")
            print(f"     ✅ Active: {employee.is_active}")
            print(f"     📅 Created: {employee.created_at}")
            
        except Exception as e:
            print(f"  {i}. ❌ Failed to create {emp_data['first_name']} {emp_data['last_name']}: {e}")
    
    return created_employees


def demonstrate_basemodel_features(employees):
    """Demonstrate BaseModel inherited features"""
    
    print("\n🔧 Demonstrating BaseModel inherited features...")
    
    if not employees:
        print("  ⚠️ No employees to demonstrate with")
        return
    
    try:
        employee = employees[0]
        print(f"\n👤 Working with: {employee.full_name}")
        
        # Demonstrate BaseModel fields
        print(f"  📝 Name (BaseModel): {employee.name}")
        print(f"  📄 Description (BaseModel): {employee.description}")
        print(f"  ✅ Is Active (BaseModel): {employee.is_active}")
        print(f"  📅 Created At (BaseModel): {employee.created_at}")
        print(f"  🔄 Updated At (BaseModel): {employee.updated_at}")
        
        # Demonstrate updating
        print(f"\n🔄 Updating employee description...")
        old_description = employee.description
        employee.description = f"Updated: {old_description}"
        employee.save()
        
        # Refresh from database to see updated timestamp
        employee.refresh_from_db()
        print(f"  ✅ Updated description: {employee.description}")
        print(f"  🕒 New updated_at: {employee.updated_at}")
        
        # Demonstrate deactivation
        print(f"\n⏸️ Deactivating employee...")
        employee.is_active = False
        employee.save()
        print(f"  ✅ Employee deactivated: {not employee.is_active}")
        
        # Reactivate
        print(f"\n▶️ Reactivating employee...")
        employee.is_active = True
        employee.save()
        print(f"  ✅ Employee reactivated: {employee.is_active}")
        
        return employee
        
    except Exception as e:
        print(f"  ❌ Failed to demonstrate BaseModel features: {e}")
        return None


def demonstrate_model_functionality(employees):
    """Demonstrate Employee model methods and properties"""
    
    print("\n🧪 Demonstrating model functionality...")
    
    for employee in employees:
        print(f"\n👤 Employee: {employee.full_name}")
        print(f"   📧 Email: {employee.email}")
        print(f"   📝 BaseModel Name: {employee.name}")
        print(f"   📄 Description: {employee.description}")
        print(f"   ✅ Active Status: {employee.is_active}")
        print(f"   📅 Created: {employee.created_at}")
        print(f"   🔄 Updated: {employee.updated_at}")
        print(f"   🆔 Database ID: {employee.id}")


def demonstrate_dbt_features(employees):
    """Dedicated DBT features demonstration"""
    
    print("\n🛠️ Demonstrating DBT features...")
    
    if not employees:
        print("  ⚠️ No employees to demonstrate DBT with")
        return
    
    employee = employees[0]
    print(f"👤 Using employee: {employee.full_name}")
    
    # Demonstrate various DBT commands
    dbt_commands = [
        ("check", "Basic DBT health check"),
        ("debug", "DBT environment debug"),
        ("deps", "Install DBT dependencies"),
        ("compile", "Compile DBT models")
    ]
    
    print(f"\n🔧 Testing DBT commands:")
    for command, description in dbt_commands:
        print(f"\n  📋 {description}:")
        print(f"     Command: dbt {command}")
        
        result = employee.run_dbt(command)
        
        if result.get('success'):
            print(f"     ✅ Success! Initiated by: {result.get('initiated_by')}")
            print(f"     📁 Project: {result.get('project_dir')}")
        else:
            print(f"     ❌ Failed: {result.get('error')}")
    
    # Test class method
    print(f"\n🏢 Testing class-level DBT operations:")
    class_result = Employee.run_dbt_check_all()
    
    if class_result.get('success'):
        print(f"  ✅ Class method DBT check successful")
    else:
        print(f"  ❌ Class method failed: {class_result.get('error')}")


def demonstrate_pae_utils(employees):
    """Demonstrate PAE utils integration"""
    
    print("\n🔧 Demonstrating PAE utils integration...")
    
    if not pae_utils_available:
        print("  ⚠️ PAE utils not available - skipping integration demo")
        return
    
    try:
        # Test QueryRunner integration (if available)
        if employees:
            employee = employees[0]
            print(f"\n📊 Testing QueryRunner integration:")
            
            try:
                runner = QueryRunner()
                # Simple test query (might fail if postgres not configured, but that's ok)
                test_query = "SELECT 1 as test_connection"
                result = runner.run_query(test_query, source='postgres')
                print(f"  ✅ QueryRunner test successful: {result}")
            except Exception as qe:
                print(f"  ⚠️ QueryRunner test failed (expected if postgres not running): {qe}")
                
    except Exception as e:
        print(f"  ❌ PAE utils demo failed: {e}")


def main():
    """Main execution function"""
    
    print("🚀 Starting Employee Example Script with DBT Integration")
    print("=" * 60)
    
    try:
        # Create employees
        employees = create_example_employees()
        
        if not employees:
            print("❌ No employees created - exiting")
            return
        
        # Demonstrate BaseModel features
        demonstrate_basemodel_features(employees)
        
        # Demonstrate functionality
        demonstrate_model_functionality(employees)
        
        # Demonstrate DBT features (NEW!)
        demonstrate_dbt_features(employees)
        
        # Demonstrate PAE utils
        demonstrate_pae_utils(employees)
        
        print("\n" + "=" * 60)
        print("✅ Example script completed successfully!")
        print(f"📊 Total employees in database: {Employee.objects.count()}")
        print(f"📈 Active employees: {Employee.objects.filter(is_active=True).count()}")
        print(f"📧 Unique emails: {Employee.objects.values('email').distinct().count()}")
        print("\n🛠️ DBT Integration Summary:")
        print("   - Employee.run_dbt(command) - Run DBT from employee context")
        print("   - Employee.run_dbt_check_all() - Organization-wide DBT check")
        print("   - Supports: check, debug, deps, compile, run, test commands")
        
    except Exception as e:
        print(f"\n❌ Script failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
