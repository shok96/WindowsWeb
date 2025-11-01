/**
 * VisualIDE - A node-based visual programming editor
 */
import Drawflow from 'drawflow';
import { showContextMenu, hideContextMenu } from '../../components/ContextMenu/ContextMenu.js';

// Node Library
const getNodeLibrary = (lm) => ({
  'Input': [
    { name: 'Number', html: `<div><p>${lm.getString('visualide_node_number', 'Number')}</p><input type="number" df-number value="0" style="width: 100%;"></div>`, inputs: 0, outputs: 1, data: { number: '0' } },
    { name: 'String', html: `<div><p>${lm.getString('visualide_node_string', 'String')}</p><input type="text" df-string value="text" style="width: 100%;"></div>`, inputs: 0, outputs: 1, data: { string: 'text' } },
  ],
  'Math': [
    { name: 'Add', html: `<div><p>${lm.getString('visualide_node_add', 'Add (+)')}</p></div>`, inputs: 2, outputs: 1, data: {} },
    { name: 'Subtract', html: `<div><p>${lm.getString('visualide_node_subtract', 'Subtract (-)')}</p></div>`, inputs: 2, outputs: 1, data: {} },
    { name: 'Multiply', html: `<div><p>${lm.getString('visualide_node_multiply', 'Multiply (*)')}</p></div>`, inputs: 2, outputs: 1, data: {} },
    { name: 'Divide', html: `<div><p>${lm.getString('visualide_node_divide', 'Divide (')}</p></div>`, inputs: 2, outputs: 1, data: {} },
  ],
  'Logic': [
      { name: 'If', html: `<div><p>${lm.getString('visualide_node_if', 'If')}</p></div>`, inputs: 3, outputs: 1, data: {} }, // condition, true_val, false_val
      { name: 'Equals', html: `<div><p>${lm.getString('visualide_node_equals', 'Equals (==)')}</p></div>`, inputs: 2, outputs: 1, data: {} },
      { name: 'GreaterThan', html: `<div><p>${lm.getString('visualide_node_greaterthan', 'Greater Than (>)')}</p></div>`, inputs: 2, outputs: 1, data: {} },
      { name: 'LessThan', html: `<div><p>${lm.getString('visualide_node_lessthan', 'Less Than (<)')}</p></div>`, inputs: 2, outputs: 1, data: {} },
  ],
  'String': [
    { name: 'Concat', html: `<div><p>${lm.getString('visualide_node_concat', 'Concat Strings')}</p></div>`, inputs: 2, outputs: 1, data: {} },
  ],
  'Output': [
    { name: 'Log', html: `<div><p>${lm.getString('visualide_node_log', 'Log')}</p></div>`, inputs: 1, outputs: 0, data: {} },
  ]
});

const addDeleteButton = (html) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'drawflow-delete-btn';
    deleteBtn.innerHTML = '❌'; // Replaced icon with a cross
    wrapper.firstChild.prepend(deleteBtn);
    return wrapper.innerHTML;
};

export class VisualIDE {
  constructor() {
    this.editor = null;
    this.fs = window.app.fileSystem; // Access global file system
    this.eventBus = window.app.eventBus; // Access global event bus
    this.languageManager = null;
  }

