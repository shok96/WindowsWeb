/**
 * Notepad - Простой текстовый редактор
 */

export class Notepad {
  constructor(params = {}) {
    if (params.filePath) {
      const parts = params.filePath.split('/');
      this.fileName = parts.pop();
      this.path = parts.join('/');
    } else {
      this.path = params.path || 'Documents';
      this.fileName = params.fileName || 'Untitled.txt';
    }
    this.content = '';
    this.isDirty = false;
    this.languageManager = null;
  }

  render(fileSystem, languageManager) {
    this.languageManager = languageManager;
    const lm = languageManager;
    const container = document.createElement('div');
    container.className = 'notepad-app';
    container.innerHTML = `
      <div class="notepad-toolbar">
        <button class="toolbar-btn" data-action="new">${lm.getString('notepad_new', 'New')}</button>
        <button class="toolbar-btn" data-action="save">${lm.getString('notepad_save', 'Save')}</button>
      </div>
      <textarea class="notepad-textarea" placeholder="${lm.getString('notepad_placeholder', 'Start typing...')}"></textarea>
    `;
    
    const textarea = container.querySelector('.notepad-textarea');
    
    // Загрузить содержимое файла если он существует
    if (this.fileName !== 'Untitled.txt') {
      const content = fileSystem.getFileContent(this.path, this.fileName);
      if (content !== null) {
        textarea.value = content;
        this.content = content;
      }
    }
    
    // Отслеживание изменений
    textarea.addEventListener('input', () => {
      this.content = textarea.value;
      this.isDirty = true;
    });
    
    // Кнопки
    container.querySelector('[data-action="new"]').addEventListener('click', () => {
      if (this.isDirty && !confirm(lm.getString('notepad_confirm_unsaved', 'Unsaved changes will be lost. Continue?'))) return;
      textarea.value = '';
      this.content = '';
      this.fileName = 'Untitled.txt';
      this.isDirty = false;
    });
    
    container.querySelector('[data-action="save"]').addEventListener('click', () => {
      const result = fileSystem.updateFileContent(this.path, this.fileName, this.content);
      if (result.success) {
        this.isDirty = false;
        alert(lm.getString('notepad_alert_saved', 'File saved!'));
      } else {
        // Создать новый файл
        const name = prompt(lm.getString('notepad_prompt_filename', 'Enter file name:'), this.fileName);
        if (name) {
          const createResult = fileSystem.createFile(this.path, name, this.content, 'text');
          if (createResult.success) {
            this.fileName = name;
            this.isDirty = false;
            alert(lm.getString('notepad_alert_created', 'File created!'));
          }
        }
      }
    });
    
    return container;
  }
}



