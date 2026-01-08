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
        // Detecta se estamos usando HTTPS (Seguro) ou HTTP (Local)
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        
        // Cria a URL completa com o protocolo correto
        const wsUrl = protocol + window.location.host + '/ws/video/';

        console.log("Tentando conectar em:", wsUrl); // Log para debug

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("✅ WebSocket Conectado!");
            window.socket = this.socket; 
        };

        // ... o resto do código do onmessage continua igual ...
        this.socket.onmessage = async (e) => {
            // ... (mantenha seu código original de onmessage aqui)
            const data = JSON.parse(e.data);
            
            if (!this.rtc && (data.type === 'offer')) {
                await this.setupWebRTC(); 
            }

            if (!this.rtc) return;

            switch(data.type) {
                case 'offer':
                    await this.rtc.createAnswer(data.offer);
                    break;
                case 'answer':
                    await this.rtc.handleAnswer(data.answer);
                    break;
                case 'candidate':
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