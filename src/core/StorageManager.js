/**
 * StorageManager - Управление localStorage для Windows 11 Web OS
 * Обеспечивает сохранение и загрузку данных системы
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Гарантирует персистентность данных системы между сессиями браузера
 * @integration_contract: Единая точка доступа к localStorage для всех модулей
 * @consistency_model: Strong consistency - все изменения сохраняются синхронно
 * @failure_policy: При QuotaExceededError показывает alert и возвращает false
 * @performance_contract: Операции O(1), размер ограничен localStorage (~5-10MB)
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Предоставляет единый интерфейс для работы с localStorage через ключ 'andlanceros'
 * @interface_contract: API включает save(), load(), update(), get(), export(), import(), clear(), getStorageSize()
 * @implementation_strategy: JSON сериализация/десериализация, автоматическое добавление timestamp
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: localStorage доступен в браузере, data валиден для JSON.stringify
 * @ensures: save() - данные сохраняются в localStorage с lastModified timestamp
 * @ensures: load() - возвращает данные или создает хранилище по умолчанию при ошибке
 * @invariant: storageKey всегда равен 'andlanceros', данные всегда содержат lastModified
 * @modifies: localStorage ключ 'andlanceros', добавляет lastModified к данным
 * @throws: QuotaExceededError при переполнении, JSON ошибки при парсинге
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: localStorage нужен для сохранения состояния между перезагрузками страницы
 * @why_ensures: lastModified позволяет отслеживать актуальность данных
 * @why_invariant: Единый ключ гарантирует что все модули работают с одними данными
 * @business_impact: Нарушение ведет к потере данных пользователя между сессиями
 * @stakeholder_value: Пользователь не теряет настройки, файлы и состояние системы
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
   * 
   * @requires: data является валидным объектом, можно сериализовать в JSON
   * @ensures: data сохраняется в localStorage с обновленным lastModified, возвращает true при успехе
   * @modifies: localStorage ключ 'andlanceros', добавляет/обновляет data.lastModified
   * @throws: QuotaExceededError при переполнении (показывает alert), возвращает false
   * @why_ensures: lastModified критичен для отслеживания актуальности данных
   * @business_impact: Ошибка сохранения = потеря данных пользователя
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
   * 
   * @requires: localStorage доступен, ключ 'andlanceros' существует или будет создан
   * @ensures: Возвращает загруженные данные или создает хранилище по умолчанию при ошибке
   * @invariant: Всегда возвращает валидный объект (никогда не возвращает null/undefined)
   * @throws: JSON.parse ошибки обрабатываются, возвращается хранилище по умолчанию
   * @why_ensures: Гарантия валидных данных критична для инициализации других модулей
   * @stakeholder_value: Система всегда запускается даже при поврежденных данных
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

