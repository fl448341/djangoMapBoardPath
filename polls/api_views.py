from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Route, RoutePoint
from .serializers import RouteSerializer, RoutePointSerializer

class RouteListCreateAPI(generics.ListCreateAPIView):
    serializer_class = RouteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Route.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RouteDetailAPI(generics.RetrieveDestroyAPIView):
    serializer_class = RouteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Route.objects.filter(user=self.request.user)

class RoutePointListCreateAPI(generics.ListCreateAPIView):
    serializer_class = RoutePointSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RoutePoint.objects.filter(
            route__user=self.request.user,
            route__id=self.kwargs['route_pk']
        )
    
    def perform_create(self, serializer):
        route = get_object_or_404(
            Route, pk=self.kwargs['route_pk'], user=self.request.user
        )
        serializer.save(route=route)

class RoutePointDetailAPI(generics.RetrieveDestroyAPIView):
    serializer_class = RoutePointSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RoutePoint.objects.filter(
            route__user=self.request.user,
            route__id=self.kwargs['route_pk']
        )
