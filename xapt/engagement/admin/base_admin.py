from django.contrib import admin
from .base_model_admin_mixin import BaseModelAdminExtended
from ..models import BaseModel


@admin.register(BaseModel)
class BaseModelAdmin(BaseModelAdminExtended):
    """
    Admin interface for BaseModel using the reusable BaseModelAdminExtended.
    This demonstrates how to use the base admin for models that only have BaseModel fields.
    """
    
    # Inherited from BaseModelAdminExtended:
    # - list_display, list_filter, search_fields
    # - fieldsets with BaseModel fields
    # - activate/deactivate actions
    # - is_active_badge display method
    
    # Custom ordering for BaseModel
    ordering = ('-created_at',)
