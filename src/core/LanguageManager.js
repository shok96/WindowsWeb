import { showDialog } from '../components/Dialog/Dialog.js';

export class LanguageManager {
    constructor(storageManager, eventBus) {
        this.storage = storageManager;
        this.eventBus = eventBus;
        this.locales = {};
        this.currentLang = this.getLanguage();

        this.eventBus.on('language:set', (lang) => this.setLanguage(lang));
    }

    async load() {
        try {
            const response = await fetch(`src/locales/${this.currentLang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load locale file for ${this.currentLang}`);
            }
            this.locales = await response.json();
            console.log(`Language set to: ${this.currentLang}`);
            this.eventBus.emit('language:loaded', this.locales);
        } catch (error) {
            console.error(error);
            // Fallback to Russian if the selected language fails to load
            if (this.currentLang !== 'ru') {
                // Показываем ошибку только если fallback тоже не сработает
                this.currentLang = 'ru';
                try {
                    await this.load();
                } catch (fallbackError) {
                    if (window.app && window.app.eventBus) {
                        window.app.eventBus.emit('system:error', {
                            title: this.getString('lang_load_error_title', 'Language Load Error'),
                            message: `${this.getString('lang_load_error_message', 'Failed to load language files:')} ${error.message}`
                        });
                    }
                }
            }
        }
    }

    getString(key, fallback = key) {
        return this.locales[key] || fallback;
    }

    getLanguage() {
        const data = this.storage.load();
        return data.settings?.language || 'ru';
    }

    setLanguage(lang, requireReboot = false) {
        if (lang === this.currentLang) return;

        const data = this.storage.load();
        if (!data.settings) {
            data.settings = {};
        }
        data.settings.language = lang;
        this.storage.save(data);
        this.currentLang = lang;

        if (requireReboot) {
            showDialog({
                title: this.getString('reboot_required'),
                message: this.getString('reboot_required'),
                confirmText: this.getString('reboot_now'),
                cancelText: this.getString('cancel'),
                onConfirm: () => {
                    window.location.reload();
                }
            });
        } else {
            this.load();
        }
    }
}
