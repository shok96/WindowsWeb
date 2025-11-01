/**
 * Browser - Веб-браузер
 */

export class Browser {
  constructor() {
    // DuckDuckGo is more iframe-friendly
    this.homepage = 'https://duckduckgo.com/html/'; 
    this.currentUrl = '';
  }

  render() {
    const container = document.createElement('div');
    container.className = 'browser-app';
    container.innerHTML = `
      <div class="browser-toolbar">
        <div class="browser-nav">
          <button data-action="back" title="Назад" disabled>←</button>
          <button data-action="forward" title="Вперед" disabled>→</button>
          <button data-action="refresh" title="Обновить">⟳</button>
          <button data-action="home" title="Домой">⌂</button>
        </div>
        <input type="text" class="url-bar" placeholder="Искать в DuckDuckGo или ввести адрес...">
        <button data-action="go" class="go-button" title="Перейти">→</button>
        <button data-action="new-tab" class="new-tab-button" title="Открыть в новой вкладке">↗</button>
      </div>
      <div class="browser-content-wrapper">
        <div class="browser-message">
          <h2>Веб-браузер</h2>
          <p>Используйте поисковую строку для навигации.</p>
          <p class="security-note">
            <small>
              <strong>Примечание:</strong> Некоторые сайты могут блокировать отображение. Если страница не загружается, попробуйте открыть ее в новой вкладке с помощью кнопки ↗.
            </small>
          </p>
        </div>
        <iframe class="browser-iframe" sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals" frameborder="0"></iframe>
      </div>
    `;
    
    const urlBar = container.querySelector('.url-bar');
    const iframe = container.querySelector('.browser-iframe');
    const message = container.querySelector('.browser-message');
    const backBtn = container.querySelector('[data-action="back"]');
    const forwardBtn = container.querySelector('[data-action="forward"]');

    const navigate = (url) => {
      let finalUrl = url;
      if (!url) {
          finalUrl = this.homepage;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Simple check for something that looks like a domain vs. a search query
        finalUrl = url.includes('.') ? `https://${url}` : `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
      }
      
      this.currentUrl = finalUrl;
      urlBar.value = this.currentUrl;
      message.style.display = 'none';
      iframe.style.display = 'block';
      iframe.src = finalUrl;
    };
    
    container.querySelector('[data-action="go"]').addEventListener('click', () => navigate(urlBar.value));
    urlBar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') navigate(urlBar.value);
    });
    
    container.querySelector('[data-action="back"]').addEventListener('click', () => iframe.contentWindow.history.back());
    container.querySelector('[data-action="forward"]').addEventListener('click', () => iframe.contentWindow.history.forward());
    container.querySelector('[data-action="refresh"]').addEventListener('click', () => { if(iframe.src) iframe.src = iframe.src });
    container.querySelector('[data-action="home"]').addEventListener('click', () => navigate(this.homepage));
    
    container.querySelector('[data-action="new-tab"]').addEventListener('click', () => {
        if(this.currentUrl) window.open(this.currentUrl, '_blank');
    });

    iframe.addEventListener('load', () => {
        try {
            this.currentUrl = iframe.contentWindow.location.href;
            urlBar.value = this.currentUrl;
            // Update back/forward button states
            backBtn.disabled = !iframe.contentWindow.history.length || iframe.contentWindow.history.state === null || iframe.contentWindow.history.state.index === 0;
            forwardBtn.disabled = !iframe.contentWindow.history.length || iframe.contentWindow.history.state === null || iframe.contentWindow.history.state.index === iframe.contentWindow.history.length - 1;

        } catch (e) {
            // Cross-origin error, can't access history. Disable buttons.
            backBtn.disabled = true;
            forwardBtn.disabled = true;
        }
    });

    // Don't load homepage on start, just show the message
    // navigate('');

    return container;
  }
}

