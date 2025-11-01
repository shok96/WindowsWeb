export class PowerOnScreen {
    constructor(container, onPowerOn) {
        this.container = container;
        this.onPowerOn = onPowerOn;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="power-on-overlay">
                <button class="power-button" aria-label="Power On">
                    <svg class="power-icon" viewBox="0 0 64 64">
                        <path d="M32,12 C19.8497381,12 10,21.8497381 10,34 C10,46.1502619 19.8497381,56 32,56 C44.1502619,56 54,46.1502619 54,34 C54,21.8497381 44.1502619,12 32,12 Z M32,52 C22.0588745,52 14,43.9411255 14,34 C14,24.0588745 22.0588745,16 32,16 C41.9411255,16 50,24.0588745 50,34 C50,43.9411255 41.9411255,52 32,52 Z"></path>
                        <path d="M30,4 L30,24 L34,24 L34,4 L30,4 Z"></path>
                    </svg>
                </button>
            </div>
        `;

        this.container.querySelector('.power-button').addEventListener('click', () => {
            this.onPowerOn();
        });
    }
}
