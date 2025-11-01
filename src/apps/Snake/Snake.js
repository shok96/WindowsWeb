/**
 * Snake - Классическая игра Змейка
 */

export class Snake {
  constructor() {
    this.gridSize = 20;
    this.tileCount = 20;
    this.snake = [{ x: 10, y: 10 }];
    this.food = { x: 15, y: 15 };
    this.dx = 0;
    this.dy = 0;
    this.score = 0;
    this.gameRunning = false;
    this.gameLoop = null;
    this.languageManager = null;
  }

  render(languageManager = null) {
    this.languageManager = languageManager;
    const lm = this.languageManager;
    const getString = (key, fallback) => {
      return lm ? lm.getString(key, fallback) : fallback;
    };
    const container = document.createElement('div');
    container.className = 'snake-app';
    container.innerHTML = `
      <div class="snake-header">
        <div class="score-display">${getString('snake_score', 'Очки')}: <span id="snake-score">0</span></div>
        <button class="start-btn" id="snake-start-btn">${getString('snake_start', 'Старт')}</button>
        <div class="high-score-display">${getString('snake_high_score', 'Рекорд')}: <span id="snake-high-score">0</span></div>
      </div>
      <canvas id="snake-canvas" width="400" height="400"></canvas>
      <div class="snake-controls">
        <p>${getString('snake_controls', 'Используйте стрелки для управления')}</p>
        <div class="arrow-controls">
          <div class="arrow-row">
            <button class="arrow-btn" data-dir="up">↑</button>
          </div>
          <div class="arrow-row">
            <button class="arrow-btn" data-dir="left">←</button>
            <button class="arrow-btn" data-dir="down">↓</button>
            <button class="arrow-btn" data-dir="right">→</button>
          </div>
        </div>
      </div>
    `;
    
    const canvas = container.querySelector('#snake-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = container.querySelector('#snake-score');
    const highScoreDisplay = container.querySelector('#snake-high-score');
    const startBtn = container.querySelector('#snake-start-btn');
    const arrowBtns = container.querySelectorAll('.arrow-btn');
    
    // Загрузить рекорд из localStorage
    const loadHighScore = () => {
      const highScore = localStorage.getItem('snakeHighScore') || 0;
      highScoreDisplay.textContent = highScore;
    };
    
    // Сохранить рекорд в localStorage
    const saveHighScore = (score) => {
      const currentHighScore = parseInt(localStorage.getItem('snakeHighScore') || 0);
      if (score > currentHighScore) {
        localStorage.setItem('snakeHighScore', score);
        highScoreDisplay.textContent = score;
      }
    };
    
    loadHighScore();
    
    // Рисование игрового поля
    const drawGame = () => {
      // Очистка канваса
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Рисование сетки
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i <= this.tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * this.gridSize, 0);
        ctx.lineTo(i * this.gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * this.gridSize);
        ctx.lineTo(canvas.width, i * this.gridSize);
        ctx.stroke();
      }
      
      // Рисование еды
      ctx.fillStyle = '#e81123';
      ctx.fillRect(this.food.x * this.gridSize + 2, this.food.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);
      
      // Рисование змейки
      ctx.fillStyle = '#4ecdc4';
      this.snake.forEach((segment, index) => {
        if (index === 0) {
          // Голова змейки
          ctx.fillStyle = '#45b7b8';
        } else {
          ctx.fillStyle = '#4ecdc4';
        }
        ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);
      });
    };
    
    // Проверка столкновения
    const checkCollision = () => {
      const head = this.snake[0];
      
      // Столкновение со стенами
      if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
        return true;
      }
      
      // Столкновение с собой
      for (let i = 1; i < this.snake.length; i++) {
        if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
          return true;
        }
      }
      
      return false;
    };
    
    // Генерация новой еды
    const generateFood = () => {
      let newFood;
      do {
        newFood = {
          x: Math.floor(Math.random() * this.tileCount),
          y: Math.floor(Math.random() * this.tileCount)
        };
      } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
      this.food = newFood;
    };
    
    // Игровой цикл
    const gameStep = () => {
      if (!this.gameRunning) return;
      
      // Проверка направления
      if (this.dx === 0 && this.dy === 0) {
        this.gameLoop = requestAnimationFrame(gameStep);
        return;
      }
      
      // Движение змейки
      const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
      this.snake.unshift(head);
      
      // Проверка поедания еды
      if (head.x === this.food.x && head.y === this.food.y) {
        this.score++;
        scoreDisplay.textContent = this.score;
        generateFood();
      } else {
        this.snake.pop();
      }
      
      // Проверка столкновения
      if (checkCollision()) {
        gameOver();
        return;
      }
      
      drawGame();
      this.gameLoop = setTimeout(() => requestAnimationFrame(gameStep), 150);
    };
    
    // Начало игры
    const startGame = () => {
      this.snake = [{ x: 10, y: 10 }];
      this.dx = 0;
      this.dy = 0;
      this.score = 0;
      this.gameRunning = true;
      scoreDisplay.textContent = 0;
      startBtn.textContent = getString('snake_pause', 'Пауза');
      generateFood();
      drawGame();
      gameStep();
    };
    
    // Пауза/возобновление
    const togglePause = () => {
      if (!this.gameRunning && this.snake.length > 0) {
        this.gameRunning = true;
        startBtn.textContent = getString('snake_pause', 'Пауза');
        gameStep();
      } else if (this.gameRunning) {
        this.gameRunning = false;
        startBtn.textContent = getString('snake_resume', 'Продолжить');
        if (this.gameLoop) {
          cancelAnimationFrame(this.gameLoop);
        }
      }
    };
    
    // Конец игры
    const gameOver = () => {
      this.gameRunning = false;
      startBtn.textContent = getString('snake_start', 'Старт');
      if (this.gameLoop) {
        cancelAnimationFrame(this.gameLoop);
      }
      saveHighScore(this.score);
      const gameOverMsg = getString('snake_game_over', 'Игра окончена! Ваш счет: {score}');
      alert(gameOverMsg.replace('{score}', this.score));
    };
    
    // Управление с клавиатуры
    const handleKeyPress = (e) => {
      if (!this.gameRunning && e.key !== ' ') return;
      
      const keyPressed = e.key;
      const head = this.snake[0];
      const second = this.snake[1];
      
      switch (keyPressed) {
        case 'ArrowUp':
          e.preventDefault();
          if (!second || second.y >= head.y) {
            this.dx = 0;
            this.dy = -1;
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!second || second.y <= head.y) {
            this.dx = 0;
            this.dy = 1;
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!second || second.x >= head.x) {
            this.dx = -1;
            this.dy = 0;
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!second || second.x <= head.x) {
            this.dx = 1;
            this.dy = 0;
          }
          break;
        case ' ':
          e.preventDefault();
          if (this.gameRunning || this.snake.length === 1) {
            togglePause();
          } else {
            startGame();
          }
          break;
      }
    };
    
    // Управление кнопками
    const handleArrowClick = (direction) => {
      if (!this.gameRunning) return;
      
      const head = this.snake[0];
      const second = this.snake[1];
      
      switch (direction) {
        case 'up':
          if (!second || second.y >= head.y) {
            this.dx = 0;
            this.dy = -1;
          }
          break;
        case 'down':
          if (!second || second.y <= head.y) {
            this.dx = 0;
            this.dy = 1;
          }
          break;
        case 'left':
          if (!second || second.x >= head.x) {
            this.dx = -1;
            this.dy = 0;
          }
          break;
        case 'right':
          if (!second || second.x <= head.x) {
            this.dx = 1;
            this.dy = 0;
          }
          break;
      }
    };
    
    // Обработчики событий
    startBtn.addEventListener('click', () => {
      if (!this.gameRunning && this.snake.length === 1) {
        startGame();
      } else {
        togglePause();
      }
    });
    
    document.addEventListener('keydown', handleKeyPress);
    
    arrowBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        handleArrowClick(btn.dataset.dir);
      });
    });
    
    // Сохранить ссылку на обработчик для очистки
    this._keyHandler = handleKeyPress;
    
    // Начальное отображение
    drawGame();
    
    return container;
  }
  
  destroy() {
    // Удалить обработчик событий
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
    
    // Остановить игровой цикл
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    
    this.gameRunning = false;
  }
}

