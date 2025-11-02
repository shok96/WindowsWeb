/**
 * ThemeManager - Управление темами и персонализацией Windows 11 Web OS
 * Управление светлой/темной темой, обоями и акцентным цветом
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Единая система персонализации интерфейса
 * @integration_contract: ThemeManager ↔ StorageManager для персистентности, ThemeManager → EventBus для уведомлений
 * @consistency_model: Strong consistency - изменения применяются мгновенно и сохраняются
 * @failure_policy: Невалидные цвета показывают предупреждение, не применяются
 * @performance_contract: Операции O(1), применение темы через CSS переменные
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Управление CSS переменными и сохранение настроек персонализации
 * @interface_contract: setTheme(), getTheme(), toggleTheme(), setWallpaper(), getWallpaper(), setAccentColor(), getAccentColor()
 * @implementation_strategy: CSS переменные через document.documentElement, сохранение через StorageManager
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: StorageManager инициализирован, EventBus доступен, DOM готов
 * @ensures: setTheme() - тема применяется к document.documentElement, сохраняется, генерирует событие 'theme:changed'
 * @ensures: setAccentColor() - цвет валидируется (HEX формат), применяется с hover/pressed вариантами, сохраняется
 * @invariant: currentTheme всегда валидна ('light' | 'dark'), цвета в формате HEX (#RRGGBB)
 * @modifies: document.documentElement стили и атрибуты, StorageManager.data.settings, генерирует события через EventBus
 * @throws: Предупреждения при невалидных форматах цветов (не выбрасываются)
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: StorageManager критичен для сохранения настроек между сессиями
 * @why_ensures: Мгновенное применение темы улучшает UX, события позволяют UI обновляться автоматически
 * @why_invariant: Валидация тем и цветов предотвращает некорректное отображение интерфейса
 * @business_impact: Нарушение ведет к несохранению настроек пользователя или некорректному отображению
 * @stakeholder_value: Пользователь может персонализировать интерфейс, настройки сохраняются
 */

export class ThemeManager {
  constructor(storageManager, eventBus) {
    this.storage = storageManager;
    this.eventBus = eventBus;
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
    this.loadAccentColor();
    this.loadTextColor();
    this.loadBorderColor();
  }

  /**
   * Загрузка темы из хранилища
   * @returns {string} Название темы
   */
  loadTheme() {
    const data = this.storage.load();
    return data.settings?.theme || 'light';
  }

