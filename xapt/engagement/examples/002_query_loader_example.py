#!/usr/bin/env python3
"""
Example script: Query-based instance loading demonstration

This script demonstrates how to:
1. Use the new BaseModel.load_from_query() method
2. Load Employee instances from SQL queries
3. Test query templates and field mapping
4. Handle different query scenarios

Run this script from anywhere by executing:
python3 002_query_loader_example.py
"""

import os
import sys

# === PATH SETUP ===
script_dir = os.path.dirname(os.path.abspath(__file__))
xapt_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
pae_root = os.path.abspath(os.path.join(xapt_root, '..'))

for path in [pae_root, xapt_root]:
    if path not in sys.path:
        sys.path.insert(0, path)

print(f"🚀 Query Loader Example Script")
print(f"📁 XAPT root: {xapt_root}")
print(f"🔧 PAE root: {pae_root}")

# === DJANGO SETUP ===
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xapt.settings')

import django
django.setup()

# === IMPORT MODELS ===
try:
    from engagement.models import Employee, BaseModel
    from engagement.models.base_model_utils.query_loader import QueryTemplates
    print("✅ Successfully imported models and QueryLoader utilities")
except ImportError as e:
    print(f"❌ Failed to import: {e}")
    sys.exit(1)


def test_simple_query():
    """Test the simple query as requested by the user"""
    
    print("\n🧪 Testing simple query creation...")
    
    # The exact query requested by the user
    simple_query = """
    SELECT 
        'JAJA' as first_name, 
        'dcscd' as last_name, 
        'cdcdsc@xapt.com' as email,
        'JAJA Profile' as name,
        'Auto-generated from simple query' as description,
        true as is_active
    """
    
    print(f"📝 Query: {simple_query.strip()}")
    
    # Execute the query using BaseModel.load_from_query
    result = Employee.load_from_query(
        query=simple_query,
        unique_fields=['email']  # Use email to check for duplicates
    )
    
    print(f"\n📊 Query Results:")
    print(f"  ✅ Success: {result.get('success', False)}")
    
    if result.get('success'):
        print(f"  📈 Created: {result.get('created', 0)} employees")
        print(f"  🔄 Updated: {result.get('updated', 0)} employees") 
        print(f"  ❌ Failed: {result.get('failed', 0)} employees")
        print(f"  📋 Total rows processed: {result.get('total_rows', 0)}")
        
        # Show created instances
        instances = result.get('instances', [])
        for i, employee in enumerate(instances, 1):
            print(f"\n  👤 Employee {i}: {employee.full_name}")
            print(f"     📧 Email: {employee.email}")
            print(f"     📝 BaseModel Name: {employee.name}")
            print(f"     📄 Description: {employee.description}")
            print(f"     ✅ Active: {employee.is_active}")
            print(f"     📅 Created: {employee.created_at}")
            print(f"     🆔 ID: {employee.id}")
    else:
        print(f"  ❌ Error: {result.get('error', 'Unknown error')}")
    
    return result


def test_multiple_employees():
    """Test creating multiple employees with one query"""
    
    print("\n🧪 Testing multiple employees creation...")
    
    # Query that creates multiple test employees
    multi_query = """
    SELECT 'JAJA' as first_name, 'dcscd' as last_name, 'jaja@xapt.com' as email,
           'JAJA Employee Profile' as name, 'First test employee' as description, true as is_active
    UNION ALL
    SELECT 'PEPE' as first_name, 'TUTU' as last_name, 'pepe@xapt.com' as email,
           'PEPE Employee Profile' as name, 'Second test employee' as description, true as is_active
    UNION ALL
    SELECT 'LOLO' as first_name, 'COCO' as last_name, 'lolo@xapt.com' as email,
           'LOLO Employee Profile' as name, 'Third test employee' as description, true as is_active
    """
    
    print(f"📝 Creating 3 employees with UNION query")
    
    result = Employee.load_from_query(
        query=multi_query,
        unique_fields=['email'],
        create_if_not_exists=True,
        update_existing=False
    )
    
    print(f"\n📊 Results:")
    if result.get('success'):
        print(f"  ✅ Successfully processed {result.get('total_rows', 0)} rows")
        print(f"  🆕 Created: {result.get('created', 0)} new employees")
        print(f"  ⏭️ Skipped: {result.get('total_rows', 0) - result.get('created', 0)} existing employees")
        
        instances = result.get('instances', [])
        print(f"\n  👥 Employees processed:")
        for employee in instances:
            print(f"    - {employee.full_name} ({employee.email})")
    else:
        print(f"  ❌ Failed: {result.get('error')}")
    
    return result


