/**
 * FileSystem - Виртуальная файловая система для Windows 11 Web OS
 * Управление файлами и папками с сохранением в localStorage
 */

export class FileSystem {
  constructor(storageManager, eventBus) {
    this.storage = storageManager;
    this.eventBus = eventBus;
    this.root = this.initFileSystem();
  }

  /**
   * Инициализация файловой системы
   */
  initFileSystem() {
    const data = this.storage.load();
    if (!data.fileSystem || !data.fileSystem.root) {
      const defaultFS = this.createDefaultFileSystem();
      data.fileSystem = defaultFS;
      this.storage.save(data);
      return defaultFS;
    }
    
    // Миграция: переименовываем virus.bat в destroy_system.exe
    const desktop = data.fileSystem.root.children['Desktop'];
    if (desktop && desktop.children['virus.bat']) {
      desktop.children['destroy_system.aos'] = desktop.children['virus.bat'];
      desktop.children['destroy_system.aos'].name = 'destroy_system.aos';
      delete desktop.children['virus.bat'];
      this.storage.save(data);
    }
    
    // Проверка наличия системных файлов
    if (desktop && !desktop.children['destroy_system.aos']) {
        desktop.children['destroy_system.aos'] = {
            type: 'file',
            name: 'destroy_system.aos',
            content: 'run crash',
            fileType: 'binary',
            size: 11,
            created: Date.now(),
            modified: Date.now(),
            systemFile: true
        };
        this.storage.save(data);
    }
    
    return data.fileSystem;
  }

  /**
   * Создание файловой системы по умолчанию
   */
  createDefaultFileSystem() {
    return {
      root: {
        type: 'folder',
        name: 'C:',
        children: {
          'Desktop': {
            type: 'folder',
            name: 'Desktop',
            children: {
              'Welcome.txt': {
                type: 'file',
                name: 'Welcome.txt',
                content: 'Добро пожаловать в Windows 11 Web OS!\n\nЭто полнофункциональная веб-копия Windows 11.\n\nВы можете:\n- Создавать файлы и папки\n- Запускать приложения\n- Менять темы и обои\n- И многое другое!\n\nНачните с открытия меню Пуск.',
                fileType: 'text',
                size: 250,
                created: Date.now(),
                modified: Date.now()
              },
              'destroy_system.aos': {
                type: 'file',
                name: 'destroy_system.aos',
                content: 'run crash',
                fileType: 'binary',
                size: 11,
                created: Date.now(),
                modified: Date.now(),
                systemFile: true
              }
            },
            created: Date.now(),
            modified: Date.now()
          },
          'Documents': {
            type: 'folder',
            name: 'Documents',
            children: {},
            created: Date.now(),
            modified: Date.now()
          },
          'Downloads': {
            type: 'folder',
            name: 'Downloads',
            children: {},
            created: Date.now(),
            modified: Date.now()
          },
          'Pictures': {
            type: 'folder',
            name: 'Pictures',
            children: {},
            created: Date.now(),
            modified: Date.now()
          },
          'Music': {
            type: 'folder',
            name: 'Music',
            children: {},
            created: Date.now(),
            modified: Date.now()
          },
          'Videos': {
            type: 'folder',
            name: 'Videos',
            children: {},
            created: Date.now(),
            modified: Date.now()
          }
        },
        created: Date.now(),
        modified: Date.now()
      }
    };
  }

  /**
   * Создание файла
   * @param {string} path - Путь к папке
   * @param {string} name - Имя файла
   * @param {string} content - Содержимое файла
   * @param {string} type - Тип файла
   */
  createFile(path, name, content = '', type = 'text') {
    const node = this.navigateToPath(path);
    if (node && node.type === 'folder') {
      // Проверка на существование файла
      if (node.children[name]) {
        return { success: false, error: 'Файл с таким именем уже существует' };
      }
      
      node.children[name] = {
        type: 'file',
        name: name,
        content: content,
        fileType: type,
        size: new Blob([content]).size,
        created: Date.now(),
        modified: Date.now()
      };
      node.modified = Date.now();
      this.save();
      this.eventBus.emit('filesystem:changed', path);
      return { success: true };
    }
    return { success: false, error: 'Папка не найдена' };
  }

  /**
   * Создание папки
   * @param {string} path - Путь
   * @param {string} name - Имя папки
   */
  createFolder(path, name) {
    const node = this.navigateToPath(path);
    if (node && node.type === 'folder') {
      // Проверка на существование папки
      if (node.children[name]) {
        return { success: false, error: 'Папка с таким именем уже существует' };
      }
      
      node.children[name] = {
        type: 'folder',
        name: name,
        children: {},
        created: Date.now(),
        modified: Date.now()
      };
      node.modified = Date.now();
      this.save();
      this.eventBus.emit('filesystem:changed', path);
      return { success: true };
    }
    return { success: false, error: 'Папка не найдена' };
  }

  /**
   * Удаление файла или папки
   * @param {string} path - Путь
   * @param {string} name - Имя
   */
  deleteItem(path, name) {
    const node = this.navigateToPath(path);
    if (node && node.children && node.children[name]) {
      // Запрет на удаление системных файлов
      if (node.children[name].systemFile) {
        return { success: false, error: 'Этот файл является системным и не может быть удален.' };
      }
      
      delete node.children[name];
      node.modified = Date.now();
      this.save();
      this.eventBus.emit('filesystem:changed', path);
      return { success: true };
    }
    return { success: false, error: 'Элемент не найден' };
  }

