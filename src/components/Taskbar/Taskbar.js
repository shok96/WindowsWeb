/**
 * Taskbar - Панель задач для Windows 11 Web OS
 */

import { getTaskbarPinnedApps } from '../../data/defaultApps.js';
import { getSoundManager } from '../../core/SoundManager.js';
import NotificationCenter from '../NotificationCenter/NotificationCenter.js';

export class Taskbar {
  constructor(container, processManager, eventBus, languageManager, notificationManager) {
    this.container = container;
    this.processManager = processManager;
    this.eventBus = eventBus;
    this.languageManager = languageManager;
    this.notificationManager = notificationManager;
    this.soundManager = getSoundManager();
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="taskbar acrylic">
        <div class="taskbar-center">
          <button class="start-button" data-action="toggleStartMenu">
            <svg class="windows-logo" width="20" height="20" viewBox="0 0 20 20">
              <rect x="0" y="0" width="8" height="8" fill="currentColor"/>
              <rect x="10" y="0" width="8" height="8" fill="currentColor"/>
              <rect x="0" y="10" width="8" height="8" fill="currentColor"/>
              <rect x="10" y="10" width="8" height="8" fill="currentColor"/>
            </svg>
          </button>
          <button class="task-switcher-button" data-action="toggleTaskSwitcher" title="${this.languageManager.getString('active_windows', 'Active Windows')}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11zM3 3v10h10V3H3z"/>
                <path d="M5 5h6v6H5V5z"/>
            </svg>
          </button>
          <div class="taskbar-icons"></div>
        </div>
        <div class="taskbar-right">
          <div class="system-tray">
            <button class="tray-icon" title="${this.languageManager.getString('language', 'Language')}">
              <span>${this.languageManager.getLanguage().toUpperCase()}</span>
            </button>
            <button class="tray-icon" data-action="toggleNotifications" title="${this.languageManager.getString('notifications', 'Notifications')}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                </svg>
            </button>
            <button class="tray-icon clock" data-action="calendar">
              <div class="time"></div>
              <div class="date"></div>
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.renderPinnedApps();
    this.attachEventListeners();
    this.startClock();
  }

  renderPinnedApps() {
    const pinnedApps = getTaskbarPinnedApps(this.languageManager);
    const iconsContainer = this.container.querySelector('.taskbar-icons');
    
    pinnedApps.forEach(app => {
      const button = document.createElement('button');
      button.className = 'taskbar-app-icon';
      button.dataset.app = app.id;
      button.innerHTML = `
        <span class="icon">${app.icon}</span>
        <div class="app-indicator"></div>
      `;
      button.title = app.name;
      button.addEventListener('click', () => {
        this.soundManager.playButtonClick();
        this.launchApp(app.id);
      });
      iconsContainer.appendChild(button);
    });
  }

  launchApp(appId) {
    this.eventBus.emit('app:open', { appId });
  }

  updateRunningApps() {
    const processes = this.processManager.getAllProcesses();
    const iconsContainer = this.container.querySelector('.taskbar-icons');
    
    // Сбросить индикаторы
    iconsContainer.querySelectorAll('.taskbar-app-icon').forEach(btn => {
      btn.classList.remove('running');
    });
    
    // Обновить индикаторы запущенных приложений
    processes.forEach(process => {
      const button = iconsContainer.querySelector(`[data-app="${process.name}"]`);
      if (button) {
        button.classList.add('running');
      }
    });
  }

  attachEventListeners() {
    const startButton = this.container.querySelector('[data-action="toggleStartMenu"]');
    startButton.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.eventBus.emit('startmenu:toggle');
    });

    const taskSwitcherButton = this.container.querySelector('[data-action="toggleTaskSwitcher"]');
    taskSwitcherButton.addEventListener('click', () => {
        this.soundManager.playButtonClick();
        this.eventBus.emit('taskswitcher:toggle');
    });
    
    const notificationsButton = this.container.querySelector('[data-action="toggleNotifications"]');
    notificationsButton.addEventListener('click', () => {
        this.soundManager.playButtonClick();
        this.notificationManager.notificationCenter.toggle();
    });

    // Обновление индикаторов при изменении процессов
    this.eventBus.on('window:created', () => this.updateRunningApps());
    this.eventBus.on('window:closed', () => this.updateRunningApps());
  }

  startClock() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
  }

  updateClock() {
    const timeEl = this.container.querySelector('.time');
    const dateEl = this.container.querySelector('.date');
    if (!timeEl || !dateEl) return;
    
    const now = new Date();
    const lang = this.languageManager.getLanguage();
    const locale = lang === 'ru' ? 'ru-RU' : 'en-US';

    timeEl.textContent = now.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    dateEl.textContent = now.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}



