/**
 * WindowManager - Управление окнами в Windows 11 Web OS
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Управление всеми окнами приложений в системе
 * @integration_contract: WindowManager ↔ ProcessManager для связи окон с процессами, WindowManager → EventBus для событий
 * @consistency_model: Strong consistency - все операции с окнами синхронны, состояние актуально
 * @failure_policy: Ошибки при создании/закрытии окон логируются, не прерывают выполнение
 * @performance_contract: Создание окна < 100ms, операции фокуса O(1)
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Создание, управление (focus, minimize, maximize, restore), закрытие окон
 * @interface_contract: createWindow(), closeWindow(), focusWindow(), minimizeWindow(), maximizeWindow(), restoreWindow()
 * @implementation_strategy: Map для хранения окон, инкрементальный zIndex для порядка отображения, связь с ProcessManager
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: ProcessManager инициализирован, EventBus доступен, container DOM элемент существует, interact.js загружен
 * @ensures: createWindow() - окно создается с уникальным windowId, связывается с процессом через PID, генерирует событие 'window:created'
 * @ensures: closeWindow() - окно удаляется из DOM и Map, процесс завершается через ProcessManager, фокус переключается, генерирует событие 'window:closed'
 * @ensures: focusWindow() - окно получает максимальный zIndex, все остальные теряют фокус, генерирует событие 'window:focused'
 * @invariant: Каждое окно связано с процессом через PID (через ProcessManager.setWindowId), windowId уникален
 * @invariant: zIndex всегда инкрементальный, активное окно имеет максимальный zIndex
 * @modifies: DOM через container.appendChild/removeChild, Map windows, ProcessManager, генерирует события через EventBus
 * @throws: Ошибки при создании/закрытии окон логируются, не выбрасываются
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: ProcessManager критичен для связи окон с процессами, EventBus для уведомлений
 * @why_ensures: События window:* позволяют другим компонентам (Taskbar, TaskSwitcher) реагировать на изменения окон
 * @why_ensures: Связь с процессом гарантирует что закрытие окна = завершение процесса
 * @why_invariant: Уникальность windowId и связь с PID предотвращают утечки окон и процессов
 * @why_invariant: Инкрементальный zIndex гарантирует правильный порядок отображения окон
 * @business_impact: Нарушение ведет к неработающим окнам, утечкам памяти, некорректному управлению процессами
 * @stakeholder_value: Пользователь может работать с окнами, порядок отображения корректен, процессы завершаются при закрытии
 */

import { Window } from './Window.js';
import { getSoundManager } from '../../core/SoundManager.js';

export class WindowManager {
  constructor(container, processManager, eventBus) {
    this.container = container;
    this.processManager = processManager;
    this.eventBus = eventBus;
    this.windows = new Map();
    this.nextZIndex = 100;
    this.activeWindow = null;
    this.soundManager = getSoundManager();
    
    // Set WindowManager reference in ProcessManager so it can close windows
    if (processManager && typeof processManager.setWindowManager === 'function') {
      processManager.setWindowManager(this);
    }
    
    this.setupEventListeners();
  }

  /**
   * Создание нового окна
   * @param {number} pid - PID процесса
   * @param {string} title - Заголовок окна
   * @param {HTMLElement|string} content - Содержимое окна
   * @param {Object} options - Опции окна
   * @returns {string} ID окна
   * 
   * @requires: pid валиден, ProcessManager имеет процесс с этим PID, container DOM элемент доступен
   * @ensures: Окно создается с уникальным windowId (`window-${pid}`), добавляется в DOM, связывается с процессом
   * @ensures: Окно получает фокус, генерируется событие 'window:created', воспроизводится звук открытия
   * @modifies: DOM (container.appendChild), Map windows, ProcessManager (setWindowId), генерирует события
   * @why_ensures: Связь с процессом критична для корректного cleanup при закрытии окна
   * @business_impact: Ошибка создания окна = приложение не может отобразиться
   */
  createWindow(pid, title, content, options = {}) {
    const windowId = `window-${pid}`;
    const cascadeOffset = (this.windows.size % 10) * 30;
    
    const windowOptions = {
      ...options,
      zIndex: this.nextZIndex++,
      onClose: () => this.closeWindow(windowId, pid),
      onFocus: () => this.focusWindow(windowId),
      onMinimize: () => this.minimizeWindow(windowId),
      onMaximize: () => this.maximizeWindow(windowId),
      onRestore: () => this.restoreWindow(windowId),
      cascadeOffset: cascadeOffset
    };
    
    const window = new Window(windowId, title, content, windowOptions, this.eventBus);
    
    this.container.appendChild(window.element);
    
    // Make window visible after it's in the DOM and positioned
    requestAnimationFrame(() => {
      window.element.style.opacity = '1';
      window.element.classList.add('visible'); // Add visible class for transitions
    });

    this.windows.set(windowId, window);
    this.focusWindow(windowId);
    
    // Связать окно с процессом
    this.processManager.setWindowId(pid, windowId);
    
    // Воспроизводим звук открытия окна
    this.soundManager.playWindowOpen();
    
    // Уведомление о создании окна
    this.eventBus.emit('window:created', { windowId, pid, title });
    
    return windowId;
  }

