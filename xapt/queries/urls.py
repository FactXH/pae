from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QueryViewSet, QueryViewViewSet

router = DefaultRouter()
router.register(r'queries', QueryViewSet, basename='query')
router.register(r'query-views', QueryViewViewSet, basename='queryview')

urlpatterns = [
    path('', include(router.urls)),
]
