/**
 * FileAssociation - Ассоциации файлов с приложениями для Windows 11 Web OS
 * Связывание расширений файлов с приложениями для автоматического открытия
 * 
 * === СИСТЕМНЫЕ КОНТРАКТЫ ===
 * @system_contract: Ассоциации файлов с приложениями для автоматического открытия
 * @integration_contract: FileAssociation → EventBus для запуска приложений, FileAssociation использует window.app.fileSystem
 * @consistency_model: Strong consistency - ассоциации статичны, определяются в конструкторе
 * @failure_policy: Возвращает {success: false, error: string} при отсутствии ассоциации или приложения
 * @performance_contract: Операции O(1) для поиска ассоциации
 * 
 * === КОМПОНЕНТНЫЕ КОНТРАКТЫ ===
 * @component_contract: Маппинг расширений на приложения и запуск через EventBus
 * @interface_contract: getApplicationForExtension(extension), openFile(filePath), openFileWith(appName, filePath)
 * @implementation_strategy: Объекты associations и appLaunchers, запуск через EventBus.emit('app:open')
 * 
 * === ФОРМАЛЬНЫЕ КОНТРАКТЫ ===
 * @requires: EventBus инициализирован, FileSystem доступен через window.app.fileSystem
 * @ensures: getApplicationForExtension() - возвращает имя приложения для расширения или undefined
 * @ensures: openFile() - находит приложение по расширению, запускает через EventBus, возвращает {success: true/false}
 * @ensures: openFileWith() - запускает приложение напрямую по имени, возвращает {success: true/false}
 * @invariant: associations и appLaunchers всегда синхронизированы (для каждого расширения есть launcher)
 * @modifies: Генерирует события app:open через EventBus
 * @throws: Возвращает {success: false, error: string} при ошибках (не выбрасывает исключения)
 * 
 * === БИЗНЕСОВОЕ ОБОСНОВАНИЕ ===
 * @why_requires: EventBus критичен для запуска приложений без прямой зависимости
 * @why_ensures: Возврат {success: false} позволяет UI обработать ошибку без исключений
 * @why_invariant: Синхронизация associations и appLaunchers гарантирует что все ассоциации работают
 * @business_impact: Нарушение ведет к невозможности открыть файлы двойным кликом
 * @stakeholder_value: Пользователь может открывать файлы автоматически правильным приложением
 */

export class FileAssociation {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.associations = {
            'txt': 'Notepad',
            'bat': 'BSOD',
            'aos': 'aosExecutor',
            // Add other default associations here
        };

        this.appLaunchers = {
            'Notepad': (filePath) => {
                this.eventBus.emit('app:open', { appId: 'Notepad', params: { filePath } });
            },
            'BSOD': (filePath) => {
                this.eventBus.emit('app:open', { appId: 'BSOD', params: { filePath } });
            },
            'aosExecutor': (filePath) => {
                const content = window.app.fileSystem.getFileContent(filePath.substring(0, filePath.lastIndexOf('/')), filePath.substring(filePath.lastIndexOf('/') + 1));
                if (content === 'run crash') {
                    this.eventBus.emit('app:open', { appId: 'BSOD' });
                }
            }
            // Add other app launchers here
        }
    }

    getApplicationForExtension(extension) {
        return this.associations[extension.toLowerCase()];
    }

    openFile(filePath) {
        const extension = filePath.split('.').pop();
        const appName = this.getApplicationForExtension(extension);

        if (appName && this.appLaunchers[appName]) {
            this.appLaunchers[appName](filePath);
            return { success: true };
        }

        return { success: false, error: 'No application found for this file type.' };
    }

    openFileWith(appName, filePath) {
        if (this.appLaunchers[appName]) {
            this.appLaunchers[appName](filePath);
            return { success: true };
        }
        return { success: false, error: 'Application not found.' };
    }
}
