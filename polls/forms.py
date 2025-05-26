from django import forms
from .models import Route, RoutePoint

class RouteForm(forms.ModelForm):
    class Meta:
        model = Route
        fields = ['name', 'background']

class RoutePointForm(forms.ModelForm):
    class Meta:
        model = RoutePoint
        fields = ['x', 'y', 'order']