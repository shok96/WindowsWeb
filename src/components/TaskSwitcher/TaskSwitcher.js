import './TaskSwitcher.css';
import { getSoundManager } from '../../core/SoundManager.js';

export class TaskSwitcher {
  constructor(container, windowManager, eventBus, languageManager) {
    this.container = container;
    this.windowManager = windowManager;
    this.eventBus = eventBus;
    this.languageManager = languageManager;
    this.isVisible = false;
    this.element = null;
    this.soundManager = getSoundManager();

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'task-switcher-overlay';
    this.element.style.display = 'none';
    this.container.appendChild(this.element);

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.hide();
      }
    });

    this.eventBus.on('taskswitcher:toggle', () => this.toggle());
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.update();
    this.element.style.display = 'flex';
    requestAnimationFrame(() => {
      this.element.classList.add('visible');
    });
    this.isVisible = true;
    this.eventBus.emit('taskswitcher:shown');
  }

  hide() {
    this.element.classList.remove('visible');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 300); // Match CSS transition duration
    this.isVisible = false;
    this.eventBus.emit('taskswitcher:hidden');
  }

  update() {
    this.element.innerHTML = '';
    const windows = this.windowManager.getAllWindows().filter(w => !w.isMinimized);

    if (windows.length === 0) {
        this.element.innerHTML = `<div class="no-windows-message">${this.languageManager.getString('no_open_windows', 'No open windows')}</div>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'task-switcher-grid';

    windows.forEach(window => {
      const preview = this.createWindowPreview(window);
      grid.appendChild(preview);
    });

    this.element.appendChild(grid);
  }

  createWindowPreview(window) {
    const preview = document.createElement('div');
    preview.className = 'window-preview';
    
    // In a real scenario, we might generate a thumbnail.
    // For now, we'll just show the title and an icon.
    preview.innerHTML = `
      <div class="preview-header">${window.title}</div>
      <div class="preview-content"></div>
    `;

    preview.addEventListener('click', () => {
      this.soundManager.playWindowSwitch();
      this.windowManager.focusWindow(window.id);
      this.hide();
    });

    return preview;
  }
}
