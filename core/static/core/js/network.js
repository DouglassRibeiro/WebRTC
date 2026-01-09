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
        // 2. Correção do "Atropelamento" (Fix para Edge/Chrome)
        // Substitua APENAS o this.peerConnection.ontrack = ...
        this.peerConnection.ontrack = (event) => {
            console.log("🎥 Track recebida:", event.track.kind);
            
            const incomingStream = (event.streams && event.streams[0]) 
                                    ? event.streams[0] 
                                    : new MediaStream([event.track]);

            if (this.videoRemoto.srcObject !== incomingStream) {
                this.videoRemoto.srcObject = incomingStream;
                console.log("🔗 Stream vinculado!");
            }

            // Garante Mudo para o navegador deixar tocar
            this.videoRemoto.muted = true;
            
            // Tenta dar Play e trata os erros comuns do Edge/Chrome
            this.videoRemoto.play()
                .then(() => {
                    console.log("▶️ Play iniciado!");
                    // Tenta ligar o som após 1 segundo
                    setTimeout(() => { this.videoRemoto.muted = false; }, 1000);
                })
                .catch(err => {
                    // Ignora o erro de "Interrompido" (Race Condition)
                    if (err.name === "AbortError") {
                        console.log("⚠️ Play interrompido (Isso é normal, o vídeo vai tocar na próxima tentativa)");
                    } else {
                        console.error("❌ Erro real no Play:", err);
                    }
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
        } catch (e) { console.error("Erro ICE:", e); }
    }
}