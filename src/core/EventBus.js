/**
 * EventBus - Глобальная система событий для Windows 11 Web OS
 * Реализация паттерна Pub/Sub для коммуникации между компонентами
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Централизованная система событий для слабой связанности компонентов
 * @integration_contract: Единая точка коммуникации между всеми модулями системы
 * @consistency_model: Eventual consistency - события доставляются асинхронно
 * @failure_policy: Ошибки в обработчиках логируются, не прерывают другие обработчики
 * @performance_contract: O(n) где n - количество подписчиков на событие, события обрабатываются синхронно
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Pub/Sub паттерн с поддержкой множественных подписчиков на событие
 * @interface_contract: on(event, callback), off(event, callback), emit(event, data), once(event, callback)
 * @implementation_strategy: Объект events с массивами callback функций, on() возвращает функцию отписки
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: Нет внешних зависимостей, event - строка, callback - функция
 * @ensures: on() - добавляет подписчика, возвращает функцию отписки
 * @ensures: emit() - вызывает все подписчики с данными, ошибки не прерывают другие обработчики
 * @invariant: Каждое событие имеет массив подписчиков (может быть пустым)
 * @modifies: Внутренний объект events, глобальное состояние коммуникации компонентов
 * @throws: Ошибки в callback логируются в console.error, не выбрасываются дальше
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: Слабая связанность через события улучшает поддерживаемость кода
 * @why_ensures: Изоляция ошибок гарантирует что один сбойный компонент не ломает всю систему
 * @why_invariant: Структура событий гарантирует предсказуемую коммуникацию
 * @business_impact: Нарушение ведет к потере коммуникации между компонентами
 * @stakeholder_value: Разработчики могут добавлять компоненты без изменения существующих
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
   * 
   * @requires: event - непустая строка
   * @ensures: Все подписчики на событие вызываются с data, ошибки изолированы
   * @invariant: Если события нет в events, метод завершается без ошибок
   * @modifies: Вызывает callback функции, может логировать ошибки
   * @throws: Ошибки в callback перехватываются, логируются, но не прерывают выполнение других обработчиков
   * @why_ensures: Изоляция ошибок критична для стабильности системы
   * @business_impact: Один сбойный обработчик не должен ломать всю систему
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



