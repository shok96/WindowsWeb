export class BIOS {
    constructor(container, onExit, languageManager) {
        this.container = container;
        this.onExit = onExit;
        this.languageManager = languageManager;
        this.currentMenu = 'main';
        this.selectedIndex = 0;
        this.menus = this.getMenus();
        this.render();
        this.setupEventListeners();
    }

    getMenus() {
        const lm = this.languageManager;
        return {
            main: {
                title: lm.getString('bios_title_main', 'UEFI BIOS Setup'),
                items: [
                    { name: lm.getString('bios_menu_sysinfo', 'System Information'), key: 'cmos' },
                    { name: lm.getString('bios_menu_health', 'PC Health Status'), key: 'health' },
                    { name: lm.getString('bios_menu_save_exit', 'Save & Exit Setup'), key: 'save' },
                    { name: lm.getString('bios_menu_exit', 'Exit Without Saving'), key: 'exit' }
                ]
            },
            cmos: {
                title: lm.getString('bios_menu_sysinfo', 'System Information'),
                items: [
                    { name: lm.getString('bios_info_date', 'System Date'), value: '01/01/2025' },
                    { name: lm.getString('bios_info_time', 'System Time'), value: '00:00:00' },
                    { name: lm.getString('bios_info_cpu', 'CPU'), value: 'Andlancer Virtual CPU @ 3.00GHz' },
                    { name: lm.getString('bios_info_memory', 'Memory'), value: '8192 MB' },
                    { name: lm.getString('bios_info_storage', 'Storage'), value: 'VIRTUAL-HDD-1TB' },
                    { name: lm.getString('bios_info_optical', 'Optical Drive'), value: 'VIRTUAL-DVD-RW' },
                    { name: lm.getString('bios_menu_back', 'Back'), key: 'back' }
                ]
            },
            health: {
                title: lm.getString('bios_menu_health', 'PC Health Status'),
                items: [
                    { name: lm.getString('bios_health_cpu_temp', 'CPU Temperature'), value: '35°C' },
                    { name: lm.getString('bios_health_sys_temp', 'System Temperature'), value: '28°C' },
                    { name: lm.getString('bios_health_cpu_fan', 'CPU Fan Speed'), value: '2500 RPM' },
                    { name: lm.getString('bios_health_sys_fan', 'System Fan Speed'), value: '1800 RPM' },
                    { name: lm.getString('bios_health_cpu_volt', 'CPU Core Voltage'), value: '1.200V' },
                    { name: lm.getString('bios_health_mem_volt', 'Memory Voltage'), value: '1.500V' },
                    { name: lm.getString('bios_menu_back', 'Back'), key: 'back' }
                ]
            }
        };
    }

    render() {
        const menu = this.menus[this.currentMenu];
        const lm = this.languageManager;
        
        this.container.innerHTML = `
            <div class="bios-screen">
                <div class="bios-header">
                    <div class="bios-logo">AndlancerOS UEFI BIOS</div>
                    <div class="bios-version">${lm.getString('bios_version', 'Version 2.5.1 | Copyright (C) 2025, Andlancer Corp.')}</div>
                </div>
                <div class="bios-content">
                    <div class="bios-menu">
                        <div class="bios-title">${menu.title}</div>
                        <div class="bios-items">
                            ${menu.items.map((item, index) => `
                                <div class="bios-item ${index === this.selectedIndex ? 'selected' : ''}" 
                                     data-index="${index}">
                                    <span class="bios-item-name">${item.name}</span>
                                    ${item.value ? `<span class="bios-item-value">${item.value}</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="bios-footer">
                        <div class="bios-help">
                            <div class="bios-help-item"><span>↑↓</span> ${lm.getString('bios_help_move', 'Move')}</div>
                            <div class="bios-help-item"><span>${lm.getString('bios_help_click', 'Click')}</span> ${lm.getString('bios_help_select', 'Select')}</div>
                            <div class="bios-help-item"><span>ESC</span> ${lm.getString('bios_help_exit', 'Exit')}</div>
                            <div class="bios-help-item"><span>F10</span> ${lm.getString('bios_help_save_exit', 'Save & Exit')}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupMouseListeners();
    }

    setupEventListeners() {
        this.keyHandler = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.keyHandler);
    }
    
    setupMouseListeners() {
        const itemsContainer = this.container.querySelector('.bios-items');
        if (!itemsContainer) return;
        
        // Удаляем старые обработчики, если они есть
        if (this.mouseOverHandler) {
            itemsContainer.removeEventListener('mouseover', this.mouseOverHandler);
            itemsContainer.removeEventListener('click', this.mouseClickHandler);
        }
        
        // Делегирование события mouseover для выделения при наведении
        this.mouseOverHandler = (e) => {
            const item = e.target.closest('.bios-item');
            if (!item) return;
            
            const index = parseInt(item.getAttribute('data-index'));
            if (!isNaN(index) && index !== this.selectedIndex) {
                this.selectedIndex = index;
                this.render();
            }
        };
        
        // Делегирование события click для выбора элемента
        this.mouseClickHandler = (e) => {
            const item = e.target.closest('.bios-item');
            if (!item) return;
            
            const index = parseInt(item.getAttribute('data-index'));
            if (!isNaN(index)) {
                this.selectedIndex = index;
                this.handleSelect();
            }
        };
        
        itemsContainer.addEventListener('mouseover', this.mouseOverHandler);
        itemsContainer.addEventListener('click', this.mouseClickHandler);
    }

    handleKeyPress(e) {
        const menu = this.menus[this.currentMenu];
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + menu.items.length) % menu.items.length;
                this.render();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % menu.items.length;
                this.render();
                break;
            case 'Enter':
                e.preventDefault();
                this.handleSelect();
                break;
            case 'Escape':
                e.preventDefault();
                if (this.currentMenu === 'main') {
                    this.exit();
                } else {
                    this.currentMenu = 'main';
                    this.selectedIndex = 0;
                    this.render();
                }
                break;
            case 'F10':
                e.preventDefault();
                this.saveAndExit();
                break;
        }
    }

    handleSelect() {
        const menu = this.menus[this.currentMenu];
        const selectedItem = menu.items[this.selectedIndex];
        
        if (selectedItem.key === 'back') {
            this.currentMenu = 'main';
            this.selectedIndex = 0;
            this.render();
        } else if (selectedItem.key === 'exit') {
            this.exit();
        } else if (selectedItem.key === 'save') {
            this.saveAndExit();
        } else if (selectedItem.key && this.menus[selectedItem.key]) {
            this.currentMenu = selectedItem.key;
            this.selectedIndex = 0;
            this.render();
        }
    }

    saveAndExit() {
        // Временно удаляем основной обработчик
        document.removeEventListener('keydown', this.keyHandler);
        
        this.container.innerHTML = `
            <div class="bios-screen">
                <div class="bios-message">
                    <div class="bios-message-text">${this.languageManager.getString('bios_confirm_save', 'Save configuration and exit?')}</div>
                    <div class="bios-message-buttons">
                        <span>[Y] ${this.languageManager.getString('yes', 'Yes')}</span> <span>[N] ${this.languageManager.getString('no', 'No')}</span>
                    </div>
                </div>
            </div>
        `;
        
        const handleAnswer = (e) => {
            if (e.key === 'y' || e.key === 'Y') {
                document.removeEventListener('keydown', handleAnswer);
                this.exit();
            } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
                document.removeEventListener('keydown', handleAnswer);
                // Восстанавливаем основной обработчик
                document.addEventListener('keydown', this.keyHandler);
                this.render();
            }
        };
        
        document.addEventListener('keydown', handleAnswer);
    }

    exit() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        // Очищаем обработчики мыши
        const itemsContainer = this.container.querySelector('.bios-items');
        if (itemsContainer && this.mouseOverHandler && this.mouseClickHandler) {
            itemsContainer.removeEventListener('mouseover', this.mouseOverHandler);
            itemsContainer.removeEventListener('click', this.mouseClickHandler);
        }
        if (this.onExit) {
            this.onExit();
        }
    }
}

