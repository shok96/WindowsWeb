/**
 * Terminal - A command-line interface
 */

import { getAllCommands, getCommandInfo } from '../../data/systemCommands.js';

export class Terminal {
  constructor() {
    this.currentDirectory = 'C:\\';
    this.commandHistory = [];
    this.historyIndex = -1;
    this.languageManager = null;
    
    this.isInPythonRepl = false;
    this.pyodide = null;
    this.pyodideReady = false;

    // Elements
    this.outputElement = null;
    this.inputElement = null;
    this.promptElement = null;
  }

  async initPyodide() {
    if (this.pyodideReady) return;

    this.printLine(this.languageManager.getString('terminal_loading_python', 'Loading Python environment (this may take a moment)...'));
    try {
      this.pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
      });
      this.pyodideReady = true;
      this.printLine(this.languageManager.getString('terminal_python_ready', 'Python is ready. Type code or exit() to leave.'));
      this.setPrompt('>>>');
    } catch (error) {
      this.printLine(`${this.languageManager.getString('terminal_python_load_error', 'Error loading Python')}: ${error}`, 'error');
      this.isInPythonRepl = false; // Revert state on failure
      this.setPrompt();
    }
  }

  render(fileSystem, languageManager) {
    this.languageManager = languageManager;
    const container = document.createElement('div');
    container.className = 'terminal-app';
    container.innerHTML = `
      <div class="terminal-output"></div>
      <div class="terminal-input-line">
        <span class="terminal-prompt"></span>
        <input type="text" class="terminal-input" autofocus />
      </div>
    `;

    this.outputElement = container.querySelector('.terminal-output');
    this.inputElement = container.querySelector('.terminal-input');
    this.promptElement = container.querySelector('.terminal-prompt');
    
    this.setPrompt();
    this.printLine(this.languageManager.getString('terminal_welcome', 'AndlancerOS Terminal [Version 1.0.0]'));
    this.printLine(this.languageManager.getString('terminal_help_prompt', 'Type "help" for a list of commands.'));

    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = this.inputElement.value;
        this.printLine(`${this.promptElement.textContent} ${command}`, 'command');
        
        if (command.trim()) {
            this.commandHistory.push(command);
            this.historyIndex = this.commandHistory.length;
        }

        if (this.isInPythonRepl) {
            this.handlePython(command);
            this.inputElement.value = '';
            this.outputElement.scrollTop = this.outputElement.scrollHeight;
            return;
        }

        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        const lm = this.languageManager;
        const fs = window.app.fileSystem;

        switch (cmd) {
            case 'python':
                this.isInPythonRepl = true;
                this.setPrompt('...');
                this.initPyodide();
                break;
            case 'help':
                if (args[0]) {
                    const info = getCommandInfo(args[0], lm);
                    if (info) {
                        this.printLine(`${args[0]}: ${info.description}`);
                        this.printLine(`  ${lm.getString('usage', 'Usage')}: ${info.usage}`);
                        if (info.examples && info.examples.length > 0) {
                            this.printLine(`  ${lm.getString('examples', 'Examples')}:`);
                            info.examples.forEach(ex => this.printLine(`    - ${ex}`));
                        }
                    } else {
                        this.printLine(lm.getString('terminal_command_not_found', 'Command not found: {command}').replace('{command}', args[0]), 'error');
                    }
                } else {
                    this.printLine(lm.getString('terminal_available_commands', 'Available commands:'));
                    const commands = getAllCommands(lm);
                    this.printLine(commands.join(', '));
                }
                break;
            case 'ls':
            case 'dir':
                const items = fs.listDirectory(this.currentDirectory);
                if (items.length === 0) {
                    this.printLine(lm.getString('terminal_folder_empty', 'Folder is empty.'));
                } else {
                    items.forEach(item => {
                        const type = item.type === 'folder' ? lm.getString('terminal_dir_indicator', '[DIR]') : lm.getString('terminal_file_indicator', '[FILE]');
                        this.printLine(`${type} ${item.name}`);
                    });
                }
                break;
            case 'cd':
                // Simplified cd logic
                this.printLine(lm.getString('terminal_cd_not_implemented', '"cd" command is not yet implemented.'));
                this.setPrompt();
                break;
            case 'mkdir':
                if (args[0]) {
                    fs.createFolder(this.currentDirectory.replace(/\\/g, '/'), args[0]);
                    this.printLine(lm.getString('terminal_folder_created', 'Folder created: {folderName}').replace('{folderName}', args[0]));
                }
                break;
            case 'pwd':
                this.printLine(this.currentDirectory);
                break;
            case 'clear':
                this.outputElement.innerHTML = '';
                break;
            case '':
                break; // Do nothing on empty command
            default:
                this.printLine(lm.getString('terminal_command_not_recognized', "'{command}' is not recognized as an internal or external command.").replace('{command}', cmd), 'error');
        }
        this.inputElement.value = '';
        this.outputElement.scrollTop = this.outputElement.scrollHeight;

      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.inputElement.value = this.commandHistory[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          this.inputElement.value = this.commandHistory[this.historyIndex];
        } else {
          this.historyIndex = this.commandHistory.length;
          this.inputElement.value = '';
        }
      }
    });

    return container;
  }

  async handlePython(code) {
      if (!this.pyodideReady) {
          this.printLine(this.languageManager.getString('terminal_python_loading', 'Python is still loading, please wait...'));
          return;
      }
      
      if (code.trim().toLowerCase() === 'exit()') {
          this.isInPythonRepl = false;
          this.printLine(this.languageManager.getString('terminal_exiting_python', 'Exiting Python REPL.'));
          this.setPrompt();
          return;
      }

      try {
          // Redirect stdout
          this.pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
          `);
          let result = await this.pyodide.runPythonAsync(code);
          let stdout = this.pyodide.runPython("sys.stdout.getvalue()");
          
          if (stdout) {
              this.printLine(stdout.trimEnd());
          } else if (result !== undefined) {
              this.printLine(result);
          }
      } catch (error) {
          this.printLine(error, 'error');
      }
  }

  printLine(text, type = 'output') {
    const p = document.createElement('p');
    p.className = `terminal-line ${type}`;
    p.textContent = text;
    this.outputElement.appendChild(p);
  }
  
  setPrompt(prompt = null) {
      if (prompt) {
          this.promptElement.textContent = prompt;
      } else {
          this.promptElement.textContent = `${this.currentDirectory}>`;
      }
  }
}

