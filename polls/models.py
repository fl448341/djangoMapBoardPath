from django.db import models
from django.contrib.auth.models import User
from django.db.models import JSONField


class BackgroundImage(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='backgrounds/')
    
    def __str__(self):
        return self.name    

class Route(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    background = models.ForeignKey(BackgroundImage, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class RoutePoint(models.Model):
    route = models.ForeignKey(Route, related_name='points', on_delete=models.CASCADE)
    x = models.FloatField()
    y = models.FloatField()
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Point {self.order} on {self.route.name}"
    
    
class GameBoard(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="boards")
    name  = models.CharField(max_length=120)
    rows  = models.PositiveSmallIntegerField()
    cols  = models.PositiveSmallIntegerField()
    dots  = models.JSONField(default=list)

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            "id":   self.pk,
            "pk":   self.pk,
            "name": self.name,
            "rows": self.rows,
            "cols": self.cols,
            "dots": self.dots,
        }

    class Meta:
        unique_together = ("owner", "name")
        ordering = ["-updated"]

    def __str__(self):
        return f"{self.name} ({self.rows}×{self.cols})"

class BoardPath(models.Model):
    board = models.ForeignKey(GameBoard, on_delete=models.CASCADE)
    user  = models.ForeignKey(User,      on_delete=models.CASCADE)
    cells = models.JSONField(default=list)

    class Meta:
        unique_together = ("board", "user")