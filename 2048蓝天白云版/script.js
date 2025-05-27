// 游戏常量
const GRID_SIZE = 4;
const EMPTY_CELL = 0;

// 游戏状态
let grid = [];
let score = 0;
let bestScore = 0;
let gameOver = false;
let moveHistory = [];

// DOM元素
const gameGrid = document.getElementById('game-grid');
const currentScoreElement = document.getElementById('current-score');
const bestScoreElement = document.getElementById('best-score');
const newGameBtn = document.getElementById('new-game-btn');
const undoBtn = document.getElementById('undo-btn');

// 初始化游戏
function initGame() {
    // 确保DOM已加载
    if (!gameGrid) {
        console.error('Game grid element not found!');
        return;
    }

    // 初始化空网格
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY_CELL));
    
    // 重置分数
    score = 0;
    updateScore();
    
    // 重置游戏状态
    gameOver = false;
    moveHistory = [];
    
    // 加载最高分
    bestScore = parseInt(localStorage.getItem('2048-best-score')) || 0;
    bestScoreElement.textContent = bestScore;
    
    // 生成初始方块
    addRandomTile();
    addRandomTile();
    
    // 渲染网格
    renderGrid();
    
    // 设置事件监听器
    setupEventListeners();

    console.log('Game initialized successfully');
}

// 添加随机方块(2或4)
function addRandomTile() {
    const emptyCells = [];
    
    // 找出所有空单元格
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === EMPTY_CELL) {
                emptyCells.push({ row, col });
            }
        }
    }
    
    // 如果有空单元格，随机选择一个并放置2或4
    if (emptyCells.length > 0) {
        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
}

// 渲染游戏网格(带动画支持)
function renderGrid() {
    console.log('Starting grid render...');
    
    if (!gameGrid) {
        console.error('Game grid element not found!');
        return;
    }

    // 重置所有transform并强制重排避免错位
    const existingTiles = document.querySelectorAll('.tile');
    console.log(`Found ${existingTiles.length} existing tiles`);
    
    existingTiles.forEach(tile => {
        tile.style.transform = 'none';
    });
    gameGrid.offsetHeight; // 强制重排

    // 保留现有tile元素用于动画
    const tilesCache = {};
    existingTiles.forEach(tile => {
        const key = `${tile.dataset.row}-${tile.dataset.col}`;
        tilesCache[key] = tile;
    });

    gameGrid.innerHTML = '';
    console.log('Cleared game grid');
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cellElement = document.createElement('div');
            cellElement.className = 'grid-cell';
            console.log(`Created cell at [${row},${col}]`);
            
            const value = grid[row][col];
            if (value !== EMPTY_CELL) {
                const key = `${row}-${col}`;
                let tileElement = tilesCache[key];
                
                if (!tileElement) {
                    console.log(`Creating new tile for value ${value} at [${row},${col}]`);
                    tileElement = document.createElement('div');
                    tileElement.className = 'tile new';
                    tileElement.textContent = value;
                    tileElement.style.backgroundColor = getTileColor(value);
                    tileElement.dataset.row = row;
                    tileElement.dataset.col = col;
                    
                    // 移除新方块动画类(动画完成后)
                    setTimeout(() => {
                        tileElement.classList.remove('new');
                    }, 150);
                } else {
                    console.log(`Reusing existing tile for value ${value} at [${row},${col}]`);
                    tileElement.className = 'tile';
                    tileElement.textContent = value;
                    tileElement.style.backgroundColor = getTileColor(value);
                    tileElement.dataset.row = row;
                    tileElement.dataset.col = col;
                    
                    // 检查是否是合并的方块
                    if (value > parseInt(tileElement.textContent || '0')) {
                        tileElement.classList.add('merged');
                        setTimeout(() => {
                            tileElement.classList.remove('merged');
                        }, 150);
                    }
                }
                
                cellElement.appendChild(tileElement);
                console.log(`Appended tile to cell [${row},${col}]`);
            }
            
            gameGrid.appendChild(cellElement);
        }
    }
    console.log('Grid render completed');
}

