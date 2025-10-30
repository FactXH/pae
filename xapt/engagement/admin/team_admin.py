from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .base_model_admin_mixin import BaseModelAdminMixin, combine_fieldsets, extend_list_display
from ..models import Team, TeamMembership


@admin.register(Team)
class TeamAdmin(BaseModelAdminMixin):
    """
    Admin interface for Team model
    
    BaseModel fields (inherited): name, description, created_at, updated_at, is_active
    Team fields: team_name, nature, level, parent_team
    """
    
    # Extend base configuration with Team-specific fields
    list_display = extend_list_display(
        BaseModelAdminMixin.base_list_display,
        'team_name', 'nature_badge', 'level', 'parent_team_link', 'team_size_display'
    )
    
    list_filter = BaseModelAdminMixin.base_list_filter + (
        'nature', 'level', 'parent_team'
    )
    
    search_fields = BaseModelAdminMixin.base_search_fields + (
        'team_name', 'parent_team__team_name'
    )
    
    list_editable = ('level',)
    
    # Inherit base readonly fields and add computed fields
    readonly_fields = BaseModelAdminMixin.base_readonly_fields + (
        'full_hierarchy_display', 'team_size_display', 'hierarchy_info'
    )
    
    # Team-specific fieldsets
    team_fieldsets = (
        ('Team Information', {
            'fields': (
                'team_name',
                'nature',
                'parent_team',
                'level'
            )
        }),
        ('Hierarchy Information', {
            'fields': (
                'full_hierarchy_display',
                'hierarchy_info',
                'team_size_display'
            ),
            'classes': ('collapse',)
        }),
    )
    
    # Combine Team fieldsets with BaseModel fieldsets
    fieldsets = combine_fieldsets(
        team_fieldsets,
        BaseModelAdminMixin.base_fieldsets
    )
    
    # Ordering and pagination
    ordering = ('level', 'team_name')
    list_per_page = 25
    
    # Extend base actions with Team-specific actions
    actions = BaseModelAdminMixin.actions + ['show_team_hierarchy', 'export_team_structure']
    
    # Custom display methods
    def nature_badge(self, obj):
        """Display nature with color coding"""
        colors = {'team': '#007bff', 'market': '#28a745'}
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            colors.get(obj.nature, '#6c757d'),
            obj.get_nature_display().upper()
        )
    nature_badge.short_description = 'Nature'
    nature_badge.admin_order_field = 'nature'
    
    def parent_team_link(self, obj):
        """Display parent team as a clickable link"""
        if obj.parent_team:
            url = reverse('admin:engagement_team_change', args=[obj.parent_team.pk])
            return format_html('<a href="{}">{}</a>', url, obj.parent_team.team_name)
        return '(Root Team)'
    parent_team_link.short_description = 'Parent Team'
    parent_team_link.admin_order_field = 'parent_team__team_name'
    
    def team_size_display(self, obj):
        """Display current team size"""
        current_size = obj.get_team_size()
        total_size = obj.get_team_size(include_descendants=True)
        
        if current_size != total_size:
            return format_html(
                '<strong>{}</strong> direct <em>(+{} in subtrees = {} total)</em>',
                current_size, total_size - current_size, total_size
            )
        else:
            return format_html('<strong>{}</strong> members', current_size)
    team_size_display.short_description = 'Team Size'
    
    def full_hierarchy_display(self, obj):
        """Display full hierarchy path"""
        return obj.full_hierarchy_name
    full_hierarchy_display.short_description = 'Full Hierarchy'
    
    def hierarchy_info(self, obj):
        """Display hierarchy information"""
        info = []
        
        if obj.is_root_team:
            info.append('🌳 <strong>Root Team</strong>')
        else:
            ancestors = obj.get_all_ancestors()
            info.append(f'⬆️ {len(ancestors)} level(s) up to root')
        
        descendants = obj.get_all_descendants()
        if descendants:
            info.append(f'⬇️ {len(descendants)} descendant team(s)')
        
        if obj.is_leaf_team:
            info.append('🍃 <strong>Leaf Team</strong> (no children)')
        
        return mark_safe('<br>'.join(info))
    hierarchy_info.short_description = 'Hierarchy Info'
    
    # Custom actions
    def show_team_hierarchy(self, request, queryset):
        """Show team hierarchy information"""
        for team in queryset:
            ancestors = team.get_all_ancestors()
            descendants = team.get_all_descendants()
            
            self.message_user(
                request, 
                f"{team.team_name}: {len(ancestors)} ancestors, {len(descendants)} descendants, "
                f"level {team.level}, {team.get_team_size()} members"
            )
    show_team_hierarchy.short_description = 'Show hierarchy info for selected teams'
    
    def export_team_structure(self, request, queryset):
        """Export team structure information"""
        total_teams = queryset.count()
        total_members = sum(team.get_team_size() for team in queryset)
        
        self.message_user(
            request,
            f'Team structure exported: {total_teams} teams with {total_members} total members'
        )
    export_team_structure.short_description = 'Export team structure'


