/**
 * TaskManager - Диспетчер задач
 */

import { formatTime, formatBytes } from '../../core/Utils.js';

export class TaskManagerApp {
  constructor() {
    this.processManager = null;
    this.updateInterval = null;
    this.cpuHistory = new Array(60).fill(0);
    this.memHistory = new Array(60).fill(0);
    this.activeTab = 'processes'; // 'processes' or 'performance'
    this.activePerfView = 'cpu'; // 'cpu' or 'memory'
    this.selectedPid = null;
  }

  render(processManager) {
    this.processManager = processManager;
    const container = document.createElement('div');
    container.className = 'task-manager-app win11-style';
    container.innerHTML = this.getHTML();
    this.container = container; // Add this line

    this.tbody = container.querySelector('.tm-table tbody');
    this.endTaskBtn = container.querySelector('#tm-end-task-btn');
    this.cpuCanvas = container.querySelector('#cpu-graph');
    this.memCanvas = container.querySelector('#mem-graph');

    this.setupSidebar(container);
    this.attachEventListeners();
    this.updateAll();

    this.updateInterval = setInterval(() => {
        this.updateAll();
    }, 1500);
    
    // Initial draw
    setTimeout(() => this.updatePerformanceGraphs(), 100);

    return container;
  }
  
  getHTML() {
    return `
      <div class="tm-sidebar">
        <button class="tm-sidebar-btn active" data-tab="processes">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          <span class="tm-sidebar-tooltip">Processes</span>
        </button>
        <button class="tm-sidebar-btn" data-tab="performance">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <span class="tm-sidebar-tooltip">Performance</span>
        </button>
      </div>
      <div class="tm-main-content">
        <div class="tm-header">
            <h3 id="tm-view-title">Processes</h3>
            <div class="tm-header-actions">
                <input type="search" placeholder="Search by name, publisher, or PID" class="tm-search-bar">
                <button class="tm-action-btn" id="tm-end-task-btn" disabled>End task</button>
            </div>
        </div>

        <div class="tm-tab-panel active" id="processes-panel">
          <div class="tm-perf-summary">
             <div class="perf-metric">
                <div class="name">CPU</div>
                <div class="value cpu-usage-summary">0%</div>
             </div>
             <div class="perf-metric">
                <div class="name">Memory</div>
                <div class="value mem-usage-summary">0 MB</div>
             </div>
          </div>
          <div class="tm-table-container">
            <table class="tm-table">
              <thead>
                <tr>
                  <th>Process name</th>
                  <th>Status</th>
                  <th>CPU</th>
                  <th>Memory</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <div class="tm-tab-panel" id="performance-panel">
            <div class="tm-perf-view">
                <div class="tm-perf-sidebar">
                    <button class="tm-perf-sidebar-btn active" data-perf-view="cpu">CPU</button>
                    <button class="tm-perf-sidebar-btn" data-perf-view="memory">Memory</button>
                </div>
                <div class="tm-perf-main">
                    <div id="cpu-perf-view">
                        <div class="tm-perf-graph-header">
                            <h4>CPU</h4>
                            <p>AndlancerOS Virtual CPU</p>
                        </div>
                        <div class="perf-graph-container">
                            <canvas id="cpu-graph" width="600" height="120"></canvas>
                        </div>
                        <div class="tm-perf-details">
                            <div class="detail-item"><span>Utilization</span><strong><span class="cpu-usage-summary">0</span>%</strong></div>
                            <div class="detail-item"><span>Speed</span><strong>0.00 GHz</strong></div>
                            <div class="detail-item"><span>Processes</span><strong id="tm-process-count">0</strong></div>
                            <div class="detail-item"><span>Up time</span><strong id="tm-uptime">0:00:00:00</strong></div>
                        </div>
                    </div>
                    <div id="memory-perf-view" style="display: none;">
                        <div class="tm-perf-graph-header">
                            <h4>Memory</h4>
                            <p>Virtual RAM</p>
                        </div>
                        <div class="perf-graph-container">
                            <canvas id="mem-graph" width="600" height="120"></canvas>
                        </div>
                        <div class="tm-perf-details">
                            <div class="detail-item"><span>In use</span><strong class="mem-usage-summary">0 MB</strong></div>
                            <div class="detail-item"><span>Available</span><strong>8.0 GB</strong></div>
                            <div class="detail-item"><span>Committed</span><strong>0 / 16.0 GB</strong></div>
                            <div class="detail-item"><span>Cached</span><strong>0 MB</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    this.endTaskBtn.addEventListener('click', () => {
      if (this.selectedPid) {
        this.processManager.killProcess(this.selectedPid);
        this.selectedPid = null;
        this.endTaskBtn.disabled = true;
        this.updateProcessList();
      }
    });
  }
  
  setupSidebar(container) {
      const tabs = container.querySelectorAll('.tm-sidebar-btn[data-tab]');
      const panels = container.querySelectorAll('.tm-tab-panel');
      const title = container.querySelector('#tm-view-title');

      tabs.forEach(tab => {
          tab.addEventListener('click', () => {
              tabs.forEach(t => t.classList.remove('active'));
              tab.classList.add('active');
              
              this.activeTab = tab.dataset.tab;
              const targetPanelId = `${this.activeTab}-panel`;
              title.textContent = tab.querySelector('.tm-sidebar-tooltip').textContent;

              panels.forEach(p => p.classList.remove('active'));
              container.querySelector(`#${targetPanelId}`).classList.add('active');

              if (this.activeTab === 'performance') {
                  this.updatePerformanceGraphs();
              }
          });
      });

      // Performance tab view switcher
      const perfButtons = container.querySelectorAll('.tm-perf-sidebar-btn');
      const perfViews = container.querySelectorAll('#cpu-perf-view, #memory-perf-view');
      perfButtons.forEach(button => {
          button.addEventListener('click', () => {
              perfButtons.forEach(btn => btn.classList.remove('active'));
              button.classList.add('active');
              this.activePerfView = button.dataset.perfView;
              
              perfViews.forEach(view => {
                  view.style.display = view.id.startsWith(this.activePerfView) ? 'block' : 'none';
              });
              this.updatePerformanceGraphs();
          });
      });
  }

  updateAll() {
    if (!this.processManager) return;
    
    this.updateProcessList();

    if (this.activeTab === 'performance') {
        this.updatePerformanceGraphs();
    }
  }

  updateProcessList() {
    if (!this.tbody) return;
    const scrollTop = this.tbody.parentNode.scrollTop;

    const processes = this.processManager.getAllProcesses();
    this.tbody.innerHTML = processes.map(p => `
      <tr data-pid="${p.pid}" class="${p.pid === this.selectedPid ? 'selected' : ''}">
        <td>
            <div class="process-name">
                <span class="process-icon-font">${p.icon || '⚙️'}</span>
                <span>${p.name}</span>
            </div>
        </td>
        <td>-</td>
        <td>${(p.cpuUsage / 1000).toFixed(1)}%</td>
        <td>${formatBytes(p.memoryUsage)}</td>
      </tr>
    `).join('');

    this.tbody.parentNode.scrollTop = scrollTop;

    // Re-attach listeners using event delegation on the container
    const processRows = this.tbody.querySelectorAll('tr');
    processRows.forEach(row => {
        row.addEventListener('click', () => {
            if (this.selectedPid === parseInt(row.dataset.pid)) {
                // Deselect if clicking the same row again
                row.classList.remove('selected');
                this.selectedPid = null;
                this.endTaskBtn.disabled = true;
            } else {
                processRows.forEach(r => r.classList.remove('selected'));
                row.classList.add('selected');
                this.selectedPid = parseInt(row.dataset.pid);
                this.endTaskBtn.disabled = false;
            }
        });
    });

    const processCountEl = this.container.querySelector('#tm-process-count');
    if(processCountEl) processCountEl.textContent = processes.length;
  }
  
  updatePerformanceGraphs() {
      if (!this.cpuCanvas || !this.memCanvas) return;
      
      const processes = this.processManager.getAllProcesses();
      // Simulate total CPU usage more realistically
      const baseUsage = 5; // Base OS usage
      const appUsage = processes.reduce((acc, p) => acc + p.cpuUsage, 0) / 1000;
      const totalCpu = Math.min(100, baseUsage + appUsage + (Math.random() * 5));
      const totalMem = processes.reduce((acc, p) => acc + p.memoryUsage, 0);
      
      this.cpuHistory.push(totalCpu);
      if(this.cpuHistory.length > 60) this.cpuHistory.shift();
      
      this.memHistory.push(totalMem);
      if(this.memHistory.length > 60) this.memHistory.shift();
      
      this.container.querySelectorAll('.cpu-usage-summary').forEach(el => {
          el.textContent = `${totalCpu.toFixed(1)}%`;
      });
      this.container.querySelectorAll('.mem-usage-summary').forEach(el => {
          el.textContent = `${formatBytes(totalMem)}`;
      });
      const uptimeEl = this.container.querySelector('#tm-uptime');
      if (uptimeEl) {
        const seconds = this.processManager.getUptime();
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        uptimeEl.textContent = `${days}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }


      this.drawGraph(this.cpuCanvas, this.cpuHistory, 100, '#0078d4');
      this.drawGraph(this.memCanvas, this.memHistory, 8 * 1024 * 1024 * 1024, '#8e8e8e'); // Assuming 8GB RAM
  }
  
  drawGraph(canvas, data, maxValue, color) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
      ctx.lineWidth = 1;
      for(let i = 1; i < 4; i++) {
          const y = height / 4 * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
      }
      for(let i = 1; i < 10; i++) {
          const x = width / 10 * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
      }
      
      // Draw line
      ctx.strokeStyle = color;
      ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, height);

      const step = width / (data.length -1);
      data.forEach((value, index) => {
          const x = step * index;
          const y = height - (Math.min(value, maxValue) / maxValue) * height;
          ctx.lineTo(x, y);
      });
      
      ctx.lineTo(width + 5, height);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
  }

  onClose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