// 根据方块值获取颜色(蓝天白云主题)
function getTileColor(value) {
    const colors = {
        2: '#E6F7FF',    // 浅天蓝
        4: '#BAE7FF',    // 淡天蓝
        8: '#87CEFA',    // 天蓝
        16: '#00BFFF',   // 深天蓝
        32: '#1E90FF',   // 道奇蓝
        64: '#4169E1',   // 皇家蓝
        128: '#4682B4',  // 钢蓝
        256: '#5F9EA0',  // 卡其蓝
        512: '#4682B4',  // 钢蓝
        1024: '#1E3A8A', // 深海军蓝
        2048: '#000080'  // 海军蓝
    };
    
    return colors[value] || '#000080';
}

// 更新分数显示
function updateScore() {
    currentScoreElement.textContent = score;
    
    if (score > bestScore) {
        bestScore = score;
        bestScoreElement.textContent = bestScore;
        localStorage.setItem('2048-best-score', bestScore);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 键盘控制
    document.addEventListener('keydown', handleKeyPress);
    
    // 新游戏按钮
    newGameBtn.addEventListener('click', initGame);
    
    // 撤销按钮
    undoBtn.addEventListener('click', undoMove);
    
    // 触摸控制
    setupTouchControls();
}

// 处理键盘输入(异步支持动画)
async function handleKeyPress(event) {
    if (gameOver) return;
    
    const gridBeforeMove = JSON.parse(JSON.stringify(grid));
    let moved = false;
    
    switch (event.key) {
        case 'ArrowUp':
            moved = await moveTilesUp();
            break;
        case 'ArrowDown':
            moved = await moveTilesDown();
            break;
        case 'ArrowLeft':
            moved = await moveTilesLeft();
            break;
        case 'ArrowRight':
            moved = await moveTilesRight();
            break;
        default:
            return; // 忽略其他按键
    }
    
    if (moved) {
        // 保存移动前的状态用于撤销
        moveHistory.push({
            grid: gridBeforeMove,
            score: score
        });
        
        // 限制历史记录数量
        if (moveHistory.length > 10) {
            moveHistory.shift();
        }
        
        // 添加新方块并重新渲染
        addRandomTile();
        renderGrid();
        
        // 检查游戏结束状态
        if (isGameOver()) {
            gameOver = true;
            setTimeout(() => alert('游戏结束! 你的分数: ' + score), 100);
        }
    }
}

// 向上移动方块(带动画支持)
function moveTilesUp() {
    let moved = false;
    const movePromises = [];
    
    for (let col = 0; col < GRID_SIZE; col++) {
        // 合并相同数字
        for (let row = 1; row < GRID_SIZE; row++) {
            if (grid[row][col] !== EMPTY_CELL) {
                let currentRow = row;
                
                while (currentRow > 0 && 
                      (grid[currentRow - 1][col] === EMPTY_CELL || 
                       grid[currentRow - 1][col] === grid[currentRow][col])) {
                    // 合并相同数字
                    if (grid[currentRow - 1][col] === grid[currentRow][col]) {
                        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
                        if (tile) {
                            // 准备合并动画
                            tile.style.transform = `translateY(${(currentRow - 1 - row) * 100}%)`;
                            tile.dataset.row = currentRow - 1;
                            tile.dataset.col = col;
                            
                            // 等待移动动画完成
                            movePromises.push(new Promise(resolve => {
                                setTimeout(() => {
                                    grid[currentRow - 1][col] *= 2;
                                    grid[row][col] = EMPTY_CELL;
                                    resolve();
                                }, 150);
                            }));
                        }
                        
                        score += grid[currentRow - 1][col] * 2;
                        moved = true;
                        break;
                    }
                    // 移动数字到空位置
                    else if (grid[currentRow - 1][col] === EMPTY_CELL) {
                        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
                        if (tile) {
                            // 设置移动动画
                            tile.style.transform = `translateY(${(currentRow - 1 - row) * 100}%)`;
                            tile.dataset.row = currentRow - 1;
                            tile.dataset.col = col;
                        }
                        
                        grid[currentRow - 1][col] = grid[currentRow][col];
                        grid[currentRow][col] = EMPTY_CELL;
                        moved = true;
                        currentRow--;
                    }
                }
            }
        }
    }
    
    if (moved) {
        updateScore();
        // 等待所有动画完成再重新渲染
        return Promise.all(movePromises).then(() => true);
    }
    return Promise.resolve(false);
}

// 向下移动方块(带动画支持)
function moveTilesDown() {
    let moved = false;
    const movePromises = [];
    
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = GRID_SIZE - 2; row >= 0; row--) {
            if (grid[row][col] !== EMPTY_CELL) {
                let currentRow = row;
                
                while (currentRow < GRID_SIZE - 1 && 
                      (grid[currentRow + 1][col] === EMPTY_CELL || 
                       grid[currentRow + 1][col] === grid[currentRow][col])) {
                    if (grid[currentRow + 1][col] === grid[currentRow][col]) {
                        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
                        if (tile) {
                            tile.style.transform = `translateY(${(currentRow + 1 - row) * 100}%)`;
                            tile.dataset.row = currentRow + 1;
                            tile.dataset.col = col;
                            
                            movePromises.push(new Promise(resolve => {
                                setTimeout(() => {
                                    grid[currentRow + 1][col] *= 2;
                                    grid[row][col] = EMPTY_CELL;
                                    resolve();
                                }, 150);
                            }));
                        }
                        
                        score += grid[currentRow + 1][col] * 2;
                        moved = true;
                        break;
                    } else if (grid[currentRow + 1][col] === EMPTY_CELL) {
                        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
                        if (tile) {
                            tile.style.transform = `translateY(${(currentRow + 1 - row) * 100}%)`;
                            tile.dataset.row = currentRow + 1;
                            tile.dataset.col = col;
                        }
                        
                        grid[currentRow + 1][col] = grid[currentRow][col];
                        grid[currentRow][col] = EMPTY_CELL;
                        moved = true;
                        currentRow++;
                    }
                }
            }
        }
    }
    
    if (moved) {
        updateScore();
        return Promise.all(movePromises).then(() => true);
    }
    return Promise.resolve(false);
}

