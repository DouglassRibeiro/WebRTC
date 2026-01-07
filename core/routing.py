# core/routing.py
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    # Usando path normal, sem regex complexo
    path('ws/video/', consumers.VideoCallConsumer.as_asgi()),
]