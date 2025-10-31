from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from datetime import date
from .base_model_admin_mixin import BaseModelAdminMixin, combine_fieldsets, extend_list_display
from ..models import Employee, TeamMembership


class TeamMembershipInline(admin.TabularInline):
    """
    Inline admin for viewing/editing team memberships from Employee admin
    """
    model = TeamMembership
    extra = 0
    can_delete = True
    
    fields = ('team', 'effective_from', 'effective_to', 'is_lead', 'is_active_status')
    readonly_fields = ('is_active_status',)
    
    def is_active_status(self, obj):
        """Display current active status"""
        if obj.pk:  # Only for existing memberships
            return "Active" if obj.is_active else "Inactive"
        return "-"
    is_active_status.short_description = 'Status'
    
    # Ordering by most recent first
    ordering = ['-effective_from']


@admin.register(Employee)
class EmployeeAdmin(BaseModelAdminMixin):
    """
    Comprehensive admin interface for Employee model
    
    BaseModel fields (inherited): name, description, created_at, updated_at, is_active
    Employee fields: first_name, last_name, email, phone_number, employee_id, 
                    department, position, hire_date, salary, employment_status, manager
    """
    
    # Extend base configuration with Employee-specific fields
    list_display = extend_list_display(
        BaseModelAdminMixin.base_list_display,
        'first_name', 'last_name', 'email', 'current_teams_short'
    )
    
    list_filter = BaseModelAdminMixin.base_list_filter + (
        'first_name', 'last_name', 'email'
    )
    
    search_fields = BaseModelAdminMixin.base_search_fields + (
        'first_name', 'last_name', 'email'
    )
    
    # Inherit base readonly fields and add team-related, manager-related, and contract display methods
    readonly_fields = BaseModelAdminMixin.base_readonly_fields + (
        'full_name_display', 'is_manager_display', 'subordinates_count', 
        'subordinates_links', 'current_teams_display', 'team_history_display',
        'team_membership_summary', 'manager_relationship_summary', 
        'current_manager_display', 'manager_history_display',
        'contract_summary', 'current_contracts_display', 'contract_history_display'
    )
    
    # Add team membership inline
    # inlines = [TeamMembershipInline]
    
    # Employee-specific fieldsets
    employee_fieldsets = (
        ('Personal Information', {
            'fields': (
                ('first_name', 'last_name'), 
                'email',
                'full_name_display'
            )
        }),
        ('Management Information', {
            'fields': (
                'is_manager_display',
                'subordinates_count',
                'subordinates_links'
            ),
            'classes': ('collapse',)
        }),
        ('Team Membership', {
            'fields': (
                'team_membership_summary',
                'current_teams_display',
                'team_history_display'
            ),
            'classes': ('collapse',)
        }),
        ('Manager Relationships', {
            'fields': (
                'manager_relationship_summary',
                'current_manager_display',
                'manager_history_display'
            ),
            'classes': ('collapse',)
        }),
        ('Contracts', {
            'fields': (
                'contract_summary',
                'current_contracts_display',
                'contract_history_display'
            ),
            'classes': ('collapse',)
        }),
    )
    
    # Combine Employee fieldsets with BaseModel fieldsets
    fieldsets = combine_fieldsets(
        employee_fieldsets,
        BaseModelAdminMixin.base_fieldsets
    )
    
    # Ordering and pagination
    ordering = ('last_name', 'first_name')
    list_per_page = 25
    
    # Extend base actions with Employee-specific actions
    actions = BaseModelAdminMixin.actions + ['activate_employees', 'deactivate_employees', 'export_employee_data', 'show_team_summary']
    
    # Custom display methods
    def full_name_link(self, obj):
        """Display full name as a link to detail view"""
        url = reverse('admin:engagement_employee_change', args=[obj.pk])
        return format_html('<a href="{}">{}</a>', url, obj.full_name)
    full_name_link.short_description = 'Name'
    full_name_link.admin_order_field = 'last_name'
    
    def employment_status_badge(self, obj):
        """Display employment status with color coding"""
        colors = {
            'active': '#28a745',
            'inactive': '#6c757d', 
            'terminated': '#dc3545',
            'on_leave': '#ffc107'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 12px; font-weight: bold;">{}</span>',
            colors.get(obj.employment_status, '#000000'),
            obj.get_employment_status_display().upper()
        )
    employment_status_badge.short_description = 'Status'
    employment_status_badge.admin_order_field = 'employment_status'
    
    def manager_link(self, obj):
        """Display manager as a link if exists"""
        if obj.manager:
            url = reverse('admin:engagement_employee_change', args=[obj.manager.pk])
            return format_html('<a href="{}">{}</a>', url, obj.manager.full_name)
        return '-'
    manager_link.short_description = 'Manager'
    manager_link.admin_order_field = 'manager__last_name'
    
    def is_manager_badge(self, obj):
        """Display if employee is a manager"""
        if obj.is_manager:
            return format_html(
                '<span style="background-color: #007bff; color: white; '
                'padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;">MANAGER</span>'
            )
        return '-'
    is_manager_badge.short_description = 'Manager?'
    
    def full_name_display(self, obj):
        """Read-only full name display"""
        return obj.full_name
    full_name_display.short_description = 'Full Name'
    
    def is_manager_display(self, obj):
        """Read-only manager status display"""
        return "Yes" if obj.is_manager else "No"
    is_manager_display.short_description = 'Is Manager'
    
    def subordinates_count(self, obj):
        """Display count of direct subordinates"""
        count = obj.subordinates.count()
        if count > 0:
            return format_html(
                '<strong style="color: #007bff;">{} subordinate{}</strong>',
                count, 
                's' if count != 1 else ''
            )
        return 'No subordinates'
    subordinates_count.short_description = 'Direct Subordinates'
    
    def current_teams_short(self, obj):
        """Display current teams in a compact format for list view"""
        active_memberships = [m for m in obj.team_memberships.all() if m.is_active]
        
        if not active_memberships:
            return '-'
        
        if len(active_memberships) == 1:
            membership = active_memberships[0]
            lead_indicator = " 👑" if membership.is_lead else ""
            return f"{membership.team.team_name}{lead_indicator}"
        else:
            # Multiple teams - show count with leadership indicator
            lead_count = sum(1 for m in active_memberships if m.is_lead)
            lead_info = f" ({lead_count} lead)" if lead_count > 0 else ""
            return f"{len(active_memberships)} teams{lead_info}"
    current_teams_short.short_description = 'Current Teams'
    current_teams_short.admin_order_field = 'team_memberships__team__team_name'
    
    def subordinates_links(self, obj):
        """Display subordinates as links"""
        subordinates = obj.subordinates.all()[:5]  # Limit to first 5
        if subordinates:
            links = []
            for subordinate in subordinates:
                url = reverse('admin:engagement_employee_change', args=[subordinate.pk])
                links.append(format_html('<a href="{}">{}</a>', url, subordinate.full_name))
            
            result = mark_safe(', '.join(links))
            if obj.subordinates.count() > 5:
                result += f' <em>(+{obj.subordinates.count() - 5} more)</em>'
            return result
        return 'No subordinates'
    subordinates_links.short_description = 'Subordinate Links'
    
    # Team Membership Display Methods
    def team_membership_summary(self, obj):
        """Display team membership summary statistics"""
        today = date.today()
        all_memberships = obj.team_memberships.all()
        active_memberships = [m for m in all_memberships if m.is_active]
        historical_memberships = [m for m in all_memberships if not m.is_active]
        leadership_roles = [m for m in all_memberships if m.is_lead]
        
        summary = []
        summary.append(f"<strong>📊 Membership Summary:</strong>")
        summary.append(f"• <span style='color: #28a745;'>Active Teams: {len(active_memberships)}</span>")
        summary.append(f"• Historical Teams: {len(historical_memberships)}")
        summary.append(f"• Leadership Roles: {len(leadership_roles)}")
        summary.append(f"• Total Memberships: {len(all_memberships)}")
        
        return mark_safe("<br>".join(summary))
    team_membership_summary.short_description = 'Team Summary'
    
    def current_teams_display(self, obj):
        """Display current active team memberships"""
        today = date.today()
        active_memberships = [m for m in obj.team_memberships.all() if m.is_active]
        
        if not active_memberships:
            return mark_safe("<em>No active team memberships</em>")
        
        teams_info = []
        for membership in active_memberships:
            # Create team link
            team_url = reverse('admin:engagement_team_change', args=[membership.team.pk])
            team_link = format_html('<a href="{}">{}</a>', team_url, membership.team.team_name)
            
            # Add leadership indicator and effective date
            lead_badge = ""
            if membership.is_lead:
                lead_badge = " <span style='background-color: #ffc107; color: black; padding: 1px 4px; border-radius: 3px; font-size: 10px; font-weight: bold;'>LEAD</span>"
            
            duration_info = f" (since {membership.effective_from})"
            teams_info.append(f"🏢 {team_link}{lead_badge}{duration_info}")
        
        return mark_safe("<br>".join(teams_info))
    current_teams_display.short_description = 'Current Teams'
    
    def team_history_display(self, obj):
        """Display historical team memberships"""
        today = date.today()
        historical_memberships = [m for m in obj.team_memberships.all() if not m.is_active]
        
        if not historical_memberships:
            return mark_safe("<em>No historical team memberships</em>")
        
        # Limit to most recent 10 to avoid overwhelming display
        recent_historical = sorted(historical_memberships, key=lambda m: m.effective_from, reverse=True)[:10]
        
        history_info = []
        for membership in recent_historical:
            # Create team link
            team_url = reverse('admin:engagement_team_change', args=[membership.team.pk])
            team_link = format_html('<a href="{}">{}</a>', team_url, membership.team.team_name)
            
            # Add leadership indicator and date range
            lead_badge = ""
            if membership.is_lead:
                lead_badge = " <span style='background-color: #6c757d; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px;'>WAS LEAD</span>"
            
            # Format date range
            end_date = membership.effective_to or "ongoing"
            duration_info = f" ({membership.effective_from} → {end_date})"
            
            history_info.append(f"📋 {team_link}{lead_badge}{duration_info}")
        
        # Add note if there are more historical memberships
        if len(historical_memberships) > 10:
            history_info.append(f"<em>... and {len(historical_memberships) - 10} more historical memberships</em>")
        
        return mark_safe("<br>".join(history_info))
    team_history_display.short_description = 'Team History'
    
    # Manager Relationship Display Methods
    def manager_relationship_summary(self, obj):
        """Display manager relationship summary statistics"""
        from ..models import Manager
        today = date.today()
        
        # Get all manager relationships where this employee is the managed employee
        all_relationships = Manager.objects.filter(employee=obj).order_by('-effective_from')
        active_relationships = [r for r in all_relationships if r.is_active_relationship]
        historical_relationships = [r for r in all_relationships if not r.is_active_relationship]
        
        summary = []
        summary.append(f"<strong>📊 Manager Relationship Summary:</strong>")
        summary.append(f"• <span style='color: #28a745;'>Current Manager: {len(active_relationships)}</span>")
        summary.append(f"• Historical Managers: {len(historical_relationships)}")
        summary.append(f"• Total Manager Changes: {len(all_relationships)}")
        
        return mark_safe("<br>".join(summary))
    manager_relationship_summary.short_description = 'Manager Summary'
    
    def current_manager_display(self, obj):
        """Display current active manager"""
        from ..models import Manager
        today = date.today()
        
        active_relationships = [r for r in Manager.objects.filter(employee=obj) if r.is_active_relationship]
        
        if not active_relationships:
            return mark_safe("<em>No current manager assigned</em>")
        
        manager_info = []
        for relationship in active_relationships:
            # Create manager link
            manager_url = reverse('admin:engagement_employee_change', args=[relationship.manager.pk])
            manager_link = format_html('<a href="{}">{}</a>', manager_url, relationship.manager.full_name)
            
            # Use effective_from or fall back to created_at
            start_date = relationship.effective_from or relationship.created_at.date()
            duration_info = f" (since {start_date})"
            manager_info.append(f"👤 {manager_link}{duration_info}")
        
        return mark_safe("<br>".join(manager_info))
    current_manager_display.short_description = 'Current Manager'
    
    def manager_history_display(self, obj):
        """Display historical manager relationships"""
        from ..models import Manager
        today = date.today()
        
        historical_relationships = [r for r in Manager.objects.filter(employee=obj) if not r.is_active_relationship]
        
        if not historical_relationships:
            return mark_safe("<em>No manager history</em>")
        
        # Sort by most recent first
        recent_historical = sorted(historical_relationships, key=lambda r: r.effective_from, reverse=True)[:10]
        
        history_info = []
        for relationship in recent_historical:
            # Create manager link
            manager_url = reverse('admin:engagement_employee_change', args=[relationship.manager.pk])
            manager_link = format_html('<a href="{}">{}</a>', manager_url, relationship.manager.full_name)
            
            # Format date range
            end_date = relationship.effective_to or "ongoing"
            duration_info = f" ({relationship.effective_from} → {end_date})"
            
            history_info.append(f"📋 {manager_link}{duration_info}")
        
        # Add note if there are more historical relationships
        if len(historical_relationships) > 10:
            history_info.append(f"<em>... and {len(historical_relationships) - 10} more historical managers</em>")
        
        return mark_safe("<br>".join(history_info))
    manager_history_display.short_description = 'Manager History'
    
    # Contract Display Methods
    def contract_summary(self, obj):
        """Display contract summary statistics"""
        from ..models import Contract
        today = date.today()
        
        all_contracts = Contract.objects.filter(employee=obj).order_by('-effective_from')
        active_contracts = [c for c in all_contracts if c.is_active_contract]
        historical_contracts = [c for c in all_contracts if not c.is_active_contract]
        
        # Calculate total compensation from active contracts
        total_compensation = sum(c.salary_amount for c in active_contracts if c.salary_amount)
        
        summary = []
        summary.append(f"<strong>📊 Contract Summary:</strong>")
        summary.append(f"• <span style='color: #28a745;'>Active Contracts: {len(active_contracts)}</span>")
        if total_compensation:
            summary.append(f"• Total Active Compensation: <strong>${total_compensation:,.2f}</strong>")
        summary.append(f"• Historical Contracts: {len(historical_contracts)}")
        summary.append(f"• Total Contracts: {len(all_contracts)}")
        
        return mark_safe("<br>".join(summary))
    contract_summary.short_description = 'Contract Summary'
    
    def current_contracts_display(self, obj):
        """Display current active contracts"""
        from ..models import Contract
        today = date.today()
        
        active_contracts = [c for c in Contract.objects.filter(employee=obj) if c.is_active_contract]
        
        if not active_contracts:
            return mark_safe("<em>No active contracts</em>")
        
        # Sort by most recent first
        active_contracts.sort(key=lambda c: c.effective_from, reverse=True)
        
        contracts_info = []
        for contract in active_contracts:
            # Create role link
            role_url = reverse('admin:engagement_role_change', args=[contract.role.pk])
            role_link = format_html('<a href="{}">{}</a>', role_url, contract.role.role_level_name)
            
            # Create contract link
            contract_url = reverse('admin:engagement_contract_change', args=[contract.pk])
            contract_link = format_html('<a href="{}" style="font-size: 11px;">[View]</a>', contract_url)
            
            # Format salary
            salary_display = f"${contract.salary_amount:,.2f}" if contract.salary_amount else "N/A"
            
            # Duration info
            duration_info = f" (since {contract.effective_from})"
            
            contracts_info.append(
                f"💼 {role_link} - <strong>{salary_display}</strong>{duration_info} {contract_link}"
            )
        
        return mark_safe("<br>".join(contracts_info))
    current_contracts_display.short_description = 'Current Contracts'
    
    def contract_history_display(self, obj):
        """Display historical contracts"""
        from ..models import Contract
        today = date.today()
        
        historical_contracts = [c for c in Contract.objects.filter(employee=obj) if not c.is_active_contract]
        
        if not historical_contracts:
            return mark_safe("<em>No contract history</em>")
        
        # Sort by most recent first, limit to 10
        recent_historical = sorted(historical_contracts, key=lambda c: c.effective_from, reverse=True)[:10]
        
        history_info = []
        for contract in recent_historical:
            # Create role link
            role_url = reverse('admin:engagement_role_change', args=[contract.role.pk])
            role_link = format_html('<a href="{}">{}</a>', role_url, contract.role.role_level_name)
            
            # Create contract link
            contract_url = reverse('admin:engagement_contract_change', args=[contract.pk])
            contract_link = format_html('<a href="{}" style="font-size: 11px;">[View]</a>', contract_url)
            
            # Format salary
            salary_display = f"${contract.salary_amount:,.2f}" if contract.salary_amount else "N/A"
            
            # Format date range - use effective dates or fall back to created_at
            start_date = contract.effective_from or contract.created_at.date()
            end_date = contract.effective_to or "ongoing"
            duration_info = f" ({start_date} → {end_date})"
            
            history_info.append(
                f"📋 {role_link} - {salary_display}{duration_info} {contract_link}"
            )
        
        # Add note if there are more historical contracts
        if len(historical_contracts) > 10:
            history_info.append(f"<em>... and {len(historical_contracts) - 10} more historical contracts</em>")
        
        return mark_safe("<br>".join(history_info))
    contract_history_display.short_description = 'Contract History'
    
    # Custom actions
    def activate_employees(self, request, queryset):
        """Activate selected employees"""
        updated = queryset.update(employment_status='active', is_active=True)
        self.message_user(request, f'Successfully activated {updated} employee{"s" if updated != 1 else ""}.')
    activate_employees.short_description = 'Activate selected employees'
    
    def deactivate_employees(self, request, queryset):
        """Deactivate selected employees"""
        updated = queryset.update(employment_status='inactive', is_active=False)
        self.message_user(request, f'Successfully deactivated {updated} employee{"s" if updated != 1 else ""}.')
    deactivate_employees.short_description = 'Deactivate selected employees'
    
    def export_employee_data(self, request, queryset):
        """Export employee data using PAE utils"""
        try:
            results = []
            for employee in queryset:
                result = employee.load_employee_data_to_warehouse()
                if result.get('success'):
                    results.extend(result.get('data', []))
            
            self.message_user(
                request, 
                f'Successfully exported data for {len(queryset)} employee{"s" if len(queryset) != 1 else ""} using PAE utils.'
            )
        except Exception as e:
            self.message_user(
                request, 
                f'Export failed: {str(e)}. Make sure PAE utils are properly configured.',
                level='ERROR'
            )
    export_employee_data.short_description = 'Export employee data (PAE utils)'
    
    def show_team_summary(self, request, queryset):
        """Show team membership summary for selected employees"""
        total_employees = queryset.count()
        total_active_memberships = 0
        total_leadership_roles = 0
        teams_covered = set()
        
        for employee in queryset:
            active_memberships = [m for m in employee.team_memberships.all() if m.is_active]
            leadership_roles = [m for m in employee.team_memberships.all() if m.is_lead and m.is_active]
            
            total_active_memberships += len(active_memberships)
            total_leadership_roles += len(leadership_roles)
            
            for membership in active_memberships:
                teams_covered.add(membership.team.team_name)
        
        self.message_user(
            request,
            f'Team Summary for {total_employees} employees: '
            f'{total_active_memberships} active memberships, '
            f'{total_leadership_roles} leadership roles across '
            f'{len(teams_covered)} different teams: {", ".join(sorted(teams_covered))}'
        )
    show_team_summary.short_description = 'Show team membership summary'