// 向左移动方块(带动画支持)
function moveTilesLeft() {
    let moved = false;
    const movePromises = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 1; col < GRID_SIZE; col++) {
            if (grid[row][col] !== EMPTY_CELL) {
                let currentCol = col;
                
                while (currentCol > 0 && 
                      (grid[row][currentCol - 1] === EMPTY_CELL || 
                       grid[row][currentCol - 1] === grid[row][currentCol])) {
                    if (grid[row][currentCol - 1] === grid[row][currentCol]) {
                        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
                        if (tile) {
                            tile.style.transform = `translateX(${(currentCol - 1 - col) * 100}%)`;
                            tile.dataset.row = row;
                            tile.dataset.col = currentCol - 1;
                            
                            movePromises.push(new Promise(resolve => {
                                setTimeout(() => {
                                    grid[row][currentCol - 1] *= 2;
                                    grid[row][col] = EMPTY_CELL;
                                    resolve();
                                }, 150);
                            }));
                        }
                        
                        score += grid[row][currentCol - 1] * 2;
                        moved = true;
                        break;
                    } else if (grid[row][currentCol - 1] === EMPTY_CELL) {
                        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
                        if (tile) {
                            tile.style.transform = `translateX(${(currentCol - 1 - col) * 100}%)`;
                            tile.dataset.row = row;
                            tile.dataset.col = currentCol - 1;
                        }
                        
                        grid[row][currentCol - 1] = grid[row][currentCol];
                        grid[row][currentCol] = EMPTY_CELL;
                        moved = true;
                        currentCol--;
                    }
                }
            }
        }
    }
    
    if (moved) {
        updateScore();
        return Promise.all(movePromises).then(() => true);
    }
    return Promise.resolve(false);
}

