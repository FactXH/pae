# Admin package for engagement app
# This imports all admin configurations to make them available

# Import all admin configurations
from .base_admin import BaseModelAdmin
# from .related_admin import RelatedModelAdmin
from .employee_admin import EmployeeAdmin
from .team_admin import TeamAdmin, TeamMembershipAdmin
from .base_model_admin_mixin import BaseModelAdminMixin, BaseModelAdminExtended

# Make sure Django admin site has custom branding
from django.contrib import admin

# Custom admin site configuration
admin.site.site_header = 'XAPT Employee Management'
admin.site.site_title = 'XAPT Admin'
admin.site.index_title = 'Welcome to XAPT Administration'

# Export all admin classes for easy importing
__all__ = ['BaseModelAdmin', 'EmployeeAdmin', 'TeamAdmin', 'TeamMembershipAdmin', 'BaseModelAdminMixin', 'BaseModelAdminExtended']
