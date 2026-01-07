export class WebRTCConnection {
    constructor(streamLocal, videoRemotoElement) {
        this.streamLocal = streamLocal;
        this.videoRemoto = videoRemotoElement;
        
        // 1. O objeto principal da conexão
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' } // Servidor do Google que ajuda a encontrar seu IP real
            ]
        });

        this.init();
    }

    init() {
        // 2. Adicionar seu vídeo local à conexão para ser enviado ao outro
        this.streamLocal.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.streamLocal);
        });

        // 3. Quando o vídeo do OUTRO chegar, coloque no elemento HTML de vídeo remoto
        this.peerConnection.ontrack = (event) => {
            this.videoRemoto.srcObject = event.streams[0];
        };
    }

    // Função para criar o "Pedido de Chamada" (Offer)
    async createOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer; // Você enviará isso via Django para o outro usuário
    }
}