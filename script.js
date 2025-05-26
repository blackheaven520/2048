document.addEventListener('DOMContentLoaded', () => {
    const GRID_SIZE = 4;
    const CELL_SIZE = 90; // Should match .tile width/height in CSS
    const CELL_GAP = 10; // Should match gap in #game-board in CSS

    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const newGameButton = document.getElementById('new-game-button');

    let grid; // 2D array to store tile values
    let score = 0; // Initialize score
    let gameWon = false; // Flag to track if the game has been won

    function clearGameOverMessage() {
        const existingMessage = document.querySelector('.game-over-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    function showGameOverMessage(messageText, showTryAgainButton = true) {
        clearGameOverMessage(); // Clear any existing message first

        const overlay = document.createElement('div');
        overlay.classList.add('game-over-message');

        const messageP = document.createElement('p');
        messageP.textContent = messageText;
        overlay.appendChild(messageP);

        if (showTryAgainButton) {
            const tryAgainButton = document.createElement('button');
            tryAgainButton.textContent = 'Try Again';
            tryAgainButton.addEventListener('click', () => {
                startGame(); // This will also clear the message via its own call
            });
            overlay.appendChild(tryAgainButton);
        }
        // Append to the gameBoard's parent, which is .container, for better layering
        // Or ensure gameBoard is relative and this is absolute, and append to gameBoard
        gameBoard.parentNode.appendChild(overlay); // Assuming .container is the parent
    }


    function createBoardCells() { // Renamed from createBoard to only create background cells
        // Clear only tiles and game-over messages, not cells if they are already there.
        // However, for simplicity and ensuring a clean state, clearing gameBoard and rebuilding cells is fine.
        gameBoard.innerHTML = ''; 
        clearGameOverMessage(); // Ensure messages are cleared when board is reset

        // Create background cells
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                gameBoard.appendChild(cell);
            }
        }
    }

    function initializeGrid() {
        grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    }

    function getRandomEmptyCell() {
        const emptyCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        if (emptyCells.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }

    function addTile(position, value) {
        // This function is being replaced by redrawAllTiles and direct grid manipulation.
        // Old addTile function is removed.
    }


    // New function to add a tile to the grid model only
    function addTileToGrid(position, value) {
        if (!position) return;
        grid[position.r][position.c] = value;
    }

    function redrawAllTiles() {
        // Remove existing tile elements
        const existingTiles = gameBoard.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());

        // Add new tiles based on the grid model
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const value = grid[r][c];
                if (value > 0) {
                    const tile = document.createElement('div');
                    tile.classList.add('tile');
                    tile.dataset.value = value;
                    tile.textContent = value;

                    const newLeft = CELL_GAP + c * (CELL_SIZE + CELL_GAP);
                    const newTop = CELL_GAP + r * (CELL_SIZE + CELL_GAP);

                    tile.style.left = `${newLeft}px`;
                    tile.style.top = `${newTop}px`;
                    
                    // Append to gameBoard, not a cell
                    gameBoard.appendChild(tile);
                }
            }
        }
    }

    function slideAndMergeRowOrColumn(line) {
        let movedInLine = false;
        let currentScoreIncrease = 0;
        const originalLine = line.slice(); // For checking if moved

        const noZeros = line.filter(val => val !== 0);
        const mergedLine = [];

        for (let i = 0; i < noZeros.length; i++) {
            if (i < noZeros.length - 1 && noZeros[i] === noZeros[i + 1]) {
                const mergedValue = noZeros[i] * 2;
                mergedLine.push(mergedValue);
                currentScoreIncrease += mergedValue;
                i++; // Skip the next tile as it's merged
            } else {
                mergedLine.push(noZeros[i]);
            }
        }

        const newLine = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            if (i < mergedLine.length) {
                newLine.push(mergedLine[i]);
            } else {
                newLine.push(0);
            }
        }

        // Check if the line actually changed
        for (let i = 0; i < GRID_SIZE; i++) {
            if (originalLine[i] !== newLine[i]) {
                movedInLine = true;
                break;
            }
        }
        
        return { newLine, scoreIncrease: currentScoreIncrease, moved: movedInLine };
    }

    function moveLeft() {
        let overallMoved = false;
        for (let r = 0; r < GRID_SIZE; r++) {
            const line = grid[r];
            const result = slideAndMergeRowOrColumn(line);
            grid[r] = result.newLine;
            score += result.scoreIncrease;
            overallMoved = overallMoved || result.moved;
        }
        return overallMoved;
    }

    function moveRight() {
        let overallMoved = false;
        for (let r = 0; r < GRID_SIZE; r++) {
            const line = grid[r].slice().reverse();
            const result = slideAndMergeRowOrColumn(line);
            grid[r] = result.newLine.reverse();
            score += result.scoreIncrease;
            overallMoved = overallMoved || result.moved;
        }
        return overallMoved;
    }

    function moveUp() {
        let overallMoved = false;
        for (let c = 0; c < GRID_SIZE; c++) {
            const line = [];
            for (let r = 0; r < GRID_SIZE; r++) {
                line.push(grid[r][c]);
            }
            const result = slideAndMergeRowOrColumn(line);
            for (let r = 0; r < GRID_SIZE; r++) {
                grid[r][c] = result.newLine[r];
            }
            score += result.scoreIncrease;
            overallMoved = overallMoved || result.moved;
        }
        return overallMoved;
    }

    function moveDown() {
        let overallMoved = false;
        for (let c = 0; c < GRID_SIZE; c++) {
            const line = [];
            // Extract column bottom-to-top (reversed)
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                line.push(grid[r][c]);
            }
            const result = slideAndMergeRowOrColumn(line);
            // Fill the column top-to-bottom with the reversed result
            for (let r = 0; r < GRID_SIZE; r++) {
                grid[GRID_SIZE - 1 - r][c] = result.newLine[r];
            }
            score += result.scoreIncrease;
            overallMoved = overallMoved || result.moved;
        }
        return overallMoved;
    }

    function addRandomTileAfterMove() {
        const emptyCell = getRandomEmptyCell();
        if (emptyCell) {
            const value = Math.random() < 0.9 ? 2 : 4;
            addTileToGrid(emptyCell, value); // Update grid model only
        }
    }

    function updateScoreDisplay() {
        scoreElement.textContent = score;
    }

    function checkForWin() {
        if (gameWon) return true; // Already won, no need to check again or show message again

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === 2048) {
                    gameWon = true;
                    showGameOverMessage("You Win!", true);
                    return true;
                }
            }
        }
        return false;
    }

    function canMove() {
        // Check for empty cells
        if (getRandomEmptyCell()) {
            return true;
        }

        // Check for possible merges
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                // Check right
                if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) {
                    return true;
                }
                // Check down
                if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) {
                    return true;
                }
            }
        }
        return false; // No empty cells and no possible merges
    }

    function checkGameOver() {
        if (checkForWin()) {
            // Game won, message already shown by checkForWin
            return;
        }

        if (!canMove()) {
            showGameOverMessage("Game Over!", true);
        }
    }

    function handleInput(event) {
        // If a game over message is showing, don't process input (except for its own buttons)
        if (document.querySelector('.game-over-message')) {
             // Allow 'Enter' perhaps to trigger 'Try Again' if it's the only button?
             // For now, just block game moves.
            if (event.key === "Enter") {
                const tryAgainButton = document.querySelector('.game-over-message button');
                if (tryAgainButton) tryAgainButton.click();
            }
            return;
        }

        let moved = false;
        switch (event.key) {
            case "ArrowUp":
                moved = moveUp();
                break;
            case "ArrowDown":
                moved = moveDown();
                break;
            case "ArrowLeft":
                moved = moveLeft();
                break;
            case "ArrowRight":
                moved = moveRight();
                break;
            default:
                return; // Exit if not an arrow key
        }

        if (moved) {
            updateScoreDisplay();
            addRandomTileAfterMove(); // This updates the grid model
            redrawAllTiles();         // This updates the DOM from the grid model
            checkGameOver();          // Check game state after move and redraw
        }
        // Prevent default browser action for arrow keys (scrolling)
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
        }
    }

    function startGame() {
        clearGameOverMessage(); // Clear any existing game over/win messages
        createBoardCells();     // Create the static background cells
        initializeGrid();       // Initialize the grid data structure
        score = 0;
        gameWon = false;        // Reset game won flag
        updateScoreDisplay();

        // Add two initial tiles to the grid model
        const initialTile1Pos = getRandomEmptyCell();
        if (initialTile1Pos) {
            const value1 = Math.random() < 0.9 ? 2 : 4;
            addTileToGrid(initialTile1Pos, value1);
        }

        const initialTile2Pos = getRandomEmptyCell();
        if (initialTile2Pos) {
            const value2 = Math.random() < 0.9 ? 2 : 4;
            addTileToGrid(initialTile2Pos, value2);
        }
        redrawAllTiles(); // Initial draw of tiles
        checkGameOver(); // Check if the initial state is already game over (e.g. extremely unlucky board)
    }

    newGameButton.addEventListener('click', startGame);
    document.addEventListener('keydown', handleInput);

    // Initial game start
    startGame();
});
