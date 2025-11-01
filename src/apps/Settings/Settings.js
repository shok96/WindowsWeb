import { showDialog } from '../../components/Dialog/Dialog.js';

/**
 * Settings - Настройки системы
 */

export class Settings {
  constructor(params = {}) {
    this.section = params.section || 'personalization';
  }

  render(themeManager, storageManager, languageManager) {
    this.languageManager = languageManager; // Store for later use
    const container = document.createElement('div');
    container.className = 'settings-app';
    container.innerHTML = `
      <div class="settings-sidebar">
        <button class="sidebar-item active" data-section="personalization">
          <span class="icon">🎨</span>
          <span>${this.languageManager.getString('personalization')}</span>
        </button>
        <button class="sidebar-item" data-section="system">
          <span class="icon">⚙️</span>
          <span>${this.languageManager.getString('system')}</span>
        </button>
      </div>
      <div class="settings-content">
        <div class="settings-section" data-section="personalization">
          ${this.renderPersonalization(themeManager)}
        </div>
        <div class="settings-section hidden" data-section="system">
          ${this.renderSystem(storageManager)}
        </div>
      </div>
    `;

    this.attachEventListeners(container, themeManager, storageManager);
    
    // Настраиваем прокрутку для всех секций
    this.setupScrollHandlers(container);
    
    return container;
  }

  setupScrollHandlers(container) {
    const contentEl = container.querySelector('.settings-content');
    if (!contentEl) return;
    
    // Функция для обновления высоты
    const updateHeight = () => {
      requestAnimationFrame(() => {
        const containerHeight = container.offsetHeight;
        if (containerHeight > 0) {
          // Устанавливаем явную высоту для правильной работы абсолютного позиционирования
          contentEl.style.height = `${containerHeight}px`;
        }
      });
    };
    
    // Обновляем высоту сразу и при изменениях
    updateHeight();
    
    // Используем ResizeObserver для отслеживания изменений размера
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(container);
    } else {
      // Fallback для старых браузеров
      window.addEventListener('resize', updateHeight);
    }
    
    // Обработчик wheel для всех секций - гарантированная прокрутка
    const setupSectionScroll = (section) => {
      section.style.overflowY = 'auto';
      
      section.addEventListener('wheel', (e) => {
        const { scrollTop, scrollHeight, clientHeight } = section;
        const delta = e.deltaY;
        
        const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
        const canScrollUp = scrollTop > 0;
        
        if ((delta > 0 && canScrollDown) || (delta < 0 && canScrollUp)) {
          section.scrollTop += delta;
          e.preventDefault();
          e.stopPropagation();
        }
      }, { passive: false });
    };
    
    // Настраиваем прокрутку для существующих секций
    container.querySelectorAll('.settings-section').forEach(setupSectionScroll);
    
