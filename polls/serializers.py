from rest_framework import serializers
from .models import Route, RoutePoint, BackgroundImage

class RoutePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutePoint
        fields = ['id', 'x', 'y', 'order']

class RouteSerializer(serializers.ModelSerializer):
    points = RoutePointSerializer(many=True, read_only=True)
    background_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = ['id', 'name', 'background', 'background_image_url', 'points']

    def get_background_image_url(self, obj):
        request = self.context.get('request')
        if obj.background and obj.background.image:
            return request.build_absolute_uri(obj.background.image.url)
        return None
