"""
API URL configuration
All frontend API endpoints
"""
from django.urls import path
from . import front_api_views

urlpatterns = [
    # Test endpoints
    path('test/', front_api_views.test_connection, name='api_test'),
    path('echo/', front_api_views.echo, name='api_echo'),
    
    # Employee endpoints
    path('employees/', front_api_views.employee_list, name='api_employee_list'),
    path('employees/<int:employee_id>/', front_api_views.employee_detail, name='api_employee_detail'),
    
    # Calculation example
    path('calculate/', front_api_views.calculate, name='api_calculate'),
    
    # SQL endpoints
    path('sql/execute/', front_api_views.execute_sql, name='api_sql_execute'),
    path('sql/tables/', front_api_views.list_tables, name='api_sql_tables'),
    path('sql/tables/<str:table_name>/columns/', front_api_views.table_columns, name='api_table_columns'),
    
    # Saved queries endpoints
    path('sql/saved-queries/', front_api_views.list_saved_queries, name='api_list_saved_queries'),
    path('sql/saved-queries/execute/', front_api_views.execute_saved_query, name='api_execute_saved_query'),
]
