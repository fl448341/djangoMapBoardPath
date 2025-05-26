from django.urls import path
from . import views


app_name = 'polls'
urlpatterns = [
    path('', views.route_list, name='route_list'),
    path('register/', views.register, name='register'),
    path('routes/', views.route_list, name='route_list'),
    path('route/create/', views.route_create, name='route_create'),
    path('route/<int:pk>/', views.route_detail, name='route_detail'),
    path('route/<int:route_pk>/point/add/', views.point_add, name='point_add'),
    path('point/<int:pk>/delete/', views.point_delete, name='point_delete'),
    path('token/', views.manage_token, name='manage_token'),
    path("boards/", views.board_list,   name="board_list"),
    path("boards/create/", views.board_create,   name="board_create"),
    path("boards/<int:pk>/", views.board_edit,   name="board_edit"),
    path("boards/<int:pk>/delete/", views.board_delete, name="board_delete"),
    path("boards/<int:pk>/draw/", views.path_draw, name="path_draw"),
    path("boards/all/", views.board_gallery, name="board_gallery"),
]

