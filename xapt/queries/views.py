from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from .models import Query, QueryView
from .serializers import (
    QuerySerializer, 
    QueryViewSerializer, 
    QueryViewDetailSerializer
)


class QueryViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Query model
    
    list: GET /api/queries/
    create: POST /api/queries/
    retrieve: GET /api/queries/{id}/
    update: PUT /api/queries/{id}/
    partial_update: PATCH /api/queries/{id}/
    destroy: DELETE /api/queries/{id}/
    """
    queryset = Query.objects.all()
    serializer_class = QuerySerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Make created_by optional for development
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()


class QueryViewViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for QueryView model
    
    list: GET /api/query-views/
    create: POST /api/query-views/
    retrieve: GET /api/query-views/{id}/
    update: PUT /api/query-views/{id}/
    partial_update: PATCH /api/query-views/{id}/
    destroy: DELETE /api/query-views/{id}/
    
    Custom actions:
    - by_name: GET /api/query-views/by_name/?name={name}
    """
    queryset = QueryView.objects.select_related('query', 'created_by').all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'by_name':
            return QueryViewDetailSerializer
        return QueryViewSerializer

    def perform_create(self, serializer):
        # Make created_by optional for development
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def by_name(self, request):
        """
        Get query view by name (includes full query details)
        GET /api/query-views/by_name/?name={name}
        """
        name = request.query_params.get('name')
        if not name:
            return Response(
                {'error': 'name parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        query_view = get_object_or_404(QueryView, name=name)
        serializer = QueryViewDetailSerializer(query_view)
        return Response(serializer.data)
