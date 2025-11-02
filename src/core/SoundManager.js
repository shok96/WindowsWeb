/**
 * SoundManager.js - Менеджер звуков системы
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Управление системными звуками через Web Audio API
 * @integration_contract: SoundManager используется через getSoundManager() singleton
 * @consistency_model: Eventual consistency - звуки воспроизводятся асинхронно
 * @failure_policy: Ошибки логируются в console.warn, не прерывают выполнение
 * @performance_contract: Воспроизведение звуков неблокирующее, использует Web Audio API
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Воспроизведение звуков через Web Audio API и HTML5 Audio
 * @interface_contract: playTone(), playSound(), playSystemStart(), playSystemShutdown(), setEnabled(), setVolume()
 * @implementation_strategy: Singleton через getSoundManager(), опциональное воспроизведение через enabled флаг
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: Web Audio API доступен в браузере (AudioContext или webkitAudioContext)
 * @ensures: playTone() - воспроизводит тон если enabled=true, ошибки обрабатываются молча
 * @ensures: setVolume() - ограничивает значение между 0 и 1
 * @invariant: enabled всегда булево значение, volume всегда в диапазоне [0, 1]
 * @modifies: Генерирует звуки через Web Audio API, не изменяет состояние системы
 * @throws: Ошибки Web Audio API перехватываются, логируются в console.warn
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: Web Audio API нужен для программного генерации звуков
 * @why_ensures: Молчаливая обработка ошибок гарантирует что отсутствие звука не ломает систему
 * @why_invariant: Валидация volume предотвращает некорректное воспроизведение
 * @business_impact: Нарушение ведет к отсутствию звуковых эффектов (не критично)
 * @stakeholder_value: Пользователь получает звуковую обратную связь при взаимодействии
 */