    // Перехватываем клики по sidebar для обновления высоты после смены секций
    container.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        setTimeout(updateHeight, 10);
        // Настраиваем прокрутку для только что показанной секции
        const section = container.querySelector('.settings-section:not(.hidden)');
        if (section) {
          setupSectionScroll(section);
        }
      });
    });
  }

  attachEventListeners(container, themeManager, storageManager) {
    // Sidebar navigation
    container.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        container.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const section = item.dataset.section;
        container.querySelectorAll('.settings-section').forEach(s => s.classList.add('hidden'));
        container.querySelector(`.settings-section[data-section="${section}"]`).classList.remove('hidden');
      });
    });

    // --- Personalization Listeners ---
    const themeSelect = container.querySelector('.theme-select');
    if (themeSelect) {
      themeSelect.value = themeManager.getTheme();
      themeSelect.addEventListener('change', () => {
        themeManager.setTheme(themeSelect.value);
      });
    }

    const accentInput = container.querySelector('.accent-color-input');
    if (accentInput) {
      accentInput.value = themeManager.getAccentColor();
      accentInput.addEventListener('input', () => {
        themeManager.setAccentColor(accentInput.value);
      });
    }

    const textColorInput = container.querySelector('.text-color-input');
    if (textColorInput) {
      textColorInput.value = themeManager.getTextColor();
      textColorInput.addEventListener('input', () => {
        themeManager.setTextColor(textColorInput.value);
      });
    }

    const borderColorInput = container.querySelector('.border-color-input');
    const borderOpacityInput = container.querySelector('.border-opacity-input');
    const opacityValue = container.querySelector('.opacity-value');
    if (borderColorInput && borderOpacityInput && opacityValue) {
      const updateBorderColor = () => {
        const color = borderColorInput.value;
        const opacity = borderOpacityInput.value / 100;
        const rgba = this.hexToRgba(color, opacity);
        themeManager.setBorderColor(rgba);
        opacityValue.textContent = `${borderOpacityInput.value}%`;
      };
      borderColorInput.addEventListener('input', updateBorderColor);
      borderOpacityInput.addEventListener('input', updateBorderColor);
    }
    
    const wallpaperInput = container.querySelector('.wallpaper-input');
    const applyWallpaperBtn = container.querySelector('.apply-wallpaper-btn');
    if (applyWallpaperBtn) {
      applyWallpaperBtn.addEventListener('click', async () => {
        if (wallpaperInput.value) {
          themeManager.setWallpaper(wallpaperInput.value);
          await showDialog({ title: this.languageManager.getString('personalization'), message: this.languageManager.getString('wallpaper_applied', 'Wallpaper applied!') });
        }
      });
    }

    const presetItems = container.querySelectorAll('.wallpaper-preset-item');
    presetItems.forEach(item => {
        item.addEventListener('click', () => {
            themeManager.setWallpaper(item.dataset.url);
            presetItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // --- System Listeners ---
    const langSelect = container.querySelector('#language-select');
    if (langSelect) {
      langSelect.value = this.languageManager.getLanguage();
      langSelect.addEventListener('change', () => {
        this.languageManager.setLanguage(langSelect.value, true); // true for reboot required
      });
    }

    const timeZoneSelect = container.querySelector('#timezone-select');
    if (timeZoneSelect) {
      timeZoneSelect.addEventListener('change', () => showDialog({ title: this.languageManager.getString('information', 'Information'), message: this.languageManager.getString('timezone_not_implemented', 'Timezone changing is not yet implemented.')}));
    }

    const timeEl = container.querySelector('.current-time');
    if (timeEl) {
      const updateClock = () => timeEl.textContent = new Date().toLocaleTimeString();
      updateClock();
      const clockInterval = setInterval(updateClock, 1000);
      // TODO: Clear interval when window is closed
    }
    
    const exportBtn = container.querySelector('.export-data-btn');
    if(exportBtn) {
        exportBtn.addEventListener('click', () => {
            const url = storageManager.export();
            const a = document.createElement('a');
            a.href = url;
            a.download = 'andlanceros-backup.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    const resetBtn = container.querySelector('.reset-btn');
    if(resetBtn) {
        resetBtn.addEventListener('click', async () => {
            const confirmed = await showDialog({
                type: 'confirm',
                title: this.languageManager.getString('reset_settings_title', 'Сброс настроек'),
                message: this.languageManager.getString('reset_settings_confirm_all', 'Сбросить все настройки? Это действие нельзя отменить.')
            });
            if (confirmed) {
                storageManager.clear();
                location.reload();
            }
        });
    }
  }
  
  renderPersonalization(themeManager) {
    const presetWallpapers = themeManager.getPresetWallpapers();
    return `
      <div class="settings-page">
        <h2>${this.languageManager.getString('personalization')}</h2>
        <div class="settings-group">
          <h3>${this.languageManager.getString('theme_title', 'Тема')}</h3>
          <p>${this.languageManager.getString('theme_description', 'Выберите светлое или темное оформление.')}</p>
          <select class="theme-select settings-control">
            <option value="light">${this.languageManager.getString('light_theme')}</option>
            <option value="dark">${this.languageManager.getString('dark_theme')}</option>
          </select>
        </div>
        <div class="settings-group">
          <h3>${this.languageManager.getString('accent_color')}</h3>
          <p>${this.languageManager.getString('accent_color_description', 'Выберите цвет для элементов интерфейса.')}</p>
          <input type="color" class="accent-color-input settings-control" value="${themeManager.getAccentColor()}">
        </div>
        <div class="settings-group">
          <h3>${this.languageManager.getString('text_color', 'Text Color')}</h3>
          <p>${this.languageManager.getString('text_color_description', 'Choose a color for the main text.')}</p>
          <input type="color" class="text-color-input settings-control" value="${themeManager.getTextColor()}">
        </div>
        <div class="settings-group">
          <h3>${this.languageManager.getString('border_color', 'Border Color')}</h3>
          <p>${this.languageManager.getString('border_color_description', 'Choose a color for UI element borders.')}</p>
          <div class="border-color-controls">
            <input type="color" class="border-color-input settings-control" value="${this.rgbaToHex(themeManager.getBorderColor())}">
            <input type="range" class="border-opacity-input settings-control" min="0" max="100" value="${this.getOpacity(themeManager.getBorderColor())}" step="5">
            <span class="opacity-value">${this.getOpacity(themeManager.getBorderColor())}%</span>
          </div>
        </div>
        <div class="settings-group">
          <h3>${this.languageManager.getString('wallpaper')}</h3>
          <p>${this.languageManager.getString('wallpaper_description', 'Paste an image URL or choose from the presets.')}</p>
          <div class="wallpaper-controls">
            <input type="text" class="wallpaper-input settings-control" placeholder="https://example.com/wallpaper.jpg">
            <button class="apply-wallpaper-btn settings-button">${this.languageManager.getString('apply_wallpaper', 'Apply')}</button>
          </div>
          <div class="wallpaper-presets">
            ${presetWallpapers.map(url => `
              <div class="wallpaper-preset-item" data-url="${url}">
                <img src="${url}" alt="Wallpaper preset">
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  renderSystem(storageManager) {
    return `
      <div class="settings-page">
        <h2>${this.languageManager.getString('system')}</h2>

        <div class="settings-group">
          <h3>${this.languageManager.getString('about_system')}</h3>
          <div class="settings-item">
            <span>${this.languageManager.getString('andlanceros')}</span>
          </div>
           <div class="settings-item">
            <span>${this.languageManager.getString('version')}: 1.0.0</span>
          </div>
           <div class="settings-item">
            <span>${this.languageManager.getString('build')}: ${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}</span>
          </div>
        </div>

        <div class="settings-group">
          <h3>${this.languageManager.getString('system_language')}</h3>
          <div class="settings-item">
            <label for="language-select">${this.languageManager.getString('app_language')}</label>
            <select id="language-select" class="settings-control">
              <option value="ru">${this.languageManager.getString('lang_ru', 'Russian (Russia)')}</option>
              <option value="en">${this.languageManager.getString('lang_en', 'English (United States)')}</option>
            </select>
          </div>
        </div>
        <div class="settings-group">
          <h3>${this.languageManager.getString('date_and_time', 'Date and Time')}</h3>
          <div class="settings-item">
            <label>${this.languageManager.getString('current_time', 'Current Time')}</label>
            <span class="current-time">--:--:--</span>
          </div>
          <div class="settings-item">
            <label for="timezone-select">${this.languageManager.getString('timezone', 'Timezone')}</label>
            <select id="timezone-select" class="settings-control">
              <option value="Europe/Moscow">${this.languageManager.getString('tz_moscow', '(UTC+03:00) Moscow')}</option>
              <option value="Europe/Kaliningrad">${this.languageManager.getString('tz_kaliningrad', '(UTC+02:00) Kaliningrad')}</option>
              <option value="Asia/Yekaterinburg">${this.languageManager.getString('tz_yekaterinburg', '(UTC+05:00) Yekaterinburg')}</option>
              <option value="UTC">${this.languageManager.getString('tz_utc', '(UTC) Coordinated Universal Time')}</option>
            </select>
          </div>
        </div>
        <div class="settings-group">
            <h3>${this.languageManager.getString('backup', 'Backup')}</h3>
            <p>${this.languageManager.getString('backup_description', 'Save or load all your data and settings.')}</p>
            <div class="system-actions">
                <button class="settings-button export-data-btn">${this.languageManager.getString('export_data', 'Export Data')}</button>
                <button class="settings-button reset-btn danger">${this.languageManager.getString('reset_system', 'Reset System')}</button>
            </div>
        </div>
      </div>
    `;
  }

  // Helper methods for color conversion
  rgbaToHex(rgba) {
    if (rgba.startsWith('rgba')) {
      const matches = rgba.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]).toString(16).padStart(2, '0');
        const g = parseInt(matches[1]).toString(16).padStart(2, '0');
        const b = parseInt(matches[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    }
    // If it's already hex, return as is
    if (rgba.startsWith('#')) {
      return rgba.substring(0, 7); // Remove alpha if present
    }
    return '#000000';
  }

  getOpacity(rgba) {
    if (rgba.startsWith('rgba')) {
      const matches = rgba.match(/\d+\.?\d*/g);
      if (matches && matches.length >= 4) {
        return Math.round(parseFloat(matches[3]) * 100);
      }
    }
    return 10; // Default opacity
  }

  hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}

