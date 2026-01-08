// Importa a classe que acabamos de criar
import { WebRTCConnection } from './network.js';

class CameraHandler {
    constructor() {
        this.video = document.getElementById('meuVideo');
        this.videoRemoto = document.getElementById('videoRemoto');
        
        // Botões
        this.btnCamera = document.getElementById('btnCamera');
        this.btnCall = document.getElementById('btnMirrorCamera'); // Vamos reusar o botão "Espelhar" para "Ligar"
        
        this.streamLocal = null;
        this.rtc = null; // Instância da conexão WebRTC
        this.socket = null;

        this.initSocket();
        this.initEvents();
    }

    initSocket() {
        this.socket = new WebSocket('ws://' + window.location.host + '/ws/video/');

        this.socket.onopen = () => {
            console.log("✅ WebSocket Conectado!");
            // Expõe para debug global se precisar
            window.socket = this.socket; 
        };

        this.socket.onmessage = async (e) => {
            const data = JSON.parse(e.data);
            
            // Se não tiver conexão WebRTC iniciada, não faz sentido processar mensagens WebRTC
            if (!this.rtc && (data.type === 'offer')) {
                // Se receber uma oferta e não tiver RTC, inicia um como "Passivo" (Receiver)
                await this.setupWebRTC(); 
            }

            if (!this.rtc) return; // Segurança

            switch(data.type) {
                case 'offer':
                    console.log("📩 Recebi Oferta. Gerando Resposta...");
                    await this.rtc.createAnswer(data.offer);
                    break;
                
                case 'answer':
                    console.log("📩 Recebi Resposta. Conectando...");
                    await this.rtc.handleAnswer(data.answer);
                    break;
                
                case 'candidate':
                    // Ignora candidatos vazios ou repetidos
                    if(data.candidate) { 
                        await this.rtc.handleCandidate(data.candidate); 
                    }
                    break;
            }
        };
    }

    initEvents() {
        // Botão 1: Apenas liga a câmera local
        this.btnCamera.addEventListener('click', async () => {
            await this.startCamera();
        });

        // Botão 2: Inicia a chamada (O antigo botão Espelhar)
        this.btnCall.innerText = "📞 Iniciar Chamada";
        this.btnCall.addEventListener('click', async () => {
            if (!this.streamLocal) {
                alert("Ligue a câmera primeiro!");
                return;
            }
            console.log("Iniciando chamada...");
            await this.setupWebRTC();
            await this.rtc.createOffer();
        });

    }

    async startCamera() {
        if (this.streamLocal) return;
        try {
            this.streamLocal = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            this.video.srcObject = this.streamLocal;
            this.btnCamera.innerText = 'Câmera Ativa';
            this.btnCamera.disabled = true; // Trava para não desligar por engano
        } catch (error) {
            console.error('Erro na câmera:', error);
        }
    }

    async setupWebRTC() {
        // Cria a instância de rede passando os 3 ingredientes principais:
        // 1. Seu vídeo (Stream)
        // 2. Onde mostrar o vídeo do amigo (Elemento HTML)
        // 3. O telefone para falar com ele (Socket)
        this.rtc = new WebRTCConnection(this.streamLocal, this.videoRemoto, this.socket);
    }
}

// Inicializa tudo
const app = new CameraHandler();