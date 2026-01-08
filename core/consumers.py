# core/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'sala_geral'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"✅ Conectado: {self.channel_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"❌ Desconectado: {self.channel_name}")

    # Recebe do WebSocket (Navegador) -> Envia para o Grupo (Django)
    async def receive(self, text_data):
        data = json.loads(text_data)
        
        # O PULO DO GATO:
        # Não tentamos ler 'message' ou 'offer'. Pegamos o pacote inteiro ('data')
        # e enviamos para o grupo, anexando o ID de quem mandou ('sender_channel_name')
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'signal_message', # Nome da função abaixo
                'data': data,             # O payload completo (Offer, Answer, etc)
                'sender_channel_name': self.channel_name # Quem enviou
            }
        )

    # Recebe do Grupo (Django) -> Envia de volta para o WebSocket (Navegador)
    async def signal_message(self, event):
        # Ignora a mensagem se for eu mesmo quem mandou (Evita loop infinito)
        if self.channel_name == event['sender_channel_name']:
            return

        # Envia apenas os dados úteis para o navegador
        await self.send(text_data=json.dumps(event['data']))