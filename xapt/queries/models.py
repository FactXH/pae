from django.db import models
from django.contrib.auth.models import User


class Query(models.Model):
    """
    Stores SQL queries that can be reused across different views
    """
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)
    sql_query = models.TextField(help_text="SQL query to execute")
    database = models.CharField(
        max_length=50, 
        default='trino',
        choices=[('trino', 'Trino'), ('sqlite', 'SQLite')]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_queries'
    )

    class Meta:
        verbose_name_plural = "Queries"
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class QueryView(models.Model):
    """
    Stores configurations for displaying queries (filters, visibility, grouping, etc.)
    """
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)
    query = models.ForeignKey(Query, on_delete=models.CASCADE, related_name='views')
    
    # Configuration stored as JSON
    config = models.JSONField(
        default=dict,
        help_text="""
        Stores: {
            'title': str,
            'thresholds': {'red': float, 'yellow': float},
            'dimensionFilters': {},
            'dimensionExcludes': {},
            'enabledFilters': {},
            'metricRanges': {},
            'aggMetricRanges': {},
            'visibleColumns': [],
            'selectedDimensions': [],
            'sortConfig': {'column': str, 'direction': str}
        }
        """
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_query_views'
    )

    class Meta:
        verbose_name_plural = "Query Views"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.query.name})"
