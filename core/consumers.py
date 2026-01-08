import json
from channels.generic.websocket import AsyncWebsocketConsumer

class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'sala_geral'

        # 1. Entra no Grupo (Sala)
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"✅ Usuário {self.channel_name} entrou na sala {self.room_group_name}")

    async def disconnect(self, close_code):
        # 2. Sai do Grupo ao fechar a aba
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print("❌ Usuário desconectado.")

    # 3. Recebe mensagem do JavaScript e envia para o Grupo
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        
        # Envia para TODOS no grupo (broadcast)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message', # Chama o método abaixo
                'message': message
            }
        )

    # 4. Método auxiliar para enviar a mensagem de volta ao WebSocket
    async def chat_message(self, event):
        message = event['message']

        # Envia para o navegador
        await self.send(text_data=json.dumps({
            'response': message
        }))