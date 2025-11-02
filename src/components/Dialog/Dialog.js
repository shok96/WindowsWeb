/**
 * Dialog.js - Custom dialogs (alert, confirm, prompt)
 */

export function showDialog(options) {
    return new Promise((resolve) => {
        const dialogId = `dialog-${Date.now()}`;

        const defaults = {
            title: 'System Message',
            message: '',
            type: 'alert', // alert, confirm, prompt
            placeholder: '',
            okText: 'OK',
            cancelText: 'Cancel',
        };

        const config = { ...defaults, ...options };

        const dialogOverlay = document.createElement('div');
        dialogOverlay.className = 'dialog-overlay';
        dialogOverlay.id = dialogId;

        let inputHtml = '';
        if (config.type === 'prompt') {
            inputHtml = `<input type="text" class="dialog-input" placeholder="${config.placeholder}">`;
        }

        let buttonsHtml = `<button class="dialog-button ok-button">${config.okText}</button>`;
        if (config.type === 'confirm' || config.type === 'prompt') {
            buttonsHtml += `<button class="dialog-button cancel-button">${config.cancelText}</button>`;
        }

        dialogOverlay.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-header">${config.title}</div>
                <div class="dialog-content">
                    <p>${config.message}</p>
                    ${inputHtml}
                </div>
                <div class="dialog-footer">
                    ${buttonsHtml}
                </div>
            </div>
        `;

        document.body.appendChild(dialogOverlay);

        const input = dialogOverlay.querySelector('.dialog-input');
        const okButton = dialogOverlay.querySelector('.ok-button');
        const cancelButton = dialogOverlay.querySelector('.cancel-button');

        const close = (value) => {
            dialogOverlay.classList.add('fade-out');
            setTimeout(() => {
                dialogOverlay.remove();
                resolve(value);
            }, 200);
        };

        okButton.addEventListener('click', () => {
            const value = config.type === 'prompt' ? input.value : true;
            close(value);
        });

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                const value = config.type === 'prompt' ? null : false;
                close(value);
            });
        }
        
        // Focus on input if it's a prompt
        if (input) {
            input.focus();
        }
    });
}



