export class CatapultGame {
    constructor(hakerOs) {
        this.hakerOs = hakerOs;
        this.terminal = hakerOs.container.querySelector('.hakeros-terminal');
        this.output = this.terminal.querySelector('.hakeros-output');
        this.input = this.terminal.querySelector('.hakeros-input');
        this.prompt = this.terminal.querySelector('.hakeros-prompt');
        this.originalPrompt = this.prompt.textContent;
        
        this.gameActive = false;
        this.inputHandler = this.handleInput.bind(this);
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.endGame("Game aborted. Returning to terminal.");
            }
        };

        // Game world properties
        this.width = 80;
        this.height = 24;
        this.castlePosition = { x: 70, y: this.height - 4 };
    }

    start() {
        this.gameActive = true;
        this.hakerOs.detachMainInputListener();
        document.body.classList.add('game-mode');
        
        this.output.innerHTML = ''; // Clear the screen

        this.gameScreen = document.createElement('pre');
        this.gameScreen.style.fontFamily = "'Courier New', Courier, monospace";
        this.gameScreen.style.fontSize = '16px';
        this.gameScreen.style.lineHeight = '1';
        this.output.appendChild(this.gameScreen);

        document.addEventListener('keydown', this.escapeHandler);
        this.input.addEventListener('keydown', this.inputHandler);
        
        this.newRound();
    }

    newRound() {
        this.drawInitialScene();
        this.gameState = 'angle';
        this.prompt.style.display = 'inline';
        this.input.style.display = 'inline';
        this.prompt.textContent = 'Enter angle (1-90): ';
        this.input.focus();
    }

    endGame(message = "Thanks for playing!") {
        if (!this.gameActive) return;
        this.gameActive = false;

        clearInterval(this.animationInterval);
        document.removeEventListener('keydown', this.escapeHandler);
        this.input.removeEventListener('keydown', this.inputHandler);
        document.body.classList.remove('game-mode');

        this.output.innerHTML = '';
        this.hakerOs.typewriterEffect(message, this.output, () => {
            this.prompt.style.display = 'inline';
            this.input.style.display = 'inline';
            this.prompt.textContent = this.originalPrompt;
            this.hakerOs.attachMainInputListener();
            this.input.focus();
        });
    }

    drawInitialScene() {
        const buffer = this.createScreenBuffer();
        this.drawScenery(buffer);
        this.renderScreen(buffer);
    }
    
    handleInput(e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        
        const value = this.input.value;
        this.input.value = '';

        if (this.gameState === 'angle') {
            this.angle = parseInt(value, 10);
            if (isNaN(this.angle) || this.angle < 1 || this.angle > 90) {
                this.prompt.textContent = 'Invalid angle (1-90). Try again: ';
                return;
            }
            this.gameState = 'power';
            this.prompt.textContent = 'Enter power (1-100): ';
        } else if (this.gameState === 'power') {
            this.power = parseInt(value, 10);
            if (isNaN(this.power) || this.power < 1 || this.power > 100) {
                this.prompt.textContent = 'Invalid power (1-100). Try again: ';
                return;
            }
            this.gameState = 'result';
            this.fire();
        }
    }

    fire() {
        this.prompt.style.display = 'none';
        this.input.style.display = 'none';

        let proj = { x: 4, y: this.height - 4 };
        const rad = this.angle * (Math.PI / 180);
        let velX = (this.power / 12) * Math.cos(rad); // Adjusted for better feel
        let velY = -(this.power / 12) * Math.sin(rad) * 0.5; // Y velocity feels better when smaller
        const gravity = 0.02;

        this.animationInterval = setInterval(() => {
            proj.x += velX;
            proj.y += velY;
            velY += gravity;

            const buffer = this.createScreenBuffer();
            this.drawScenery(buffer);
            
            const px = Math.round(proj.x);
            const py = Math.round(proj.y);
            if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                buffer[py][px] = '*';
            }
            this.renderScreen(buffer);

            if (py >= this.height - 1) {
                clearInterval(this.animationInterval);
                this.showResult(px);
            }
        }, 50);
    }

    showResult(distance) {
        let message;
        if (distance >= this.castlePosition.x && distance < this.castlePosition.x + 6) {
            message = "DIRECT HIT! YOU WIN! Play again?";
        } else if (Math.abs(distance - this.castlePosition.x) < 10) {
            message = `So close! Your shot landed at ${distance}m. Try again!`;
        } else {
            message = `A wild miss! Your shot landed at ${distance}m. Try again!`;
        }
        
        const buffer = this.createScreenBuffer();
        this.drawScenery(buffer);
        this.drawText(buffer, message, Math.floor(this.width / 2 - message.length / 2), Math.floor(this.height / 2));
        this.renderScreen(buffer);
        
        setTimeout(() => this.newRound(), 3000);
    }

    createScreenBuffer() {
        return Array.from({ length: this.height }, () => Array(this.width).fill(' '));
    }

    drawScenery(buffer) {
        // Ground
        for (let i = 0; i < this.width; i++) buffer[this.height - 1][i] = '=';
        
        // Catapult
        buffer[this.height - 2][2] = '/'; buffer[this.height - 2][3] = '_'; buffer[this.height - 2][4] = '_'; buffer[this.height - 2][5] = '\\';
        buffer[this.height - 3][3] = '/'; buffer[this.height - 3][4] = ' '; buffer[this.height - 3][5] = 'O';
        buffer[this.height - 4][4] = '/';
        
        // Castle
        const cx = this.castlePosition.x;
        const cy = this.castlePosition.y;
        buffer[cy][cx] = '|'; buffer[cy][cx+1] = '_'; buffer[cy][cx+2] = '|'; buffer[cy][cx+3] = '_'; buffer[cy][cx+4] = '|';
        buffer[cy+1][cx] = '|'; buffer[cy+1][cx+1] = ' '; buffer[cy+1][cx+2] = '_'; buffer[cy+1][cx+3] = ' '; buffer[cy+1][cx+4] = '|';
        buffer[cy+2][cx] = '|'; buffer[cy+2][cx+1] = '_'; buffer[cy+2][cx+2] = '_'; buffer[cy+2][cx+3] = '_'; buffer[cy+2][cx+4] = '|';
    }

    drawText(buffer, text, x, y) {
        for (let i = 0; i < text.length; i++) {
            if (x + i < this.width) {
                buffer[y][x + i] = text[i];
            }
        }
    }

    renderScreen(buffer) {
        this.gameScreen.textContent = buffer.map(row => row.join('')).join('\n');
    }
}
