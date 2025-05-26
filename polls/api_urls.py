from django.urls import path
from .api_views import (
    RouteListCreateAPI, RouteDetailAPI,
    RoutePointListCreateAPI, RoutePointDetailAPI
)

urlpatterns = [
    path('trasy/', RouteListCreateAPI.as_view(), name='api-route-list'),
    path('trasy/<int:pk>/', RouteDetailAPI.as_view(), name='api-route-detail'),
    path(
      'trasy/<int:route_pk>/punkty/',
      RoutePointListCreateAPI.as_view(),
      name='api-point-list'
    ),
    path(
      'trasy/<int:route_pk>/punkty/<int:pk>/',
      RoutePointDetailAPI.as_view(),
      name='api-point-detail'
    ),
]
