from django.contrib import admin
from .models import BackgroundImage, Route, RoutePoint

@admin.register(BackgroundImage)
class BackgroundImageAdmin(admin.ModelAdmin):
    list_display = ('name', 'image')

class RoutePointInline(admin.TabularInline):
    model = RoutePoint
    extra = 0

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'background')
    inlines = [RoutePointInline]
