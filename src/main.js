/**
 * Main.js - Точка входа Windows 11 Web OS
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Инициализирует и координирует всю систему AndlancerOS
 * @integration_contract: Оркестрирует все модули: core ↔ apps ↔ components
 * @consistency_model: Strong consistency - инициализация последовательна, состояние синхронно
 * @failure_policy: Ошибки перехватываются через setupErrorHandling(), показываются через Notification
 * @performance_contract: Инициализация должна завершаться < 2 секунд, hot path (openApp) < 100ms
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Главный оркестратор компонентов, управление жизненным циклом системы
 * @interface_contract: init(), openApp(appId, params), lifecycle методы (showPowerOnScreen, showDesktop, etc.)
 * @implementation_strategy: Dependency injection через конструкторы, EventBus для коммуникации
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: DOM готов, все импорты загружены, HTML содержит необходимые контейнеры
 * @ensures: init() - все core модули инициализированы в правильном порядке, UI компоненты созданы
 * @ensures: openApp() - приложение запускается через ProcessManager и WindowManager, окно создается
 * @invariant: Порядок инициализации: StorageManager → EventBus → LanguageManager → FileSystem → ProcessManager → ThemeManager
 * @invariant: UI компоненты создаются только после инициализации core модулей
 * @modifies: Глобальное состояние через window.app, DOM структура через контейнеры
 * @throws: Ошибки инициализации обрабатываются через Notification, системные ошибки показывают BSOD
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: Правильный порядок инициализации критичен для зависимостей между модулями
 * @why_ensures: Последовательная инициализация гарантирует что компоненты получают валидные зависимости
 * @why_invariant: Порядок инициализации core модулей определяет доступность зависимостей для UI
 * @business_impact: Нарушение порядка ведет к ошибкам инициализации и неработающей системе
 * @stakeholder_value: Пользователь видит рабочую систему после загрузки
 */

// Import main SCSS file
import './styles/main.scss';

// Core modules
import { StorageManager } from './core/StorageManager.js';
import { FileSystem } from './core/FileSystem.js';
import { FileAssociation } from './core/FileAssociation.js';
import { ProcessManager } from './core/ProcessManager.js';
import { EventBus } from './core/EventBus.js';
import { ThemeManager } from './core/ThemeManager.js';
import { LanguageManager } from './core/LanguageManager.js';

// Components
import { PowerOnScreen } from './components/PowerOnScreen/PowerOnScreen.js';
import { OSSelectionScreen } from './components/OSSelectionScreen/OSSelectionScreen.js';
import { BootScreen } from './components/BootScreen/BootScreen.js';
import { BIOS } from './components/BIOS/BIOS.js';
import { SystemLoadingScreen } from './components/SystemLoadingScreen/SystemLoadingScreen.js';
import { LoginScreen } from './components/LoginScreen/LoginScreen.js';
import { Desktop } from './components/Desktop/Desktop.js';
import { Taskbar } from './components/Taskbar/Taskbar.js';
import { StartMenu } from './components/StartMenu/StartMenu.js';
import { WindowManager } from './components/Window/WindowManager.js';
import { ShutdownScreen } from './components/ShutdownScreen/ShutdownScreen.js';
import { showDialog } from './components/Dialog/Dialog.js';
import { TaskSwitcher } from './components/TaskSwitcher/TaskSwitcher.js';
import { initNotificationManager, showError, showWarning } from './components/Notification/Notification.js';

