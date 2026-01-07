# core/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer

# core/consumers.py
class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # O navegador bateu na porta?
        print("Tentativa de conexão recebida!") 
        await self.accept() # Você PRECISA desta linha para abrir a porta
        print("Conexão aceita com sucesso.")