// 向右移动方块(带动画支持)
function moveTilesRight() {
    let moved = false;
    const movePromises = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = GRID_SIZE - 2; col >= 0; col--) {
            if (grid[row][col] !== EMPTY_CELL) {
                let currentCol = col;
                
                while (currentCol < GRID_SIZE - 1 && 
                      (grid[row][currentCol + 1] === EMPTY_CELL || 
                       grid[row][currentCol + 1] === grid[row][currentCol])) {
                    if (grid[row][currentCol + 1] === grid[row][currentCol]) {
                        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
                        if (tile) {
                            tile.style.transform = `translateX(${(currentCol + 1 - col) * 100}%)`;
                            tile.dataset.row = row;
                            tile.dataset.col = currentCol + 1;
                            
                            movePromises.push(new Promise(resolve => {
                                setTimeout(() => {
                                    grid[row][currentCol + 1] *= 2;
                                    grid[row][col] = EMPTY_CELL;
                                    resolve();
                                }, 150);
                            }));
                        }
                        
                        score += grid[row][currentCol + 1] * 2;
                        moved = true;
                        break;
                    } else if (grid[row][currentCol + 1] === EMPTY_CELL) {
                        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
                        if (tile) {
                            tile.style.transform = `translateX(${(currentCol + 1 - col) * 100}%)`;
                            tile.dataset.row = row;
                            tile.dataset.col = currentCol + 1;
                        }
                        
                        grid[row][currentCol + 1] = grid[row][currentCol];
                        grid[row][currentCol] = EMPTY_CELL;
                        moved = true;
                        currentCol++;
                    }
                }
            }
        }
    }
    
    if (moved) {
        updateScore();
        return Promise.all(movePromises).then(() => true);
    }
    return Promise.resolve(false);
}

// 检查游戏是否结束
function isGameOver() {
    // 检查是否有空单元格
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === EMPTY_CELL) {
                return false;
            }
        }
    }
    
    // 检查是否有相邻相同数字
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const value = grid[row][col];
            
            // 检查右侧
            if (col < GRID_SIZE - 1 && grid[row][col + 1] === value) {
                return false;
            }
            
            // 检查下方
            if (row < GRID_SIZE - 1 && grid[row + 1][col] === value) {
                return false;
            }
        }
    }
    
    return true;
}

// 撤销上一步移动
function undoMove() {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory.pop();
    grid = lastMove.grid;
    score = lastMove.score;
    gameOver = false;
    
    updateScore();
    renderGrid();
}

// 触摸事件支持
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 50; // 最小滑动距离

    document.addEventListener('touchstart', function(event) {
        if (gameOver) return;
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, {passive: false});

    document.addEventListener('touchmove', function(event) {
        if (gameOver || !touchStartX || !touchStartY) return;
        
        const touch = event.touches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // 检查是否达到最小滑动距离
        if (Math.abs(diffX) < minSwipeDistance && Math.abs(diffY) < minSwipeDistance) return;
        
        // 确定主要滑动方向
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平滑动
            if (diffX > 0) {
                handleKeyPress({key: 'ArrowLeft'});
            } else {
                handleKeyPress({key: 'ArrowRight'});
            }
        } else {
            // 垂直滑动
            if (diffY > 0) {
                handleKeyPress({key: 'ArrowUp'});
            } else {
                handleKeyPress({key: 'ArrowDown'});
            }
        }
        
        // 重置起点，防止连续触发
        touchStartX = 0;
        touchStartY = 0;
        
        event.preventDefault();
    }, {passive: false});
}

// 启动游戏
initGame();