  render(languageManager) {
    this.languageManager = languageManager;
    const lm = this.languageManager;

    const container = document.createElement('div');
    container.className = 'visual-ide-app';
    container.innerHTML = `
      <div class="visual-ide-toolbar">
        <button data-action="new">${lm.getString('visualide_new', 'New')}</button>
        <button data-action="save">${lm.getString('visualide_save', 'Save')}</button>
        <button data-action="load">${lm.getString('visualide_load', 'Load')}</button>
        <button data-action="run">▶️ ${lm.getString('visualide_run', 'Run')}</button>
      </div>
      <div id="drawflow"></div>
      <div class="visual-ide-output">
        <pre class="output-console">${lm.getString('visualide_initial_prompt', '(Right-click to add a node)')}</pre>
      </div>
    `;

    setTimeout(() => {
      const editorEl = container.querySelector('#drawflow');
      this.editor = new Drawflow(editorEl);
      this.editor.start();

      // Use event delegation for delete buttons
      editorEl.addEventListener('click', (e) => {
          if (e.target && e.target.classList.contains('drawflow-delete-btn')) {
              e.stopPropagation();
              e.preventDefault();
              const nodeElement = e.target.closest('.drawflow-node');
              if (nodeElement && nodeElement.id) {
                  this.editor.removeNodeId(nodeElement.id);
              }
          }
      });

      editorEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showNodeLibraryMenu(e.clientX, e.clientY);
      });

    }, 100);

    const runButton = container.querySelector('[data-action="run"]');
    const outputConsole = container.querySelector('.output-console');

    container.querySelector('[data-action="new"]').addEventListener('click', () => this.editor.clear());
    container.querySelector('[data-action="save"]').addEventListener('click', () => this.saveGraph());
    container.querySelector('[data-action="load"]').addEventListener('click', () => this.loadGraph());

    runButton.addEventListener('click', () => {
      const graph = this.editor.export();
      outputConsole.textContent = lm.getString('visualide_executing', 'Executing...');
      try {
        const result = this.executeGraph(graph.drawflow.Home.data);
        outputConsole.textContent = `${lm.getString('visualide_result', 'Result')}:\n${JSON.stringify(result, null, 2)}`;
      } catch (e) {
        outputConsole.textContent = `${lm.getString('visualide_error', 'Error')}: ${e.message}`;
      }
    });

    return container;
  }

  showNodeLibraryMenu(x, y) {
      const nodeLibrary = getNodeLibrary(this.languageManager);
      const menuItems = Object.entries(nodeLibrary).map(([category, nodes]) => ({
          label: category,
          submenu: nodes.map(node => ({
              label: node.name,
              action: () => {
                  const finalHtml = addDeleteButton(node.html);
                  this.editor.addNode(node.name, node.inputs, node.outputs, x, y, node.name, node.data, finalHtml);
                  hideContextMenu(); // This will now correctly hide the menu
              }
          }))
      }));
      showContextMenu(menuItems, x, y, this.eventBus);
  }
  
  saveGraph() {
      const lm = this.languageManager;
      const fileName = prompt(lm.getString('visualide_prompt_savename', 'Enter file name to save:'), "my-program.json");
      if (!fileName) return;

      const programData = JSON.stringify(this.editor.export(), null, 2);
      const path = 'Documents/VisualPrograms';
      
      // Ensure directory exists
      if (!this.fs.exists('Documents')) this.fs.createFolder('', 'Documents');
      if (!this.fs.exists(path)) this.fs.createFolder('Documents', 'VisualPrograms');

      const result = this.fs.createFile(path, fileName, programData);
      if(result.success) {
          alert(`${lm.getString('visualide_alert_saved', 'Program saved to')} ${path}/${fileName}`);
      } else {
          if (window.app && window.app.eventBus) {
              window.app.eventBus.emit('system:error', {
                  title: lm.getString('visualide_error_saving', 'Save Error'),
                  message: result.error
              });
          }
      }
  }

  loadGraph() {
      const lm = this.languageManager;
      const fileName = prompt(lm.getString('visualide_prompt_loadname', 'Enter file name to load (from Documents/VisualPrograms):'), "my-program.json");
      if(!fileName) return;

      const path = 'Documents/VisualPrograms';
      const file = this.fs.readFile(path, fileName);

      if (file) {
          try {
              const programData = JSON.parse(file.content);
              this.editor.import(programData);
          } catch (e) {
              if (window.app && window.app.eventBus) {
                  window.app.eventBus.emit('system:error', {
                      title: lm.getString('visualide_error_reading_file', 'File Read Error'),
                      message: lm.getString('visualide_error_reading_file_msg', 'Error reading file. Make sure it is a valid program file.')
                  });
              }
          }
      } else {
          if (window.app && window.app.eventBus) {
              window.app.eventBus.emit('system:error', {
                  title: lm.getString('visualide_error_file_not_found', 'File Not Found'),
                  message: lm.getString('visualide_error_file_not_found_msg', 'File not found.')
              });
          }
      }
  }

  executeGraph(data) {
    const lm = this.languageManager;
    const nodes = Object.values(data);
    const outputNode = nodes.find(n => n.name === 'Log');
    if (!outputNode) {
      const errorMsg = lm.getString('visualide_error_no_log_node', 'Output node (Log) not found.');
      if (window.app && window.app.eventBus) {
          window.app.eventBus.emit('system:error', {
              title: lm.getString('visualide_error_execution', 'Execution Error'),
              message: errorMsg
          });
      }
      throw new Error(errorMsg);
    }

    const resolveNodeValue = (nodeId) => {
      const node = data[nodeId];
      if (!node) {
          const errorMsg = lm.getString('visualide_error_node_not_found', 'Node with ID {nodeId} not found.').replace('{nodeId}', nodeId);
          if (window.app && window.app.eventBus) {
              window.app.eventBus.emit('system:error', {
                  title: lm.getString('visualide_error_execution', 'Execution Error'),
                  message: errorMsg
              });
          }
          throw new Error(errorMsg);
      }

      const getInput = (inputIndex) => {
          const input = node.inputs[`input_${inputIndex}`].connections[0];
          if (!input) {
              const errorMsg = lm.getString('visualide_error_missing_input', 'Node "{nodeName}" (ID: {nodeId}) requires input #{inputIndex}.')
                .replace('{nodeName}', node.name)
                .replace('{nodeId}', nodeId)
                .replace('{inputIndex}', inputIndex);
              if (window.app && window.app.eventBus) {
                  window.app.eventBus.emit('system:error', {
                      title: lm.getString('visualide_error_execution', 'Execution Error'),
                      message: errorMsg
                  });
              }
              throw new Error(errorMsg);
          }
          return resolveNodeValue(input.node);
      };

      switch (node.name) {
        case 'Number':
          return parseFloat(node.data.number);
        case 'String':
          return String(node.data.string);
        case 'Add':
          return getInput(1) + getInput(2);
        case 'Subtract':
          return getInput(1) - getInput(2);
        case 'Multiply':
          return getInput(1) * getInput(2);
        case 'Divide':
          return getInput(1) / getInput(2);
        case 'If':
          const condition = getInput(1);
          const trueVal = getInput(2);
          const falseVal = getInput(3);
          return condition ? trueVal : falseVal;
        case 'Equals':
            return getInput(1) == getInput(2);
        case 'GreaterThan':
            return getInput(1) > getInput(2);
        case 'LessThan':
            return getInput(1) < getInput(2);
        case 'Concat':
            return String(getInput(1)) + String(getInput(2));
        default:
          return null;
      }
    };
    
    const logInput = outputNode.inputs.input_1.connections[0];
    if (!logInput) return `(${lm.getString('visualide_no_log_input', 'No input for Log')})`;
    
    return resolveNodeValue(logInput.node);
  }
}
