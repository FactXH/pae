from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .base_model_admin_mixin import BaseModelAdminMixin, combine_fieldsets, extend_list_display
from ..models import Manager


@admin.register(Manager)
class ManagerAdmin(BaseModelAdminMixin):
    """
    Admin interface for Manager model
    
    BaseModel fields (inherited): name, description, created_at, updated_at, is_active
    Manager fields: employee, manager, effective_from, effective_to
    """
    
    # Extend base configuration with Manager-specific fields
    list_display = extend_list_display(
        BaseModelAdminMixin.base_list_display,
        'employee_link', 'manager_link', 'effective_from', 'effective_to', 
        'relationship_status_badge'
    )
    
    list_filter = BaseModelAdminMixin.base_list_filter + (
        'effective_from', 'effective_to', 'employee', 'manager'
    )
    
    search_fields = BaseModelAdminMixin.base_search_fields + (
        'employee__first_name', 'employee__last_name', 'employee__email',
        'manager__first_name', 'manager__last_name', 'manager__email'
    )
    
    # Add custom readonly fields
    readonly_fields = BaseModelAdminMixin.base_readonly_fields + (
        'employee_link', 'manager_link', 'relationship_status_badge',
        'relationship_duration_display', 'is_active_relationship_display'
    )
    
    # Manager-specific fieldsets
    manager_fieldsets = (
        ('Relationship', {
            'fields': (
                'employee',
                'manager',
                'employee_link',
                'manager_link'
            ),
            'description': 'Define who manages whom'
        }),
        ('Effective Period', {
            'fields': (
                ('effective_from', 'effective_to'),
                'relationship_duration_display',
                'relationship_status_badge',
                'is_active_relationship_display'
            ),
        }),
    )
    
    # Combine Manager fieldsets with BaseModel fieldsets
    fieldsets = combine_fieldsets(
        manager_fieldsets,
        BaseModelAdminMixin.base_fieldsets
    )
    
    # Ordering and pagination
    ordering = ('-effective_from',)
    list_per_page = 25
    
    # Date hierarchy for easy filtering
    date_hierarchy = 'effective_from'
    
    # Custom display methods
    def employee_link(self, obj):
        """Display employee as a clickable link"""
        if obj.employee:
            url = reverse('admin:engagement_employee_change', args=[obj.employee.pk])
            return format_html(
                '<a href="{}" style="font-weight: bold;">{}</a>', 
                url, obj.employee.full_name
            )
        return "-"
    employee_link.short_description = 'Employee'
    employee_link.admin_order_field = 'employee__last_name'
    
    def manager_link(self, obj):
        """Display manager as a clickable link"""
        if obj.manager:
            url = reverse('admin:engagement_employee_change', args=[obj.manager.pk])
            return format_html(
                '<a href="{}" style="color: #0066cc;">{}</a>', 
                url, obj.manager.full_name
            )
        return "-"
    manager_link.short_description = 'Manager'
    manager_link.admin_order_field = 'manager__last_name'
    
    def relationship_status_badge(self, obj):
        """Display relationship status with color coding"""
        if obj.is_active_relationship:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">ACTIVE</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #6c757d; color: white; padding: 2px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">INACTIVE</span>'
            )
    relationship_status_badge.short_description = 'Status'
    
    def relationship_duration_display(self, obj):
        """Display relationship duration"""
        duration = obj.relationship_duration_days
        if duration:
            return f"{duration} days"
        return "Ongoing"
    relationship_duration_display.short_description = 'Duration'
    
    def is_active_relationship_display(self, obj):
        """Display whether relationship is currently active"""
        return obj.is_active_relationship
    is_active_relationship_display.short_description = 'Currently Active'
    is_active_relationship_display.boolean = True
    
    # Custom actions
    def end_relationships_today(self, request, queryset):
        """Set effective_to to today for selected manager relationships"""
        from django.utils import timezone
        today = timezone.now().date()
        
        updated = 0
        for relationship in queryset:
            if not relationship.effective_to:
                relationship.effective_to = today
                relationship.save()
                updated += 1
        
        self.message_user(request, f'Successfully ended {updated} manager relationship(s).')
    end_relationships_today.short_description = 'End selected relationships today'
    
    # Add custom action to base actions
    actions = BaseModelAdminMixin.actions + ['end_relationships_today']