  /**
   * Установка темы
   * @param {string} theme - Название темы ('light' или 'dark')
   */
  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme:', theme);
      return;
    }
    
    this.currentTheme = theme;
    this.applyTheme(theme);
    
    // Сохранение в хранилище
    const data = this.storage.load();
    if (!data.settings) data.settings = {};
    data.settings.theme = theme;
    this.storage.save(data);
    
    // Уведомление о смене темы
    this.eventBus.emit('theme:changed', { theme });
  }

  /**
   * Применение темы к документу
   * @param {string} theme - Название темы
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Обновление класса body для Gravity UI
    const body = document.body;
    body.classList.remove('g-root_theme_light', 'g-root_theme_dark');
    body.classList.add(`g-root_theme_${theme}`);
  }

  /**
   * Получение текущей темы
   * @returns {string} Название темы
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Переключение темы
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Установка обоев
   * @param {string} wallpaperUrl - URL обоев
   */
  setWallpaper(wallpaperUrl) {
    const data = this.storage.load();
    if (!data.settings) data.settings = {};
    data.settings.wallpaper = wallpaperUrl;
    this.storage.save(data);
    
    // Уведомление о смене обоев
    this.eventBus.emit('wallpaper:changed', { wallpaper: wallpaperUrl });
  }

  /**
   * Получение URL обоев
   * @returns {string} URL обоев
   */
  getWallpaper() {
    const data = this.storage.load();
    return data.settings?.wallpaper || 'https://i.pinimg.com/originals/17/88/92/17889228fae817f8e6291d471f80c3ad.jpg';
  }

  /**
   * Установка акцентного цвета
   * @param {string} color - Цвет в формате HEX
   */
  setAccentColor(color) {
    // Валидация HEX цвета
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      console.warn('Invalid color format:', color);
      return;
    }
    
    document.documentElement.style.setProperty('--accent-color', color);
    
    // Вычисление hover и pressed вариантов
    const hoverColor = this.adjustBrightness(color, -10);
    const pressedColor = this.adjustBrightness(color, -20);
    
    document.documentElement.style.setProperty('--accent-hover', hoverColor);
    document.documentElement.style.setProperty('--accent-pressed', pressedColor);
    
    // Сохранение в хранилище
    const data = this.storage.load();
    if (!data.settings) data.settings = {};
    data.settings.accentColor = color;
    this.storage.save(data);
    
    // Уведомление о смене цвета
    this.eventBus.emit('accentColor:changed', { color });
  }

  /**
   * Получение акцентного цвета
   * @returns {string} Цвет в формате HEX
   */
  getAccentColor() {
    const data = this.storage.load();
    return data.settings?.accentColor || '#0078d4';
  }

  /**
   * Загрузка сохраненного акцентного цвета
   */
  loadAccentColor() {
    const color = this.getAccentColor();
    this.setAccentColor(color);
  }

  /**
   * Изменение яркости цвета
   * @param {string} color - Цвет в формате HEX
   * @param {number} percent - Процент изменения (-100 до 100)
   * @returns {string} Измененный цвет
   */
  adjustBrightness(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  /**
   * Предустановленные обои
   * @returns {Array} Массив URL обоев
   */
  getPresetWallpapers() {
    return [
      'https://i.pinimg.com/originals/17/88/92/17889228fae817f8e6291d471f80c3ad.jpg',
      'https://i.pinimg.com/originals/f4/2d/a7/f42da78be969a6301083e049930e58dc.jpg'
    ];
  }

  /**
   * Предустановленные акцентные цвета
   * @returns {Array} Массив цветов
   */
  getPresetAccentColors() {
    return [
      { name: 'Синий', color: '#0078d4' },
      { name: 'Красный', color: '#e81123' },
      { name: 'Зеленый', color: '#10893e' },
      { name: 'Фиолетовый', color: '#8764b8' },
      { name: 'Оранжевый', color: '#ff8c00' },
      { name: 'Розовый', color: '#e3008c' },
      { name: 'Бирюзовый', color: '#00b7c3' },
      { name: 'Золотой', color: '#ffd700' }
    ];
  }

  /**
   * Установка цвета текста
   * @param {string} color - Цвет в формате HEX
   */
  setTextColor(color) {
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      console.warn('Invalid color format:', color);
      return;
    }
    
    document.documentElement.style.setProperty('--text-primary', color);
    
    const data = this.storage.load();
    if (!data.settings) data.settings = {};
    data.settings.textColor = color;
    this.storage.save(data);
    
    this.eventBus.emit('textColor:changed', { color });
  }

  /**
   * Получение цвета текста
   * @returns {string} Цвет в формате HEX
   */
  getTextColor() {
    const data = this.storage.load();
    if (data.settings?.textColor) {
      return data.settings.textColor;
    }
    // Возвращаем цвет по умолчанию в зависимости от темы
    return this.currentTheme === 'dark' ? '#ffffff' : '#000000';
  }

  /**
   * Загрузка сохраненного цвета текста
   */
  loadTextColor() {
    const color = this.getTextColor();
    this.setTextColor(color);
  }

  /**
   * Установка цвета границ
   * @param {string} color - Цвет в формате HEX (с прозрачностью через rgba или hex с alpha)
   */
  setBorderColor(color) {
    // Поддерживаем rgba и hex с alpha
    const isRgba = color.startsWith('rgba');
    const isHex = /^#[0-9A-F]{6,8}$/i.test(color);
    
    if (!isRgba && !isHex) {
      console.warn('Invalid color format:', color);
      return;
    }
    
    document.documentElement.style.setProperty('--border-primary', color);
    
    const data = this.storage.load();
    if (!data.settings) data.settings = {};
    data.settings.borderColor = color;
    this.storage.save(data);
    
    this.eventBus.emit('borderColor:changed', { color });
  }

  /**
   * Получение цвета границ
   * @returns {string} Цвет
   */
  getBorderColor() {
    const data = this.storage.load();
    if (data.settings?.borderColor) {
      return data.settings.borderColor;
    }
    // Возвращаем цвет по умолчанию в зависимости от темы
    return this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  }

  /**
   * Загрузка сохраненного цвета границ
   */
  loadBorderColor() {
    const color = this.getBorderColor();
    this.setBorderColor(color);
  }

  /**
   * Сброс настроек персонализации
   */
  resetPersonalization() {
    this.setTheme('light');
    this.setWallpaper('https://i.pinimg.com/originals/17/88/92/17889228fae817f8e6291d471f80c3ad.jpg');
    this.setAccentColor('#0078d4');
    // Сброс цветов текста и границ к значениям по умолчанию
    document.documentElement.style.removeProperty('--text-primary');
    document.documentElement.style.removeProperty('--border-primary');
    const data = this.storage.load();
    if (data.settings) {
      delete data.settings.textColor;
      delete data.settings.borderColor;
      this.storage.save(data);
    }
  }
}

