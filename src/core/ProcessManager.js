/**
 * ProcessManager - Управление процессами (приложениями) в Windows 11 Web OS
 * Отслеживание запущенных приложений и их ресурсов
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Управление жизненным циклом всех процессов системы
 * @integration_contract: ProcessManager ↔ WindowManager для связи процессов с окнами, ProcessManager → EventBus для событий
 * @consistency_model: Strong consistency - все процессы отслеживаются синхронно через Map
 * @failure_policy: Ошибки при cleanup логируются, не прерывают завершение процесса
 * @performance_contract: Операции O(1) для поиска по PID, O(n) для поиска по имени
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Отслеживание процессов с PID, статистикой ресурсов, связью с окнами
 * @interface_contract: startProcess(), killProcess(), getProcess(), getAllProcesses(), getProcessesByName(), isAppRunning()
 * @implementation_strategy: Map для хранения процессов, инкрементальный PID, связь с WindowManager опциональна
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: EventBus инициализирован
 * @ensures: startProcess() - возвращает уникальный PID, процесс добавляется в Map со статусом 'running'
 * @ensures: killProcess() - вызывает destroy() на компоненте если есть, закрывает окно через WindowManager, генерирует событие 'process:killed'
 * @invariant: PID всегда уникален и инкрементальный (nextPID), процессы в Map хранятся актуально
 * @modifies: Map процессов, вызывает destroy() на компонентах, вызывает WindowManager.closeWindowByPid()
 * @throws: Ошибки при cleanup логируются в console, не выбрасываются
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: EventBus критичен для уведомлений о событиях процессов
 * @why_ensures: Уникальный PID гарантирует что процессы можно однозначно идентифицировать
 * @why_ensures: cleanup через destroy() и закрытие окна критичны для освобождения ресурсов
 * @why_invariant: Инкрементальный PID гарантирует уникальность без коллизий
 * @business_impact: Нарушение ведет к утечкам памяти, неосвобожденным окнам
 * @stakeholder_value: Пользователь может управлять процессами, ресурсы освобождаются корректно
 */

export class ProcessManager {
  constructor(eventBus) {
    this.processes = new Map();
    this.nextPID = 1;
    this.eventBus = eventBus;
    this.startTime = Date.now(); // Время создания ProcessManager (время работы системы)
    this.windowManager = null; // Will be set by WindowManager
  }
  
  /**
   * Set WindowManager reference for closing windows when killing processes
   * @param {WindowManager} windowManager - WindowManager instance
   */
  setWindowManager(windowManager) {
    this.windowManager = windowManager;
  }

  /**
   * Запуск нового процесса
   * @param {string} appName - Имя приложения
   * @param {Object} appComponent - Компонент приложения
   * @param {Object} windowConfig - Конфигурация окна
   * @returns {number} PID процесса
   */
  startProcess(appName, appComponent, windowConfig = {}) {
    const pid = this.nextPID++;
    const process = {
      pid,
      name: appName,
      component: appComponent,
      windowConfig,
      windowId: null,
      startTime: Date.now(),
      status: 'running',
      memoryUsage: Math.floor(Math.random() * 50) + 20, // Симуляция 20-70 MB
      cpuUsage: Math.floor(Math.random() * 30) + 5 // Симуляция 5-35%
    };
    
    this.processes.set(pid, process);
    return pid;
  }

  /**
   * Завершение процесса
   * @param {number} pid - PID процесса
   * @returns {boolean} Успешность операции
   */
  killProcess(pid, skipWindowClose = false) {
    if (this.processes.has(pid)) {
      const process = this.processes.get(pid);
      process.status = 'terminated';
      
      // Call destroy() on the app component if it exists (cleanup app resources)
      if (process.component && typeof process.component.destroy === 'function') {
        try {
          process.component.destroy();
          console.log(`✅ App component destroyed for PID ${pid}`);
        } catch (error) {
          console.error(`Error destroying app component for PID ${pid}:`, error);
        }
      }
      
      // Close the window if it exists (via WindowManager)
      // But skip if called from WindowManager.closeWindow() to avoid recursion
      if (!skipWindowClose && process.windowId && this.windowManager) {
        try {
          // Use WindowManager's closeWindowByPid method which handles all cleanup
          this.windowManager.closeWindowByPid(pid);
          console.log(`✅ Window closed for PID ${pid}`);
        } catch (error) {
          console.error(`Error closing window for PID ${pid}:`, error);
        }
      }
      
      // Emit event
      this.eventBus.emit('process:killed', { pid: process.pid, windowId: process.windowId });

      this.processes.delete(pid);
      return true;
    }
    return false;
  }

