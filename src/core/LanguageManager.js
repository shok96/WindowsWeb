/**
 * LanguageManager - Управление локализацией для Windows 11 Web OS
 * Загрузка и предоставление локализованных строк
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Многоязычная поддержка системы
 * @integration_contract: LanguageManager ↔ StorageManager для сохранения выбранного языка, LanguageManager → EventBus для уведомлений
 * @consistency_model: Strong consistency - язык загружается перед инициализацией UI
 * @failure_policy: Fallback на 'ru' при ошибках загрузки, показываются уведомления об ошибках
 * @performance_contract: Загрузка языкового файла асинхронная, getString() O(1)
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Загрузка и предоставление локализованных строк через getString()
 * @interface_contract: load(), getString(key, fallback), getLanguage(), setLanguage(lang, requireReboot)
 * @implementation_strategy: Загрузка JSON файлов через fetch, кэширование в this.locales
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: StorageManager инициализирован, EventBus доступен, файлы локализации существуют в src/locales/
 * @ensures: load() - загружает языковой файл, fallback на 'ru' при ошибке, генерирует событие 'language:loaded'
 * @ensures: getString() - возвращает локализованную строку или fallback, всегда возвращает строку (не null/undefined)
 * @invariant: currentLang всегда валиден, locales объект всегда инициализирован (может быть пустым до загрузки)
 * @modifies: this.locales, StorageManager.data.settings.language, генерирует события через EventBus
 * @throws: Ошибки загрузки языковых файлов обрабатываются с fallback, уведомления через EventBus
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: StorageManager критичен для сохранения выбранного языка пользователя
 * @why_ensures: Fallback на русский гарантирует что система всегда работает даже при ошибках
 * @why_ensures: getString() всегда возвращает строку предотвращает ошибки отображения
 * @why_invariant: Валидный currentLang гарантирует что загрузка всегда возможна
 * @business_impact: Нарушение ведет к отображению ключей вместо текста или ошибкам загрузки
 * @stakeholder_value: Пользователь видит интерфейс на выбранном языке
 */

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
