# Django Admin Configuration for Engagement App
# This file imports all admin configurations from the admin package

# Import all admin classes from the admin package
# This ensures all models are registered with their respective admin interfaces
from .admin import *

# The actual admin configurations are now organized in separate files:
# - admin/base_admin.py: BaseModelAdmin
# - admin/related_admin.py: RelatedModelAdmin  
# - admin/employee_admin.py: EmployeeAdmin
# - admin/__init__.py: Package configuration and admin site branding