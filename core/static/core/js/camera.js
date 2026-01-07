class CameraHandler {
    constructor() {
        // 1. Estado e Seletores (Atributos da classe)
        this.video = document.getElementById('meuVideo');
        this.btnCamera = document.getElementById('btnCamera');
        this.btnMirrorCamera = document.getElementById('btnMirrorCamera');
        
        this.streamLocal = null;
        this.mirrored = false;
        this.cameraDesiredByUser = false;

        // 2. Inicializar os "Ouvintes" de eventos
        this.initEvents();
    }

    initEvents() {
        // Usamos Arrow Functions ( () => ) para garantir que o 'this' 
        // aponte para a classe e não para o botão clicado.
        this.btnCamera.addEventListener('click', () => this.manageCamera());
        this.btnMirrorCamera.addEventListener('click', () => this.toggleMirror());
        
        document.addEventListener('visibilitychange', () => this.handleVisibility());
    }

    async manageCamera() {
        if (this.streamLocal) {
            this.cameraDesiredByUser = false;
            this.stopCamera();
        } else {
            this.cameraDesiredByUser = true;
            await this.startCamera();
        }
    }

    async startCamera() {
        if (this.streamLocal) return;

        try {
            const constraints = {
                video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
                audio: false
            };

            this.streamLocal = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.streamLocal;

            this.btnCamera.innerText = 'Desligar Câmera';
            this.btnCamera.classList.add('ativo');
            
            // Aplicar o espelhamento inicial
            this.updateMirrorStyle();
        } catch (error) {
            console.error('Erro ao abrir a câmera:', error);
        }
    }

    stopCamera() {
        if (!this.streamLocal) return;

        this.streamLocal.getTracks().forEach(track => track.stop());
        this.video.srcObject = null;
        this.streamLocal = null;

        this.btnCamera.innerText = 'Ligar Câmera';
        this.btnCamera.classList.remove('ativo');
    }

    handleVisibility() {
        if (document.visibilityState === 'hidden') {
            console.log("Aba escondida: Suspendendo vídeo.");
            this.stopCamera();
        } else if (this.cameraDesiredByUser) {
            console.log("Aba visível: Retomando vídeo.");
            this.startCamera();
        }
    }

    toggleMirror() {
        this.mirrored = !this.mirrored;
        this.updateMirrorStyle();
    }

    updateMirrorStyle() {
        if (this.mirrored) {
            this.video.style.transform = 'scaleX(1)';
            this.btnMirrorCamera.innerText = 'Foto Normal';
        } else {
            this.video.style.transform = 'scaleX(-1)';
            this.btnMirrorCamera.innerText = 'Espelhar Foto';
        }
    }
    
}

// Para usar, basta instanciar a classe no final do arquivo:
const minhaCamera = new CameraHandler();


// camera.js ou Console do F12
const socket = new WebSocket('ws://' + window.location.host + '/ws/video/');

socket.onopen = function(e) {
    console.log("✅ Conectado ao servidor Django Channels!");
    socket.send(JSON.stringify({ // JSON em maiúsculo
        'message': 'Olá Django, estou pronto para a chamada!'
    }));
};

socket.onmessage = function(e) {
    const data = JSON.parse(e.data); // JSON.parse em vez de json.loads
    console.log("📩 Mensagem do servidor:", data.response);
};

socket.onerror = function(e) {
    console.error("❌ Erro no WebSocket:", e);
};