  /**
   * Закрытие окна
   * @param {string} windowId - ID окна
   * @param {number} pid - PID процесса
   * 
   * @requires: windowId существует в windows Map
   * @ensures: Окно удаляется из DOM и Map, процесс завершается через ProcessManager.killProcess()
   * @ensures: Фокус переключается на другое окно (если есть), генерируется событие 'window:closed', воспроизводится звук
   * @modifies: DOM (удаление окна), Map windows, ProcessManager (killProcess), activeWindow
   * @why_ensures: Завершение процесса гарантирует cleanup ресурсов приложения
   * @business_impact: Ошибка закрытия = утечка памяти и неосвобожденные процессы
   */
  closeWindow(windowId, pid) {
    const window = this.windows.get(windowId);
    if (window) {
      // Get process info before destroying
      const process = pid ? this.processManager.getProcess(pid) : null;
      
      // Destroy window UI first
      window.destroy();
      this.windows.delete(windowId);
      
      // Kill the process (skip window close since we already did it)
      // This will call component.destroy() for cleanup
      if (pid && this.processManager.processes.has(pid)) {
        this.processManager.killProcess(pid, true); // true = skip window close
      }
      
      // Установить фокус на следующее окно
      if (this.activeWindow === windowId) {
        const windows = Array.from(this.windows.values());
        if (windows.length > 0) {
          const lastWindow = windows[windows.length - 1];
          this.focusWindow(lastWindow.id);
        } else {
          this.activeWindow = null;
        }
      }
      
      // Воспроизводим звук закрытия окна
      this.soundManager.playWindowClose();
      
      // Уведомление о закрытии окна
      this.eventBus.emit('window:closed', { windowId, pid });
    }
  }

  /**
   * Закрытие окна по PID процесса (вызывается извне)
   * @param {number} pid - PID процесса
   */
  closeWindowByPid(pid) {
    const process = this.processManager.getProcess(pid);
    if (process && process.windowId) {
      this.closeWindow(process.windowId, pid);
    }
  }

  /**
   * Фокусировка окна
   * @param {string} windowId - ID окна
   */
  focusWindow(windowId) {
    // Воспроизводим звук фокуса только если это не первое открытие (когда activeWindow еще null)
    if (this.activeWindow && this.activeWindow !== windowId) {
      this.soundManager.playWindowFocus();
    }
    // Снять фокус со всех окон
    this.windows.forEach(window => {
      window.blur();
    });
    
    const window = this.windows.get(windowId);
    if (window) {
      window.focus();
      window.setZIndex(this.nextZIndex++);
      this.activeWindow = windowId;
      
      // Уведомление о фокусировке окна
      this.eventBus.emit('window:focused', { windowId });
    }
  }

  /**
   * Минимизация окна
   * @param {string} windowId - ID окна
   */
  minimizeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.minimize();
      
      // Установить фокус на следующее окно
      if (this.activeWindow === windowId) {
        const visibleWindows = Array.from(this.windows.values())
          .filter(w => !w.isMinimized && w.id !== windowId);
        
        if (visibleWindows.length > 0) {
          const lastWindow = visibleWindows[visibleWindows.length - 1];
          this.focusWindow(lastWindow.id);
        } else {
          this.activeWindow = null;
        }
      }
      
      // Уведомление о минимизации окна
      this.eventBus.emit('window:minimized', { windowId });
    }
  }

  /**
   * Максимизация окна
   * @param {string} windowId - ID окна
   */
  maximizeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.toggleMaximize();
      
      // Уведомление о максимизации окна
      this.eventBus.emit('window:maximized', { windowId, isMaximized: window.isMaximized });
    }
  }

  /**
   * Восстановление окна
   * @param {string} windowId - ID окна
   */
  restoreWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.restore();
      this.focusWindow(windowId);
      
      // Уведомление о восстановлении окна
      this.eventBus.emit('window:restored', { windowId });
    }
  }

  /**
   * Получение всех окон
   * @returns {Array} Массив окон
   */
  getAllWindows() {
    return Array.from(this.windows.values());
  }

  /**
   * Получение окна по ID
   * @param {string} windowId - ID окна
   * @returns {Window|undefined} Окно
   */
  getWindow(windowId) {
    return this.windows.get(windowId);
  }

  /**
   * Получение активного окна
   * @returns {Window|null} Активное окно
   */
  getActiveWindow() {
    return this.activeWindow ? this.windows.get(this.activeWindow) : null;
  }

  /**
   * Закрытие всех окон
   */
  closeAllWindows() {
    const windowIds = Array.from(this.windows.keys());
    windowIds.forEach(windowId => {
      const process = this.processManager.getProcessByWindowId(windowId);
      if (process) {
        this.closeWindow(windowId, process.pid);
      }
    });
  }

  /**
   * Минимизация всех окон
   */
  minimizeAllWindows() {
    this.windows.forEach((window, windowId) => {
      if (!window.isMinimized) {
        this.minimizeWindow(windowId);
      }
    });
  }
  
  /**
   * Setup event listeners for the Window Manager
   */
  setupEventListeners() {
    this.eventBus.on('process:killed', ({ pid }) => {
      this.closeWindowByPid(pid);
    });
  }
}

