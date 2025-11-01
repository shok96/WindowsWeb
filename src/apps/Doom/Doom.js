/**
 * DOOM - Classic first-person shooter
 * Based on js-dos.com/DOOM/ guide
 * Uses old Dosbox API for compatibility
 */
export class Doom {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'doom-container';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.dosbox = null;

        // Store original AudioContext to monkey-patch it later for preventing squeal
        this._originalAudioContext = window.AudioContext;
        this._originalWebkitAudioContext = window.webkitAudioContext;
        this.languageManager = null;
    }

    render(languageManager) {
        this.languageManager = languageManager;
        const lm = this.languageManager;
        // Ensure the container is empty before rendering
        this.element.innerHTML = '';

        const gameContainer = document.createElement('div');
        gameContainer.id = 'doom-game-container';
        gameContainer.style.width = '100%';
        gameContainer.style.height = '100%';
        gameContainer.style.position = 'relative';
        gameContainer.style.backgroundColor = '#000';
        gameContainer.style.overflow = 'hidden';
        this.element.appendChild(gameContainer);
        
        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'doom-loading';
        loadingMsg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-family:monospace;text-align:center;';
        loadingMsg.textContent = lm.getString('doom_loading', 'Loading DOOM...');
        gameContainer.appendChild(loadingMsg);
        
        // Wait for Dosbox API to load, then initialize
        const initDosbox = () => {
            console.log('Checking for Dosbox API...', { Dosbox: window.Dosbox, Dos: window.Dos });
            
            // Check if old Dosbox API is available (from js-dos-api.js)
            if (window.Dosbox) {
                console.log('Dosbox API found, initializing...');
                try {
                    // HACK: Shim AudioContext to create a real context but suspend it immediately.
                    // This prevents the initialization squeal without causing the game to freeze.
                    const self = this;
                    const SuspendedAudioContext = function(...args) {
                        const realContext = new (self._originalAudioContext || self._originalWebkitAudioContext)(...args);
                        realContext.suspend().then(() => {
                            console.log('ℹ️ AudioContext suspended immediately to prevent squeal.');
                        });
                        self._audioContextToResume = realContext; // Store for later resumption
                        return realContext;
                    };
                    window.AudioContext = SuspendedAudioContext;
                    window.webkitAudioContext = SuspendedAudioContext;
                    console.log('ℹ️ AudioContext shimmed with a suspending wrapper.');
                    
                    this.dosbox = new window.Dosbox({
                        id: 'doom-game-container',
                        style: 'width: 100%; height: 100%;',
                        // We control audio via the shim now
                        onload: (dosbox) => {
                            console.log('✅ Dosbox loaded, configuring audio...');
                            
                            // Store reference for cleanup
                            this._dosboxInstance = dosbox;
                            this._dosboxModule = dosbox.module;
                            
                            // Temporarily mute audio context to prevent squeal during initialization
                            // This will be unmuted after DOOM starts
                            try {
                                if (window.AudioContext || window.webkitAudioContext) {
                                    // Find and temporarily mute any active audio contexts
                                    // DOSBox creates its own audio context internally
                                    console.log('ℹ️ Audio context will be configured after game starts');
                                }
                            } catch (e) {
                                // Ignore
                            }
                            
                            // Configure audio to reduce squeal and enable MIDI
                            // The squeal is typically caused by:
                            // 1. Too small audio buffer (blocksize)
                            // 2. Incorrect sample rate
                            // 3. MIDI device not properly initialized
                            
                            // Check for Web MIDI API support (required for MIDI music)
                            if (navigator.requestMIDIAccess) {
                                navigator.requestMIDIAccess().then(
                                    (midiAccess) => {
                                        console.log('✅ Web MIDI API available! MIDI music may work.');
                                        const inputs = midiAccess.inputs;
                                        const outputs = midiAccess.outputs;
                                        console.log(`MIDI inputs: ${inputs.size}, outputs: ${outputs.size}`);
                                    },
                                    (error) => {
                                        console.warn('⚠️ Web MIDI API not available:', error);
                                        console.log('ℹ️ MIDI music will not work. Sound effects should work fine.');
                                    }
                                );
                            } else {
                                console.warn('⚠️ Web MIDI API not supported in this browser.');
                                console.log('ℹ️ MIDI music will not work. Sound effects should work fine.');
                            }
                            
                            // Attempt to reduce audio squeal by accessing DOSBox runtime
                            // Note: This may not work with js-dos 6.22, but we'll try
                            setTimeout(() => {
                                try {
                                    // Try to find a way to configure audio through module
                                    if (dosbox.module) {
                                        // Look for methods that might allow sending config commands
                                        const moduleKeys = Object.keys(dosbox.module);
                                        
                                        // Try common DOSBox config methods
                                        const configMethods = [
                                            'sendCommand',
                                            'writeToStdin',
                                            'sendKeys',
                                            'execCommand'
                                        ];
                                        
                                        for (const method of configMethods) {
                                            if (dosbox.module[method] && typeof dosbox.module[method] === 'function') {
                                                console.log(`✅ Found config method: ${method}`);
                                                // Try to send audio config commands
                                                const audioCommands = [
                                                    'CONFIG -SET mixer blocksize 2048',
                                                    'CONFIG -SET mixer rate 44100',
                                                    'CONFIG -SET mixer prebuffer 25'
                                                ];
                                                
                                                audioCommands.forEach((cmd, idx) => {
                                                    setTimeout(() => {
                                                        try {
                                                            dosbox.module[method](cmd + '\r');
                                                            console.log(`Audio config sent: ${cmd}`);
                                                        } catch (e) {
                                                            // Silent fail
                                                        }
                                                    }, idx * 200);
                                                });
                                                break;
                                            }
                                        }
                                    }
                                } catch (e) {
                                    // Configuration not available - this is expected with js-dos 6.22
                                    console.log('ℹ️ Audio config not available through API. Squeal may occur.');
                                    console.log('ℹ️ To fix squeal, modify dosbox.conf in the bundle with:');
                                    console.log('   [mixer] blocksize=2048, rate=44100, prebuffer=25');
                                }
                            }, 2000);
                            
                            // Continue with DOOM launch
                            // Add longer delay to allow audio system to fully initialize
                            // This helps prevent the sharp squeal sound on load
                            // Longer delay = less squeal, but slower startup
                            setTimeout(() => {
                                console.log('✅ Dosbox loaded callback triggered, starting DOOM...');
                                loadingMsg.textContent = lm.getString('doom_starting', 'Starting DOOM...');
                                // Run DOOM from the bundle file
                                // According to original js-dos.com/DOOM/ example: dosbox.run("upload/DOOM-@evilution.zip", "./doom")
                                // The second parameter is the command to run after extraction
                                // Files extract to DOOM/ folder, so we need: CD DOOM then DOOM.EXE
                                try {
                                    console.log('Calling dosbox.run() with bundle and command...');
                                // According to js-dos API, the second parameter should be a command
                                // Files extract to DOOM/ folder, executable is DOOM.EXE
                                // Try different command formats
                                // According to original example: dosbox.run("upload/DOOM-@evilution.zip", "./doom")
                                // But our files are in DOOM/ folder, so we need different command
                                // Try multiple command formats
                                const commands = [
                                    'DOOM/DOOM.EXE',  // Forward slash (Unix style)
                                    'DOOM\\DOOM.EXE', // Backslash (DOS style)
                                    './DOOM/DOOM.EXE', // Relative with forward slash
                                    '.\\DOOM\\DOOM.EXE' // Relative with backslash
                                ];
                                
                                let commandUsed = null;
                                for (const cmd of commands) {
                                    try {
                                        console.log(`Trying command: ${cmd}`);
                                        dosbox.run('/games/doom.jsdos', cmd);
                                        commandUsed = cmd;
                                        console.log(`✅ dosbox.run() called with: ${cmd}`);
                                        break;
                                    } catch (e) {
                                        console.warn(`Command ${cmd} failed:`, e);
                                        continue;
                                    }
                                }
                                
                                if (!commandUsed) {
                                    console.warn('All direct command formats failed, will try module API');
                                }
                                
                                // After extraction, try to execute commands via module API
                                setTimeout(() => {
                                    console.log('Attempting to execute commands via module...');
                                    console.log('Available dosbox methods:', Object.keys(dosbox));
                                    
                                    // Check if module has methods for command execution
                                    if (dosbox.module) {
                                        console.log('dosbox.module structure:', dosbox.module);
                                        const moduleKeys = Object.keys(dosbox.module);
                                        console.log('module keys:', moduleKeys);
                                        
                                        // Try various module methods
                                        try {
                                            // Check for command/shell methods in module
                                            if (dosbox.module.sendKeys || dosbox.module.writeToStdin) {
                                                // Some implementations use sendKeys or writeToStdin
                                                const cmd = 'CD DOOM\rDOOM.EXE\r';
                                                if (dosbox.module.sendKeys) {
                                                    dosbox.module.sendKeys(cmd);
                                                    console.log('✅ Command sent via module.sendKeys');
                                                } else if (dosbox.module.writeToStdin) {
                                                    dosbox.module.writeToStdin(cmd);
                                                    console.log('✅ Command sent via module.writeToStdin');
                                                }
                                            } else if (dosbox.module.shell) {
                                                dosbox.module.shell('CD DOOM');
                                                setTimeout(() => dosbox.module.shell('DOOM.EXE'), 500);
                                                console.log('✅ Commands sent via module.shell');
                                            } else {
                                                // Log full module for debugging
                                                console.log('Full module object:', JSON.stringify(dosbox.module, null, 2));
                                            }
                                        } catch (modError) {
                                            console.error('Error using module:', modError);
                                        }
                                    }
                                    
                                    // Try UI methods
                                    if (dosbox.ui) {
                                        console.log('dosbox.ui structure:', dosbox.ui);
                                        const uiKeys = Object.keys(dosbox.ui);
                                        console.log('ui keys:', uiKeys);
                                    }
                                    
                                    // Last resort: Simulate keyboard input on canvas
                                    const canvas = gameContainer.querySelector('canvas');
                                    if (canvas) {
                                        console.log('Canvas found, will try keyboard simulation as last resort');
                                        // Focus canvas and try keyboard events
                                        canvas.focus();
                                        
                                        // Simulate typing: CD DOOM, Enter, DOOM.EXE, Enter
                                        const commands = ['C', 'D', ' ', 'D', 'O', 'O', 'M', 'Enter', 'D', 'O', 'O', 'M', '.', 'E', 'X', 'E', 'Enter'];
                                        let commandIndex = 0;
                                        const typeCommand = () => {
                                            if (commandIndex < commands.length) {
                                                const key = commands[commandIndex];
                                                if (key === 'Enter') {
                                                    const event = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13 });
                                                    canvas.dispatchEvent(event);
                                                } else {
                                                    const event = new KeyboardEvent('keydown', { key: key, code: `Key${key}`, keyCode: key.charCodeAt(0) });
                                                    canvas.dispatchEvent(event);
                                                    const inputEvent = new KeyboardEvent('keypress', { key: key, charCode: key.charCodeAt(0) });
                                                    canvas.dispatchEvent(inputEvent);
                                                }
                                                commandIndex++;
                                                setTimeout(typeCommand, 100);
                                            }
                                        };
                                        setTimeout(typeCommand, 1000);
                                        console.log('✅ Started keyboard simulation');
                                    }
                                }, 4000); // Wait longer for full extraction and DOSBox initialization
                            } catch (runError) {
                                console.error('❌ Error running DOOM:', runError);
                                loadingMsg.innerHTML = `<div style="color:#f00;padding:20px;">${lm.getString('doom_error_running', 'Error: ')}${runError.message}</div>`;
                            }
                            // Remove loading message after a delay
                            setTimeout(() => {
                                const msg = document.getElementById('doom-loading');
                                if (msg && gameContainer.querySelector('canvas')) {
                                    msg.remove();
                                }
                                }, 3000);
                            }, 1500); // 1500ms delay to allow audio initialization and prevent squeal
                        },
                        onrun: (dosbox, app) => {
                            console.log(`✅ DOOM started callback triggered: ${app}`);

                            // Restore original AudioContext function for other apps
                            window.AudioContext = this._originalAudioContext;
                            window.webkitAudioContext = this._originalWebkitAudioContext;
                            console.log('ℹ️ AudioContext restored.');

                            const msg = document.getElementById('doom-loading');
                            if (msg) {
                                msg.remove();
                            }

                            // Now that game has started, resume the audio context to enable sound.
                            setTimeout(() => {
                                if (this._audioContextToResume && typeof this._audioContextToResume.resume === 'function') {
                                    this._audioContextToResume.resume().then(() => {
                                        console.log('✅ AudioContext resumed, sound should now work.');
                                    });
                                } else {
                                    // Fallback if the context wasn't captured
                                    console.warn('⚠️ Could not find suspended AudioContext to resume. Falling back to enableSound API.');
                                    if (dosbox && typeof dosbox.enableSound === 'function') {
                                        dosbox.enableSound();
                                    }
                                }
                                this._soundEnabled = true;
                            }, 2000); // Increased delay to 2 seconds to ensure everything is ready

                            console.log('✅ DOOM is running');
                        },
                        onerror: (error) => {
                             // Also restore AudioContext on error
                            window.AudioContext = this._originalAudioContext;
                            window.webkitAudioContext = this._originalWebkitAudioContext;
                            console.log('ℹ️ AudioContext restored after error.');

                            console.error('❌ DOOM error callback:', error);
                            loadingMsg.innerHTML = `
                                <div style="text-align: center; padding: 20px; max-width: 600px;">
                                    <p style="color: #f00; margin-bottom: 15px; font-size: 16px;">⚠️ ${lm.getString('doom_load_error', 'DOOM Load Error')}</p>
                                    <p style="font-size: 12px; color: #aaa; line-height: 1.6;">
                                        ${lm.getString('error', 'Error')}: ${error || lm.getString('unknown_error', 'Unknown error')}<br/>
                                        ${lm.getString('doom_check_file', 'Check that /games/doom.jsdos exists and is not corrupted.')}
                                    </p>
                                </div>
                            `;
                        }
                    });
                    console.log('✅ Dosbox instance created');
                } catch (error) {
                    console.error('❌ Error creating Dosbox instance:', error);
                    loadingMsg.innerHTML = `
                        <div style="text-align: center; padding: 20px; max-width: 500px;">
                            <p style="color: #f00; margin-bottom: 15px; font-size: 16px;">⚠️ ${lm.getString('doom_init_error', 'Initialization Error')}</p>
                            <p style="font-size: 12px; color: #aaa;">
                                ${lm.getString('doom_create_dosbox_fail', 'Failed to create Dosbox')}: ${error.message}<br/>
                                <pre style="font-size:10px;color:#888;margin-top:10px;">${error.stack}</pre>
                            </p>
                        </div>
                    `;
                }
            } else {
                console.warn('⚠️ Dosbox API not found, waiting...');
                // Wait a bit more for the script to load
                setTimeout(() => {
                    if (window.Dosbox) {
                        console.log('✅ Dosbox loaded after delay, retrying...');
                        initDosbox();
                    } else {
                        loadingMsg.innerHTML = `
                            <div style="text-align: center; padding: 20px; max-width: 500px;">
                                <p style="color: #f00; margin-bottom: 15px; font-size: 16px;">⚠️ ${lm.getString('doom_api_not_found', 'API Not Found')}</p>
                                <p style="font-size: 12px; color: #aaa;">
                                    ${lm.getString('doom_api_fail_msg', 'js-dos-api.js script failed to load or is loading too slowly.')}<br/>
                                    ${lm.getString('doom_check_console', 'Check the browser console for script loading errors.')}<br/><br/>
                                    ${lm.getString('doom_available_objects', 'Available objects')}: Dosbox=${typeof window.Dosbox}, Dos=${typeof window.Dos}
                                </p>
                            </div>
                        `;
                    }
                }, 2000);
            }
        };
        
        // Start initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initDosbox);
        } else {
            // DOM already loaded, but script might still be loading
            setTimeout(initDosbox, 100);
        }
        
        return this.element;
    }
    
    destroy() {
        // Restore AudioContext just in case it was disabled and not restored
        if (this._originalAudioContext || this._originalWebkitAudioContext) {
            window.AudioContext = this._originalAudioContext;
            window.webkitAudioContext = this._originalWebkitAudioContext;
            console.log('ℹ️ Ensured AudioContext is restored during destroy.');
        }

        console.log('🛑 DOOM destroy() called - stopping DOSBox completely...');

        // Store references before destroying
        const dosbox = this.dosbox;
        const module = this.dosbox?.module;
        const gameContainer = this.element ? this.element.querySelector('#doom-game-container') : null;

        // STEP 0: Aggressively clear all timers and animation frames
        try {
            console.log('ℹ️ Aggressively clearing timers and animation frames...');
            // Clear a large range of possible timer IDs. This is a last resort.
            for (let i = 0; i < 20000; i++) {
                window.clearTimeout(i);
                window.clearInterval(i);
            }
            // This one might not exist in all browsers, but worth a try
            if (window.cancelAnimationFrame) {
                for (let i = 0; i < 20000; i++) {
                    window.cancelAnimationFrame(i);
                }
            }
            console.log('✅ Aggressive timer clearing complete.');
        } catch (e) {
            console.log('⚠️ Error during aggressive timer clearing:', e.message);
        }

        // STEP 1: Monkey-patch the module to halt execution
        if (module) {
            try {
                console.log('ℹ️ Monkey-patching module to halt execution...');
                const functionsToNullify = [
                    'preRun', 'postRun', 'resumeMainLoop', 'mainLoop', 'render', 'onRuntimeInitialized',
                    'requestAnimationFrame', '_main', 'callMain', 'tick', 'tock'
                ];
                functionsToNullify.forEach(fnName => {
                    if (module[fnName] && typeof module[fnName] === 'function') {
                        try {
                            module[fnName] = () => {};
                            console.log(`✅ Nullified module.${fnName}`);
                        } catch (e) { /* ignore read-only properties */ }
                    }
                });
            } catch (e) {
                console.log('⚠️ Error monkey-patching module:', e.message);
            }
        }

        // STEP 2: Send exit command to DOS program FIRST (before destroying DOM)
        if (module) {
            try {
                const exitMethods = ['sendKeys', 'writeToStdin', 'exec'];
                for (const method of exitMethods) {
                    if (typeof module[method] === 'function') {
                        try {
                            if (method === 'sendKeys') {
                                module[method]('\x03'); // Ctrl+C
                                console.log(`✅ Sent Ctrl+C via ${method}`);
                            } else {
                                module[method]('exit\r');
                                console.log(`✅ Sent exit via ${method}`);
                            }
                            break;
                        } catch (e) { /* Continue */ }
                    }
                }
            } catch (e) {
                console.log('⚠️ Error sending exit commands:', e.message);
            }
        }

        // STEP 3: Immediately pause and stop module execution
        if (module) {
            try {
                if (typeof module.pauseMainLoop === 'function') {
                    module.pauseMainLoop();
                    console.log('✅ Paused main loop');
                }
                if (module.Runtime) {
                    if (module.Runtime.keepAlive !== undefined) {
                        module.Runtime.keepAlive = false;
                    }
                    if (typeof module.Runtime.quit === 'function') {
                        module.Runtime.quit();
                    }
                    try {
                        Object.defineProperty(module.Runtime, 'keepAlive', { value: false, writable: false });
                        console.log('✅ Forced Runtime.keepAlive = false (locked)');
                    } catch (e) { /* ignore */ }
                }
            } catch (e) {
                console.log('⚠️ Error stopping module execution:', e.message);
            }
        }

        // STEP 4: Remove DOM elements IMMEDIATELY to stop rendering and audio
        if (gameContainer) {
            try {
                const canvas = gameContainer.querySelector('canvas');
                if (canvas) {
                    try {
                        const ctxWebGL = canvas.getContext('webgl') || canvas.getContext('webgl2');
                        if (ctxWebGL) {
                            const loseContext = ctxWebGL.getExtension('WEBGL_lose_context');
                            if (loseContext) loseContext.loseContext();
                        }
                    } catch (e) { /* ignore */ }
                    canvas.remove();
                }
                if (gameContainer.parentNode) {
                    gameContainer.parentNode.removeChild(gameContainer);
                } else {
                    gameContainer.innerHTML = '';
                }
                console.log('✅ DOM elements removed');
            } catch (e) {
                console.log('⚠️ Error removing DOM:', e.message);
            }
        }

        // STEP 5: Quit module completely
        if (module && typeof module.quit === 'function') {
            try {
                module.quit(0);
                setTimeout(() => {
                    if (module && typeof module.quit === 'function') {
                        try { module.quit(1); } catch (e) { /* ignore */ }
                    }
                }, 50);
            } catch (e) { /* ignore */ }
        }

        // STEP 6: Terminate module runtime
        if (module) {
            try {
                if (typeof module.exit === 'function') module.exit(0);
                if (typeof module.terminate === 'function') module.terminate(0);
                if (module.runtime && typeof module.runtime.terminate === 'function') module.runtime.terminate(0);
            } catch (e) { /* ignore */ }
        }

        // STEP 7: Stop DOSBox instance methods
        if (dosbox) {
            try {
                if (dosbox.ui) {
                    try {
                        if (dosbox.ui.wrapper && dosbox.ui.wrapper.parentNode) dosbox.ui.wrapper.parentNode.removeChild(dosbox.ui.wrapper);
                        if (dosbox.ui.div && dosbox.ui.div.parentNode) dosbox.ui.div.parentNode.removeChild(dosbox.ui.div);
                        if (typeof dosbox.ui.remove === 'function') dosbox.ui.remove();
                        if (typeof dosbox.ui.destroy === 'function') dosbox.ui.destroy();
                    } catch (e) { /* ignore */ }
                }
                if (typeof dosbox.stop === 'function') dosbox.stop();
                if (typeof dosbox.exit === 'function') dosbox.exit();
                if (typeof dosbox.destroy === 'function') dosbox.destroy();
            } catch (error) {
                console.error('❌ Error in dosbox cleanup:', error);
            }
        }

        // STEP 8: Final DOM cleanup
        try {
            const allDosboxElements = document.querySelectorAll('[id*="doom"], [class*="dosbox"]');
            allDosboxElements.forEach(el => {
                try { if (el && el.parentNode) el.parentNode.removeChild(el); } catch (e) { /* ignore */ }
            });
            if (this.element) {
                this.element.innerHTML = '';
                if (this.element.parentNode) this.element.parentNode.removeChild(this.element);
            }
            console.log('✅ Final DOM cleanup complete');
        } catch (e) {
            console.log('⚠️ Error in final DOM cleanup:', e.message);
        }

        // STEP 9: Clear ALL references
        this.dosbox = null;
        this._dosboxInstance = null;
        this._dosboxModule = null;
        this._soundEnabled = false;

        // Try to force garbage collection
        if (window.gc) {
            try { window.gc(); } catch (e) { /* ignore */ }
        }

        console.log('✅ DOOM COMPLETE CLEANUP FINISHED');
    }
}



