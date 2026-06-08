/**
 * 俄罗斯方块 - Tetris Game
 * 纯 JavaScript 实现，无外部依赖
 * Made by Claude
 */
(function() {
  'use strict';

  // ==========================================
  // 游戏常量
  // ==========================================
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 28;

  // 七种方块形状
  const SHAPES = {
    I: { blocks: [[1,1,1,1]], color: '#00f0f0' },
    O: { blocks: [[1,1],[1,1]], color: '#f0f000' },
    T: { blocks: [[0,1,0],[1,1,1]], color: '#a000f0' },
    S: { blocks: [[0,1,1],[1,1,0]], color: '#00f000' },
    Z: { blocks: [[1,1,0],[0,1,1]], color: '#f00000' },
    J: { blocks: [[1,0,0],[1,1,1]], color: '#0000f0' },
    L: { blocks: [[0,0,1],[1,1,1]], color: '#f0a000' }
  };

  const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  // 分数系统
  const SCORE_TABLE = {
    1: 100,   // 单行
    2: 300,   // 两行
    3: 500,   // 三行
    4: 800    // 四行（Tetris!）
  };

  // ==========================================
  // 游戏状态
  // ==========================================
  let board = [];
  let currentPiece = null;
  let nextPiece = null;
  let score = 0;
  let lines = 0;
  let level = 1;
  let gameOver = false;
  let paused = false;
  let gameLoop = null;
  let dropInterval = 500;
  let lastDropTime = 0;
  let animationId = null;

  // DOM 引用
  let canvas, ctx;
  let nextCanvas, nextCtx;
  let scoreEl, linesEl, levelEl;
  let gameOverEl, finalScoreEl;

  // ==========================================
  // 初始化
  // ==========================================
  function init() {
    canvas = document.getElementById('tetris-board');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('tetris-next');
    nextCtx = nextCanvas.getContext('2d');
    scoreEl = document.getElementById('tetris-score');
    linesEl = document.getElementById('tetris-lines');
    levelEl = document.getElementById('tetris-level');
    gameOverEl = document.getElementById('tetris-gameover');
    finalScoreEl = document.getElementById('tetris-final-score');

    // 设置 canvas 大小
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    nextCanvas.width = 4 * (BLOCK_SIZE - 4);
    nextCanvas.height = 4 * (BLOCK_SIZE - 4);

    resetGame();
    setupControls();
    gameLoop = requestAnimationFrame(update);
  }

  // ==========================================
  // 游戏板操作
  // ==========================================
  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function resetGame() {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 500;
    gameOver = false;
    paused = false;
    updateUI();

    if (gameOverEl) gameOverEl.style.display = 'none';

    nextPiece = createRandomPiece();
    spawnPiece();
  }

  // ==========================================
  // 方块操作
  // ==========================================
  function createRandomPiece() {
    const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
    const shape = SHAPES[name];
    return {
      name: name,
      blocks: shape.blocks.map(row => [...row]),
      color: shape.color,
      x: Math.floor((COLS - shape.blocks[0].length) / 2),
      y: 0
    };
  }

  function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = createRandomPiece();

    // 检查是否 game over
    if (collides(currentPiece.blocks, currentPiece.x, currentPiece.y)) {
      gameOver = true;
      if (gameOverEl) {
        gameOverEl.style.display = 'block';
        if (finalScoreEl) finalScoreEl.textContent = score;
      }
      currentPiece = null;
    }

    renderNext();
  }

  function collides(blocks, offsetX, offsetY) {
    for (let r = 0; r < blocks.length; r++) {
      for (let c = 0; c < blocks[r].length; c++) {
        if (!blocks[r][c]) continue;
        const boardX = offsetX + c;
        const boardY = offsetY + r;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS || boardY < 0) return true;
        if (boardY >= 0 && board[boardY][boardX]) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    if (!currentPiece) return;
    const { blocks, x, y, color } = currentPiece;
    for (let r = 0; r < blocks.length; r++) {
      for (let c = 0; c < blocks[r].length; c++) {
        if (!blocks[r][c]) continue;
        const boardY = y + r;
        const boardX = x + c;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          board[boardY][boardX] = color;
        }
      }
    }
    clearLines();
    spawnPiece();
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== 0)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
        r++; // re-check same row
      }
    }

    if (cleared > 0) {
      lines += cleared;
      score += (SCORE_TABLE[cleared] || cleared * 100) * level;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 500 - (level - 1) * 25);
      updateUI();
    }
  }

  // ==========================================
  // 移动和旋转
  // ==========================================
  function movePiece(dx, dy) {
    if (!currentPiece || gameOver || paused) return false;
    const { blocks, x, y } = currentPiece;
    if (!collides(blocks, x + dx, y + dy)) {
      currentPiece.x += dx;
      currentPiece.y += dy;
      return true;
    }
    // 如果是向下移动失败，锁定
    if (dy === 1) {
      lockPiece();
    }
    return false;
  }

  function rotatePiece() {
    if (!currentPiece || gameOver || paused) return;
    const blocks = currentPiece.blocks;
    // 矩阵转置顺时针旋转
    const rotated = blocks[0].map((_, idx) => blocks.map(row => row[idx]).reverse());
    // 踢墙检查
    if (!collides(rotated, currentPiece.x, currentPiece.y)) {
      currentPiece.blocks = rotated;
    } else {
      // 尝试左移
      if (!collides(rotated, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.blocks = rotated;
        currentPiece.x -= 1;
      }
      // 尝试右移
      else if (!collides(rotated, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.blocks = rotated;
        currentPiece.x += 1;
      }
    }
  }

  function hardDrop() {
    if (!currentPiece || gameOver || paused) return;
    while (!collides(currentPiece.blocks, currentPiece.x, currentPiece.y + 1)) {
      currentPiece.y++;
    }
    lockPiece();
  }

  function getGhostY() {
    if (!currentPiece) return 0;
    let ghostY = currentPiece.y;
    while (!collides(currentPiece.blocks, currentPiece.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  // ==========================================
  // 绘制
  // ==========================================
  function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(canvas.width, r * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, canvas.height);
      ctx.stroke();
    }

    // 绘制已锁定的方块
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) {
          drawBlock(ctx, c, r, board[r][c]);
        }
      }
    }

    // 绘制幽灵方块（落点预览）
    if (currentPiece && !gameOver) {
      const ghostY = getGhostY();
      const { blocks, x, color } = currentPiece;
      for (let r = 0; r < blocks.length; r++) {
        for (let c = 0; c < blocks[r].length; c++) {
          if (blocks[r][c]) {
            const gx = (x + c) * BLOCK_SIZE;
            const gy = (ghostY + r) * BLOCK_SIZE;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.3;
            ctx.strokeRect(gx + 0.5, gy + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // 绘制当前方块
    if (currentPiece && !gameOver) {
      const { blocks, x, y, color } = currentPiece;
      for (let r = 0; r < blocks.length; r++) {
        for (let c = 0; c < blocks[r].length; c++) {
          if (blocks[r][c]) {
            drawBlock(ctx, x + c, y + r, color);
          }
        }
      }
    }
  }

  function drawBlock(context, col, row, color) {
    const x = col * BLOCK_SIZE;
    const y = row * BLOCK_SIZE;
    const inset = 1;

    // 主色块
    context.fillStyle = color;
    context.fillRect(x + inset, y + inset, BLOCK_SIZE - inset * 2, BLOCK_SIZE - inset * 2);

    // 高光效果
    context.fillStyle = 'rgba(255,255,255,0.2)';
    context.fillRect(x + inset, y + inset, BLOCK_SIZE - inset * 2, 3);
    context.fillRect(x + inset, y + inset, 3, BLOCK_SIZE - inset * 2);

    // 阴影效果
    context.fillStyle = 'rgba(0,0,0,0.2)';
    context.fillRect(x + BLOCK_SIZE - inset - 3, y + inset, 3, BLOCK_SIZE - inset * 2);
    context.fillRect(x + inset, y + BLOCK_SIZE - inset - 3, BLOCK_SIZE - inset * 2, 3);
  }

  function renderNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = '#1a1a2e';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) return;
    const blocks = nextPiece.blocks;
    const size = BLOCK_SIZE - 4;
    const offsetX = (nextCanvas.width - blocks[0].length * size) / 2;
    const offsetY = (nextCanvas.height - blocks.length * size) / 2;

    for (let r = 0; r < blocks.length; r++) {
      for (let c = 0; c < blocks[r].length; c++) {
        if (blocks[r][c]) {
          const x = offsetX + c * size;
          const y = offsetY + r * size;
          nextCtx.fillStyle = nextPiece.color;
          nextCtx.fillRect(x + 1, y + 1, size - 2, size - 2);
          nextCtx.fillStyle = 'rgba(255,255,255,0.2)';
          nextCtx.fillRect(x + 1, y + 1, size - 2, 2);
        }
      }
    }
  }

  function updateUI() {
    if (scoreEl) scoreEl.textContent = score;
    if (linesEl) linesEl.textContent = lines;
    if (levelEl) levelEl.textContent = level;
  }

  // ==========================================
  // 游戏循环
  // ==========================================
  function update(timestamp) {
    if (!gameOver && !paused && currentPiece) {
      if (timestamp - lastDropTime > dropInterval) {
        movePiece(0, 1);
        lastDropTime = timestamp;
      }
    }
    draw();
    gameLoop = requestAnimationFrame(update);
  }

  // ==========================================
  // 控制
  // ==========================================
  function setupControls() {
    // 键盘控制
    document.addEventListener('keydown', function(e) {
      if (gameOver || paused) {
        if (e.key === ' ' && gameOver) {
          e.preventDefault();
          resetGame();
        }
        if (e.key === 'p' || e.key === 'P') {
          paused = !paused;
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          paused = !paused;
          break;
      }
    });

    // 移动端触控按钮
    const btnLeft = document.getElementById('tetris-btn-left');
    const btnRight = document.getElementById('tetris-btn-right');
    const btnRotate = document.getElementById('tetris-btn-rotate');
    const btnDrop = document.getElementById('tetris-btn-drop');
    const btnDown = document.getElementById('tetris-btn-down');
    const btnRestart = document.getElementById('tetris-btn-restart');
    const btnPause = document.getElementById('tetris-btn-pause');

    function addTouch(el, fn) {
      if (!el) return;
      el.addEventListener('click', function(e) {
        e.preventDefault();
        fn();
      });
      el.addEventListener('touchstart', function(e) {
        e.preventDefault();
        fn();
      });
    }

    addTouch(btnLeft, () => movePiece(-1, 0));
    addTouch(btnRight, () => movePiece(1, 0));
    addTouch(btnRotate, rotatePiece);
    addTouch(btnDrop, hardDrop);
    addTouch(btnDown, () => movePiece(0, 1));
    addTouch(btnRestart, resetGame);
    addTouch(btnPause, () => { paused = !paused; });
  }

  // ==========================================
  // 页面加载时启动
  // ==========================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
