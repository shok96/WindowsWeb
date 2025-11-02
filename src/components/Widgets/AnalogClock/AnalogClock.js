import interact from 'interactjs';

export class AnalogClockWidget {
    constructor(container) {
        this.container = container;
        this.element = null;
        this.clockInterval = null;
        this.resizeObserver = null;
        this.marks = [];
        this.numbers = [];

        this.render();
        this.updateClock();
        this.setupInteract();
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'analog-clock-widget';
        this.element.innerHTML = `
            <div class="clock-face">
                <div class="hand hour-hand"></div>
                <div class="hand minute-hand"></div>
                <div class="hand second-hand"></div>
                <div class="center-dot"></div>
            </div>
        `;

        this.clockFace = this.element.querySelector('.clock-face');

        // Create marks once
        for (let i = 0; i < 60; i++) {
            const mark = document.createElement('div');
            mark.className = 'clock-mark';
            if (i % 5 === 0) mark.classList.add('hour-mark');
            this.clockFace.appendChild(mark);
            this.marks.push(mark);
        }

        // Create numbers once
        for (let i = 1; i <= 12; i++) {
            const number = document.createElement('div');
            number.className = 'clock-number';
            number.textContent = i;
            this.clockFace.appendChild(number);
            this.numbers.push(number);
        }

        this.container.appendChild(this.element);

        this.hourHand = this.element.querySelector('.hour-hand');
        this.minuteHand = this.element.querySelector('.minute-hand');
        this.secondHand = this.element.querySelector('.second-hand');

        // Initial layout and resize observer
        this.layout();
        this.resizeObserver = new ResizeObserver(() => this.layout());
        this.resizeObserver.observe(this.element);

        // Set initial position using left/top like desktop icons
        const parentRect = this.container.getBoundingClientRect();
        const initialX = parentRect.width - 240 - 50; // parentWidth - selfWidth - offset
        const initialY = 50;

        this.element.style.left = `${initialX}px`;
        this.element.style.top = `${initialY}px`;
        this.element.setAttribute('data-x', initialX);
        this.element.setAttribute('data-y', initialY);

        this.clockInterval = setInterval(() => this.updateClock(), 1000);
    }

    layout() {
        const rect = this.element.getBoundingClientRect();
        const radius = Math.min(rect.width, rect.height) / 2;

        // Position marks very close to the edge
        const markPaddingFromEdge = 0;
        const markRadius = radius - markPaddingFromEdge;

        // Lengths for hands
        const hourLen = radius * 0.45;
        const minuteLen = radius * 0.65;
        const secondLen = radius * 0.78;
        this.hourHand.style.height = `${hourLen}px`;
        this.minuteHand.style.height = `${minuteLen}px`;
        this.secondHand.style.height = `${secondLen}px`;

        // Make font size responsive
        const fontSize = Math.max(13, radius * 0.13);

        // Position numbers just inside the circle of hour marks
        const numberPaddingFromMarks = 12;
        const numberRadius = markRadius - numberPaddingFromMarks;

        this.numbers.forEach((el, idx) => {
            const i = idx + 1;
            el.style.fontSize = `${fontSize}px`;
            const angleDeg = (i / 12) * 360 - 90;
            const angle = angleDeg * Math.PI / 180;
            const x = numberRadius * Math.cos(angle);
            const y = numberRadius * Math.sin(angle);
            el.style.left = `calc(50% + ${x}px)`;
            el.style.top = `calc(50% + ${y}px)`;
        });

        // Position marks
        this.marks.forEach((el, i) => {
            const angleDeg = i * 6;
            el.style.transform = `rotate(${angleDeg}deg) translateY(${-markRadius}px)`;
        });
    }

    updateClock() {
        const now = new Date();
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        const secondsAngle = seconds * 6; // 360/60
        const minutesAngle = minutes * 6 + seconds * 0.1; // smooth minute hand
        const hoursAngle = (hours % 12) * 30 + minutes * 0.5; // 360/12 + smooth

        this.secondHand.style.transform = `translate(-50%, 0) rotate(${secondsAngle}deg)`;
        this.minuteHand.style.transform = `translate(-50%, 0) rotate(${minutesAngle}deg)`;
        this.hourHand.style.transform = `translate(-50%, 0) rotate(${hoursAngle}deg)`;
    }
    
    setupInteract() {
        interact(this.element).draggable({
            listeners: {
                move: (event) => {
                    // Exactly like desktop icons
                    const x = (parseFloat(this.element.getAttribute('data-x')) || parseFloat(this.element.style.left) || 0) + event.dx;
                    const y = (parseFloat(this.element.getAttribute('data-y')) || parseFloat(this.element.style.top) || 0) + event.dy;

                    this.element.style.left = `${x}px`;
                    this.element.style.top = `${y}px`;
                    this.element.setAttribute('data-x', x);
                    this.element.setAttribute('data-y', y);
                }
            }
        });
    }

    destroy() {
        clearInterval(this.clockInterval);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        interact(this.element).unset();
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
