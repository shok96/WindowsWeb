/**
 * Desktop - Рабочий стол для Windows 11 Web OS
 */

import interact from 'interactjs';
import { showContextMenu } from '../ContextMenu/ContextMenu.js';
import { getFileIcon } from '../../core/Utils.js';
import { showDialog } from '../Dialog/Dialog.js';
import { showError } from '../Notification/Notification.js';
import { ContextMenu } from '../ContextMenu/ContextMenu.js';
import { getAppConfig } from '../../data/defaultApps.js';
import { AnalogClockWidget } from '../Widgets/AnalogClock/AnalogClock.js';
import { getSoundManager } from '../../core/SoundManager.js';

export class Desktop {
  constructor(container, fileSystem, themeManager, eventBus, fileAssociation, processManager, languageManager) {
    this.container = container;
    this.fs = fileSystem;
    this.themeManager = themeManager;
    this.eventBus = eventBus;
    this.fileAssociation = fileAssociation;
    this.processManager = processManager;
    this.languageManager = languageManager;
    this.selectedIcons = new Set();
    this.selectionRect = null;
    this.isSelecting = false;
    this.widgets = [];
    this.soundManager = getSoundManager();

    this.render();
    this.loadWallpaper();
    this.loadDesktopIcons();
    this.loadWidgets();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="desktop">
        <div class="desktop-icons-container"></div>
      </div>
      <div class="desktop-selection-rect"></div>
    `;
  }

  loadWallpaper() {
    const desktop = this.container.querySelector('.desktop');
    const oldWallpaper = desktop.style.backgroundImage;
    const newWallpaperUrl = this.themeManager.getWallpaper();

    if (!oldWallpaper || oldWallpaper === `url("${newWallpaperUrl}")`) {
        desktop.style.backgroundImage = `url('${newWallpaperUrl}')`;
        return;
    }

    const img = new Image();
    img.onload = () => {
        desktop.style.setProperty('--desktop-bg-old', oldWallpaper);
        desktop.classList.add('wallpaper-changing');
        desktop.style.backgroundImage = `url('${newWallpaperUrl}')`;

        setTimeout(() => {
            desktop.classList.remove('wallpaper-changing');
            setTimeout(() => {
                desktop.style.removeProperty('--desktop-bg-old');
            }, 500); // Transition duration
        }, 50);
    };
    img.src = newWallpaperUrl;
  }

  loadWidgets() {
    const clock = new AnalogClockWidget(this.container);
    this.widgets.push(clock);
  }

  loadDesktopIcons() {
    const desktopItems = this.fs.listDirectory('Desktop');
    const iconsContainer = this.container.querySelector('.desktop-icons-container');
    iconsContainer.innerHTML = '';
    
    desktopItems.forEach((item, index) => {
      const icon = this.createDesktopIcon(item, index);
      iconsContainer.appendChild(icon);
    });
  }

  createDesktopIcon(item, index) {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.dataset.name = item.name;
    
    let iconEmoji;
    if (item.type === 'file') {
      const extension = item.name.split('.').pop().toLowerCase();
      if (this.fileAssociation.getApplicationForExtension(extension)) {
        iconEmoji = getFileIcon(item.name, item.type);
      } else {
        iconEmoji = '❓'; // Иконка для неизвестного типа файла
      }
    } else {
      iconEmoji = getFileIcon(item.name, item.type);
    }
    
    icon.innerHTML = `
      <div class="icon-image">${iconEmoji}</div>
      <div class="icon-label">${item.name}</div>
    `;
    
    // Позиционирование иконок в сетке
    const col = Math.floor(index / 10);
    const row = index % 10;
    icon.style.left = (col * 100 + 20) + 'px';
    icon.style.top = (row * 90 + 20) + 'px';
    
    this.makeIconDraggable(icon);
    this.attachIconListeners(icon, item);
    
    return icon;
  }

  makeIconDraggable(icon) {
    interact(icon).draggable({
      listeners: {
        move: (event) => {
          const x = (parseFloat(icon.getAttribute('data-x')) || parseFloat(icon.style.left)) + event.dx;
          const y = (parseFloat(icon.getAttribute('data-y')) || parseFloat(icon.style.top)) + event.dy;
          
          icon.style.left = x + 'px';
          icon.style.top = y + 'px';
          
          icon.setAttribute('data-x', x);
          icon.setAttribute('data-y', y);
        }
      }
    });
  }

  attachIconListeners(icon, item) {
    // Двойной клик для открытия
    icon.addEventListener('dblclick', () => {
      this.openItem(item);
    });
    
    // Клик для выделения
    icon.addEventListener('click', (e) => {
      if (!e.ctrlKey) {
        this.clearSelection();
      }
      this.selectIcon(icon);
    });
    
    // Контекстное меню
    icon.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showIconContextMenu(e.clientX, e.clientY, item);
    });
  }

  openItem(item) {
    if (item.type === 'folder') {
      this.eventBus.emit('app:open', { appId: 'FileExplorer', params: { path: `Desktop/${item.name}` } });
    } else if (item.type === 'file') {
      const filePath = `Desktop/${item.name}`;
      const result = this.fileAssociation.openFile(filePath);
      if (!result.success) {
        showError('Ошибка', result.error);
      }
    }
  }

  selectIcon(icon) {
    icon.classList.add('selected');
    this.selectedIcons.add(icon);
  }

  clearSelection() {
    this.selectedIcons.forEach(icon => {
      icon.classList.remove('selected');
    });
    this.selectedIcons.clear();
  }

  checkSelection(rect) {
    const icons = this.container.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
      const iconRect = icon.getBoundingClientRect();
      // Simple collision detection
      if (
        rect.left < iconRect.right &&
        rect.right > iconRect.left &&
        rect.top < iconRect.bottom &&
        rect.bottom > iconRect.top
      ) {
        this.selectIcon(icon);
      } else {
        icon.classList.remove('selected');
        this.selectedIcons.delete(icon);
      }
    });
  }

  showIconContextMenu(x, y, item) {
    const lm = this.languageManager;
    const menuItems = [
      { label: 'Открыть', action: () => this.openItem(item) },
      {
        label: 'Открыть с помощью',
        submenu: [
          { label: 'Блокнот', action: () => this.fileAssociation.openFileWith('Notepad', `Desktop/${item.name}`) }
        ]
      },
      { type: 'separator' },
      { label: lm.getString('context_rename', 'Rename'), action: () => this.renameItem(item) },
      { label: lm.getString('context_delete', 'Delete'), action: () => this.deleteItem(item) }
    ];
    
    showContextMenu(menuItems, x, y, this.eventBus);
  }

  async renameItem(item) {
    const lm = this.languageManager;
    const newName = await showDialog({
        type: 'prompt',
        title: lm.getString('dialog_rename_title', 'Rename'),
        message: lm.getString('dialog_rename_message', 'Enter a new name for "{itemName}":').replace('{itemName}', item.name),
        placeholder: item.name
    });
    if (newName && newName !== item.name) {
      const result = this.fs.renameItem('Desktop', item.name, newName);
      if (result.success) {
        this.soundManager.playSelect();
        this.loadDesktopIcons();
      } else {
        showError(lm.getString('error', 'Error'), result.error);
      }
    }
  }

  async deleteItem(item) {
    const lm = this.languageManager;
    const confirmed = await showDialog({
        type: 'confirm',
        title: lm.getString('dialog_delete_title', 'Delete'),
        message: lm.getString('dialog_delete_message', 'Are you sure you want to delete "{itemName}"?').replace('{itemName}', item.name)
    });
    if (confirmed) {
      const result = this.fs.deleteItem('Desktop', item.name);
      if (result.success) {
        this.soundManager.playDelete();
        this.loadDesktopIcons();
      }
    }
  }

  attachEventListeners() {
    const desktop = this.container.querySelector('.desktop');
    const iconsContainer = this.container.querySelector('.desktop-icons-container');

    // Listener for the main desktop area
    const desktopAreaListener = (e) => {
      const target = e.target;
      // Check if the click is on the desktop itself or the icon container
      if (target === desktop || target === iconsContainer) {
        if (e.type === 'click') {
          this.clearSelection();
        } else if (e.type === 'contextmenu') {
          e.preventDefault();
          this.showDesktopContextMenu(e.clientX, e.clientY);
        }
      }
    };

    desktop.addEventListener('contextmenu', desktopAreaListener);
    desktop.addEventListener('click', desktopAreaListener);

    // Marquee Selection Logic
    desktop.addEventListener('mousedown', (e) => {
      // Start selection only on primary button click on the desktop itself
      if (e.button === 0 && (e.target === desktop || e.target === iconsContainer)) {
        this.isSelecting = true;
        this.clearSelection();
        
        this.selectionRect = document.createElement('div');
        this.selectionRect.className = 'desktop-selection-rect';
        this.startX = e.clientX;
        this.startY = e.clientY;

        this.selectionRect.style.left = `${this.startX}px`;
        this.selectionRect.style.top = `${this.startY}px`;
        this.selectionRect.style.width = '0px';
        this.selectionRect.style.height = '0px';

        desktop.appendChild(this.selectionRect);

        const onMouseMove = (moveEvent) => {
          if (!this.isSelecting) return;

          const currentX = moveEvent.clientX;
          const currentY = moveEvent.clientY;
          
          const left = Math.min(this.startX, currentX);
          const top = Math.min(this.startY, currentY);
          const width = Math.abs(this.startX - currentX);
          const height = Math.abs(this.startY - currentY);

          this.selectionRect.style.left = `${left}px`;
          this.selectionRect.style.top = `${top}px`;
          this.selectionRect.style.width = `${width}px`;
          this.selectionRect.style.height = `${height}px`;

          this.checkSelection(this.selectionRect.getBoundingClientRect());
        };

        const onMouseUp = () => {
          this.isSelecting = false;
          if (this.selectionRect) {
            this.selectionRect.remove();
            this.selectionRect = null;
          }
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp, { once: true });
      }
    });

    // Update wallpaper on change
    this.eventBus.on('wallpaper:changed', () => {
      this.loadWallpaper();
    });

    this.eventBus.on('filesystem:changed', (path) => {
        if (path === 'Desktop') {
            this.loadDesktopIcons();
        }
    });
  }

  showDesktopContextMenu(x, y) {
    const lm = this.languageManager;
    const menuItems = [
      { label: lm.getString('context_refresh', 'Refresh'), icon: '🔄', action: () => this.loadDesktopIcons() },
      { type: 'separator' },
      { 
        label: lm.getString('context_create', 'Create'), 
        icon: '➕',
        submenu: [
          { label: lm.getString('context_create_folder', 'Folder'), action: () => this.createNewFolder() },
          { label: lm.getString('context_create_textfile', 'Text File'), action: () => this.createNewFile('txt') }
        ]
      },
      { type: 'separator' },
      { label: lm.getString('personalization', 'Personalization'), icon: '🎨', action: () => this.openPersonalization() }
    ];
    
    showContextMenu(menuItems, x, y, this.eventBus);
  }

  async createNewFolder() {
    const lm = this.languageManager;
    const name = await showDialog({
        type: 'prompt',
        title: lm.getString('dialog_create_folder_title', 'Create Folder'),
        message: lm.getString('dialog_create_folder_message', 'Enter the new folder name:'),
        placeholder: lm.getString('dialog_create_folder_placeholder', 'New Folder')
    });
    if (name) {
      const result = this.fs.createFolder('Desktop', name);
      if (result.success) {
        this.soundManager.playSave();
        this.loadDesktopIcons();
      } else {
        showError(lm.getString('error', 'Error'), result.error);
      }
    }
  }

  async createNewFile(extension) {
    const lm = this.languageManager;
    const defaultName = `${lm.getString('default_file_name', 'New Document')}.${extension}`;
    const name = await showDialog({
        type: 'prompt',
        title: lm.getString('dialog_create_file_title', 'Create File'),
        message: lm.getString('dialog_create_file_message', 'Enter the new file name:'),
        placeholder: defaultName
    });
    if (name) {
      const result = this.fs.createFile('Desktop', name, '', extension);
      if (result.success) {
        this.soundManager.playSave();
        this.loadDesktopIcons();
      } else {
        showError(lm.getString('error', 'Error'), result.error);
      }
    }
  }

  openPersonalization() {
    this.eventBus.emit('app:open', { appId: 'Settings', params: { section: 'personalization' } });
  }
}

