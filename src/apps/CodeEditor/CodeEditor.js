/**
 * CodeEditor - A VS Code-like IDE application
 */
import * as monaco from 'monaco-editor';

// Pyodide loading is handled via a script tag in main.js to ensure it's available.
let pyodide;

async function initPyodide() {
  if (pyodide) return pyodide;
  console.log("Loading Pyodide...");
  pyodide = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });
  console.log("Pyodide loaded.");
  return pyodide;
}

export class CodeEditor {
  constructor() {
    this.editor = null;
    this.pyodideReady = initPyodide();
  }

  render() {
    const container = document.createElement('div');
    container.className = 'code-editor-app';
    container.innerHTML = `
      <div class="editor-main-layout">
        <div id="editor-container" style="width: 100%; height: 100%;"></div>
      </div>
      <div class="editor-terminal">
        <div class="terminal-toolbar">
          <span>Вывод</span>
          <button class="run-button">▶️ Выполнить</button>
        </div>
        <pre class="output-console"></pre>
      </div>
    `;

    const editorContainer = container.querySelector('#editor-container');
    this.editor = monaco.editor.create(editorContainer, {
      value: "print('Hello, Python!')",
      language: 'python',
      theme: 'vs-dark'
    });

    const runButton = container.querySelector('.run-button');
    const outputConsole = container.querySelector('.output-console');

    runButton.addEventListener('click', async () => {
      runButton.disabled = true;
      outputConsole.textContent = "Выполнение...";
      try {
        const py = await this.pyodideReady;
        const code = this.editor.getValue();
        
        // Capture Python's stdout
        py.globals.set("output_buffer", "");
        const customPrint = `
import sys
import io
sys.stdout = io.StringIO()
def print(*args, **kwargs):
    __builtins__.print(*args, **kwargs)
    sys.stdout.seek(0)
    global output_buffer
    output_buffer = sys.stdout.read()
`;
        await py.runPythonAsync(customPrint);
        await py.runPythonAsync(code);
        const output = py.globals.get("output_buffer");
        outputConsole.textContent = output || "(no output)";

      } catch (err) {
        outputConsole.textContent = `Ошибка: ${err}`;
      } finally {
        runButton.disabled = false;
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
        setTimeout(() => {
            if (this.editor) {
                this.editor.layout();
            }
        }, 0);
    });
    resizeObserver.observe(container);

    return container;
  }
}
