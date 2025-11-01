import './OSSelectionScreen.css';

export class OSSelectionScreen {
    constructor(container, onSelect) {
        this.container = container;
        this.onSelect = onSelect;
        this.timer = null;
        this.countdown = 5;
        this.selectedOSIndex = 0;
        this.osOptions = ['AndlancerOS', 'HakerOs'];

        this.render();
        this.startCountdown();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="os-selection-screen">
                <div class="os-window">
                    <div class="os-window-header">
                        <span class="os-window-title">Andlancer Boot Manager</span>
                    </div>
                    <div class="os-window-body">
                        <div class="os-window-prompt">Select the operating system to start:</div>
                        <div class="os-menu">
                            <div class="os-menu-item${this.selectedOSIndex === 0 ? ' selected' : ''}" data-os="AndlancerOS">
                                <span class="os-menu-indicator">></span>
                                <span class="os-menu-text">AndlancerOS</span>
                            </div>
                            <div class="os-menu-item${this.selectedOSIndex === 1 ? ' selected' : ''}" data-os="HakerOs">
                                <span class="os-menu-indicator">></span>
                                <span class="os-menu-text">HakerOs</span>
                            </div>
                        </div>
                        <div class="os-window-footer">
                            <span class="os-help-text">Use ↑ ↓ or click to select, ENTER to boot</span>
                            <span class="os-timer-text">Auto-boot in <span id="countdown-timer">5</span> seconds</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.optionsElements = this.container.querySelectorAll('.os-menu-item');
        this.countdownElement = document.getElementById('countdown-timer');
        this.updateSelection();

        // Add click handlers for mouse support
        this.optionsElements.forEach((option, index) => {
            option.addEventListener('click', () => {
                this.selectedOSIndex = index;
                this.updateSelection();
                clearInterval(this.timer);
                const timerText = this.container.querySelector('.os-timer-text');
                if (timerText) timerText.style.display = 'none';
                this.stopCountdownAndSelect(option.dataset.os);
            });
        });
    }

    updateSelection() {
        this.optionsElements.forEach((option, index) => {
            if (index === this.selectedOSIndex) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    startCountdown() {
        this.timer = setInterval(() => {
            this.countdown--;
            if (this.countdownElement) {
                this.countdownElement.textContent = this.countdown;
            }
            if (this.countdown <= 0) {
                this.stopCountdownAndSelect();
            }
        }, 1000);
    }

    stopCountdownAndSelect(os) {
        clearInterval(this.timer);
        this.removeEventListeners();
        this.onSelect(os || this.osOptions[this.selectedOSIndex]);
    }

    attachEventListeners() {
        this.keyDownHandler = (e) => {
            clearInterval(this.timer);
            const timerText = this.container.querySelector('.os-timer-text');
            if (timerText) timerText.style.display = 'none';

            let newIndex = this.selectedOSIndex;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                newIndex = (this.selectedOSIndex - 1 + this.osOptions.length) % this.osOptions.length;
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                newIndex = (this.selectedOSIndex + 1) % this.osOptions.length;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.stopCountdownAndSelect();
                return;
            }

            if (newIndex !== this.selectedOSIndex) {
                this.selectedOSIndex = newIndex;
                this.updateSelection();
            }
        };

        document.addEventListener('keydown', this.keyDownHandler);
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.keyDownHandler);
    }
}


