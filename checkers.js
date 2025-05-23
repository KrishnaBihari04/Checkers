class CheckersGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.whitePieces = 12;
        this.blackPieces = 12;
        this.mustCapture = false;
        this.initializeBoard();
        this.renderBoard();
        this.setupEventListeners();
    }
    initializeBoard() {
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    if (row < 3) {
                        this.board[row][col] = { color: 'black', isKing: false };
                    } else if (row > 4) {
                        this.board[row][col] = { color: 'white', isKing: false };
                    } else {
                        this.board[row][col] = null;
                    }
                } else {
                    this.board[row][col] = null;
                }
            }
        }
    }
    renderBoard() {
        const boardElement = document.getElementById('board');
        const whiteScoreElement = document.getElementById('white-score');
        const blackScoreElement = document.getElementById('black-score');
        boardElement.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.classList.add('piece', piece.color);
                    if (piece.isKing) pieceElement.classList.add('king');
                    square.appendChild(pieceElement);
                }
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                boardElement.appendChild(square);
            }
        }
        // Update score
        whiteScoreElement.textContent = `White: ${this.whitePieces}`;
        blackScoreElement.textContent = `Black: ${this.blackPieces}`;
        // Check for win condition
        this.checkWinCondition();
    }
    setupEventListeners() {
        const restartBtn = document.getElementById('restart-btn');
        restartBtn.addEventListener('click', () => this.restartGame());
    }
    handleSquareClick(row, col) {
        const piece = this.board[row][col];
        const status = document.getElementById('status');
        // Clear previous possible moves
        document.querySelectorAll('.possible-move').forEach(el => el.classList.remove('possible-move'));
        // If no piece selected, select a piece of current player
        if (!this.selectedPiece) {
            if (piece && piece.color === this.currentPlayer) {this.selectedPiece = { row, col };
                document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`).classList.add('selected');
                // Show possible moves
                this.showPossibleMoves(row, col);
            }
        } else {
            // Try to move the selected piece
            if (this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
                // Switch player
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                status.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
            }
            // Clear selection
            document.querySelector(`.square[data-row="${this.selectedPiece.row}"][data-col="${this.selectedPiece.col}"]`).classList.remove('selected');
            this.selectedPiece = null;
        }
    }
    showPossibleMoves(fromRow, fromCol) {
        const piece = this.board[fromRow][fromCol];
        const possibleCaptures = this.findPossibleCaptures(fromRow, fromCol);
        // If captures are possible, only show capture moves
        if (possibleCaptures.length > 0) {
            this.mustCapture = true;
            possibleCaptures.forEach(move => {
                const square = document.querySelector(`.square[data-row="${move.toRow}"][data-col="${move.toCol}"]`);
                square.classList.add('possible-move');
            });
        } else {
            this.mustCapture = false;
            const directions = piece.isKing ? [1, -1] : (piece.color === 'white' ? [-1] : [1]);
            directions.forEach(direction => {
                const moves = [
                    { toRow: fromRow + direction, toCol: fromCol - 1 },
                    { toRow: fromRow + direction, toCol: fromCol + 1 }
                ];
                moves.forEach(move => {
                    if (this.isValidMove(fromRow, fromCol, move.toRow, move.toCol)) {
                        const square = document.querySelector(`.square[data-row="${move.toRow}"][data-col="${move.toCol}"]`);
                        square.classList.add('possible-move');
                    }
                });
            });
        }
    }
    findPossibleCaptures(fromRow, fromCol) {
        const piece = this.board[fromRow][fromCol];
        const captures = [];
        const directions = piece.isKing ? [1, -1] : (piece.color === 'white' ? [-1] : [1]);
        directions.forEach(rowDir => {
            [-1, 1].forEach(colDir => {
                const toRow = fromRow + (rowDir * 2);
                const toCol = fromCol + (colDir * 2);
                if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                    captures.push({ toRow, toCol });
                }
            });
        });
        return captures;
    }
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const targetSquare = this.board[toRow] ? this.board[toRow][toCol] : null;
        // Out of board check
        if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
        // Check if target square is empty
        if (targetSquare !== null) return false;
        // Determine move direction
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const direction = piece.color === 'white' ? -1 : 1;
        // Regular move (diagonal, one square)
        if (Math.abs(colDiff) === 1 &&
            ((piece.isKing && Math.abs(rowDiff) === 1) ||
             (!piece.isKing && rowDiff === direction))) {
            // If captures are mandatory, prevent regular moves
            if (this.mustCapture) return false;
            return true;
        }
        // Jump move (capture)
        if (Math.abs(colDiff) === 2 &&
            ((piece.isKing && Math.abs(rowDiff) === 2) ||
             (!piece.isKing && rowDiff === direction * 2))) {
            const midRow = fromRow + (rowDiff / 2);
            const midCol = fromCol + (colDiff / 2);
            const midPiece = this.board[midRow][midCol];
            // Check if there's an opponent's piece to capture
            if (midPiece && midPiece.color !== piece.color) {
                // Remove captured piece
                this.board[midRow][midCol] = null;
                // Update piece count
                if (midPiece.color === 'white') {
                    this.whitePieces--;
                } else {
                    this.blackPieces--;
                }
                return true;
            }
        }
        return false;
    }
    movePiece(fromRow, fromCol, toRow, toCol) {
        // Move the piece
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
        // Check for king promotion
        if ((this.board[toRow][toCol].color === 'white' && toRow === 0) ||
            (this.board[toRow][toCol].color === 'black' && toRow === 7)) {
            this.board[toRow][toCol].isKing = true;
        }
        this.renderBoard();
    }
    checkWinCondition() {
        const status = document.getElementById('status');
        const winnerModal = document.getElementById('winner-modal');
        const winnerText = document.getElementById('winner-text');
        if (this.whitePieces === 0) {
            winnerModal.style.display = 'flex';
            winnerText.textContent = 'Black Wins!';
            status.textContent = 'Game Over';
        } else if (this.blackPieces === 0) {
            winnerModal.style.display = 'flex';
            winnerText.textContent = 'White Wins!';
            status.textContent = 'Game Over';
        }
    }
    restartGame() {
        const winnerModal = document.getElementById('winner-modal');
        const status = document.getElementById('status');
        // Reset game state
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.whitePieces = 12;
        this.blackPieces = 12;
        this.mustCapture = false;
        // Reinitialize board
        this.initializeBoard();
        this.renderBoard();
        // Hide winner modal
        winnerModal.style.display = 'none';
        status.textContent = "White's Turn";
    }
}
// Initialize the game
const game = new CheckersGame();