def test_field_mapping():
    """Test field mapping functionality"""
    
    print("\n🧪 Testing field mapping...")
    
    # Query with different column names that need mapping
    mapping_query = """
    SELECT 
        'MAPPED' as fname,
        'USER' as lname,
        'mapped@xapt.com' as user_email,
        'Mapped User Profile' as profile_name,
        'Employee created using field mapping' as profile_desc,
        true as active_status
    """
    
    # Define field mapping
    field_map = {
        'fname': 'first_name',
        'lname': 'last_name', 
        'user_email': 'email',
        'profile_name': 'name',
        'profile_desc': 'description',
        'active_status': 'is_active'
    }
    
    print(f"📝 Using field mapping: {field_map}")
    
    result = Employee.load_from_query(
        query=mapping_query,
        field_mapping=field_map,
        unique_fields=['email']
    )
    
    print(f"\n📊 Field Mapping Results:")
    if result.get('success'):
        instances = result.get('instances', [])
        if instances:
            employee = instances[0]
            print(f"  ✅ Mapped employee created: {employee.full_name}")
            print(f"     📧 Email: {employee.email}")
            print(f"     📝 Name: {employee.name}")
        print(f"  📈 Created: {result.get('created', 0)}")
    else:
        print(f"  ❌ Failed: {result.get('error')}")
    
    return result


def test_update_existing():
    """Test updating existing employees"""
    
    print("\n🧪 Testing update existing functionality...")
    
    # First, create an employee
    create_query = """
    SELECT 
        'UPDATE' as first_name,
        'TEST' as last_name,
        'update@xapt.com' as email,
        'Original Profile' as name,
        'Original description' as description,
        true as is_active
    """
    
    print("📝 Creating employee to update...")
    result1 = Employee.load_from_query(create_query, unique_fields=['email'])
    
    if result1.get('success'):
        print(f"  ✅ Created employee for update test")
        
        # Now update the same employee
        update_query = """
        SELECT 
            'UPDATE' as first_name,
            'UPDATED' as last_name,
            'update@xapt.com' as email,
            'Updated Profile' as name,
            'Updated description with new info' as description,
            true as is_active
        """
        
        print("📝 Updating existing employee...")
        result2 = Employee.load_from_query(
            query=update_query,
            unique_fields=['email'],
            create_if_not_exists=False,
            update_existing=True
        )
        
        print(f"\n📊 Update Results:")
        if result2.get('success'):
            print(f"  🔄 Updated: {result2.get('updated', 0)} employees")
            instances = result2.get('instances', [])
            if instances:
                employee = instances[0]
                print(f"  👤 Updated employee: {employee.full_name}")
                print(f"     📝 New name: {employee.name}")
                print(f"     📄 New description: {employee.description}")
        else:
            print(f"  ❌ Update failed: {result2.get('error')}")
        
        return result2
    else:
        print(f"  ❌ Failed to create employee for update test")
        return result1


def test_query_templates():
    """Test using QueryTemplates utility"""
    
    print("\n🧪 Testing QueryTemplates utility...")
    
    # Use the built-in test data query
    test_query = QueryTemplates.test_data_query()
    
    print("📝 Using QueryTemplates.test_data_query()")
    print(f"Query preview: {test_query.strip()[:100]}...")
    
    result = Employee.load_from_query(
        query=test_query,
        unique_fields=['email']
    )
    
    print(f"\n📊 Template Query Results:")
    if result.get('success'):
        print(f"  ✅ Template query executed successfully")
        print(f"  📈 Created: {result.get('created', 0)}")
        print(f"  📋 Total processed: {result.get('total_rows', 0)}")
        
        instances = result.get('instances', [])
        for employee in instances:
            print(f"    👤 {employee.full_name} ({employee.email})")
    else:
        print(f"  ❌ Template query failed: {result.get('error')}")
    
    return result


def show_summary():
    """Show final summary of all employees"""
    
    print("\n📊 Final Employee Summary:")
    
    total_employees = Employee.objects.count()
    active_employees = Employee.objects.filter(is_active=True).count()
    
    print(f"  👥 Total employees: {total_employees}")
    print(f"  ✅ Active employees: {active_employees}")
    print(f"  📧 Unique emails: {Employee.objects.values('email').distinct().count()}")
    
    print(f"\n  📋 All employees:")
    for employee in Employee.objects.all().order_by('created_at'):
        print(f"    - {employee.full_name} ({employee.email}) - Created: {employee.created_at}")


def main():
    """Main execution function"""
    
    print("🚀 Starting Query Loader Example Script")
    print("=" * 60)
    
    try:
        # Test 1: Simple query (as requested)
        test_simple_query()
        
        # Test 2: Multiple employees
        test_multiple_employees()
        
        # Test 3: Field mapping
        test_field_mapping()
        
        # Test 4: Update existing
        test_update_existing()
        
        # Test 5: Query templates
        test_query_templates()
        
        # Final summary
        show_summary()
        
        print("\n" + "=" * 60)
        print("✅ Query Loader Example completed successfully!")
        print("\n🛠️ Query Loader Features Demonstrated:")
        print("   - BaseModel.load_from_query() method")
        print("   - Field mapping for column name differences")
        print("   - Create vs Update existing instances")
        print("   - Multiple employees from single query (UNION)")
        print("   - QueryTemplates utility class")
        print("   - Integration with PAE QueryRunner")
        
    except Exception as e:
        print(f"\n❌ Script failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
