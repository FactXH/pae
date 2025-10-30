from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .base_model_admin_mixin import BaseModelAdminMixin, combine_fieldsets, extend_list_display
from ..models import Contract


@admin.register(Contract)
class ContractAdmin(BaseModelAdminMixin):
    """
    Admin interface for Contract model
    
    BaseModel fields (inherited): name, description, created_at, updated_at, is_active
    Contract fields: employee, role, salary_amount, effective_from, effective_to
    """
    
    # Extend base configuration with Contract-specific fields
    list_display = extend_list_display(
        BaseModelAdminMixin.base_list_display,
        'employee_link', 'role_link', 'salary_display', 'effective_from', 'effective_to', 
        'contract_status_badge'
    )
    
    list_filter = BaseModelAdminMixin.base_list_filter + (
        'effective_from', 'effective_to', 'role', 'employee'
    )
    
    search_fields = BaseModelAdminMixin.base_search_fields + (
        'employee__first_name', 'employee__last_name', 'employee__email',
        'role__role_name', 'role__level_name'
    )
    
    # Add custom readonly fields
    readonly_fields = BaseModelAdminMixin.base_readonly_fields + (
        'employee_link', 'role_link', 'contract_status_badge', 
        'contract_duration_display', 'is_active_contract_display'
    )
    
    # Contract-specific fieldsets
    contract_fieldsets = (
        ('Contract Parties', {
            'fields': (
                'employee',
                'role',
                'employee_link',
                'role_link'
            ),
        }),
        ('Financial Details', {
            'fields': (
                'salary_amount',
            ),
        }),
        ('Contract Period', {
            'fields': (
                ('effective_from', 'effective_to'),
                'contract_duration_display',
                'contract_status_badge',
                'is_active_contract_display'
            ),
        }),
    )
    
    # Combine Contract fieldsets with BaseModel fieldsets
    fieldsets = combine_fieldsets(
        contract_fieldsets,
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
            return format_html('<a href="{}">{}</a>', url, obj.employee.full_name)
        return "-"
    employee_link.short_description = 'Employee'
    employee_link.admin_order_field = 'employee__last_name'
    
    def role_link(self, obj):
        """Display role as a clickable link"""
        if obj.role:
            url = reverse('admin:engagement_role_change', args=[obj.role.pk])
            return format_html('<a href="{}">{}</a>', url, obj.role.role_level_name)
        return "-"
    role_link.short_description = 'Role'
    role_link.admin_order_field = 'role__role_name'
    
    def salary_display(self, obj):
        """Display salary with currency formatting"""
        if obj.salary_amount is not None:
            return format_html(
                '<span style="font-weight: bold;">${}</span>',
                f"{obj.salary_amount:,.2f}"
            )
        return "-"
    salary_display.short_description = 'Salary'
    salary_display.admin_order_field = 'salary_amount'
    
    def contract_status_badge(self, obj):
        """Display contract status with color coding"""
        if obj.is_active_contract:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">ACTIVE</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #6c757d; color: white; padding: 2px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">INACTIVE</span>'
            )
    contract_status_badge.short_description = 'Contract Status'
    
    def contract_duration_display(self, obj):
        """Display contract duration"""
        duration = obj.contract_duration_days
        if duration:
            return f"{duration} days"
        return "Ongoing"
    contract_duration_display.short_description = 'Duration'
    
    def is_active_contract_display(self, obj):
        """Display whether contract is currently active"""
        return obj.is_active_contract
    is_active_contract_display.short_description = 'Currently Active'
    is_active_contract_display.boolean = True
    
    # Custom actions
    def end_contracts_today(self, request, queryset):
        """Set effective_to to today for selected contracts"""
        from django.utils import timezone
        today = timezone.now().date()
        
        updated = 0
        for contract in queryset:
            if not contract.effective_to:
                contract.effective_to = today
                contract.save()
                updated += 1
        
        self.message_user(request, f'Successfully ended {updated} contract(s).')
    end_contracts_today.short_description = 'End selected contracts today'
    
    # Add custom action to base actions
    actions = BaseModelAdminMixin.actions + ['end_contracts_today']