export class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
    }

    /**
     * Создает простой звуковой сигнал через Web Audio API
     * @param {number} frequency - Частота в Гц
     * @param {number} duration - Длительность в мс
     * @param {string} type - Тип волны ('sine', 'square', 'sawtooth', 'triangle')
     * @param {number} volume - Громкость (0-1)
     */
    playTone(frequency, duration = 200, type = 'sine', volume = null) {
        if (!this.enabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            // Плавное нарастание и затухание
            const vol = volume !== null ? volume : this.volume;
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(vol, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    /**
     * Воспроизведение звука из файла
     * @param {string} url - URL звукового файла
     * @param {number} volume - Громкость (0-1)
     */
    playSound(url, volume = null) {
        if (!this.enabled) return;

        try {
            const audio = new Audio(url);
            audio.volume = volume !== null ? volume : this.volume;
            audio.play().catch(error => {
                console.warn('Failed to play audio file:', error);
            });
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    /**
     * Звук запуска системы
     */
    playSystemStart() {
        // Приятный восходящий звук
        this.playTone(400, 150, 'sine', 0.4);
        setTimeout(() => {
            this.playTone(600, 200, 'sine', 0.3);
        }, 150);
    }

    /**
     * Звук завершения загрузки
     */
    playSystemReady() {
        // Успешный аккорд
        this.playTone(523.25, 100, 'sine', 0.3); // C5
        setTimeout(() => {
            this.playTone(659.25, 100, 'sine', 0.3); // E5
        }, 50);
        setTimeout(() => {
            this.playTone(783.99, 150, 'sine', 0.3); // G5
        }, 100);
    }

    /**
     * Звук выхода из системы
     */
    playSystemShutdown() {
        // Нисходящий звук выключения
        this.playTone(400, 200, 'sine', 0.4);
        setTimeout(() => {
            this.playTone(300, 250, 'sine', 0.35);
        }, 150);
        setTimeout(() => {
            this.playTone(200, 300, 'sine', 0.3);
        }, 300);
    }

    /**
     * Звук перехода между этапами загрузки
     */
    playLoadingStep() {
        // Короткий звук перехода
        this.playTone(800, 50, 'sine', 0.2);
    }

    /**
     * Звук открытия окна/приложения
     */
    playWindowOpen() {
        // Приятный короткий восходящий звук
        this.playTone(600, 80, 'sine', 0.25);
        setTimeout(() => {
            this.playTone(800, 100, 'sine', 0.2);
        }, 50);
    }

    /**
     * Звук закрытия окна/приложения
     */
    playWindowClose() {
        // Короткий нисходящий звук
        this.playTone(500, 100, 'sine', 0.25);
        setTimeout(() => {
            this.playTone(300, 80, 'sine', 0.2);
        }, 50);
    }

    /**
     * Звук фокусировки окна
     */
    playWindowFocus() {
        // Очень короткий клик
        this.playTone(1000, 30, 'sine', 0.15);
    }

    /**
     * Звук переключения окон
     */
    playWindowSwitch() {
        // Быстрый переход
        this.playTone(700, 40, 'sine', 0.2);
    }

    /**
     * Звук открытия меню
     */
    playMenuOpen() {
        // Мягкий восходящий звук
        this.playTone(500, 60, 'sine', 0.2);
    }

    /**
     * Звук закрытия меню
     */
    playMenuClose() {
        // Мягкий нисходящий звук
        this.playTone(400, 60, 'sine', 0.2);
    }

    /**
     * Звук клика по кнопке
     */
    playButtonClick() {
        // Короткий клик
        this.playTone(800, 40, 'sine', 0.15);
    }

    /**
     * Звук успешной операции
     */
    playSuccess() {
        // Приятный аккорд успеха
        this.playTone(523.25, 80, 'sine', 0.25); // C5
        setTimeout(() => {
            this.playTone(659.25, 80, 'sine', 0.25); // E5
        }, 40);
        setTimeout(() => {
            this.playTone(783.99, 120, 'sine', 0.25); // G5
        }, 80);
    }

    /**
     * Звук ошибки
     */
    playError() {
        // Низкий предупреждающий звук
        this.playTone(200, 150, 'square', 0.3);
        setTimeout(() => {
            this.playTone(150, 150, 'square', 0.25);
        }, 100);
    }

    /**
     * Звук уведомления
     */
    playNotification() {
        // Мягкое уведомление
        this.playTone(700, 100, 'sine', 0.2);
        setTimeout(() => {
            this.playTone(900, 120, 'sine', 0.18);
        }, 80);
    }

    /**
     * Звук выбора элемента
     */
    playSelect() {
        // Короткий клик выбора
        this.playTone(1000, 30, 'sine', 0.12);
    }

    /**
     * Звук сохранения
     */
    playSave() {
        // Приятный звук сохранения
        this.playTone(600, 80, 'sine', 0.2);
        setTimeout(() => {
            this.playTone(800, 100, 'sine', 0.18);
        }, 60);
    }

    /**
     * Звук удаления
     */
    playDelete() {
        // Нисходящий звук удаления
        this.playTone(400, 120, 'sine', 0.25);
        setTimeout(() => {
            this.playTone(250, 100, 'sine', 0.2);
        }, 80);
    }

    /**
     * Воспроизведение аккорда (для создания более сложных звуков)
     */
    playChord(frequencies, duration = 200, volume = null) {
        if (!this.enabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioContext.createGain();
            const vol = volume !== null ? volume : this.volume;
            
            gainNode.connect(audioContext.destination);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(vol, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                oscillator.connect(gainNode);
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                oscillator.start(audioContext.currentTime + index * 0.02);
                oscillator.stop(audioContext.currentTime + duration / 1000);
            });
        } catch (error) {
            console.warn('Failed to play chord:', error);
        }
    }

    /**
     * Включить/выключить звуки
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Установить громкость
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

// Глобальный экземпляр
let soundManager = null;

export function getSoundManager() {
    if (!soundManager) {
        soundManager = new SoundManager();
    }
    return soundManager;
}

