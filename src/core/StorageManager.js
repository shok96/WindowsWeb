/**
 * StorageManager - Управление localStorage для Windows 11 Web OS
 * Обеспечивает сохранение и загрузку данных системы
 */

export class StorageManager {
  constructor() {
    this.storageKey = 'andlanceros';
    this.init();
  }

  /**
   * Инициализация хранилища
   */
  init() {
    if (!localStorage.getItem(this.storageKey)) {
      this.createDefaultStorage();
    }
  }

  /**
   * Создание хранилища по умолчанию
   */
  createDefaultStorage() {
    const defaultData = {
      fileSystem: {},
      settings: {
        theme: 'light',
        wallpaper: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1920&h=1080&fit=crop',
        accentColor: '#0078d4'
      },
      apps: {},
      theme: 'light',
      version: '1.0.0',
      lastModified: Date.now()
    };
    this.save(defaultData);
  }

  /**
   * Сохранение данных в localStorage
   * @param {Object} data - Данные для сохранения
   */
  save(data) {
    try {
      data.lastModified = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        alert('Хранилище переполнено. Пожалуйста, экспортируйте данные и очистите хранилище.');
      }
      return false;
    }
  }

  /**
   * Загрузка данных из localStorage
   * @returns {Object} Загруженные данные
   */
  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : this.createDefaultStorage();
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return this.createDefaultStorage();
    }
  }

  /**
   * Обновление конкретного ключа в хранилище
   * @param {string} key - Ключ для обновления
   * @param {*} value - Новое значение
   */
  update(key, value) {
    const data = this.load();
    data[key] = value;
    return this.save(data);
  }

  /**
   * Получение значения по ключу
   * @param {string} key - Ключ
   * @returns {*} Значение
   */
  get(key) {
    const data = this.load();
    return data[key];
  }

  /**
   * Экспорт данных для резервного копирования
   * @returns {string} URL для скачивания
   */
  export() {
    const data = this.load();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    return URL.createObjectURL(blob);
  }

  /**
   * Импорт данных из резервной копии
   * @param {File} file - Файл для импорта
   * @returns {Promise} Promise с результатом импорта
   */
  import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (this.save(data)) {
            resolve(data);
          } else {
            reject(new Error('Failed to save imported data'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Очистка всех данных
   */
  clear() {
    localStorage.removeItem(this.storageKey);
    this.createDefaultStorage();
  }

  /**
   * Получение размера использованного хранилища
   * @returns {Object} Информация о размере
   */
  getStorageSize() {
    const data = localStorage.getItem(this.storageKey);
    const bytes = data ? new Blob([data]).size : 0;
    const kb = (bytes / 1024).toFixed(2);
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    
    return {
      bytes,
      kb,
      mb,
      formatted: mb > 1 ? `${mb} MB` : `${kb} KB`
    };
  }
}

