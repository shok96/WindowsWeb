export class BootScreen {
    constructor(container, onComplete, onBIOSEnter) {
        this.container = container;
        this.onComplete = onComplete;
        this.onBIOSEnter = onBIOSEnter;
        this.biosEntered = false;
        this.bootCompleted = false;
        this.lines = [
            'AndlancerOS BIOS v2.5.1',
            'Copyright (C) 2025, Andlancer Corp.',
            '',
            'Initializing USB Controllers ... Done',
            'Initializing IDE/SATA Devices ... Done',
            '  SATA Port 1: VIRTUAL-HDD-1TB',
            '  SATA Port 2: VIRTUAL-DVD-RW',
            'Memory Test: 8192MB OK',
            'CPU: Andlancer Virtual CPU @ 3.00GHz',
            '',
            'Detecting Plug & Play Devices ...',
            '  Found Mouse on PS/2 Port',
            '  Found Keyboard on PS/2 Port',
            '  Found GPU: Virtual VGA Adapter',
            '',
            'Loading AndlancerOS from VIRTUAL-HDD-1TB...',
            'Starting boot sequence...'
        ];
        this.currentLine = 0;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="bootscreen">
                <pre class="bootscreen-output"></pre>
                <div class="bootscreen-hint">Press DEL to enter BIOS Setup</div>
            </div>
        `;
        this.outputElement = this.container.querySelector('.bootscreen-output');
        this.setupKeyListener();
        this.startBootSequence();
    }

    setupKeyListener() {
        const keyHandler = (e) => {
            if (e.key === 'Delete' && !this.bootCompleted && !this.biosEntered) {
                e.preventDefault();
                this.biosEntered = true;
                document.removeEventListener('keydown', keyHandler);
                if (this.onBIOSEnter) {
                    this.onBIOSEnter();
                }
            }
        };
        document.addEventListener('keydown', keyHandler);
    }

    startBootSequence() {
        const interval = setInterval(() => {
            if (this.biosEntered) {
                clearInterval(interval);
                return;
            }
            if (this.currentLine < this.lines.length) {
                this.outputElement.textContent += this.lines[this.currentLine] + '\n';
                this.currentLine++;
            } else {
                clearInterval(interval);
                this.bootCompleted = true;
                if (!this.biosEntered) {
                    setTimeout(() => {
                        this.container.classList.add('fade-out');
                        setTimeout(this.onComplete, 500);
                    }, 1000);
                }
            }
        }, 150);
    }
}

