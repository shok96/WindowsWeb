export class BSOD {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'bsod-container';
  }

  render(languageManager) {
    this.container.innerHTML = `
      <div class="bsod-content">
        <div class="bsod-header">
            <h1>:(</h1>
            <p>Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</p>
        </div>
        <div class="bsod-progress-container">
            <div class="bsod-progress-bar-container">
                <div class="bsod-progress-bar"></div>
            </div>
            <span class="bsod-progress-text">0% complete</span>
        </div>
        <div class="bsod-qr-code">
          <p>For more information about this issue and possible fixes, visit https://www.windows.com/stopcode</p>
          <p>If you call a support person, give them this info:<br>Stop code: CRITICAL_PROCESS_DIED</p>
        </div>
      </div>
    `;

    let progress = 0;
    const progressBar = this.container.querySelector('.bsod-progress-bar');
    const progressText = this.container.querySelector('.bsod-progress-text');

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10);
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Даем пользователю секунду, чтобы увидеть 100%
      }
      progressBar.style.width = `${progress}%`;
      progressText.textContent = `${progress}% complete`;
    }, 500);


    return this.container;
  }
}