  /**
   * Переименование файла или папки
   * @param {string} path - Путь
   * @param {string} oldName - Старое имя
   * @param {string} newName - Новое имя
   */
  renameItem(path, oldName, newName) {
    const node = this.navigateToPath(path);
    if (node && node.children && node.children[oldName]) {
      // Проверка на существование элемента с новым именем
      if (node.children[newName]) {
        return { success: false, error: 'Элемент с таким именем уже существует' };
      }
      
      node.children[newName] = { ...node.children[oldName] };
      node.children[newName].name = newName;
      node.children[newName].modified = Date.now();
      delete node.children[oldName];
      node.modified = Date.now();
      this.save();
      this.eventBus.emit('filesystem:changed', path);
      return { success: true };
    }
    return { success: false, error: 'Элемент не найден' };
  }

  /**
   * Копирование файла или папки
   * @param {string} sourcePath - Исходный путь
   * @param {string} sourceName - Имя источника
   * @param {string} destPath - Путь назначения
   */
  copyItem(sourcePath, sourceName, destPath) {
    const sourceNode = this.navigateToPath(sourcePath);
    const destNode = this.navigateToPath(destPath);
    
    if (sourceNode && destNode && sourceNode.children && sourceNode.children[sourceName]) {
      const copy = JSON.parse(JSON.stringify(sourceNode.children[sourceName]));
      copy.created = Date.now();
      copy.modified = Date.now();
      
      // Генерация уникального имени если файл уже существует
      let newName = sourceName;
      let counter = 1;
      while (destNode.children[newName]) {
        const parts = sourceName.split('.');
        if (parts.length > 1) {
          const ext = parts.pop();
          newName = `${parts.join('.')} (${counter}).${ext}`;
        } else {
          newName = `${sourceName} (${counter})`;
        }
        counter++;
      }
      
      copy.name = newName;
      destNode.children[newName] = copy;
      destNode.modified = Date.now();
      this.save();
      this.eventBus.emit('filesystem:changed', sourcePath);
      this.eventBus.emit('filesystem:changed', destPath);
      return { success: true, newName };
    }
    return { success: false, error: 'Не удалось скопировать элемент' };
  }

  /**
   * Перемещение файла или папки
   * @param {string} sourcePath - Исходный путь
   * @param {string} sourceName - Имя источника
   * @param {string} destPath - Путь назначения
   */
  moveItem(sourcePath, sourceName, destPath) {
    const result = this.copyItem(sourcePath, sourceName, destPath);
    if (result.success) {
      this.deleteItem(sourcePath, sourceName);
      // События уже вызваны в copyItem и deleteItem
      return { success: true };
    }
    return result;
  }

  /**
   * Навигация по пути
   * @param {string} path - Путь (например: "Desktop/MyFolder")
   */
  navigateToPath(path) {
    if (!path || path === '' || path === '/') {
      return this.root.root;
    }
    
    const parts = path.split('/').filter(p => p && p !== 'C:');
    let current = this.root.root;
    
    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      } else {
        return null;
      }
    }
    
    return current;
  }

  /**
   * Получение содержимого файла
   * @param {string} path - Путь
   * @param {string} name - Имя файла
   */
  getFileContent(path, name) {
    const node = this.navigateToPath(path);
    if (node && node.children && node.children[name] && node.children[name].type === 'file') {
      return node.children[name].content;
    }
    return null;
  }

  /**
   * Обновление содержимого файла
   * @param {string} path - Путь
   * @param {string} name - Имя файла
   * @param {string} content - Новое содержимое
   */
  updateFileContent(path, name, content) {
    const node = this.navigateToPath(path);
    if (node && node.children && node.children[name] && node.children[name].type === 'file') {
      node.children[name].content = content;
      node.children[name].modified = Date.now();
      node.children[name].size = new Blob([content]).size;
      node.modified = Date.now();
      this.save();
      this.eventBus.emit('filesystem:changed', path);
      return { success: true };
    }
    return { success: false, error: 'Файл не найден' };
  }

  /**
   * Получение списка элементов в папке
   * @param {string} path - Путь
   */
  listDirectory(path) {
    const node = this.navigateToPath(path);
    if (node && node.type === 'folder' && node.children) {
      return Object.values(node.children);
    }
    return [];
  }

  /**
   * Получение информации об элементе
   * @param {string} path - Путь
   * @param {string} name - Имя
   */
  getItemInfo(path, name) {
    const node = this.navigateToPath(path);
    if (node && node.children && node.children[name]) {
      return node.children[name];
    }
    return null;
  }

  /**
   * Поиск файлов по имени
   * @param {string} query - Поисковый запрос
   * @param {string} startPath - Начальный путь для поиска
   */
  search(query, startPath = '') {
    const results = [];
    const searchNode = (node, currentPath) => {
      if (node.name && node.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          ...node,
          path: currentPath
        });
      }
      
      if (node.type === 'folder' && node.children) {
        Object.values(node.children).forEach(child => {
          searchNode(child, `${currentPath}/${child.name}`);
        });
      }
    };
    
    const startNode = this.navigateToPath(startPath) || this.root.root;
    searchNode(startNode, startPath);
    return results;
  }

  /**
   * Сохранение файловой системы
   */
  save() {
    const data = this.storage.load();
    data.fileSystem = this.root;
    this.storage.save(data);
  }

  /**
   * Получение размера папки
   * @param {string} path - Путь к папке
   */
  getFolderSize(path) {
    const node = this.navigateToPath(path);
    if (!node) return 0;
    
    const calculateSize = (item) => {
      if (item.type === 'file') {
        return item.size || 0;
      } else if (item.type === 'folder' && item.children) {
        return Object.values(item.children).reduce((sum, child) => {
          return sum + calculateSize(child);
        }, 0);
      }
      return 0;
    };
    
    return calculateSize(node);
  }
}



