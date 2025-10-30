from django.contrib import admin
from django.utils.html import format_html


class BaseModelAdminMixin(admin.ModelAdmin):
    """
    Reusable admin mixin for models that inherit from BaseModel.
    
    This provides common fieldsets, display methods, and actions for BaseModel fields:
    - name, description, is_active (core BaseModel fields)
    - created_at, updated_at (timestamp fields)
    
    Usage:
    class YourModelAdmin(BaseModelAdminMixin):
        # Add your model-specific configuration
        list_display = BaseModelAdminMixin.list_display + ('your_field',)
        fieldsets = BaseModelAdminMixin.fieldsets + (
            ('Your Model Fields', {
                'fields': ('your_field1', 'your_field2')
            }),
        )
    """
    
    # Base configuration for BaseModel fields
    # Use base_list_display for inline editing compatibility
    base_list_display = ('name', 'is_active', 'created_at', 'updated_at')
    base_list_display = ()
    # Use base_list_display_with_badge for visual-only display (no inline editing)
    base_list_display_with_badge = ('name', 'is_active_badge', 'created_at', 'updated_at')
    base_list_filter = ('is_active', 'created_at', 'updated_at')
    base_search_fields = ('name', 'description')
    base_readonly_fields = ('created_at', 'updated_at')
    
    # Default configuration (can be overridden)
    list_display = base_list_display
    list_filter = base_list_filter
    search_fields = base_search_fields
    readonly_fields = base_readonly_fields
    list_per_page = 25
    
    # Base fieldsets that can be combined with model-specific fieldsets
    base_fieldsets = (
        ('BaseModel Fields', {
            'fields': (
                ('factorial_id', 'tair_id'),
                'name',
                'description', 
                'is_active'
            ),
            'classes': ('collapse',),
            'description': 'Core fields inherited from BaseModel'
        }),
        ('Timestamps (Auto-generated)', {
            'fields': (
                'created_at', 
                'updated_at'
            ),
            'classes': ('collapse',),
            'description': 'Automatically managed timestamps from BaseModel'
        }),
    )
    
    # Default fieldsets (can be overridden)
    fieldsets = base_fieldsets
    
    # Base actions
    actions = ['activate_entities', 'deactivate_entities']
    
    # Common display methods for BaseModel fields
    def is_active_badge(self, obj):
        """Display active status with color coding"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">ACTIVE</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 2px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">INACTIVE</span>'
            )
    is_active_badge.short_description = 'Status'
    is_active_badge.admin_order_field = 'is_active'
    
    # Common actions for BaseModel
    def activate_entities(self, request, queryset):
        """Activate selected entities"""
        updated = queryset.update(is_active=True)
        model_name = queryset.model._meta.verbose_name_plural.lower()
        self.message_user(request, f'Successfully activated {updated} {model_name}.')
    activate_entities.short_description = 'Activate selected items'
    
    def deactivate_entities(self, request, queryset):
        """Deactivate selected entities"""
        updated = queryset.update(is_active=False)
        model_name = queryset.model._meta.verbose_name_plural.lower()
        self.message_user(request, f'Successfully deactivated {updated} {model_name}.')
    deactivate_entities.short_description = 'Deactivate selected items'
    
    class Meta:
        abstract = True


class BaseModelAdminExtended(BaseModelAdminMixin):
    """
    Extended base admin for models that ONLY have BaseModel fields.
    Use this for models that don't add additional fields beyond BaseModel.
    """
    
    # More comprehensive configuration for pure BaseModel usage
    # Use actual field name for inline editing, custom method for other cases
    list_display = ('name', 'is_active', 'created_at', 'updated_at')
    list_editable = ('is_active',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


def combine_fieldsets(*fieldset_groups):
    """
    Utility function to combine multiple fieldset groups.
    
    Usage:
    fieldsets = combine_fieldsets(
        BaseModelAdminMixin.base_fieldsets,
        your_model_fieldsets,
        additional_fieldsets
    )
    """
    combined = []
    for group in fieldset_groups:
        if isinstance(group, tuple) and len(group) > 0:
            combined.extend(group)
    return tuple(combined)


def extend_list_display(base_display, *additional_fields):
    """
    Utility function to extend list_display with additional fields.
    
    Usage:
    list_display = extend_list_display(
        BaseModelAdminMixin.base_list_display,
        'your_field1', 'your_field2'
    )
    """
    if isinstance(base_display, (list, tuple)):
        return tuple(base_display) + additional_fields
    return additional_fields
