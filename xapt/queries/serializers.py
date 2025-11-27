from rest_framework import serializers
from .models import Query, QueryView


class QuerySerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Query
        fields = [
            'id', 'name', 'description', 'sql_query', 'database',
            'created_at', 'updated_at', 'created_by', 'created_by_username'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class QueryViewSerializer(serializers.ModelSerializer):
    query_name = serializers.CharField(source='query.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = QueryView
        fields = [
            'id', 'name', 'description', 'query', 'query_name', 'config',
            'created_at', 'updated_at', 'created_by', 'created_by_username'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class QueryViewDetailSerializer(serializers.ModelSerializer):
    """Includes full query details"""
    query = QuerySerializer(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = QueryView
        fields = [
            'id', 'name', 'description', 'query', 'config',
            'created_at', 'updated_at', 'created_by', 'created_by_username'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
