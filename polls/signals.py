import json
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import GameBoard, BoardPath
from .sse_events import notify_all

@receiver(post_save, sender=GameBoard)
def board_saved(sender, instance, created, **kwargs):
    payload = {
        "board_id": instance.pk,
        "board_name": instance.name,
        "creator_username": instance.owner.username,
        "action": "created" if created else "updated",
    }
    message = (
        "event: newBoard\n"
        f"data: {json.dumps(payload)}\n\n"
    )
    notify_all(message)

@receiver(post_save, sender=BoardPath)
def path_saved(sender, instance, created, **kwargs):
    payload = {
        "path_id": instance.pk,
        "board_id": instance.board.pk,
        "board_name": instance.board.name,
        "user_username": instance.user.username,
        "action": "created" if created else "updated",
    }
    message = (
        "event: newPath\n"
        f"data: {json.dumps(payload)}\n\n"
    )
    notify_all(message)
