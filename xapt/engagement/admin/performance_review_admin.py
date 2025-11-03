from django.contrib import admin
from django.db import models
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .base_model_admin_mixin import BaseModelAdminMixin, combine_fieldsets, extend_list_display
from ..models import PerformanceReview


@admin.register(PerformanceReview)
class PerformanceReviewAdmin(BaseModelAdminMixin):
    """
    Admin interface for PerformanceReview model
    
    BaseModel fields (inherited): name, description, created_at, updated_at, is_active
    PerformanceReview fields: employee, performance_name, performance_date, overall_score,
                             manager_questionary, self_questionary
    """
    
    # Extend base configuration with PerformanceReview-specific fields
    list_display = extend_list_display(
        BaseModelAdminMixin.base_list_display,
        'employee_link', 'performance_name', 'performance_date', 'score_badge'
    )
    
    list_filter = BaseModelAdminMixin.base_list_filter + (
        'performance_date', 'overall_score', 'employee'
    )
    
    search_fields = BaseModelAdminMixin.base_search_fields + (
        'performance_name', 'employee__first_name', 'employee__last_name', 'employee__email'
    )
    
    # Add custom readonly fields
    readonly_fields = BaseModelAdminMixin.base_readonly_fields + (
        'employee_link', 'manager_link', 'score_badge'
    )
    
    # PerformanceReview-specific fieldsets
    performance_review_fieldsets = (
        ('Review Information', {
            'fields': (
                'employee',
                'employee_link',
                'manager',
                'manager_link',
                'performance_name',
                'performance_date',
                'overall_score',
                'score_badge'
            ),
        }),
        ('Questionnaires', {
            'fields': (
                'manager_questionary',
                'self_questionary'
            ),
            'classes': ('collapse',)
        }),
    )
    
    # Combine PerformanceReview fieldsets with BaseModel fieldsets
    fieldsets = combine_fieldsets(
        performance_review_fieldsets,
        BaseModelAdminMixin.base_fieldsets
    )
    
    # Ordering and pagination
    ordering = ('-performance_date',)
    list_per_page = 25
    
    # Date hierarchy for easy filtering
    date_hierarchy = 'performance_date'
    
    # Custom display methods
    def employee_link(self, obj):
        """Display employee as a clickable link"""
        if obj.employee:
            url = reverse('admin:engagement_employee_change', args=[obj.employee.pk])
            return format_html('<a href="{}">{}</a>', url, obj.employee.full_name)
        return "-"
    employee_link.short_description = 'Employee'
    employee_link.admin_order_field = 'employee__last_name'
    
    def manager_link(self, obj):
        """Display manager as a clickable link"""
        if obj.manager:
            url = reverse('admin:engagement_employee_change', args=[obj.manager.pk])
            return format_html('<a href="{}">{}</a>', url, obj.manager.full_name)
        return "-"
    manager_link.short_description = 'Manager'
    manager_link.admin_order_field = 'manager__last_name'

    def score_badge(self, obj):
        """Display score with color coding"""
        if obj.overall_score is None:
            return format_html(
                '<span style="background-color: #6c757d; color: white; padding: 2px 8px; '
                'border-radius: 3px; font-size: 11px;">N/A</span>'
            )
        
        # Color coding based on score (assuming scale of 1-5)
        if obj.overall_score >= 4:
            color = '#28a745'  # Green for good
        elif obj.overall_score >= 3:
            color = '#ffc107'  # Yellow for average
        else:
            color = '#dc3545'  # Red for needs improvement
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.overall_score
        )
    score_badge.short_description = 'Score'
    score_badge.admin_order_field = 'overall_score'
    
    # Custom actions
    def export_review_summary(self, request, queryset):
        """Export summary of selected reviews"""
        total = queryset.count()
        avg_score = queryset.filter(overall_score__isnull=False).aggregate(
            models.Avg('overall_score')
        )['overall_score__avg']
        
        if avg_score:
            self.message_user(
                request,
                f'Selected {total} reviews. Average score: {avg_score:.2f}'
            )
        else:
            self.message_user(
                request,
                f'Selected {total} reviews. No scores available.'
            )
    export_review_summary.short_description = 'Show summary statistics'
    
    # Add custom action to base actions
    actions = BaseModelAdminMixin.actions + ['export_review_summary']
