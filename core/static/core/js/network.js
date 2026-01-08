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

        // 2. Quando o vídeo chega (VERSÃO BLINDADA)
        this.peerConnection.ontrack = (event) => {
            console.log("🎥 RECEBIDO! Track Kind:", event.track.kind);

            // Verificação de segurança: O elemento HTML existe?
            if (!this.videoRemoto) {
                console.error("❌ ERRO CRÍTICO: O elemento HTML 'videoRemoto' não foi encontrado!");
                return;
            }

            // FALLBACK: Se o navegador não agrupar o stream, criamos um manualmente
            // Isso resolve o problema de 'streams[0]' ser undefined
            const incomingStream = (event.streams && event.streams[0])
                ? event.streams[0]
                : new MediaStream([event.track]);

            console.log("🔗 Conectando stream ao elemento de vídeo...");
            this.videoRemoto.srcObject = incomingStream;

            // Tentativa de Play com tratamento de erro detalhado
            this.videoRemoto.play()
                .then(() => console.log("▶️ SUCESSO TOTAL: O vídeo está rodando!"))
                .catch(e => {
                    console.error("⚠️ O navegador bloqueou o Autoplay:", e);
                    console.log("💡 Dica: Verifique se o <video> tem o atributo 'muted'.");
                });
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
        } catch (e) {
            console.error("Erro ICE:", e);
        }
    }
}