// Apps
import { FileExplorer } from './apps/FileExplorer/FileExplorer.js';
import { Notepad } from './apps/Notepad/Notepad.js';
import { Calculator } from './apps/Calculator/Calculator.js';
import { Calendar } from './apps/Calendar/Calendar.js';
import { Browser } from './apps/Browser/Browser.js';
import { Minesweeper } from './apps/Minesweeper/Minesweeper.js';
import { Snake } from './apps/Snake/Snake.js';
import { Terminal } from './apps/Terminal/Terminal.js';
import { TaskManagerApp } from './apps/TaskManager/TaskManager.js';
import { Settings } from './apps/Settings/Settings.js';
import { Paint } from './apps/Paint/Paint.js';
import { CodeEditor } from './apps/CodeEditor/CodeEditor.js';
import { VisualIDE } from './apps/VisualIDE/VisualIDE.js';
import { Doom } from './apps/Doom/Doom.js';
import { AudioPlayer } from './apps/AudioPlayer/AudioPlayer.js';
import { Tetris } from './apps/Tetris/Tetris.js';
import { BSOD } from './apps/BSOD/BSOD.js';
import { Camera } from './apps/Camera/Camera.js';

// Data
import { getAppConfig } from './data/defaultApps.js';

// HakerOs
import { HakerOs } from './hakeros/HakerOs.js';

// Styles
import './components/PowerOnScreen/PowerOnScreen.css';
import './components/OSSelectionScreen/OSSelectionScreen.css';
import './components/BootScreen/BootScreen.css';
import './components/BIOS/BIOS.css';
import './components/SystemLoadingScreen/SystemLoadingScreen.css';
import './components/LoginScreen/LoginScreen.css';
import './components/Desktop/Desktop.css';
import './components/Taskbar/Taskbar.css';
import './components/StartMenu/StartMenu.css';
import './components/ContextMenu/ContextMenu.css';
import './components/Window/Window.css';
import './components/ShutdownScreen/ShutdownScreen.css';
import './components/Dialog/Dialog.css';
import './components/Widgets/AnalogClock/AnalogClock.css';
import './components/TaskSwitcher/TaskSwitcher.css';
import './components/Notification/Notification.css';
import './apps/Doom/Doom.css';
import './apps/AudioPlayer/AudioPlayer.css';
import './apps/BSOD/BSOD.css';
import './hakeros/HakerOs.css';

/**
 * @orchestrates: StorageManager, FileSystem, ProcessManager, EventBus, ThemeManager, LanguageManager, Desktop, Taskbar, StartMenu, WindowManager
 * @depends_on: Все core модули, apps модули, components модули, data модули
 */
class AndlancerOS_Class {
  /**
   * Конструктор главного класса системы
   * @requires: DOMContentLoaded событие еще не произошло (вызывается из addEventListener)
   * @ensures: isCrashed = false, вызывается init() для инициализации
   */
  constructor() {
    this.isCrashed = false;
    this.init();
  }

  /**
   * Инициализация системы
   * @requires: Все импорты загружены, DOM контейнеры существуют в HTML
   * @ensures: Все core модули инициализированы, язык загружен, контейнеры получены, приложения зарегистрированы
   * @ensures: Система уведомлений инициализирована, обработка ошибок настроена, показывается начальный экран
   * @invariant: Порядок инициализации core модулей не нарушается (StorageManager первый, EventBus второй)
   * @modifies: this.storageManager, this.eventBus, this.fileSystem, etc., глобальное состояние
   * @why_ensures: Правильная последовательность критична для работы зависимостей
   * @business_impact: Ошибка инициализации = система не запускается
   */
  async init() {
    // Инициализация core модулей
    this.storageManager = new StorageManager();
    this.eventBus = new EventBus();
    this.languageManager = new LanguageManager(this.storageManager, this.eventBus);
    this.fileSystem = new FileSystem(this.storageManager, this.eventBus);
    this.fileAssociation = new FileAssociation(this.eventBus);
    this.processManager = new ProcessManager(this.eventBus); // Pass eventBus
    this.themeManager = new ThemeManager(this.storageManager, this.eventBus);
    
    // Загрузка языка
    await this.languageManager.load();
    
    // Контейнеры
    this.containers = {
      powerOn: document.getElementById('power-on-container'),
      osSelection: document.getElementById('os-selection-container'),
      bootscreen: document.getElementById('bootscreen-container'),
      systemloading: document.getElementById('system-loading-container'),
      login: document.getElementById('login-container'),
      desktop: document.getElementById('desktop-container'),
      taskbar: document.getElementById('taskbar-container'),
      startmenu: document.getElementById('startmenu-container'),
      windows: document.getElementById('windows-container'),
      shutdown: document.getElementById('shutdown-container')
    };
    
    // Регистрация приложений
    this.apps = {
      FileExplorer,
      Notepad,
      Calculator,
      Calendar,
      Browser,
      Minesweeper,
      Snake,
      Terminal,
      TaskManager: TaskManagerApp,
      Settings,
      Paint,
      CodeEditor,
      VisualIDE,
      Doom,
      AudioPlayer,
      Tetris,
      BSOD,
      Camera
    };
    
    // Инициализация системы уведомлений
    this.notificationManager = initNotificationManager(this.languageManager);
    
    // Настройка перехвата ошибок из консоли и глобальных ошибок
    this.setupErrorHandling();
    
    // Показать экран входа
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fastboot')) {
        this.showLoginScreen();
    } else if (urlParams.get('restart')) {
        this.showBootScreen();
    } else {
        this.showPowerOnScreen();
    }
    
