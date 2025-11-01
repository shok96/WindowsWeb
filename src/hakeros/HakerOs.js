import { CatapultGame } from './games/Catapult.js';
import './HakerOs.css';

export class HakerOs {
    constructor(container, osInstance = null) {
        this.container = container;
        this.osInstance = osInstance; // Store reference to main OS instance
        this.history = [];
        this.historyIndex = -1;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="hakeros-terminal">
                <div class="hakeros-output"></div>
                <div class="hakeros-input-line">
                    <span class="hakeros-prompt">&gt;</span>
                    <input type="text" class="hakeros-input" autofocus />
                </div>
            </div>
        `;

        this.inputElement = this.container.querySelector('.hakeros-input');
        this.outputElement = this.container.querySelector('.hakeros-output');

        this.attachMainInputListener();

        this.typewriterEffect("Welcome to HakerOs...", this.outputElement, () => {
             this.typewriterEffect("Type 'help' for a list of commands.", this.outputElement);
        });
    }

    mainInputHandler = (e) => {
        if (e.key === 'Enter') {
            const command = this.inputElement.value;
            if (command.trim() !== '') {
                this.history.push(command);
            }
            this.historyIndex = this.history.length;
            this.handleCommand(command, this.outputElement);
            this.inputElement.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputElement.value = this.history[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.inputElement.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = this.history.length;
                this.inputElement.value = '';
            }
        }
    }

    attachMainInputListener() {
        this.inputElement.addEventListener('keydown', this.mainInputHandler);
    }

    detachMainInputListener() {
        this.inputElement.removeEventListener('keydown', this.mainInputHandler);
    }

    handleCommand(command, outputElement) {
        const outputLine = document.createElement('div');
        outputLine.textContent = `> ${command}`;
        outputElement.appendChild(outputLine);

        // Simple command handler
        switch (command.toLowerCase().split(' ')[0]) {
            case 'help':
                this.typewriterEffect("Available commands: help, clear, matrix, date, whoami, ls, cat, scan, neofetch, echo, history, game, reboot, shutdown", outputElement);
                break;
            case 'clear':
                outputElement.innerHTML = '';
                break;
            case 'matrix':
                this.runMatrix(outputElement);
                break;
            case 'date':
                this.typewriterEffect(new Date().toString(), outputElement);
                break;
            case 'whoami':
                this.typewriterEffect("root", outputElement);
                break;
            case 'ls':
                this.typewriterEffect("bin   etc   home   var   root", outputElement);
                break;
            case 'cat':
                this.handleCat(command, outputElement);
                break;
            case 'scan':
                this.handleScan(command, outputElement);
                break;
            case 'neofetch':
                this.handleNeofetch(outputElement);
                break;
            case 'echo':
                this.typewriterEffect(command.substring(5), outputElement);
                break;
            case 'history':
                this.history.forEach((cmd, i) => {
                    this.typewriterEffect(`${i}: ${cmd}`, outputElement);
                });
                break;
            case 'game':
                this.handleGame(command, outputElement);
                break;
            case 'reboot':
                // Перезагрузка через полную последовательность загрузки (BootScreen -> BIOS -> OSSelection)
                // Используем параметр restart, чтобы запустить showBootScreen как в основной системе
                window.location.href = window.location.pathname + '?restart=true';
                break;
            case 'shutdown':
                document.body.innerHTML = '<div style="background: black; color: white; font-family: monospace; font-size: 24px; text-align: center; padding-top: 20%; height: 100vh;">It is now safe to turn off your computer.</div>';
                break;
            default:
                if (command.trim() !== '') {
                    this.typewriterEffect(`Command not found: ${command}`, outputElement);
                }
                break;
        }
        outputElement.scrollTop = outputElement.scrollHeight;
    }

    typewriterEffect(text, element, callback) {
        let i = 0;
        const line = document.createElement('div');
        element.appendChild(line);

        const typing = () => {
            if (i < text.length) {
                line.textContent += text.charAt(i);
                i++;
                setTimeout(typing, 50);
            } else if (callback) {
                callback();
            }
        };
        typing();
    }

    handleGame(command, outputElement) {
        const parts = command.split(' ');
        if (parts.length < 2) {
            this.typewriterEffect("Usage: game <gamename>. Available: catapult", outputElement);
            return;
        }
        const gameName = parts[1].toLowerCase();
        
        if (gameName === 'catapult') {
            const game = new CatapultGame(this);
            game.start();
        } else {
            this.typewriterEffect(`Game "${gameName}" not found.`, outputElement);
        }
    }

    handleCat(command, outputElement) {
        const parts = command.split(' ');
        if (parts.length < 2) {
            this.typewriterEffect("Usage: cat <filename>", outputElement);
            return;
        }
        const filename = parts[1];
        const files = {
            'readme.txt': 'HakerOs v0.1 - A simulation.',
            'secrets.txt': 'The password is... password.'
        };
        const content = files[filename] || `cat: ${filename}: No such file or directory`;
        this.typewriterEffect(content, outputElement);
    }

    handleScan(command, outputElement) {
        const parts = command.split(' ');
        if (parts.length < 2) {
            this.typewriterEffect("Usage: scan <host>", outputElement);
            return;
        }
        const host = parts[1];
        this.typewriterEffect(`Scanning ${host}...`, outputElement, () => {
            setTimeout(() => this.typewriterEffect("22/tcp OPEN ssh", outputElement), 500);
            setTimeout(() => this.typewriterEffect("80/tcp OPEN http", outputElement), 1000);
            setTimeout(() => this.typewriterEffect("443/tcp OPEN https", outputElement), 1500);
            setTimeout(() => this.typewriterEffect("Scan complete.", outputElement), 2000);
        });
    }

    handleNeofetch(outputElement) {
        const asciiLogo = [
            "  /\\_/\\  ",
            " ( o.o ) ",
            "  > ^ <  "
        ];
        const info = [
            "OS: HakerOs 0.1 x86_64",
            "Host: Virtual Machine",
            "Kernel: 5.4.0-haker",
            "Uptime: 42 mins",
            "Shell: bash 5.0.17",
            "CPU: Intel Core i9 (16) @ 5.0GHz",
            "GPU: NVIDIA GeForce RTX 4090",
            "Memory: 12MiB / 65488MiB"
        ];
        
        const output = asciiLogo.map((line, i) => {
            return `${line}   ${info[i] || ''}`;
        }).join('\\n');

        this.typewriterEffect(output.replace(/\\n/g, '\\n'), outputElement);
    }

    runMatrix(outputElement) {
        const canvas = document.createElement('canvas');
        const container = document.querySelector('body.hakeros'); // Append to body
        if (!container) {
            console.error("HakerOs container not found!");
            return;
        }
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*()';
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = letters[Math.floor(Math.random() * letters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        const intervalId = setInterval(draw, 33);

        const stopMatrix = () => {
            clearInterval(intervalId);
            if (container.contains(canvas)) {
                container.removeChild(canvas);
            }
            document.removeEventListener('keydown', stopMatrix);
        };
        
        this.typewriterEffect("Starting matrix effect... Press any key to stop.", outputElement, () => {
            document.addEventListener('keydown', stopMatrix, { once: true });
        });
    }
}