@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    """
    Admin interface for TeamMembership model
    Fields: employee, team, effective_from, effective_to, is_lead, created_at, updated_at
    """
    
    # List view configuration
    list_display = (
        'employee_link', 'team_link', 'effective_period',
        'is_lead', 'is_active_badge', 'duration_display'
    )
    
    list_filter = (
        'is_lead', 'team__nature', 'team__level', 'effective_from', 
        'effective_to', 'team', 'created_at'
    )
    
    search_fields = (
        'employee__first_name', 'employee__last_name', 'employee__email',
        'team__team_name', 'team__name'
    )
    
    list_editable = ('is_lead',)
    
    readonly_fields = ('created_at', 'updated_at', 'duration_display', 'is_active_status')
    
    # Form organization
    fieldsets = (
        ('Membership Information', {
            'fields': (
                ('employee', 'team'),
                ('effective_from', 'effective_to'),
                'is_lead'
            )
        }),
        ('Status Information', {
            'fields': (
                'is_active_status',
                'duration_display'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Ordering and pagination
    ordering = ('-effective_from', 'team__team_name', 'employee__last_name')
    list_per_page = 25
    
    # Actions
    actions = ['activate_memberships', 'mark_as_leads', 'extend_memberships']
    
    # Custom display methods
    def employee_link(self, obj):
        """Display employee as a clickable link"""
        url = reverse('admin:engagement_employee_change', args=[obj.employee.pk])
        return format_html('<a href="{}">{}</a>', url, obj.employee.full_name)
    employee_link.short_description = 'Employee'
    employee_link.admin_order_field = 'employee__last_name'
    
    def team_link(self, obj):
        """Display team as a clickable link"""
        url = reverse('admin:engagement_team_change', args=[obj.team.pk])
        return format_html('<a href="{}">{}</a>', url, obj.team.team_name)
    team_link.short_description = 'Team'
    team_link.admin_order_field = 'team__team_name'
    
    def effective_period(self, obj):
        """Display effective period"""
        start = obj.effective_from or "Not set"
        end = obj.effective_to or "Ongoing"
        return f"{start} → {end}"
    effective_period.short_description = 'Period'
    
    def is_lead_badge(self, obj):
        """Display leadership status"""
        if obj.is_lead:
            return format_html(
                '<span style="background-color: #ffc107; color: black; padding: 2px 6px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">LEAD</span>'
            )
        return '-'
    is_lead_badge.short_description = 'Leader?'
    is_lead_badge.admin_order_field = 'is_lead'
    
    def is_active_badge(self, obj):
        """Display active status"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">ACTIVE</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #6c757d; color: white; padding: 2px 6px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">INACTIVE</span>'
            )
    is_active_badge.short_description = 'Status'
    
    def duration_display(self, obj):
        """Display membership duration"""
        days = obj.duration_days
        if days > 0:
            years = days // 365
            remaining_days = days % 365
            months = remaining_days // 30
            
            if years > 0:
                return f"{years}y {months}m ({days} days)"
            elif months > 0:
                return f"{months}m ({days} days)"
            else:
                return f"{days} days"
        return "0 days"
    duration_display.short_description = 'Duration'
    
    def is_active_status(self, obj):
        """Read-only active status display"""
        return "Active" if obj.is_active else "Inactive"
    is_active_status.short_description = 'Current Status'
    
    # Custom actions
    def activate_memberships(self, request, queryset):
        """Extend memberships to make them active"""
        from datetime import date, timedelta
        today = date.today()
        future_date = today + timedelta(days=365)  # Extend by 1 year
        
        updated = 0
        for membership in queryset:
            # Handle None values in effective_to
            if membership.effective_to is None or membership.effective_to < today:
                membership.effective_to = future_date
                membership.save()
                updated += 1
        
        self.message_user(
            request,
            f'Extended {updated} membership{"s" if updated != 1 else ""} to {future_date}'
        )
    activate_memberships.short_description = 'Activate/extend selected memberships'
    
    def mark_as_leads(self, request, queryset):
        """Mark selected memberships as leadership roles"""
        updated = queryset.update(is_lead=True)
        self.message_user(
            request,
            f'Marked {updated} membership{"s" if updated != 1 else ""} as leadership roles'
        )
    mark_as_leads.short_description = 'Mark as team leads'
    
    def extend_memberships(self, request, queryset):
        """Extend membership end dates by 1 year"""
        from datetime import date, timedelta
        
        updated = 0
        for membership in queryset:
            # Handle None values in effective_to
            if membership.effective_to is None:
                # If no end date, set to 1 year from today
                membership.effective_to = date.today() + timedelta(days=365)
            else:
                membership.effective_to += timedelta(days=365)
            membership.save()
            updated += 1
        
        self.message_user(
            request,
            f'Extended {updated} membership{"s" if updated != 1 else ""} by 1 year'
        )
    extend_memberships.short_description = 'Extend memberships by 1 year'
