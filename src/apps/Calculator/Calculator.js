/**
 * Calculator - Калькулятор
 */

export class Calculator {
  constructor() {
    this.display = '0';
    this.currentValue = 0;
    this.previousValue = 0;
    this.operation = null;
    this.shouldResetDisplay = false;
    this.languageManager = null;
  }

  render(languageManager) {
    this.languageManager = languageManager;
    const lm = this.languageManager;

    const container = document.createElement('div');
    container.className = 'calculator-app';
    container.innerHTML = `
      <div class="calculator-display">${this.display}</div>
      <div class="calculator-buttons">
        <button data-action="clear" title="${lm.getString('calculator_clear', 'Clear')}">C</button>
        <button data-action="operator" data-value="/" title="${lm.getString('calculator_divide', 'Divide')}">÷</button>
        <button data-action="operator" data-value="*" title="${lm.getString('calculator_multiply', 'Multiply')}">×</button>
        <button data-action="backspace" title="${lm.getString('calculator_backspace', 'Backspace')}">⌫</button>
        
        <button data-action="number" data-value="7">7</button>
        <button data-action="number" data-value="8">8</button>
        <button data-action="number" data-value="9">9</button>
        <button data-action="operator" data-value="-" title="${lm.getString('calculator_subtract', 'Subtract')}">−</button>
        
        <button data-action="number" data-value="4">4</button>
        <button data-action="number" data-value="5">5</button>
        <button data-action="number" data-value="6">6</button>
        <button data-action="operator" data-value="+" title="${lm.getString('calculator_add', 'Add')}">+</button>
        
        <button data-action="number" data-value="1">1</button>
        <button data-action="number" data-value="2">2</button>
        <button data-action="number" data-value="3">3</button>
        <button data-action="equals" class="equals" title="${lm.getString('calculator_equals', 'Equals')}">=</button>
        
        <button data-action="number" data-value="0" class="zero">0</button>
        <button data-action="number" data-value=".">.</button>
      </div>
    `;
    
    const displayEl = container.querySelector('.calculator-display');
    
    container.querySelectorAll('[data-action="number"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        if (this.shouldResetDisplay) {
          this.display = value;
          this.shouldResetDisplay = false;
        } else {
          this.display = this.display === '0' ? value : this.display + value;
        }
        displayEl.textContent = this.display;
      });
    });
    
    container.querySelectorAll('[data-action="operator"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleOperator(btn.dataset.value);
        displayEl.textContent = this.display;
      });
    });
    
    container.querySelector('[data-action="equals"]').addEventListener('click', () => {
      this.calculate();
      displayEl.textContent = this.display;
    });
    
    container.querySelector('[data-action="clear"]').addEventListener('click', () => {
      this.display = '0';
      this.currentValue = 0;
      this.previousValue = 0;
      this.operation = null;
      displayEl.textContent = this.display;
    });
    
    container.querySelector('[data-action="backspace"]').addEventListener('click', () => {
      this.display = this.display.length > 1 ? this.display.slice(0, -1) : '0';
      displayEl.textContent = this.display;
    });
    
    return container;
  }

  handleOperator(op) {
    this.currentValue = parseFloat(this.display);
    if (this.operation && !this.shouldResetDisplay) {
      this.calculate();
    }
    this.operation = op;
    this.previousValue = this.currentValue;
    this.shouldResetDisplay = true;
  }

  calculate() {
    if (!this.operation) return;
    
    this.currentValue = parseFloat(this.display);
    let result = 0;
    
    switch (this.operation) {
      case '+': result = this.previousValue + this.currentValue; break;
      case '-': result = this.previousValue - this.currentValue; break;
      case '*': result = this.previousValue * this.currentValue; break;
      case '/': result = this.previousValue / this.currentValue; break;
    }
    
    this.display = String(result);
    this.operation = null;
    this.shouldResetDisplay = true;
  }
}



