/**
 * Notification.js - Всплывающие уведомления для системы
 */

import { getSoundManager } from '../../core/SoundManager.js';
import NotificationCenter from '../NotificationCenter/NotificationCenter.js';

class NotificationManager {
    constructor(languageManager) {
        this.notifications = [];
        this.notificationHistory = [];
        this.container = null;
        this.languageManager = languageManager;
        this.soundManager = getSoundManager();
        this.notificationCenter = new NotificationCenter(languageManager);
        this.init();
    }

    init() {
        // Создаем контейнер для уведомлений
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    show(options) {
        const config = {
            title: options.title || this.languageManager.getString('notification', 'Notification'),
            message: options.message || '',
            type: options.type || 'info', // info, success, warning, error
            duration: options.duration !== undefined ? options.duration : 3000,
            id: `notification-${Date.now()}-${Math.random()}`
        };

        const notification = document.createElement('div');
        notification.className = `notification notification-${config.type}`;
        notification.id = config.id;
        notification.setAttribute('data-id', config.id);

        const icon = this.getIcon(config.type);
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${config.title}</div>
                <div class="notification-message">${config.message}</div>
            </div>
        `;

        this.container.appendChild(notification);
        this.notifications.push(config);
        this.notificationHistory.push(config);
        this.notificationCenter.addNotification(config);

        // Анимация появления
        requestAnimationFrame(() => {
            notification.classList.add('notification-visible');
            // Воспроизводим звук уведомления
            if (config.type === 'error') {
                this.soundManager.playError();
            } else if (config.type === 'success') {
                this.soundManager.playSuccess();
            } else {
                this.soundManager.playNotification();
            }
        });

        // Автоматическое закрытие
        if (config.duration > 0) {
            const timer = setTimeout(() => {
                this.hide(config.id);
            }, config.duration);

            notification.setAttribute('data-timer', timer);
        }

        // Закрытие по клику на уведомление
        notification.addEventListener('click', () => {
            this.hide(config.id);
        });

        return config.id;
    }

    hide(id) {
        const notification = this.container.querySelector(`[data-id="${id}"]`);
        if (!notification) return;

        const timer = notification.getAttribute('data-timer');
        if (timer) {
            clearTimeout(parseInt(timer));
        }

        notification.classList.remove('notification-visible');
        notification.classList.add('notification-hiding');

        setTimeout(() => {
            notification.remove();
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    getIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    error(title, message, duration = 3000) {
        return this.show({ title, message, type: 'error', duration });
    }

    success(title, message, duration = 3000) {
        return this.show({ title, message, type: 'success', duration });
    }

    warning(title, message, duration = 3000) {
        return this.show({ title, message, type: 'warning', duration });
    }

    info(title, message, duration = 3000) {
        return this.show({ title, message, type: 'info', duration });
    }
}

// Глобальный экземпляр
let notificationManager = null;

export function initNotificationManager(languageManager) {
    if (!notificationManager) {
        notificationManager = new NotificationManager(languageManager);
    }
    return notificationManager;
}

export function showNotification(options) {
    if (!notificationManager) {
        notificationManager = initNotificationManager();
    }
    return notificationManager.show(options);
}

export function showError(title, message, duration) {
    if (!notificationManager) {
        notificationManager = initNotificationManager();
    }
    return notificationManager.error(title, message, duration);
}

export function showSuccess(title, message, duration) {
    if (!notificationManager) {
        notificationManager = initNotificationManager();
    }
    return notificationManager.success(title, message, duration);
}

export function showWarning(title, message, duration) {
    if (!notificationManager) {
        notificationManager = initNotificationManager();
    }
    return notificationManager.warning(title, message, duration);
}

export function showInfo(title, message, duration) {
    if (!notificationManager) {
        notificationManager = initNotificationManager();
    }
    return notificationManager.info(title, message, duration);
}