    // Подписка на события
    this.setupEventListeners();
  }

  showPowerOnScreen() {
    this.powerOnScreen = new PowerOnScreen(this.containers.powerOn, () => {
      this.containers.powerOn.style.display = 'none';
      this.showBootScreen();
    });
  }

  showOSSelectionScreen() {
    this.osSelectionScreen = new OSSelectionScreen(this.containers.osSelection, (os) => {
      this.containers.osSelection.style.display = 'none';
      if (os === 'AndlancerOS') {
        this.showSystemLoadingScreen();
      } else if (os === 'HakerOs') {
        document.body.classList.add('hakeros');
        document.getElementById('app').innerHTML = ''; // Clear the app container
        this.hakerOs = new HakerOs(document.body, this); // Pass this instance
      }
    });
    this.containers.osSelection.style.display = 'block';
  }

  showBootScreen() {
    this.bootScreen = new BootScreen(
      this.containers.bootscreen,
      () => {
        this.containers.bootscreen.style.display = 'none';
        this.showOSSelectionScreen();
      },
      () => {
        this.showBIOS();
      }
    );
  }

  showBIOS() {
    this.bios = new BIOS(this.containers.bootscreen, () => {
      // При выходе из BIOS продолжаем загрузку
      this.containers.bootscreen.style.display = 'none';
      this.showOSSelectionScreen();
    }, this.languageManager);
    this.containers.bootscreen.style.display = 'block';
  }

  showSystemLoadingScreen() {
    this.systemLoadingScreen = new SystemLoadingScreen(this.containers.systemloading, () => {
        this.containers.systemloading.style.display = 'none';
        this.showLoginScreen();
    }, this.languageManager);
  }

  showLoginScreen() {
    // Ensure desktop is hidden
    this.containers.desktop.style.display = 'none';
    this.containers.taskbar.style.display = 'none';
    this.containers.startmenu.style.display = 'none';
    this.containers.windows.style.display = 'none';

    this.loginScreen = new LoginScreen(this.containers.login, this.eventBus, this.languageManager);
    this.containers.login.style.display = 'block';
  }

  showDesktop() {
    // Скрыть экран входа
    this.containers.login.style.display = 'none';
    
    // Показать рабочий стол с анимацией
    this.containers.desktop.style.display = 'block';
    this.containers.taskbar.style.display = 'block';
    this.containers.startmenu.style.display = 'block'; // Restore start menu container visibility
    this.containers.windows.style.display = 'block';
    
    requestAnimationFrame(() => {
      this.containers.desktop.classList.add('fade-in');
      this.containers.taskbar.classList.add('slide-up');
    });

    // Инициализация компонентов
    this.desktop = new Desktop(
      this.containers.desktop,
      this.fileSystem,
      this.themeManager,
      this.eventBus,
      this.fileAssociation,
      this.processManager,
      this.languageManager
    );
    
    this.taskbar = new Taskbar(
      this.containers.taskbar,
      this.processManager,
      this.eventBus,
      this.languageManager,
      this.notificationManager
    );
    
    this.startMenu = new StartMenu(
      this.containers.startmenu,
      this.eventBus,
      this.languageManager
    );
    
    this.windowManager = new WindowManager(
      this.containers.windows,
      this.processManager,
      this.eventBus
    );

    this.taskSwitcher = new TaskSwitcher(
        this.containers.windows,
        this.windowManager,
        this.eventBus,
        this.languageManager
    );
  }

  /**
   * Открытие приложения
   * @param {string} appId - ID приложения (например, 'FileExplorer', 'Notepad')
   * @param {Object} params - Параметры для приложения (например, {filePath: 'Desktop/note.txt'})
   * @requires: appId существует в this.apps, ProcessManager и WindowManager инициализированы
   * @ensures: Приложение создается, процесс запускается, окно создается и отображается
   * @ensures: Если приложение уже запущено (кроме FileExplorer), фокус переключается на существующее окно
   * @modifies: ProcessManager (добавляет процесс), WindowManager (создает окно), DOM (добавляет окно)
   * @throws: Ошибки при отсутствии приложения или конфигурации логируются, не блокируют систему
   * @why_requires: apps должны быть зарегистрированы в init() перед использованием
   * @why_ensures: Одно приложение одно окно (кроме FileExplorer) улучшает UX
   * @business_impact: Ошибка открытия = пользователь не может запустить приложение
   * @stakeholder_value: Пользователь может запускать приложения и работать с ними
   */
  openApp(appId, params = {}) {
    // Особый случай для BSOD
    if (appId === 'BSOD') {
      this.isCrashed = true;
      const bsod = new this.apps.BSOD();
      const bsodElement = bsod.render(this.languageManager);
      document.body.appendChild(bsodElement);
      return;
    }

    // Проверка существования приложения
    if (!this.apps[appId]) {
      console.error(`Приложение с ID "${appId}" не найдено.`);
      return;
    }
    
    // Получение конфигурации приложения
    const appConfig = getAppConfig(appId, this.languageManager);
    if (!appConfig) {
      console.error(`App config not found: ${appId}`);
      return;
    }
    
    // Проверка, запущено ли уже приложение (кроме FileExplorer)
    if (appId !== 'FileExplorer') {
      const runningProcesses = this.processManager.getProcessesByName(appId);
      if (runningProcesses.length > 0) {
        const windowId = runningProcesses[0].windowId;
        if (windowId) {
          this.windowManager.focusWindow(windowId);
        }
        return;
      }
    }
    
    // Создание экземпляра приложения
    const AppClass = this.apps[appId];
    const appInstance = new AppClass(params);
    
    // Рендеринг содержимого приложения
    let content;
    if (appId === 'FileExplorer') {
      content = appInstance.render(this.fileSystem, this.fileAssociation, this.languageManager);
    } else if (appId === 'Notepad' || appId === 'Terminal') {
      content = appInstance.render(this.fileSystem, this.languageManager);
    } else if (appId === 'Settings') {
      content = appInstance.render(this.themeManager, this.storageManager, this.languageManager);
    } else if (appId === 'TaskManager') {
      content = appInstance.render(this.processManager);
    } else if (appId === 'VisualIDE') {
      content = appInstance.render(this.languageManager);
    } else if (appId === 'Doom') {
      content = appInstance.render(this.languageManager);
    } else if (appId === 'Paint') {
      content = appInstance.render(this.languageManager);
    } else if (appId === 'Calculator') {
        content = appInstance.render(this.languageManager);
    } else if (appId === 'Camera') {
        content = appInstance.render();
    } else {
      content = appInstance.render();
    }
    
    // Запуск процесса
    const pid = this.processManager.startProcess(appId, appInstance, appConfig.window);
    
    // Создание окна
    const windowId = this.windowManager.createWindow(
      pid,
      appConfig.name,
      content,
      appConfig.window
    );
    
    // Установка callbacks для Camera приложения
    if (appId === 'Camera') {
      appInstance.onFocus = () => {
        this.windowManager.focusWindow(windowId);
      };
      appInstance.onKill = () => {
        this.processManager.killProcess(pid);
      };
      // Обновляем обработчик клика
      if (appInstance.elem) {
        appInstance.elem.onclick = () => appInstance.onFocus();
      }
    }
    
    console.log(`App opened: ${appConfig.name} (PID: ${pid}, Window: ${windowId})`);
  }

  setupEventListeners() {
    // Вход в систему
    this.eventBus.on('login:success', () => {
      this.showDesktop();
    });
    
    // Открытие приложения
    this.eventBus.on('app:open', ({ appId, params }) => {
      this.openApp(appId, params);
    });

    this.eventBus.on('language:loaded', () => {
        // Here you might want to re-render components that are already visible
        // For now, we assume language is loaded before major components are rendered.
    });

    this.eventBus.on('system:logout', () => this.logout());
    this.eventBus.on('system:restart', () => this.restart());
    this.eventBus.on('system:shutdown', () => this.shutdown());
    
    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
      if (this.isCrashed) {
        e.preventDefault();
        return;
      }
      
      // Win (открыть меню Пуск)
      if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        this.eventBus.emit('startmenu:toggle');
      }
      
      // Ctrl + Alt + Delete (диспетчер задач)
      if (e.ctrlKey && e.altKey && e.key === 'Delete') {
        e.preventDefault();
        this.openApp('TaskManager');
      }
      
      // Win + E (проводник)
      if ((e.metaKey || e.key === 'OS') && e.key === 'e') {
        e.preventDefault();
        this.openApp('FileExplorer');
      }
      
      // Win + R (терминал)
      if ((e.metaKey || e.key === 'OS') && e.key === 'r') {
        e.preventDefault();
        this.openApp('Terminal');
      }
    });
  }

  setupErrorHandling() {
    // Сохраняем оригинальные методы консоли
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Перехват console.error
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      // Извлекаем сообщение об ошибке
      let errorMessage = '';
      let errorTitle = this.languageManager.getString('error', 'Error');
      
      args.forEach(arg => {
        if (typeof arg === 'string') {
          errorMessage += arg + ' ';
        } else if (arg instanceof Error) {
          errorTitle = this.languageManager.getString('system_error', 'System Error');
          errorMessage = arg.message || String(arg);
          if (arg.stack && errorMessage.length < 200) {
            errorMessage += '\n' + arg.stack.split('\n').slice(0, 3).join('\n');
          }
        } else if (typeof arg === 'object') {
          try {
            errorMessage += JSON.stringify(arg, null, 2) + ' ';
          } catch (e) {
            errorMessage += String(arg) + ' ';
          }
        } else {
          errorMessage += String(arg) + ' ';
        }
      });
      
      // Показываем уведомление только если это не ошибка инициализации уведомлений
      if (errorMessage && !errorMessage.includes('Notification')) {
        showError(errorTitle.trim(), errorMessage.trim());
      }
    };

    // Перехват console.warn
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      
      let warningMessage = '';
      args.forEach(arg => {
        if (typeof arg === 'string') {
          warningMessage += arg + ' ';
        } else {
          warningMessage += String(arg) + ' ';
        }
      });
      
      if (warningMessage && !warningMessage.includes('Notification')) {
        showWarning(this.languageManager.getString('warning', 'Warning'), warningMessage.trim());
      }
    };

    // Глобальный перехват необработанных ошибок
    window.addEventListener('error', (event) => {
      event.preventDefault();
      const errorMessage = event.message || this.languageManager.getString('unknown_error', 'Unknown error');
      const errorFile = event.filename || '';
      const errorLine = event.lineno || 0;
      
      showError(
        this.languageManager.getString('system_error', 'System Error'),
        `${errorMessage}${errorFile ? `\n${this.languageManager.getString('file', 'File')}: ${errorFile}:${errorLine}` : ''}`
      );
      
      // Все еще логируем в консоль для разработки (через оригинальный console.error)
      originalConsoleError('Unhandled error:', event);
    }, true);

    // Перехват промисов с отклонением
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      const error = event.reason;
      let errorMessage = this.languageManager.getString('unknown_promise_error', 'Unknown promise error');
      
      if (error instanceof Error) {
        errorMessage = error.message || String(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error) {
        errorMessage = String(error);
      }
      
      showError(
        this.languageManager.getString('execution_error', 'Execution Error'),
        errorMessage
      );
      
      originalConsoleError('Unhandled promise rejection:', event.reason);
    });

    // Подписка на события ошибок через EventBus
    this.eventBus.on('system:error', ({ title, message }) => {
      showError(title || this.languageManager.getString('error', 'Error'), message || this.languageManager.getString('an_error_occurred', 'An error occurred'));
    });

    // Перехват ошибок в EventBus
    const originalEmit = this.eventBus.emit.bind(this.eventBus);
    this.eventBus.emit = (event, data) => {
      try {
        originalEmit(event, data);
      } catch (error) {
        showError(
          this.languageManager.getString('event_error', 'Event Error'),
          `${this.languageManager.getString('event_processing_error', 'Error processing event "{event}"')}: ${error.message}`.replace('{event}', event)
        );
        originalConsoleError('EventBus error:', error);
      }
    };
  }

  async restart() {
      const confirmed = await showDialog({
          type: 'confirm',
          title: this.languageManager.getString('restart_title', 'Перезагрузка'),
          message: this.languageManager.getString('restart_confirm', 'Вы уверены, что хотите перезагрузить систему?')
      });
      if (confirmed) {
          const { getSoundManager } = await import('./core/SoundManager.js');
          const soundManager = getSoundManager();
          soundManager.playSystemShutdown();
          
          setTimeout(() => {
              window.location.replace(window.location.pathname + '?restart=true');
          }, 800);
      }
  }

  async logout() {
      const confirmed = await showDialog({
          type: 'confirm',
          title: this.languageManager.getString('logout_title', 'Выход'),
          message: this.languageManager.getString('logout_confirm', 'Вы уверены, что хотите выйти? Все запущенные приложения будут закрыты.')
      });
      if (confirmed) {
          // Воспроизводим звук выхода
          const { getSoundManager } = await import('./core/SoundManager.js');
          const soundManager = getSoundManager();
          soundManager.playSystemShutdown();
          
          // Ждем немного для воспроизведения звука, затем выходим
          setTimeout(() => {
              window.location.replace(window.location.pathname + '?fastboot=true');
          }, 800);
      }
  }

  async shutdown() {
    const confirmed = await showDialog({
        type: 'confirm',
        title: this.languageManager.getString('shutdown_title', 'Выключение'),
        message: this.languageManager.getString('shutdown_confirm', 'Вы уверены, что хотите выключить систему?')
    });
    if (confirmed) {
        Object.values(this.containers).forEach(container => {
            if (container.id !== 'shutdown-container') {
                container.style.display = 'none';
            }
        });
        this.shutdownScreen = new ShutdownScreen(this.containers.shutdown);
        // Звук уже воспроизводится в ShutdownScreen конструкторе
    }
  }
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AndlancerOS_Class();
  console.log('AndlancerOS started');
});

