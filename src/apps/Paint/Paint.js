/**
 * Paint - A simple drawing application
 */
export class Paint {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.lineWidth = 5;
    this.lineColor = '#000000';
    this.tool = 'brush'; // 'brush' or 'eraser'
    this.lineCap = 'round'; // 'round' or 'square'
    this.languageManager = null;
  }

  render(languageManager) {
    this.languageManager = languageManager;
    const lm = this.languageManager;
    const container = document.createElement('div');
    container.className = 'paint-app';

    container.innerHTML = `
      <div class="paint-toolbar">
        <div class="tool-group">
            <label>${lm.getString('paint_color', 'Color')}:</label>
            <input type="color" class="color-picker" value="${this.lineColor}">
        </div>
        <div class="tool-group">
            <label>${lm.getString('paint_thickness', 'Thickness')}:</label>
            <input type="range" class="line-width" min="1" max="50" value="${this.lineWidth}">
            <span class="width-preview">${this.lineWidth}</span>
        </div>
        <div class="tool-group">
            <label>${lm.getString('paint_tool', 'Tool')}:</label>
            <button class="tool-btn active" data-tool="brush">✏️ ${lm.getString('paint_tool_brush', 'Brush')}</button>
            <button class="tool-btn" data-tool="eraser">🧼 ${lm.getString('paint_tool_eraser', 'Eraser')}</button>
        </div>
        <div class="tool-group">
            <label>${lm.getString('paint_brush_shape', 'Brush Shape')}:</label>
            <button class="tool-btn active" data-cap="round">${lm.getString('paint_shape_round', 'Round')}</button>
            <button class="tool-btn" data-cap="square">${lm.getString('paint_shape_square', 'Square')}</button>
        </div>
        <div class="tool-group">
            <button class="action-btn" data-action="fill">🎨 ${lm.getString('paint_fill', 'Fill')}</button>
            <button class="action-btn" data-action="clear">🗑️ ${lm.getString('paint_clear', 'Clear')}</button>
        </div>
        <div class="tool-group io-group">
            <button class="action-btn" data-action="save">💾 ${lm.getString('paint_save', 'Save')}</button>
            <label for="paint-file-input" class="action-btn file-input-label">📤 ${lm.getString('paint_load', 'Load')}</label>
            <input type="file" id="paint-file-input" accept="image/*" style="display: none;">
        </div>
      </div>
      <canvas class="paint-canvas"></canvas>
    `;

    this.canvas = container.querySelector('.paint-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Set canvas size
    setTimeout(() => {
      const canvasContainer = this.canvas.parentElement;
      this.canvas.width = canvasContainer.clientWidth;
      this.canvas.height = canvasContainer.clientHeight - container.querySelector('.paint-toolbar').offsetHeight;
      this.fillCanvas(); // Initial white background
    }, 0);

    this.attachEventListeners(container);

    return container;
  }
  
  fillCanvas(color = '#FFFFFF') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  attachEventListeners(container) {
    const colorPicker = container.querySelector('.color-picker');
    const lineWidthSlider = container.querySelector('.line-width');
    const widthPreview = container.querySelector('.width-preview');

    colorPicker.addEventListener('change', (e) => this.lineColor = e.target.value);
    
    lineWidthSlider.addEventListener('input', (e) => {
      this.lineWidth = e.target.value;
      widthPreview.textContent = this.lineWidth;
    });

    // Tool selection
    container.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelector('.tool-btn[data-tool].active').classList.remove('active');
            btn.classList.add('active');
            this.tool = btn.dataset.tool;
        });
    });
    
    // Line cap selection
    container.querySelectorAll('.tool-btn[data-cap]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelector('.tool-btn[data-cap].active').classList.remove('active');
            btn.classList.add('active');
            this.lineCap = btn.dataset.cap;
        });
    });

    // Action buttons
    container.querySelector('[data-action="clear"]').addEventListener('click', () => this.fillCanvas());
    container.querySelector('[data-action="fill"]').addEventListener('click', () => this.fillCanvas(this.lineColor));
    container.querySelector('[data-action="save"]').addEventListener('click', () => this.saveImage());
    
    const fileInput = container.querySelector('#paint-file-input');
    fileInput.addEventListener('change', (e) => this.loadImage(e));


    // Canvas drawing events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
  }

  startDrawing(e) {
    this.isDrawing = true;
    this.ctx.beginPath(); // <--- FIX: Start a new path
    this.ctx.moveTo(e.offsetX, e.offsetY);
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  draw(e) {
    if (!this.isDrawing) return;

    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = this.lineCap;

    if (this.tool === 'brush') {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = this.lineColor;
    } else if (this.tool === 'eraser') {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.strokeStyle = 'rgba(0,0,0,1)'; // Eraser color doesn't matter, but needs to be opaque
    }

    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
  }
  
  saveImage() {
      const link = document.createElement('a');
      link.download = 'drawing.png';
      link.href = this.canvas.toDataURL('image/png');
      link.click();
  }
  
  loadImage(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
          };
          img.src = event.target.result;
      };
      reader.readAsDataURL(file);
  }
}

