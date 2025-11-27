from django.contrib import admin
from .models import Query, QueryView


@admin.register(Query)
class QueryAdmin(admin.ModelAdmin):
    list_display = ['name', 'database', 'created_by', 'created_at', 'updated_at']
    list_filter = ['database', 'created_at']
    search_fields = ['name', 'description', 'sql_query']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    
    def save_model(self, request, obj, form, change):
        if not change:  # Only set created_by on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(QueryView)
class QueryViewAdmin(admin.ModelAdmin):
    list_display = ['name', 'query', 'created_by', 'created_at', 'updated_at']
    list_filter = ['query', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    
    def save_model(self, request, obj, form, change):
        if not change:  # Only set created_by on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
