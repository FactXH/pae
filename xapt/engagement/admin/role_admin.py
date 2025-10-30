from django.contrib import admin
from django.utils.html import format_html
from .base_model_admin_mixin import BaseModelAdminMixin, combine_fieldsets, extend_list_display
from ..models import Role


@admin.register(Role)
class RoleAdmin(BaseModelAdminMixin):
    """
    Admin interface for Role model
    
    BaseModel fields (inherited): name, description, created_at, updated_at, is_active
    Role fields: role_level_name, role_name, level_name
    """
    
    # Extend base configuration with Role-specific fields
    list_display = extend_list_display(
        BaseModelAdminMixin.base_list_display,
        'role_level_name', 'active_contracts_count', 'contract_count'
    )
    
    list_filter = BaseModelAdminMixin.base_list_filter + (
        'role_name', 'level_name'
    )
    
    search_fields = BaseModelAdminMixin.base_search_fields + (
        'role_level_name', 'role_name', 'level_name'
    )
    
    # Add custom readonly fields
    readonly_fields = BaseModelAdminMixin.base_readonly_fields + (
        'contract_count', 'active_contracts_count', 'active_contracts_display',
        'historical_contracts_display'
    )
    
    # Role-specific fieldsets
    role_fieldsets = (
        ('Role Information', {
            'fields': (
                'role_level_name',
                ('role_name', 'level_name')
            ),
            'description': 'Define the role and its level. role_level_name will be auto-generated if empty.'
        }),
        ('Contract Statistics', {
            'fields': (
                'contract_count',
                'active_contracts_count',
                'active_contracts_display',
                'historical_contracts_display'
            ),
            'classes': ('collapse',)
        }),
    )
    
    # Combine Role fieldsets with BaseModel fieldsets
    fieldsets = combine_fieldsets(
        role_fieldsets,
        BaseModelAdminMixin.base_fieldsets
    )
    
    # Ordering and pagination
    ordering = ('role_name', 'level_name')
    list_per_page = 25
    
    # Custom display methods
    def contract_count(self, obj):
        """Display total number of contracts for this role"""
        count = obj.contracts.count()
        return format_html(
            '<span style="font-weight: bold;">{}</span>',
            count
        )
    contract_count.short_description = 'Total Contracts'
    
    def active_contracts_count(self, obj):
        """Display number of active contracts"""
        active_contracts = [c for c in obj.contracts.all() if c.is_active_contract]
        count = len(active_contracts)
        if count > 0:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 8px; '
                'border-radius: 3px; font-size: 11px;">{}</span>',
                count
            )
        return count
    active_contracts_count.short_description = 'Active Contracts'
    
    def active_contracts_display(self, obj):
        """Display list of employees with active contracts for this role"""
        from django.urls import reverse
        from django.utils.safestring import mark_safe
        
        # Get all contracts and filter for active ones
        active_contracts = [c for c in obj.contracts.all() if c.is_active_contract]
        
        if not active_contracts:
            return mark_safe("<em>No active contracts</em>")
        
        # Sort by employee last name
        active_contracts.sort(key=lambda c: c.employee.last_name)
        
        contracts_info = []
        for contract in active_contracts:
            # Create employee link
            employee_url = reverse('admin:engagement_employee_change', args=[contract.employee.pk])
            employee_link = format_html('<a href="{}">{}</a>', employee_url, contract.employee.full_name)
            
            # Create contract link
            contract_url = reverse('admin:engagement_contract_change', args=[contract.pk])
            contract_link = format_html('<a href="{}" style="font-size: 11px;">[View Contract]</a>', contract_url)
            
            # Format salary
            salary_display = f"${contract.salary_amount:,.2f}" if contract.salary_amount else "N/A"
            
            # Format date info
            date_info = f"since {contract.effective_from}"
            
            contracts_info.append(
                f"👤 {employee_link} - {salary_display} ({date_info}) {contract_link}"
            )
        
        return mark_safe("<br>".join(contracts_info))
    active_contracts_display.short_description = 'Active Contracts'
    
    def historical_contracts_display(self, obj):
        """Display list of employees with historical contracts for this role"""
        from django.urls import reverse
        from django.utils.safestring import mark_safe
        
        # Get all contracts and filter for inactive ones
        historical_contracts = [c for c in obj.contracts.all() if not c.is_active_contract]
        
        if not historical_contracts:
            return mark_safe("<em>No historical contracts</em>")
        
        # Sort by most recent first, limit to 10
        historical_contracts.sort(key=lambda c: c.effective_from, reverse=True)
        recent_historical = historical_contracts[:10]
        
        contracts_info = []
        for contract in recent_historical:
            # Create employee link
            employee_url = reverse('admin:engagement_employee_change', args=[contract.employee.pk])
            employee_link = format_html('<a href="{}">{}</a>', employee_url, contract.employee.full_name)
            
            # Create contract link
            contract_url = reverse('admin:engagement_contract_change', args=[contract.pk])
            contract_link = format_html('<a href="{}" style="font-size: 11px;">[View Contract]</a>', contract_url)
            
            # Format salary
            salary_display = f"${contract.salary_amount:,.2f}" if contract.salary_amount else "N/A"
            
            # Format date range
            end_date = contract.effective_to or "ongoing"
            date_info = f"({contract.effective_from} → {end_date})"
            
            contracts_info.append(
                f"📋 {employee_link} - {salary_display} {date_info} {contract_link}"
            )
        
        # Add note if there are more historical contracts
        if len(historical_contracts) > 10:
            contracts_info.append(
                f"<em>... and {len(historical_contracts) - 10} more historical contracts</em>"
            )
        
        return mark_safe("<br>".join(contracts_info))
    historical_contracts_display.short_description = 'Historical Contracts'
