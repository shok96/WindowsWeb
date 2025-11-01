import './NotificationCenter.css';

class NotificationCenter {
    constructor(languageManager) {
        this.languageManager = languageManager;
        const lm = this.languageManager;

        this.element = document.createElement('div');
        this.element.className = 'notification-center';
        this.element.innerHTML = `
            <div class="notification-center-header">
                <h2>${lm.getString('nc_title', 'Notifications')}</h2>
                <button class="clear-all-btn">${lm.getString('nc_clear_all', 'Clear All')}</button>
            </div>
            <div class="notification-list"></div>
        `;
        document.body.appendChild(this.element);

        this.notificationList = this.element.querySelector('.notification-list');
        this.clearAllBtn = this.element.querySelector('.clear-all-btn');

        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Bind for event listeners
        this._handleDocumentClick = this._handleDocumentClick.bind(this);

        // Prevent clicks inside the center from closing it
        this.element.addEventListener('click', (e) => e.stopPropagation());
    }

    addNotification(notification) {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item notification-${notification.type}`;
        notificationElement.innerHTML = `
            <div class="notification-item-header">
                <span class="notification-item-title">${notification.title}</span>
                <button class="dismiss-btn">&times;</button>
            </div>
            <div class="notification-item-message">${notification.message}</div>
        `;
        this.notificationList.appendChild(notificationElement);

        notificationElement.querySelector('.dismiss-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.notificationList.removeChild(notificationElement);
        });
    }

    clearAll() {
        this.notificationList.innerHTML = '';
    }

    toggle() {
        const isVisible = this.element.classList.toggle('visible');
        if (isVisible) {
            // Add a slight delay to prevent the opening click from immediately closing it
            setTimeout(() => {
                document.addEventListener('click', this._handleDocumentClick);
            }, 0);
        } else {
            document.removeEventListener('click', this._handleDocumentClick);
        }
    }

    hide() {
        if (this.element.classList.contains('visible')) {
            this.element.classList.remove('visible');
            document.removeEventListener('click', this._handleDocumentClick);
        }
    }

    _handleDocumentClick() {
        this.hide();
    }
}

export default NotificationCenter;
