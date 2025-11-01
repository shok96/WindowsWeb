/**
 * StartMenu - Меню Пуск для Windows 11 Web OS
 */

import { getPinnedApps, defaultApps, getAppsByCategory } from '../../data/defaultApps.js';
import { getSoundManager } from '../../core/SoundManager.js';

export class StartMenu {
  constructor(container, eventBus, languageManager) {
    this.container = container;
    this.eventBus = eventBus;
    this.languageManager = languageManager;
    this.isVisible = false;
    this.soundManager = getSoundManager();
    this.render();
  }

  render() {
    const menu = document.createElement('div');
    menu.className = 'start-menu hidden acrylic';
    menu.innerHTML = `
      <div class="start-menu-content">
        <div class="start-search">
          <input type="text" placeholder="${this.languageManager.getString('startmenu_search_placeholder', 'Search for apps, files...')}" />
        </div>
        <div class="start-apps">
          <div class="apps-container"></div>
        </div>
        <div class="start-footer">
          <div class="user-profile">
            <div class="user-avatar">👤</div>
            <span>${this.languageManager.getString('guest', 'Guest')}</span>
          </div>
          <div class="power-controls">
            <button class="power-button" data-action="power" title="${this.languageManager.getString('power', 'Power')}">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-power"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            </button>
            <div class="power-options">
                <button data-action="logout">${this.languageManager.getString('logout_title', 'Logout')}</button>
                <button data-action="restart">${this.languageManager.getString('restart_title', 'Restart')}</button>
                <button data-action="shutdown">${this.languageManager.getString('shutdown_title', 'Shutdown')}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.container.appendChild(menu);
    this.menu = menu;
    this.renderAllApps();
    this.attachEventListeners();
  }

  renderAllApps() {
    const container = this.menu.querySelector('.apps-container');
    const allApps = getPinnedApps(this.languageManager);
    
    // Группируем приложения по категориям
    const categories = {
      'system': { name: 'Система', apps: [] },
      'productivity': { name: 'Продуктивность', apps: [] },
      'utility': { name: 'Утилиты', apps: [] },
      'internet': { name: 'Интернет', apps: [] },
      'games': { name: 'Игры', apps: [] },
      'developer': { name: 'Разработка', apps: [] },
      'media': { name: 'Медиа', apps: [] }
    };
    
    allApps.forEach(app => {
      const category = app.category || 'system';
      if (categories[category]) {
        categories[category].apps.push(app);
      }
    });
    
    // Рендерим категории с приложениями
    Object.entries(categories).forEach(([key, category]) => {
      if (category.apps.length > 0) {
        const section = document.createElement('div');
        section.className = 'app-category';
        section.innerHTML = `
          <div class="section-header">
            <span>${category.name}</span>
          </div>
          <div class="apps-grid"></div>
        `;
        
        const grid = section.querySelector('.apps-grid');
        category.apps.forEach(app => {
          const item = document.createElement('button');
          item.className = 'app-item';
          item.innerHTML = `
            <div class="app-icon">${app.icon}</div>
            <div class="app-label">${app.name}</div>
          `;
          item.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.eventBus.emit('app:open', { appId: app.id });
            this.hide();
          });
          grid.appendChild(item);
        });
        
        container.appendChild(section);
      }
    });
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.menu.classList.remove('hidden');
    requestAnimationFrame(() => {
      this.menu.classList.add('visible');
    });
    this.isVisible = true;
    this.soundManager.playMenuOpen();
  }

  hide() {
    this.menu.classList.remove('visible');
    setTimeout(() => {
      this.menu.classList.add('hidden');
    }, 200);
    this.isVisible = false;
    this.soundManager.playMenuClose();
  }

  attachEventListeners() {
    // Закрытие при клике вне меню
    document.addEventListener('click', (e) => {
      if (this.isVisible && 
          !this.menu.contains(e.target) && 
          !e.target.closest('.start-button')) {
        this.hide();
      }
    });
    
    // Кнопка выключения
    const powerButton = this.menu.querySelector('[data-action="power"]');
    const powerOptions = this.menu.querySelector('.power-options');
    
    powerButton.addEventListener('click', (e) => {
        e.stopPropagation();
        powerOptions.classList.toggle('visible');
        this.soundManager.playButtonClick();
    });
    
    this.menu.querySelector('[data-action="logout"]').addEventListener('click', () => {
        this.soundManager.playButtonClick();
        this.eventBus.emit('system:logout');
        this.hide();
    });

    this.menu.querySelector('[data-action="restart"]').addEventListener('click', () => {
        this.soundManager.playButtonClick();
        this.eventBus.emit('system:restart');
    });

    this.menu.querySelector('[data-action="shutdown"]').addEventListener('click', () => {
        this.soundManager.playButtonClick();
        this.eventBus.emit('system:shutdown');
    });
    
    // Подписка на событие переключения
    this.eventBus.on('startmenu:toggle', () => this.toggle());
  }
}


