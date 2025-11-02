/**
 * Minesweeper - Сапёр
 */

export class Minesweeper {
  constructor() {
    this.rows = 10;
    this.cols = 10;
    this.mines = 15;
    this.board = [];
    this.revealed = [];
    this.flagged = [];
    this.gameOver = false;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'minesweeper-app';
    container.innerHTML = `
      <div class="minesweeper-header">
        <div class="mine-counter">💣 ${this.mines}</div>
        <button class="reset-btn">😊</button>
        <div class="timer">⏱️ 0</div>
      </div>
      <div class="minesweeper-board"></div>
    `;
    
    const board = container.querySelector('.minesweeper-board');
    const resetBtn = container.querySelector('.reset-btn');
    const mineCounter = container.querySelector('.mine-counter');
    
    const initGame = () => {
      this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
      this.revealed = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
      this.flagged = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
      this.gameOver = false;
      
      // Разместить мины
      let minesPlaced = 0;
      while (minesPlaced < this.mines) {
        const r = Math.floor(Math.random() * this.rows);
        const c = Math.floor(Math.random() * this.cols);
        if (this.board[r][c] !== -1) {
          this.board[r][c] = -1;
          minesPlaced++;
        }
      }
      
      // Подсчитать соседние мины
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.board[r][c] !== -1) {
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === -1) {
                  count++;
                }
              }
            }
            this.board[r][c] = count;
          }
        }
      }
      
      renderBoard();
    };
    
    const renderBoard = () => {
      board.innerHTML = '';
      board.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
      
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = document.createElement('div');
          cell.className = 'mine-cell';
          cell.dataset.row = r;
          cell.dataset.col = c;
          
          if (this.revealed[r][c]) {
            cell.classList.add('revealed');
            if (this.board[r][c] === -1) {
              cell.textContent = '💣';
            } else if (this.board[r][c] > 0) {
              cell.textContent = this.board[r][c];
            }
          } else if (this.flagged[r][c]) {
            cell.textContent = '🚩';
          }
          
          cell.addEventListener('click', () => revealCell(r, c));
          cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleFlag(r, c);
          });
          
          board.appendChild(cell);
        }
      }
      
      const flagCount = this.flagged.flat().filter(f => f).length;
      mineCounter.textContent = `💣 ${this.mines - flagCount}`;
    };
    
    const revealCell = (r, c) => {
      if (this.gameOver || this.revealed[r][c] || this.flagged[r][c]) return;
      
      this.revealed[r][c] = true;
      
      if (this.board[r][c] === -1) {
        this.gameOver = true;
        resetBtn.textContent = '😵';
        alert('Игра окончена!');
        // Показать все мины
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.cols; j++) {
            if (this.board[i][j] === -1) {
              this.revealed[i][j] = true;
            }
          }
        }
      } else if (this.board[r][c] === 0) {
        // Открыть соседние ячейки
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              revealCell(nr, nc);
            }
          }
        }
      }
      
      renderBoard();
    };
    
    const toggleFlag = (r, c) => {
      if (this.gameOver || this.revealed[r][c]) return;
      this.flagged[r][c] = !this.flagged[r][c];
      renderBoard();
    };
    
    resetBtn.addEventListener('click', initGame);
    
    initGame();
    
    return container;
  }
}





