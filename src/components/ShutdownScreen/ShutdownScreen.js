import { getSoundManager } from '../../core/SoundManager.js';

export class ShutdownScreen {
    constructor(container) {
        this.container = container;
        this.soundManager = getSoundManager();
        this.render();
        this.playShutdownSound();
    }

    playShutdownSound() {
        // Воспроизводим звук выключения с небольшой задержкой
        setTimeout(() => {
            this.soundManager.playSystemShutdown();
        }, 200);
    }

    render() {
        this.container.innerHTML = `
            <div class="shutdown-screen">
                <div class="shutdown-content">
                    <svg class="shutdown-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
                        <path d="M12 7v5"/>
                    </svg>
                    <h1>Безопасное выключение</h1>
                    <p>Теперь питание компьютера можно отключить.</p>
                </div>
            </div>
        `;
        this.container.style.display = 'block';
    }

    hide() {
        this.container.style.display = 'none';
    }
}

