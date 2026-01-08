export class WebRTCConnection {
    constructor(streamLocal, videoRemotoElement, socket) {
        this.streamLocal = streamLocal;
        this.videoRemoto = videoRemotoElement;
        this.socket = socket;

        const rtcConfig = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };

        this.peerConnection = new RTCPeerConnection(rtcConfig);

        this.initEvents();
        this.addLocalTracks();
    }

    initEvents() {
        // 1. Candidatos ICE
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.send(JSON.stringify({
                    'type': 'candidate',
                    'candidate': event.candidate
                }));
            }
        };

        // 2. Lógica Anti-Tela Preta (Edge/Chrome)
        this.peerConnection.ontrack = (event) => {
            console.log("🎥 Stream remoto chegou! Processando...");

            // Fallback para garantir que pegamos o stream correto
            const incomingStream = (event.streams && event.streams[0])
                ? event.streams[0]
                : new MediaStream([event.track]);

            this.videoRemoto.srcObject = incomingStream;


            // ESTRATÉGIA: Começar Mudo -> Dar Play -> Tentar Desmutar
            this.videoRemoto.muted = true;

            const attemptPlay = async () => {

                try {
                    await this.videoRemoto.play();
                    console.log("▶️ Vídeo rodando (Mudo)!");

                    // Tenta ligar o som
                    this.videoRemoto.muted = false;
                    console.log("🔊 Som ativado automaticamente!");
                } catch (err) {
                    console.warn("⚠️ Bloqueio de Autoplay:", err);
                    // Se der erro, garante que fica mudo e tenta de novo
                    this.videoRemoto.muted = true;
                    this.videoRemoto.play().catch(e => console.error("❌ Falha total:", e));
                }
            };

            // Tenta rodar imediatamente
            attemptPlay();

            // Garantia extra: Se o navegador demorar para carregar os metadados
            this.videoRemoto.onloadedmetadata = () => {
                attemptPlay();
            };
        };

    }

    addLocalTracks() {
        this.streamLocal.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.streamLocal);
        });
    }

    // --- SINALIZAÇÃO ---
    async createOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.socket.send(JSON.stringify({ 'type': 'offer', 'offer': offer }));
    }

    async createAnswer(offerRemota) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerRemota));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.socket.send(JSON.stringify({ 'type': 'answer', 'answer': answer }));
    }

    async handleAnswer(answerRemota) {
        if (!this.peerConnection.currentRemoteDescription) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerRemota));
        }
    }

    async handleCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) { console.error("Erro ICE:", e); }
    }
}