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
