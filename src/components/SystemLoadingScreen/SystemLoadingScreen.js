/**
 * SystemLoadingScreen.js - Экран загрузки системы
 */

import { getSoundManager } from '../../core/SoundManager.js';

export class SystemLoadingScreen {
    constructor(container, onComplete, languageManager) {
        this.container = container;
        this.onComplete = onComplete;
        this.languageManager = languageManager;
        this.soundManager = getSoundManager();
        this.render();
        this.startLoading();
    }

    render() {
        // Убедимся, что контейнер правильно стилизован до добавления содержимого
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        
        // Создаем частицы для фона
        const particles = Array.from({ length: 8 }, (_, i) => 
            `<div class="particle" style="
                left: ${Math.random() * 100}%; 
                top: ${Math.random() * 100}%; 
                animation-delay: ${Math.random() * 2}s;
                animation-duration: ${6 + Math.random() * 4}s;
            "></div>`
        ).join('');

        const osName = this.languageManager ? this.languageManager.getString('andlanceros') : 'AndlancerOS';
        
        this.container.innerHTML = `
            <div class="decorative-circle"></div>
            <div class="decorative-circle"></div>
            <div class="decorative-circle"></div>
            ${particles}
            <div class="os-title">${osName}</div>
            <div class="system-icon-container">
                <div class="system-icon"></div>
            </div>
            <div class="progress-bar-wrapper">
                <div class="progress-info">
                    <span class="progress-percent">0%</span>
                    <span class="loading-stage">${this.languageManager.getString('loading_initializing', 'Initializing...')}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar"></div>
                </div>
            </div>
            <div class="loading-text">${this.languageManager.getString('loading_system', 'Loading system...')}</div>
        `;

        // Сохраняем ссылки на элементы для обновления
        this.progressBar = this.container.querySelector('.progress-bar');
        this.progressPercent = this.container.querySelector('.progress-percent');
        this.loadingStage = this.container.querySelector('.loading-stage');

        // Принудительный reflow для применения стилей перед анимацией
        void this.container.offsetHeight;

        // Add class for fade-in effect
        requestAnimationFrame(() => {
            this.container.classList.add('visible');
            // Воспроизводим звук запуска системы
            this.soundManager.playSystemStart();
        });
    }

    startLoading() {
        const lm = this.languageManager;
        // Этапы загрузки
        const stages = [
            { percent: 0, text: lm.getString('loading_initializing_system', 'Initializing system...') },
            { percent: 15, text: lm.getString('loading_kernel', 'Loading kernel...') },
            { percent: 30, text: lm.getString('loading_components', 'Initializing components...') },
            { percent: 45, text: lm.getString('loading_devices', 'Connecting devices...') },
            { percent: 60, text: lm.getString('loading_drivers', 'Loading drivers...') },
            { percent: 75, text: lm.getString('loading_ui', 'Preparing UI...') },
            { percent: 90, text: lm.getString('loading_services', 'Starting services...') },
            { percent: 100, text: lm.getString('loading_complete', 'Loading complete') }
        ];

        let currentStage = 0;
        let currentPercent = 0;

        const updateProgress = () => {
            if (currentStage < stages.length) {
                const targetPercent = stages[currentStage].percent;
                const increment = 2; // Скорость изменения процентов
                
                if (currentPercent < targetPercent) {
                    currentPercent = Math.min(currentPercent + increment, targetPercent);
                } else {
                    currentStage++;
                    if (currentStage < stages.length) {
                        this.loadingStage.textContent = stages[currentStage].text;
                        // Воспроизводим звук перехода этапа (кроме первого)
                        if (currentStage > 1) {
                            this.soundManager.playLoadingStep();
                        }
                    }
                }

                // Обновляем элементы
                this.progressPercent.textContent = `${Math.round(currentPercent)}%`;
                this.progressBar.style.width = `${currentPercent}%`;

                if (currentPercent < 100) {
                    setTimeout(updateProgress, 100); // Обновление каждые 100ms
                } else {
                    // Загрузка завершена, воспроизводим звук готовности
                    this.soundManager.playSystemReady();
                    setTimeout(() => {
                        this.container.classList.remove('visible');
                        setTimeout(this.onComplete, 500);
                    }, 500);
                }
            }
        };

        // Начинаем обновление прогресса
        updateProgress();
    }
}
