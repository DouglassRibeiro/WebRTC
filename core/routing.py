# core/routing.py
from django.urls import re_path # Use re_path, ele é mais robusto para WebSockets
from . import consumers

websocket_urlpatterns = [
    # O 'r' antes da string indica Regex
    # O '^' significa: "Começa exatamente com..."
    # O '$' significa: "Termina exatamente aqui"
    re_path(r'^ws/video/$', consumers.VideoCallConsumer.as_asgi()),
]