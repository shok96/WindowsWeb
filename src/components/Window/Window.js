/**
 * Window - Компонент окна для Windows 11 Web OS
 * Поддержка drag & drop и resize с помощью interact.js
 */

import interact from 'interactjs';

export class Window {
  constructor(id, title, content, options = {}, eventBus) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.eventBus = eventBus;
    this.options = {
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      resizable: true,
      ...options
    };
    
    this.isMaximized = false;
    this.isMinimized = false;
    this.previousState = null;
    
    this.createElement();
    this.setupInteract();
    this.attachEventListeners();
  }

  /**
   * Создание элемента окна
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'window';
    this.element.id = this.id;
    this.element.style.width = this.options.width + 'px';
    this.element.style.height = this.options.height + 'px';
    this.element.style.zIndex = this.options.zIndex;
    this.element.style.opacity = '0';

    const centerX = (window.innerWidth - this.options.width) / 2;
    const centerY = (window.innerHeight - this.options.height - 48) / 2;
    const cascadeOffset = this.options.cascadeOffset || 0;
    const initialX = Math.max(0, centerX + cascadeOffset);
    const initialY = Math.max(0, centerY + cascadeOffset);

    this.element.style.transform = `translate(${initialX}px, ${initialY}px)`;
    this.element.setAttribute('data-x', initialX);
    this.element.setAttribute('data-y', initialY);

    this.element.innerHTML = `
      <div class="window-titlebar">
        <div class="window-title">${this.title}</div>
        <div class="window-controls">
          <button class="window-control minimize" data-action="minimize" title="Свернуть">
            <svg width="12" height="12" viewBox="0 0 12 12"><line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" stroke-width="1"/></svg>
          </button>
          <button class="window-control maximize" data-action="maximize" title="Развернуть">
            <svg width="12" height="12" viewBox="0 0 12 12"><rect x="0" y="0" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1"/></svg>
          </button>
          <button class="window-control close" data-action="close" title="Закрыть">
            <svg width="12" height="12" viewBox="0 0 12 12"><line x1="0" y1="0" x2="12" y2="12" stroke="currentColor" stroke-width="1"/><line x1="12" y1="0" x2="0" y2="12" stroke="currentColor" stroke-width="1"/></svg>
          </button>
        </div>
      </div>
      <div class="window-content"></div>
    `;
    
    const contentEl = this.element.querySelector('.window-content');
    if (typeof this.content === 'string') {
      contentEl.innerHTML = this.content;
    } else if (this.content instanceof HTMLElement) {
      contentEl.appendChild(this.content);
    }
  }

  /**
   * Настройка interact.js для drag & resize
   */
  setupInteract() {
    // Disable interact.js on mobile devices
    if (window.innerWidth <= 768) {
      this.element.classList.add('mobile');
      return;
    }

    interact(this.element)
      .draggable({
        allowFrom: '.window-titlebar',
        ignoreFrom: '.window-controls',
        listeners: {
          start: (event) => {
            document.body.classList.add('no-select');
            this.element.classList.add('interacting');
          },
          move: (event) => {
            if (this.isMaximized) return;

            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          },
          end: (event) => {
            document.body.classList.remove('no-select');
            this.element.classList.remove('interacting');
          }
        }
      })
      .resizable({
        // Увеличиваем чувствительность краев для ресайза
        edges: { 
          left: true, right: true, bottom: true, top: true,
        },
        listeners: {
          start: (event) => {
            document.body.classList.add('no-select');
            this.element.classList.add('interacting');
          },
          move: (event) => {
            if (this.isMaximized) return;

            const target = event.target;
            let x = parseFloat(target.getAttribute('data-x')) || 0;
            let y = parseFloat(target.getAttribute('data-y')) || 0;
            
            // Ограничиваем минимальные размеры
            const width = Math.max(this.options.minWidth, event.rect.width);
            const height = Math.max(this.options.minHeight, event.rect.height);

            target.style.width = `${width}px`;
            target.style.height = `${height}px`;

            // Обновляем позицию при ресайзе с левой/верхней стороны
            x += event.deltaRect.left;
            y += event.deltaRect.top;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          },
          end: (event) => {
            document.body.classList.remove('no-select');
            this.element.classList.remove('interacting');
          }
        },
        modifiers: [
          interact.modifiers.restrictSize({
            min: { width: this.options.minWidth, height: this.options.minHeight }
          })
        ],
        inertia: false // Отключаем инерцию для "резкости"
      });
  }

  /**
   * Прикрепление обработчиков событий
   */
  attachEventListeners() {
    this.element.querySelector('[data-action="minimize"]').addEventListener('click', () => this.options.onMinimize());
    this.element.querySelector('[data-action="maximize"]').addEventListener('click', () => this.toggleMaximize());
    this.element.querySelector('[data-action="close"]').addEventListener('click', () => this.options.onClose());
    this.element.addEventListener('mousedown', () => this.options.onFocus());
    
    const titlebar = this.element.querySelector('.window-titlebar');
    titlebar.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.window-controls')) {
        this.toggleMaximize();
      }
    });
  }

  toggleMaximize() {
    if (this.isMaximized) {
      this.restore();
    } else {
      this.maximize();
    }
    this.eventBus.emit('window:maximized', { windowId: this.id, isMaximized: this.isMaximized });
  }

  maximize() {
    if (this.isMaximized) return;
    
    this.previousState = {
      width: this.element.style.width,
      height: this.element.style.height,
      x: this.element.getAttribute('data-x'),
      y: this.element.getAttribute('data-y')
    };
    
    this.element.classList.add('maximized');
    this.element.style.width = '100vw';
    this.element.style.height = 'calc(100vh - 48px)';
    this.element.style.transform = 'translate(0, 0)';
    
    this.isMaximized = true;
    this.updateMaximizeIcon();
  }

  restore() {
    if (!this.isMaximized && !this.isMinimized) return;
    
    this.element.classList.remove('maximized', 'minimized');
    
    if (this.previousState) {
      this.element.style.width = this.previousState.width;
      this.element.style.height = this.previousState.height;
      this.element.style.transform = `translate(${this.previousState.x}px, ${this.previousState.y}px)`;
      this.element.setAttribute('data-x', this.previousState.x);
      this.element.setAttribute('data-y', this.previousState.y);
    }
    
    this.isMaximized = false;
    this.isMinimized = false;
    this.updateMaximizeIcon();
  }
  
  updateMaximizeIcon() {
    const maximizeBtn = this.element.querySelector('[data-action="maximize"]');
    if (this.isMaximized) {
      maximizeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="0" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/><rect x="0" y="2" width="10" height="10" fill="var(--bg-secondary)" stroke="currentColor" stroke-width="1"/></svg>`;
      maximizeBtn.title = 'Восстановить';
    } else {
      maximizeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12"><rect x="0" y="0" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;
      maximizeBtn.title = 'Развернуть';
    }
  }

  minimize() {
    this.element.classList.add('minimized');
    this.isMinimized = true;
  }

  focus() {
    this.element.classList.add('focused');
  }

  blur() {
    this.element.classList.remove('focused');
  }

  setZIndex(zIndex) {
    this.element.style.zIndex = zIndex;
  }

  setTitle(title) {
    this.title = title;
    const titleEl = this.element.querySelector('.window-title');
    if (titleEl) titleEl.textContent = title;
  }

  getContentContainer() {
    return this.element.querySelector('.window-content');
  }

  destroy() {
    this.element.classList.add('fade-out');
    setTimeout(() => {
      interact(this.element).unset();
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 200);
  }
}

