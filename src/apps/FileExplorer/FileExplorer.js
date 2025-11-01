/**
 * FileExplorer - Проводник файлов
 */

import { getFileIcon } from '../../core/Utils.js';
import { showContextMenu } from '../../components/ContextMenu/ContextMenu.js';
import { showError } from '../../components/Notification/Notification.js';

export class FileExplorer {
  constructor(params = {}) {
    this.currentPath = params.path || '';
    this.fs = null;
    this.fileAssociation = null;
    this.container = null;
    this.pathBar = null;
    this.fileList = null;
    this.languageManager = null;
  }

  render(fileSystem, fileAssociation, languageManager) {
    this.fs = fileSystem;
    this.fileAssociation = fileAssociation;
    this.languageManager = languageManager;
    const lm = this.languageManager;

    this.container = document.createElement('div');
    this.container.className = 'fileexplorer-app';
    this.container.innerHTML = `
      <div class="fileexplorer-toolbar">
        <button data-action="back" title="${lm.getString('fe_back', 'Back')}">←</button>
        <button data-action="up" title="${lm.getString('fe_up', 'Up')}">↑</button>
        <div class="path-bar"></div>
        <button data-action="newfolder" title="${lm.getString('fe_new_folder', 'New Folder')}">+ ${lm.getString('fe_folder', 'Folder')}</button>
        <button data-action="newfile" title="${lm.getString('fe_new_file', 'New File')}">+ ${lm.getString('fe_file', 'File')}</button>
      </div>
      <div class="fileexplorer-content">
        <div class="file-list"></div>
      </div>
    `;
    
    this.pathBar = this.container.querySelector('.path-bar');
    this.fileList = this.container.querySelector('.file-list');
    
    this.attachEventListeners();
    this.loadPath(this.currentPath);
    
    return this.container;
  }

  loadPath(path) {
    this.currentPath = path;
    this.pathBar.textContent = 'C:/' + path;
    
    const items = this.fs.listDirectory(path);
    this.fileList.innerHTML = '';
    
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'file-item';
      
      let iconEmoji;
      if (item.type === 'file') {
        const extension = item.name.split('.').pop().toLowerCase();
        iconEmoji = this.fileAssociation.getApplicationForExtension(extension)
          ? getFileIcon(item.name, item.type)
          : '❓';
      } else {
        iconEmoji = getFileIcon(item.name, item.type);
      }

      itemEl.innerHTML = `
        <span class="file-icon">${iconEmoji}</span>
        <span class="file-name">${item.name}</span>
      `;
      
      itemEl.addEventListener('dblclick', () => this.openItem(item));
      itemEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showItemContextMenu(e.clientX, e.clientY, item);
      });
      
      this.fileList.appendChild(itemEl);
    });
  }

  attachEventListeners() {
    this.container.querySelector('[data-action="back"]').addEventListener('click', () => {
      const parts = this.currentPath.split('/').filter(p => p);
      if (parts.length > 0) {
        parts.pop();
        this.loadPath(parts.join('/'));
      }
    });
    
    this.container.querySelector('[data-action="up"]').addEventListener('click', () => {
        const parts = this.currentPath.split('/').filter(p => p);
        if (parts.length > 0) {
          parts.pop();
          this.loadPath(parts.join('/'));
        }
    });
    
    this.container.querySelector('[data-action="newfolder"]').addEventListener('click', () => {
      const name = prompt(this.languageManager.getString('fe_prompt_folder_name', 'Folder name:'));
      if (name) {
        const result = this.fs.createFolder(this.currentPath, name);
        if (result.success) {
          this.loadPath(this.currentPath);
        } else {
          showError(this.languageManager.getString('error', 'Error'), result.error);
        }
      }
    });
    
    this.container.querySelector('[data-action="newfile"]').addEventListener('click', () => {
      const name = prompt(this.languageManager.getString('fe_prompt_file_name', 'File name:'), this.languageManager.getString('fe_default_file_name', 'New File.txt'));
      if (name) {
        const extension = name.split('.').pop() || 'txt';
        const result = this.fs.createFile(this.currentPath, name, '', extension);
        if (result.success) {
          this.loadPath(this.currentPath);
        } else {
          showError(this.languageManager.getString('error', 'Error'), result.error);
        }
      }
    });
  }

  openItem(item) {
    const fullPath = this.currentPath ? `${this.currentPath}/${item.name}` : item.name;
    if (item.type === 'folder') {
      this.loadPath(fullPath);
    } else if (item.type === 'file') {
      const result = this.fileAssociation.openFile(fullPath);
      if (!result.success) {
        showError(this.languageManager.getString('error', 'Error'), result.error);
      }
    }
  }

  showItemContextMenu(x, y, item) {
    const fullPath = this.currentPath ? `${this.currentPath}/${item.name}` : item.name;
    const lm = this.languageManager;
    const menuItems = [
      { label: lm.getString('fe_context_open', 'Open'), action: () => this.openItem(item) },
      {
        label: lm.getString('fe_context_open_with', 'Open with'),
        submenu: [
          { label: lm.getString('app_notepad_name', 'Notepad'), action: () => this.fileAssociation.openFileWith('Notepad', fullPath) }
        ]
      },
    ];
    showContextMenu(menuItems, x, y);
  }
}



