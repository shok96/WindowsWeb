/**
 * EventBus - Глобальная система событий для Windows 11 Web OS
 * Реализация паттерна Pub/Sub для коммуникации между компонентами
 */

export class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * Подписка на событие
   * @param {string} event - Имя события
   * @param {Function} callback - Функция обратного вызова
   * @returns {Function} Функция для отписки
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Возврат функции для отписки
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Отписка от события
   * @param {string} event - Имя события
   * @param {Function} callback - Функция обратного вызова
   */
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Генерация события
   * @param {string} event - Имя события
   * @param {*} data - Данные события
   */
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
        // Отправляем событие об ошибке для показа popup
        if (window.app && window.app.eventBus && event !== 'system:error') {
          window.app.eventBus.emit('system:error', {
            title: 'Ошибка обработчика',
            message: `Ошибка в обработчике события "${event}": ${error.message}`
          });
        }
      }
    });
  }

  /**
   * Одноразовая подписка на событие
   * @param {string} event - Имя события
   * @param {Function} callback - Функция обратного вызова
   */
  once(event, callback) {
    const onceWrapper = (data) => {
      callback(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Удаление всех подписчиков события
   * @param {string} event - Имя события
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Получение количества подписчиков события
   * @param {string} event - Имя события
   * @returns {number} Количество подписчиков
   */
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }

  /**
   * Получение списка всех событий
   * @returns {Array} Массив имен событий
   */
  eventNames() {
    return Object.keys(this.events);
  }
}



