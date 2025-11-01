/**
 * ContextMenu - Контекстное меню для Windows 11 Web OS
 */

export class ContextMenu {
  constructor(items, eventBus) {
    this.items = items;
    this.eventBus = eventBus;
    this.element = null;
    this.currentSubmenu = null;
  }

  /**
   * Показать контекстное меню
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   */
  show(x, y) {
    this.hide(); // Закрыть предыдущее меню
    
    this.element = document.createElement('div');
    this.element.className = 'context-menu acrylic';
    
    // Корректировка позиции если меню выходит за пределы экрана
    const menuWidth = 200;
    const menuHeight = this.items.length * 32;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';
    
    this.renderItems(this.items, this.element);
    
    document.body.appendChild(this.element);
    
    // Анимация появления
    requestAnimationFrame(() => {
      this.element.classList.add('visible');
    });
    
    // Закрытие при клике вне меню
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
      document.addEventListener('contextmenu', this.handleOutsideClick);
    }, 0);
  }

  /**
   * Рендеринг элементов меню
   * @param {Array} items - Элементы меню
   * @param {HTMLElement} container - Контейнер
   */
  renderItems(items, container) {
    items.forEach(item => {
      if (item.type === 'separator') {
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        container.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        
        if (item.disabled) {
          menuItem.classList.add('disabled');
        }
        
        if (item.icon) {
          const icon = document.createElement('span');
          icon.className = 'context-menu-icon';
          icon.textContent = item.icon;
          menuItem.appendChild(icon);
        }
        
        const label = document.createElement('span');
        label.className = 'context-menu-label';
        label.textContent = item.label;
        menuItem.appendChild(label);
        
        if (item.shortcut) {
          const shortcut = document.createElement('span');
          shortcut.className = 'context-menu-shortcut';
          shortcut.textContent = item.shortcut;
          menuItem.appendChild(shortcut);
        }
        
        if (item.submenu) {
          menuItem.classList.add('has-submenu');
          const arrow = document.createElement('span');
          arrow.className = 'context-menu-arrow';
          arrow.textContent = '▶';
          menuItem.appendChild(arrow);
          
          menuItem.addEventListener('mouseenter', (e) => {
            this.showSubmenu(item.submenu, menuItem);
          });
        }
        
        if (!item.disabled) {
          menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.action && !item.submenu) {
              item.action();
              this.hide();
            }
          });
        }
        
        container.appendChild(menuItem);
      }
    });
  }

  /**
   * Показать подменю
   * @param {Array} items - Элементы подменю
   * @param {HTMLElement} parentItem - Родительский элемент
   */
  showSubmenu(items, parentItem) {
    // Удалить предыдущее подменю
    if (this.currentSubmenu) {
      this.currentSubmenu.remove();
    }
    
    const submenu = document.createElement('div');
    submenu.className = 'context-menu context-submenu acrylic';
    
    const rect = parentItem.getBoundingClientRect();
    submenu.style.left = rect.right + 'px';
    submenu.style.top = rect.top + 'px';
    
    this.renderItems(items, submenu);
    document.body.appendChild(submenu);
    
    requestAnimationFrame(() => {
      submenu.classList.add('visible');
    });
    
    this.currentSubmenu = submenu;
  }

  /**
   * Скрыть контекстное меню
   */
  hide() {
    if (this.element) {
      this.element.classList.remove('visible');
      setTimeout(() => {
        if (this.element) {
          this.element.remove();
          this.element = null;
        }
      }, 200);
    }
    
    if (this.currentSubmenu) {
      this.currentSubmenu.remove();
      this.currentSubmenu = null;
    }
    
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('contextmenu', this.handleOutsideClick);
  }

  /**
   * Обработчик клика вне меню
   */
  handleOutsideClick = (e) => {
    if (this.element && !this.element.contains(e.target) &&
        (!this.currentSubmenu || !this.currentSubmenu.contains(e.target))) {
      e.preventDefault();
      this.hide();
    }
  };
}

let activeMenu = null;

/**
 * Глобальная функция для показа контекстного меню.
 * Скрывает любое предыдущее активное меню.
 * @param {Array} items - Элементы меню
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @param {EventBus} eventBus - Шина событий
 */
export function showContextMenu(items, x, y, eventBus) {
  hideContextMenu(); // Close any existing menu first
  
  const menu = new ContextMenu(items, eventBus);
  menu.show(x, y);
  activeMenu = menu;
}

/**
 * Глобальная функция для скрытия активного контекстного меню.
 */
export function hideContextMenu() {
    if (activeMenu) {
        activeMenu.hide();
        activeMenu = null;
    }
}


