/**
 * Конфигурация всех приложений Windows 11 Web OS
 */

export const defaultApps = [
  {
    id: 'FileExplorer',
    name: 'app_fileexplorer_name',
    icon: '📁',
    description: 'app_fileexplorer_desc',
    category: 'system',
    pinned: true,
    window: {
      width: 900,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      resizable: true
    }
  },
  {
    id: 'Notepad',
    name: 'app_notepad_name',
    icon: '📝',
    description: 'app_notepad_desc',
    category: 'productivity',
    pinned: true,
    window: {
      width: 700,
      height: 500,
      minWidth: 400,
      minHeight: 300,
      resizable: true
    }
  },
  {
    id: 'Calculator',
    name: 'app_calculator_name',
    icon: '🔢',
    description: 'app_calculator_desc',
    category: 'utility',
    pinned: true,
    window: {
      width: 320,
      height: 500,
      minWidth: 320,
      minHeight: 500,
      resizable: false
    }
  },
  {
    id: 'Calendar',
    name: 'app_calendar_name',
    icon: '📅',
    description: 'app_calendar_desc',
    category: 'productivity',
    pinned: true,
    window: {
      width: 400,
      height: 500,
      minWidth: 350,
      minHeight: 400,
      resizable: true
    }
  },
  {
    id: 'Browser',
    name: 'app_browser_name',
    icon: '🌐',
    description: 'app_browser_desc',
    category: 'internet',
    pinned: true,
    window: {
      width: 1000,
      height: 700,
      minWidth: 600,
      minHeight: 400,
      resizable: true
    }
  },
  {
    id: 'Minesweeper',
    name: 'app_minesweeper_name',
    icon: '💣',
    description: 'app_minesweeper_desc',
    category: 'games',
    pinned: true,
    window: {
      width: 400,
      height: 500,
      minWidth: 400,
      minHeight: 500,
      resizable: false
    }
  },
  {
    id: 'Snake',
    name: 'app_snake_name',
    icon: '🐍',
    description: 'app_snake_desc',
    category: 'games',
    pinned: true,
    window: {
      width: 500,
      height: 700,
      minWidth: 500,
      minHeight: 700,
      resizable: false
    }
  },
  {
    id: 'Terminal',
    name: 'app_terminal_name',
    icon: '💻',
    description: 'app_terminal_desc',
    category: 'developer',
    pinned: true,
    window: {
      width: 800,
      height: 500,
      minWidth: 500,
      minHeight: 300,
      resizable: true
    }
  },
  {
    id: 'TaskManager',
    name: 'app_taskmanager_name',
    icon: '📊',
    description: 'app_taskmanager_desc',
    category: 'system',
    pinned: true,
    window: {
      width: 700,
      height: 600,
      minWidth: 600,
      minHeight: 500,
      resizable: true
    }
  },
  {
    id: 'Settings',
    name: 'app_settings_name',
    icon: '⚙️',
    description: 'app_settings_desc',
    category: 'system',
    pinned: true,
    window: {
      width: 900,
      height: 650,
      minWidth: 700,
      minHeight: 500,
      resizable: true
    }
  },
  {
    id: 'Paint',
    name: 'app_paint_name',
    icon: '🎨',
    description: 'app_paint_desc',
    category: 'productivity',
    pinned: true,
    window: {
      width: 700,
      height: 500,
      minWidth: 400,
      minHeight: 300,
      resizable: true
    }
  },
  {
    id: 'CodeEditor',
    name: 'app_codeeditor_name',
    icon: '👨‍💻',
    description: 'app_codeeditor_desc',
    category: 'developer',
    pinned: true,
    window: { width: 1024, height: 768, minWidth: 600, minHeight: 400 }
  },
  {
    id: 'VisualIDE',
    name: 'app_visualide_name',
    icon: '✨',
    description: 'app_visualide_desc',
    category: 'developer',
    pinned: true,
    window: { width: 1024, height: 768, minWidth: 600, minHeight: 400 }
  },
  {
    id: 'Doom',
    name: 'app_doom_name',
    icon: '👹',
    description: 'app_doom_desc',
    category: 'games',
    pinned: true,
    window: {
      width: 800,
      height: 600,
      minWidth: 640,
      minHeight: 480,
      resizable: true
    }
  },
  {
    id: 'AudioPlayer',
    name: 'app_audioplayer_name',
    icon: '🎵',
    description: 'app_audioplayer_desc',
    category: 'media',
    pinned: true,
    window: {
      width: 400,
      height: 500,
      minWidth: 300,
      minHeight: 400,
      resizable: true
    }
  },
  {
    id: 'Tetris',
    name: 'app_tetris_name',
    icon: '🧱',
    description: 'app_tetris_desc',
    category: 'games',
    pinned: true,
    window: {
      width: 400,
      height: 700,
      minWidth: 400,
      minHeight: 700,
      resizable: false
    }
  },
  {
    id: 'BSOD',
    name: 'BSOD',
    icon: '☠️',
    description: 'app_bsod_desc',
    category: 'system',
    pinned: false,
    window: {
      width: '100%',
      height: '100%',
      resizable: false,
      movable: false,
      fullscreen: true,
      noHeader: true
    }
  }
];

/**
 * Получение конфигурации приложения по ID
 * @param {string} appId - ID приложения
 * @returns {Object|null} Конфигурация приложения
 */
export function getAppConfig(appId, languageManager) {
  const app = defaultApps.find(app => app.id === appId);
  if (!app) return null;

  if (languageManager) {
    return {
      ...app,
      name: languageManager.getString(app.name, app.name),
      description: languageManager.getString(app.description, app.description),
    };
  }
  return app;
}

/**
 * Получение всех закрепленных приложений
 * @param {LanguageManager} languageManager - Менеджер языков (необязательный)
 * @returns {Array} Массив закрепленных приложений
 */
export function getPinnedApps(languageManager) {
  const apps = defaultApps.filter(app => app.pinned);
  if (languageManager) {
    return apps.map(app => ({
      ...app,
      name: languageManager.getString(app.name, app.name),
      description: languageManager.getString(app.description, app.description),
    }));
  }
  return apps;
}

/**
 * Получение приложений для панели задач (только первые 5)
 * @param {LanguageManager} languageManager - Менеджер языков (необязательный)
 * @returns {Array} Массив из максимум 5 закрепленных приложений
 */
export function getTaskbarPinnedApps(languageManager) {
  const apps = defaultApps.filter(app => app.pinned).slice(0, 5);
   if (languageManager) {
    return apps.map(app => ({
      ...app,
      name: languageManager.getString(app.name, app.name),
      description: languageManager.getString(app.description, app.description),
    }));
  }
  return apps;
}

/**
 * Получение приложений по категории
 * @param {string} category - Категория
 * @returns {Array} Массив приложений
 */
export function getAppsByCategory(category, languageManager) {
  const apps = defaultApps.filter(app => app.category === category);
  if (languageManager) {
    return apps.map(app => ({
      ...app,
      name: languageManager.getString(app.name, app.name),
      description: languageManager.getString(app.description, app.description),
    }));
  }
  return apps;
}

