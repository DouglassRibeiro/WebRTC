# webrtc/asgi.py
import os
from django.core.asgi import get_asgi_application

# 1. Configura as variáveis de ambiente
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webrtc.settings')

# 2. INICIALIZA O DJANGO AGORA (Crítico: isso deve vir antes dos imports abaixo)
django_asgi_app = get_asgi_application()

# 3. Agora sim podemos importar o Channels e suas rotas
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import core.routing 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            core.routing.websocket_urlpatterns
        )
    ),
})