  /**
   * Получение процесса по PID
   * @param {number} pid - PID процесса
   * @returns {Object|undefined} Процесс
   */
  getProcess(pid) {
    return this.processes.get(pid);
  }

  /**
   * Получение всех процессов
   * @returns {Array} Массив процессов
   */
  getAllProcesses() {
    return Array.from(this.processes.values());
  }

  /**
   * Получение процессов по имени приложения
   * @param {string} appName - Имя приложения
   * @returns {Array} Массив процессов
   */
  getProcessesByName(appName) {
    return this.getAllProcesses().filter(p => p.name === appName);
  }

  /**
   * Проверка, запущено ли приложение
   * @param {string} appName - Имя приложения
   * @returns {boolean}
   */
  isAppRunning(appName) {
    return this.getProcessesByName(appName).length > 0;
  }

  /**
   * Обновление статистики процесса
   * @param {number} pid - PID процесса
   */
  updateProcessStats(pid) {
    if (this.processes.has(pid)) {
      const process = this.processes.get(pid);
      
      // Симуляция изменения использования ресурсов
      const cpuChange = (Math.random() - 0.5) * 10;
      process.cpuUsage = Math.max(1, Math.min(100, process.cpuUsage + cpuChange));
      
      const memChange = (Math.random() - 0.5) * 5;
      process.memoryUsage = Math.max(10, Math.min(500, process.memoryUsage + memChange));
      
      process.cpuUsage = Math.floor(process.cpuUsage);
      process.memoryUsage = Math.floor(process.memoryUsage);
    }
  }

  /**
   * Обновление статистики всех процессов
   */
  updateAllProcessStats() {
    this.processes.forEach((process, pid) => {
      this.updateProcessStats(pid);
    });
  }

  /**
   * Установка ID окна для процесса
   * @param {number} pid - PID процесса
   * @param {string} windowId - ID окна
   */
  setWindowId(pid, windowId) {
    if (this.processes.has(pid)) {
      this.processes.get(pid).windowId = windowId;
    }
  }

  /**
   * Получение процесса по ID окна
   * @param {string} windowId - ID окна
   * @returns {Object|undefined} Процесс
   */
  getProcessByWindowId(windowId) {
    return this.getAllProcesses().find(p => p.windowId === windowId);
  }

  /**
   * Получение времени работы процесса
   * @param {number} pid - PID процесса
   * @returns {string} Время работы в формате "HH:MM:SS"
   */
  getProcessUptime(pid) {
    const process = this.getProcess(pid);
    if (!process) return '00:00:00';
    
    const uptime = Date.now() - process.startTime;
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  /**
   * Получение времени работы системы (uptime)
   * @returns {number} Время работы в секундах
   */
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    return Math.floor(uptimeMs / 1000);
  }

  /**
   * Получение общей статистики
   * @returns {Object} Статистика
   */
  getSystemStats() {
    const processes = this.getAllProcesses();
    const totalCPU = processes.reduce((sum, p) => sum + p.cpuUsage, 0);
    const totalMemory = processes.reduce((sum, p) => sum + p.memoryUsage, 0);
    
    return {
      processCount: processes.length,
      totalCPU: Math.min(100, Math.floor(totalCPU)),
      totalMemory: Math.floor(totalMemory),
      avgCPU: processes.length > 0 ? Math.floor(totalCPU / processes.length) : 0,
      avgMemory: processes.length > 0 ? Math.floor(totalMemory / processes.length) : 0
    };
  }

  /**
   * Очистка всех процессов
   */
  clear() {
    this.processes.clear();
    this.nextPID = 1;
  }
}

