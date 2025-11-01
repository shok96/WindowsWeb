/**
 * LoginScreen - Экран входа для AndlancerOS
 */

export class LoginScreen {
  constructor(container, eventBus, languageManager) {
    this.container = container;
    this.eventBus = eventBus;
    this.languageManager = languageManager;
    this.render();
  }

  render() {
    // Создаем частицы для фона
    const particles = Array.from({ length: 6 }, (_, i) => 
      `<div class="login-particle" style="
        left: ${Math.random() * 100}%; 
        top: ${Math.random() * 100}%; 
        animation-delay: ${Math.random() * 2}s;
        animation-duration: ${6 + Math.random() * 4}s;
      "></div>`
    ).join('');

    this.container.innerHTML = `
      <div class="login-screen">
        <div class="login-decorative-circle"></div>
        <div class="login-decorative-circle"></div>
        <div class="login-decorative-circle"></div>
        ${particles}
        <div class="login-content">
          <div class="avatar-circle">
            <svg class="avatar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="user-name">${this.languageManager.getString('guest')}</div>
          <button class="login-button">
            ${this.languageManager.getString('login')}
          </button>
        </div>
        <div class="login-footer">
          <div class="date-time"></div>
        </div>
      </div>
    `;
    
    this.attachEventListeners();
    this.startClock();
  }

  attachEventListeners() {
    const loginButton = this.container.querySelector('.login-button');
    loginButton.addEventListener('click', () => this.login());
  }

  startClock() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  updateClock() {
    const dateTimeEl = this.container.querySelector('.date-time');
    if (!dateTimeEl) return;
    
    const now = new Date();
    const lang = this.languageManager.getLanguage();
    const locale = lang === 'ru' ? 'ru-RU' : 'en-US';

    dateTimeEl.textContent = now.toLocaleString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  login() {
    this.container.classList.add('fade-out-fast');
    clearInterval(this.clockInterval);
    
    setTimeout(() => {
      this.eventBus.emit('login:success');
    }, 300); // Faster fade out
  }
}

