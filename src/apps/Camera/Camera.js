import './Camera.scss';

/**
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Предоставляет возможность взаимодействия с камерой и микрофоном пользователя для захвата изображений и видео.
 * @integration_contract: Интегрируется с ProcessManager для управления жизненным циклом, WindowManager для отображения UI и FileSystem для сохранения файлов.
 * @consistency_model: Strong consistency для файловых операций.
 * @failure_policy: В случае отказа в доступе к камере/микрофону, приложение отображает сообщение об ошибке.
 *
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Предоставляет UI для просмотра потока с камеры, создания фотографий, записи видео и визуализации аудио.
 * @interface_contract: Приложение запускается из меню "Пуск", отображает окно с видеопотоком и элементами управления.
 *
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: Браузер пользователя поддерживает navigator.mediaDevices.getUserMedia(), AudioContext и MediaRecorder API. Пользователь предоставил разрешение на доступ к камере и микрофону.
 * @ensures: Приложение отображает видеопоток, если получено разрешение. Фотографии и видео могут быть сохранены в виртуальной файловой системе. Аудио с микрофона визуализируется.
 *
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: Доступ к медиа-устройствам необходим для основной функциональности приложения.
 * @why_ensures: Пользователи получают возможность создавать медиа-контент внутри ОС.
 * @business_impact: Отказ в доступе к устройствам сделает приложение бесполезным. Ошибки сохранения приведут к потере пользовательских данных.
 * @stakeholder_value: Пользователи могут использовать камеру своего устройства в веб-ОС, как в нативной ОС.
 */
export class Camera {
    constructor(params = {}) {
        this.fs = window.app?.fileSystem;
        this.onFocus = params.onFocus || (() => {});
        this.onKill = params.onKill || (() => {});
        this.elem = document.createElement('div');
        this.elem.className = 'camera-app';
        this.elem.onclick = () => {
            if (this.onFocus) this.onFocus();
        };
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.animationFrameId = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
    }

    render() {
        this.elem.innerHTML = `
            <div class="camera-container">
                <div class="camera-message"></div>
                <video autoplay playsinline></video>
                <canvas class="visualizer"></canvas>
                <div class="controls">
                    <button class="photo-btn">Take Photo</button>
                    <button class="record-btn">Start Recording</button>
                    <select class="effects-select">
                        <option value="none">No Effect</option>
                        <option value="grayscale(1)">Grayscale</option>
                        <option value="sepia(1)">Sepia</option>
                        <option value="invert(1)">Invert</option>
                        <option value="blur(5px)">Blur</option>
                    </select>
                </div>
            </div>
        `;

        this.video = this.elem.querySelector('video');
        this.canvas = this.elem.querySelector('canvas.visualizer');
        this.canvasCtx = this.canvas.getContext('2d');
        this.messageElem = this.elem.querySelector('.camera-message');
        
        this.recordBtn = this.elem.querySelector('.record-btn');
        this.effectsSelect = this.elem.querySelector('.effects-select');

        // Установка размеров canvas
        this.updateCanvasSize();

        this.elem.querySelector('.photo-btn').onclick = () => this.takePhoto();
        this.recordBtn.onclick = () => this.toggleRecording();
        this.effectsSelect.onchange = (e) => this.applyEffect(e.target.value);

        // Обновление размеров canvas при изменении размера окна
        this.resizeObserver = new ResizeObserver(() => {
            this.updateCanvasSize();
        });
        this.resizeObserver.observe(this.canvas.parentElement);

        this.initCamera();

        return this.elem;
    }

    async initCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.video.srcObject = this.stream;

            if (this.stream.getAudioTracks().length > 0) {
                this.initAudioVisualizer();
            } else {
                this.showMessage('Microphone not available. Audio visualizer is disabled.');
            }
        } catch (err) {
            this.showMessage(`Error accessing camera: ${err.message}. Please grant permission and restart the app.`);
            console.error('Error accessing media devices.', err);
        }
    }

    updateCanvasSize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 100; // Фиксированная высота для визуализатора
    }

    showMessage(message) {
        this.messageElem.innerHTML = `<p>${message}</p>`;
        this.messageElem.style.display = 'block';
    }

    initAudioVisualizer() {
        if (!this.stream || this.stream.getAudioTracks().length === 0) {
            console.warn('No audio tracks available for visualization');
            return;
        }

        if (!this.canvas || !this.canvasCtx) {
            console.error('Canvas not initialized for audio visualization');
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(this.stream);
            source.connect(this.analyser);

            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            // Убеждаемся, что canvas имеет правильные размеры
            this.updateCanvasSize();

            this.drawVisualizer();
            console.log('Audio visualizer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio visualizer:', error);
        }
    }

    drawVisualizer() {
        if (!this.analyser || !this.canvas || !this.canvasCtx || !this.dataArray) {
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => this.drawVisualizer());

        // Проверяем размеры canvas и обновляем при необходимости
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            this.updateCanvasSize();
        }

        this.analyser.getByteTimeDomainData(this.dataArray);

        // Очищаем canvas с небольшим затуханием для эффекта следа
        this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем волну
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = 'rgb(0, 255, 0)';
        this.canvasCtx.beginPath();

        const sliceWidth = this.canvas.width / this.dataArray.length;
        const centerY = this.canvas.height / 2;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = centerY + (v - 1) * (centerY * 0.8);

            if (i === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.canvasCtx.lineTo(this.canvas.width, centerY);
        this.canvasCtx.stroke();
    }

    applyEffect(effect) {
        this.video.style.filter = effect;
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        if (!this.stream) return;
        this.isRecording = true;
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(this.stream);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = async () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `video-${timestamp}.webm`;
                
                // Скачиваем файл
                this.downloadBlob(blob, fileName);
            } catch (error) {
                console.error('Failed to save video:', error);
                alert(`Failed to save video: ${error.message}`);
            }
        };

        this.mediaRecorder.start();
        this.recordBtn.textContent = 'Stop Recording';
        this.recordBtn.classList.add('recording');
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.recordBtn.textContent = 'Start Recording';
            this.recordBtn.classList.remove('recording');
        }
    }

    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async takePhoto() {
        if (!this.stream) return;

        const photoCanvas = document.createElement('canvas');
        photoCanvas.width = this.video.videoWidth;
        photoCanvas.height = this.video.videoHeight;
        const photoCtx = photoCanvas.getContext('2d');
        photoCtx.drawImage(this.video, 0, 0, photoCanvas.width, photoCanvas.height);
        
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `photo-${timestamp}.png`;
            
            // Конвертируем canvas в blob и скачиваем
            photoCanvas.toBlob((blob) => {
                if (blob) {
                    this.downloadBlob(blob, fileName);
                } else {
                    alert('Failed to create photo blob');
                }
            }, 'image/png');
        } catch (error) {
            console.error('Failed to save photo:', error);
            alert(`Failed to save photo: ${error.message}`);
        }
    }

    destroy() {
        this.stopRecording();
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}
