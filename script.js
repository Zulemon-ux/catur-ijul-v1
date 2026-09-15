/* =========================================================
   CHESS ARENA V2
   No Login / No Database / Offline
   ========================================================= */


/* =========================
   CONSTANTS
========================= */

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const PIECES = {
    white: {
        king: "♔",
        queen: "♕",
        rook: "♖",
        bishop: "♗",
        knight: "♘",
        pawn: "♙"
    },

    black: {
        king: "♚",
        queen: "♛",
        rook: "♜",
        bishop: "♝",
        knight: "♞",
        pawn: "♟"
    }
};


/* =========================
   DOM
========================= */

const boardElement =
    document.getElementById("chessBoard");

const whiteTimerElement =
    document.getElementById("whiteTimer");

const blackTimerElement =
    document.getElementById("blackTimer");

const moveHistoryElement =
    document.getElementById("moveHistory");

const moveCountElement =
    document.getElementById("moveCount");

const undoButton =
    document.getElementById("undoBtn");

const newGameButton =
    document.getElementById("newGameBtn");

const resignButton =
    document.getElementById("resignBtn");

const flipButton =
    document.getElementById("flipBtn");

const settingsButton =
    document.getElementById("settingsBtn");

const settingsModal =
    document.getElementById("settingsModal");

const closeSettingsButton =
    document.getElementById("closeSettings");

const soundToggle =
    document.getElementById("soundToggle");

const coordinatesToggle =
    document.getElementById("coordinatesToggle");

const animationsToggle =
    document.getElementById("animationsToggle");

const hapticToggle =
    document.getElementById("hapticToggle");

const promotionModal =
    document.getElementById("promotionModal");

const resultModal =
    document.getElementById("resultModal");

const resultIcon =
    document.getElementById("resultIcon");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const resultNewGame =
    document.getElementById("resultNewGame");

const toast =
    document.getElementById("toast");

const toastIcon =
    document.getElementById("toastIcon");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================
   GAME STATE
========================= */

let board = [];

let currentTurn = "white";

let selectedSquare = null;

let legalMoves = [];

let history = [];

let moveHistory = [];

let boardFlipped = false;

let gameOver = false;

let pendingPromotion = null;

let lastMove = null;

let timerInterval = null;

let time = {
    white: 600,
    black: 600
};


/* =========================
   SETTINGS
========================= */

let settings = {
    sound: true,
    coordinates: true,
    animations: true,
    haptic: true
};


/* =========================
   INITIAL BOARD
========================= */

function createInitialBoard() {

    const emptyRow = () =>
        Array(8).fill(null);

    const newBoard = [
        emptyRow(),
        emptyRow(),
        emptyRow(),
        emptyRow(),
        emptyRow(),
        emptyRow(),
        emptyRow(),
        emptyRow()
    ];

    const backRank = [
        "rook",
        "knight",
        "bishop",
        "queen",
        "king",
        "bishop",
        "knight",
        "rook"
    ];


    for (let x = 0; x < 8; x++) {

        newBoard[0][x] = {
            type: backRank[x],
            color: "black",
            moved: false
        };

        newBoard[1][x] = {
            type: "pawn",
            color: "black",
            moved: false
        };

        newBoard[6][x] = {
            type: "pawn",
            color: "white",
            moved: false
        };

        newBoard[7][x] = {
            type: backRank[x],
            color: "white",
            moved: false
        };
    }

    return newBoard;
}


/* =========================
   START GAME
========================= */

function startGame() {

    board = createInitialBoard();

    currentTurn = "white";

    selectedSquare = null;

    legalMoves = [];

    history = [];

    moveHistory = [];

    boardFlipped = false;

    gameOver = false;

    pendingPromotion = null;

    lastMove = null;

    time.white = 600;
    time.black = 600;

    clearInterval(timerInterval);

    closeModal(promotionModal);
    closeModal(resultModal);

    renderBoard();

    renderHistory();

    updateTimers();

    startTimer();

    updateButtons();

    showToast("Game baru dimulai", "✓");

    haptic();
}


/* =========================
   RENDER BOARD
========================= */

function renderBoard() {

    boardElement.innerHTML = "";

    for (let visualRow = 0; visualRow < 8; visualRow++) {

        for (let visualCol = 0; visualCol < 8; visualCol++) {

            let row = boardFlipped
                ? 7 - visualRow
                : visualRow;

            let col = boardFlipped
                ? 7 - visualCol
                : visualCol;

            const square = document.createElement("div");

            square.classList.add("square");

            if ((row + col) % 2 === 0) {
                square.classList.add("light");
            } else {
                square.classList.add("dark");
            }


            square.dataset.row = row;
            square.dataset.col = col;


            /* SELECTED */

            if (
                selectedSquare &&
                selectedSquare.row === row &&
                selectedSquare.col === col
            ) {
                square.classList.add("selected");
            }


            /* LAST MOVE */

            if (
                lastMove &&
                (
                    (
                        lastMove.from.row === row &&
                        lastMove.from.col === col
                    )
                    ||
                    (
                        lastMove.to.row === row &&
                        lastMove.to.col === col
                    )
                )
            ) {
                square.classList.add("last-move");
            }


            /* LEGAL MOVE */

            const move = legalMoves.find(
                m =>
                    m.row === row &&
                    m.col === col
            );

            if (move) {

                if (board[row][col]) {
                    square.classList.add("capture");
                } else {
                    square.classList.add("legal");
                }
            }


            /* CHECK */

            const piece = board[row][col];

            if (
                piece &&
                piece.type === "king" &&
                piece.color === currentTurn &&
                isKingInCheck(piece.color)
            ) {
                square.classList.add("in-check");
            }


            /* COORDINATES */

            if (settings.coordinates) {

                if (visualRow === 7) {

                    const file = document.createElement("span");

                    file.className = "coordinate file";

                    file.textContent = FILES[col];

                    square.appendChild(file);
                }

                if (visualCol === 0) {

                    const rank = document.createElement("span");

                    rank.className = "coordinate rank";

                    rank.textContent = 8 - row;

                    square.appendChild(rank);
                }
            }


            /* PIECE */

            if (piece) {

                const pieceElement =
                    document.createElement("div");

                pieceElement.classList.add(
                    "piece",
                    piece.color
                );

                pieceElement.textContent =
                    PIECES[piece.color][piece.type];

                square.appendChild(pieceElement);
            }


            square.addEventListener(
                "click",
                handleSquareClick
            );


            boardElement.appendChild(square);
        }
    }
}


/* =========================
   CLICK SQUARE
========================= */

function handleSquareClick(event) {

    if (gameOver) return;

    const square = event.currentTarget;

    const row = Number(square.dataset.row);

    const col = Number(square.dataset.col);

    const piece = board[row][col];


    /* CLICK LEGAL MOVE */

    const chosenMove = legalMoves.find(
        move =>
            move.row === row &&
            move.col === col
    );

    if (chosenMove) {

        makeMove(
            selectedSquare.row,
            selectedSquare.col,
            row,
            col
        );

        return;
    }


    /* CLICK OWN PIECE */

    if (
        piece &&
        piece.color === currentTurn
    ) {

        selectedSquare = {
            row,
            col
        };

        legalMoves =
            getLegalMoves(row, col);

        renderBoard();

        haptic();

        return;
    }


    /* CLEAR */

    selectedSquare = null;

    legalMoves = [];

    renderBoard();
}


/* =========================
   GET LEGAL MOVES
========================= */

function getLegalMoves(row, col) {

    const piece = board[row][col];

    if (!piece) return [];

    if (piece.color !== currentTurn) {
        return [];
    }

    const pseudoMoves =
        getPseudoMoves(row, col, board);

    const legal = [];


    for (const move of pseudoMoves) {

        const testBoard =
            cloneBoard(board);

        applyMoveToBoard(
            testBoard,
            row,
            col,
            move.row,
            move.col,
            move.special
        );

        if (
            !isKingInCheckOnBoard(
                testBoard,
                piece.color
            )
        ) {
            legal.push(move);
        }
    }

    return legal;
}


/* =========================
   PSEUDO MOVES
========================= */

function getPseudoMoves(row, col, gameBoard) {

    const piece = gameBoard[row][col];

    if (!piece) return [];

    switch (piece.type) {

        case "pawn":
            return getPawnMoves(
                row,
                col,
                gameBoard
            );

        case "knight":
            return getKnightMoves(
                row,
                col,
                gameBoard
            );

        case "bishop":
            return getSlidingMoves(
                row,
                col,
                gameBoard,
                [
                    [-1, -1],
                    [-1, 1],
                    [1, -1],
                    [1, 1]
                ]
            );

        case "rook":
            return getSlidingMoves(
                row,
                col,
                gameBoard,
                [
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1]
                ]
            );

        case "queen":
            return getSlidingMoves(
                row,
                col,
                gameBoard,
                [
                    [-1, -1],
                    [-1, 1],
                    [1, -1],
                    [1, 1],
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1]
                ]
            );

        case "king":
            return getKingMoves(
                row,
                col,
                gameBoard
            );

        default:
            return [];
    }
}


/* =========================
   PAWN
========================= */

function getPawnMoves(row, col, gameBoard) {

    const piece = gameBoard[row][col];

    const moves = [];

    const direction =
        piece.color === "white"
            ? -1
            : 1;

    const startRow =
        piece.color === "white"
            ? 6
            : 1;


    /* ONE STEP */

    const oneRow = row + direction;

    if (
        insideBoard(oneRow, col) &&
        !gameBoard[oneRow][col]
    ) {

        moves.push({
            row: oneRow,
            col
        });


        /* TWO STEP */

        const twoRow =
            row + direction * 2;

        if (
            row === startRow &&
            !gameBoard[twoRow][col]
        ) {

            moves.push({
                row: twoRow,
                col,
                special: "doublePawn"
            });
        }
    }


    /* CAPTURE */

    for (const dc of [-1, 1]) {

        const captureCol = col + dc;

        if (!insideBoard(oneRow, captureCol)) {
            continue;
        }

        const target =
            gameBoard[oneRow][captureCol];

        if (
            target &&
            target.color !== piece.color
        ) {

            moves.push({
                row: oneRow,
                col: captureCol
            });
        }
    }


    /* EN PASSANT */

    if (lastMove) {

        const movedPiece =
            gameBoard[
                lastMove.to.row
            ][
                lastMove.to.col
            ];

        if (
            movedPiece &&
            movedPiece.type === "pawn" &&
            movedPiece.color !== piece.color &&
            Math.abs(
                lastMove.from.row -
                lastMove.to.row
            ) === 2 &&
            lastMove.to.row === row &&
            Math.abs(
                lastMove.to.col - col
            ) === 1
        ) {

            moves.push({
                row: row + direction,
                col: lastMove.to.col,
                special: "enPassant"
            });
        }
    }

    return moves;
}


/* =========================
   KNIGHT
========================= */

function getKnightMoves(row, col, gameBoard) {

    const piece = gameBoard[row][col];

    const moves = [];

    const offsets = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1]
    ];

    for (const [dr, dc] of offsets) {

        const r = row + dr;
        const c = col + dc;

        if (!insideBoard(r, c)) continue;

        const target = gameBoard[r][c];

        if (
            !target ||
            target.color !== piece.color
        ) {

            moves.push({
                row: r,
                col: c
            });
        }
    }

    return moves;
}


/* =========================
   SLIDING PIECES
========================= */

function getSlidingMoves(
    row,
    col,
    gameBoard,
    directions
) {

    const piece = gameBoard[row][col];

    const moves = [];

    for (const [dr, dc] of directions) {

        let r = row + dr;
        let c = col + dc;

        while (insideBoard(r, c)) {

            const target =
                gameBoard[r][c];

            if (!target) {

                moves.push({
                    row: r,
                    col: c
                });

            } else {

                if (
                    target.color !== piece.color
                ) {

                    moves.push({
                        row: r,
                        col: c
                    });
                }

                break;
            }

            r += dr;
            c += dc;
        }
    }

    return moves;
}


/* =========================
   KING
========================= */

function getKingMoves(row, col, gameBoard) {

    const piece = gameBoard[row][col];

    const moves = [];

    for (let dr = -1; dr <= 1; dr++) {

        for (let dc = -1; dc <= 1; dc++) {

            if (dr === 0 && dc === 0) {
                continue;
            }

            const r = row + dr;
            const c = col + dc;

            if (!insideBoard(r, c)) continue;

            const target =
                gameBoard[r][c];

            if (
                !target ||
                target.color !== piece.color
            ) {

                moves.push({
                    row: r,
                    col: c
                });
            }
        }
    }


    /* CASTLING */

    if (
        !piece.moved &&
        !isKingInCheckOnBoard(
            gameBoard,
            piece.color
        )
    ) {

        /* KING SIDE */

        const rookKingSide =
            gameBoard[row][7];

        if (
            rookKingSide &&
            rookKingSide.type === "rook" &&
            rookKingSide.color === piece.color &&
            !rookKingSide.moved &&
            !gameBoard[row][5] &&
            !gameBoard[row][6] &&
            !isSquareAttacked(
                gameBoard,
                row,
                5,
                opposite(piece.color)
            ) &&
            !isSquareAttacked(
                gameBoard,
                row,
                6,
                opposite(piece.color)
            )
        ) {

            moves.push({
                row,
                col: 6,
                special: "castleKing"
            });
        }


        /* QUEEN SIDE */

        const rookQueenSide =
            gameBoard[row][0];

        if (
            rookQueenSide &&
            rookQueenSide.type === "rook" &&
            rookQueenSide.color === piece.color &&
            !rookQueenSide.moved &&
            !gameBoard[row][1] &&
            !gameBoard[row][2] &&
            !gameBoard[row][3] &&
            !isSquareAttacked(
                gameBoard,
                row,
                3,
                opposite(piece.color)
            ) &&
            !isSquareAttacked(
                gameBoard,
                row,
                2,
                opposite(piece.color)
            )
        ) {

            moves.push({
                row,
                col: 2,
                special: "castleQueen"
            });
        }
    }

    return moves;
}


/* =========================
   MAKE MOVE
========================= */

function makeMove(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const piece =
        board[fromRow][fromCol];

    if (!piece) return;


    const move = legalMoves.find(
        m =>
            m.row === toRow &&
            m.col === toCol
    );

    if (!move) return;


    /* SAVE HISTORY */

    history.push({
        board: cloneBoard(board),
        turn: currentTurn,
        time: {
            white: time.white,
            black: time.black
        },
        lastMove: lastMove
            ? {
                from: {...lastMove.from},
                to: {...lastMove.to}
            }
            : null
    });


    const captured =
        board[toRow][toCol];


    /* EN PASSANT */

    if (move.special === "enPassant") {

        const captureRow =
            piece.color === "white"
                ? toRow + 1
                : toRow - 1;

        board[captureRow][toCol] = null;
    }


    /* MOVE */

    board[toRow][toCol] = {
        ...piece,
        moved: true
    };

    board[fromRow][fromCol] = null;


    /* CASTLING */

    if (
        move.special === "castleKing"
    ) {

        const rook =
            board[fromRow][7];

        board[fromRow][5] = {
            ...rook,
            moved: true
        };

        board[fromRow][7] = null;
    }


    if (
        move.special === "castleQueen"
    ) {

        const rook =
            board[fromRow][0];

        board[fromRow][3] = {
            ...rook,
            moved: true
        };

        board[fromRow][0] = null;
    }


    /* LAST MOVE */

    lastMove = {
        from: {
            row: fromRow,
            col: fromCol
        },

        to: {
            row: toRow,
            col: toCol
        }
    };


    /* NOTATION */

    let notation =
        createNotation(
            piece,
            fromRow,
            fromCol,
            toRow,
            toCol,
            captured,
            move.special
        );


    /* PROMOTION */

    if (
        piece.type === "pawn" &&
        (
            toRow === 0 ||
            toRow === 7
        )
    ) {

        pendingPromotion = {
            row: toRow,
            col: toCol,
            notation
        };

        selectedSquare = null;
        legalMoves = [];

        renderBoard();

        openModal(promotionModal);

        haptic();

        return;
    }


    finishMove(notation);
}


/* =========================
   FINISH MOVE
========================= */

function finishMove(notation) {

    moveHistory.push({
        color: currentTurn,
        notation
    });


    currentTurn =
        opposite(currentTurn);

    selectedSquare = null;

    legalMoves = [];


    playSound("move");

    haptic();

    renderBoard();

    renderHistory();

    updateButtons();


    /* GAME STATE */

    checkGameState();
}


/* =========================
   PROMOTION
========================= */

document
    .querySelectorAll(".promotion-piece")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (!pendingPromotion) {
                    return;
                }

                const type =
                    button.dataset.piece;

                const row =
                    pendingPromotion.row;

                const col =
                    pendingPromotion.col;

                const color =
                    board[row][col].color;


                board[row][col] = {
                    type,
                    color,
                    moved: true
                };


                const notation =
                    pendingPromotion.notation +
                    "=" +
                    type[0].toUpperCase();


                pendingPromotion = null;

                closeModal(promotionModal);

                finishMove(notation);

                showToast(
                    `Pawn promoted to ${capitalize(type)}`,
                    "♕"
                );
            }
        );
    });


/* =========================
   NOTATION
========================= */

function createNotation(
    piece,
    fromRow,
    fromCol,
    toRow,
    toCol,
    captured,
    special
) {

    if (special === "castleKing") {
        return "O-O";
    }

    if (special === "castleQueen") {
        return "O-O-O";
    }


    const destination =
        FILES[toCol] + (8 - toRow);


    if (piece.type === "pawn") {

        if (captured) {

            return (
                FILES[fromCol] +
                "x" +
                destination
            );
        }

        return destination;
    }


    const symbol = {
        knight: "N",
        bishop: "B",
        rook: "R",
        queen: "Q",
        king: "K"
    }[piece.type];


    return (
        symbol +
        (captured ? "x" : "") +
        destination
    );
}


/* =========================
   CHECK GAME STATE
========================= */

function checkGameState() {

    const hasMoves =
        hasAnyLegalMoves(currentTurn);

    const inCheck =
        isKingInCheck(currentTurn);


    if (!hasMoves && inCheck) {

        gameOver = true;

        clearInterval(timerInterval);

        const winner =
            opposite(currentTurn);

        showResult(
            "♔",
            "Checkmate!",
            `${capitalize(winner)} wins the game.`
        );

        playSound("win");

        return;
    }


    if (!hasMoves && !inCheck) {

        gameOver = true;

        clearInterval(timerInterval);

        showResult(
            "½",
            "Stalemate",
            "Game berakhir seri."
        );

        playSound("draw");

        return;
    }


    if (inCheck) {

        showToast(
            `${capitalize(currentTurn)} is in check`,
            "!"
        );

        playSound("check");
    }
}


/* =========================
   ANY LEGAL MOVES
========================= */

function hasAnyLegalMoves(color) {

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const piece =
                board[row][col];

            if (
                piece &&
                piece.color === color
            ) {

                const moves =
                    getLegalMovesForColor(
                        row,
                        col,
                        color
                    );

                if (moves.length > 0) {
                    return true;
                }
            }
        }
    }

    return false;
}


function getLegalMovesForColor(
    row,
    col,
    color
) {

    const piece =
        board[row][col];

    if (
        !piece ||
        piece.color !== color
    ) {
        return [];
    }


    const pseudo =
        getPseudoMoves(
            row,
            col,
            board
        );

    const legal = [];


    for (const move of pseudo) {

        const testBoard =
            cloneBoard(board);

        applyMoveToBoard(
            testBoard,
            row,
            col,
            move.row,
            move.col,
            move.special
        );

        if (
            !isKingInCheckOnBoard(
                testBoard,
                color
            )
        ) {

            legal.push(move);
        }
    }

    return legal;
}


/* =========================
   APPLY TEST MOVE
========================= */

function applyMoveToBoard(
    gameBoard,
    fromRow,
    fromCol,
    toRow,
    toCol,
    special
) {

    const piece =
        gameBoard[fromRow][fromCol];

    if (!piece) return;


    /* EN PASSANT */

    if (special === "enPassant") {

        const captureRow =
            piece.color === "white"
                ? toRow + 1
                : toRow - 1;

        gameBoard[captureRow][toCol] = null;
    }


    gameBoard[toRow][toCol] = {
        ...piece,
        moved: true
    };

    gameBoard[fromRow][fromCol] = null;


    /* CASTLE */

    if (special === "castleKing") {

        const rook =
            gameBoard[fromRow][7];

        gameBoard[fromRow][5] = {
            ...rook,
            moved: true
        };

        gameBoard[fromRow][7] = null;
    }


    if (special === "castleQueen") {

        const rook =
            gameBoard[fromRow][0];

        gameBoard[fromRow][3] = {
            ...rook,
            moved: true
        };

        gameBoard[fromRow][0] = null;
    }
}


/* =========================
   KING CHECK
========================= */

function isKingInCheck(color) {

    return isKingInCheckOnBoard(
        board,
        color
    );
}


function isKingInCheckOnBoard(
    gameBoard,
    color
) {

    let king = null;


    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const piece =
                gameBoard[row][col];

            if (
                piece &&
                piece.type === "king" &&
                piece.color === color
            ) {

                king = {
                    row,
                    col
                };
            }
        }
    }


    if (!king) return true;


    return isSquareAttacked(
        gameBoard,
        king.row,
        king.col,
        opposite(color)
    );
}


/* =========================
   SQUARE ATTACK
========================= */

function isSquareAttacked(
    gameBoard,
    row,
    col,
    byColor
) {

    for (let r = 0; r < 8; r++) {

        for (let c = 0; c < 8; c++) {

            const piece =
                gameBoard[r][c];

            if (
                !piece ||
                piece.color !== byColor
            ) {
                continue;
            }


            const dr = row - r;
            const dc = col - c;


            /* PAWN */

            if (piece.type === "pawn") {

                const direction =
                    byColor === "white"
                        ? -1
                        : 1;

                if (
                    row === r + direction &&
                    Math.abs(dc) === 1
                ) {
                    return true;
                }
            }


            /* KNIGHT */

            if (piece.type === "knight") {

                if (
                    (
                        Math.abs(dr) === 2 &&
                        Math.abs(dc) === 1
                    )
                    ||
                    (
                        Math.abs(dr) === 1 &&
                        Math.abs(dc) === 2
                    )
                ) {
                    return true;
                }
            }


            /* KING */

            if (piece.type === "king") {

                if (
                    Math.max(
                        Math.abs(dr),
                        Math.abs(dc)
                    ) === 1
                ) {
                    return true;
                }
            }


            /* SLIDING */

            const diagonal =
                Math.abs(dr) === Math.abs(dc);

            const straight =
                dr === 0 || dc === 0;


            if (
                (
                    piece.type === "bishop" &&
                    diagonal
                )
                ||
                (
                    piece.type === "rook" &&
                    straight
                )
                ||
                (
                    piece.type === "queen" &&
                    (
                        diagonal ||
                        straight
                    )
                )
            ) {

                const stepRow =
                    Math.sign(dr);

                const stepCol =
                    Math.sign(dc);

                let checkRow =
                    r + stepRow;

                let checkCol =
                    c + stepCol;

                let blocked = false;


                while (
                    checkRow !== row ||
                    checkCol !== col
                ) {

                    if (
                        gameBoard[
                            checkRow
                        ][
                            checkCol
                        ]
                    ) {

                        blocked = true;
                        break;
                    }

                    checkRow += stepRow;
                    checkCol += stepCol;
                }


                if (!blocked) {
                    return true;
                }
            }
        }
    }

    return false;
}


/* =========================
   UNDO
========================= */

undoButton.addEventListener(
    "click",
    undoMove
);


function undoMove() {

    if (
        history.length === 0 ||
        gameOver
    ) {
        return;
    }


    const previous =
        history.pop();


    board =
        previous.board;

    currentTurn =
        previous.turn;

    time =
        previous.time;

    lastMove =
        previous.lastMove;


    moveHistory.pop();


    selectedSquare = null;

    legalMoves = [];

    pendingPromotion = null;


    renderBoard();

    renderHistory();

    updateTimers();

    updateButtons();

    startTimer();

    showToast(
        "Move dibatalkan",
        "↶"
    );

    haptic();
}


/* =========================
   NEW GAME
========================= */

newGameButton.addEventListener(
    "click",
    startGame
);

resultNewGame.addEventListener(
    "click",
    startGame
);


/* =========================
   RESIGN
========================= */

resignButton.addEventListener(
    "click",
    () => {

        if (gameOver) return;

        const winner =
            opposite(currentTurn);

        gameOver = true;

        clearInterval(timerInterval);

        showResult(
            "⚑",
            `${capitalize(winner)} wins`,
            `${capitalize(currentTurn)} resigned.`
        );

        playSound("win");

        haptic();
    }
);


/* =========================
   FLIP
========================= */

flipButton.addEventListener(
    "click",
    () => {

        boardFlipped =
            !boardFlipped;

        renderBoard();

        haptic();
    }
);


/* =========================
   SETTINGS
========================= */

settingsButton.addEventListener(
    "click",
    () => {
        openModal(settingsModal);
    }
);


closeSettingsButton.addEventListener(
    "click",
    () => {
        closeModal(settingsModal);
    }
);


settingsModal.addEventListener(
    "click",
    event => {

        if (
            event.target === settingsModal
        ) {
            closeModal(settingsModal);
        }
    }
);


soundToggle.addEventListener(
    "change",
    () => {

        settings.sound =
            soundToggle.checked;
    }
);


coordinatesToggle.addEventListener(
    "change",
    () => {

        settings.coordinates =
            coordinatesToggle.checked;

        renderBoard();
    }
);


animationsToggle.addEventListener(
    "change",
    () => {

        settings.animations =
            animationsToggle.checked;

        if (!settings.animations) {
            document.body.style.setProperty(
                "--move",
                "rgba(124,92,255,.35)"
            );
        }
    }
);


hapticToggle.addEventListener(
    "change",
    () => {

        settings.haptic =
            hapticToggle.checked;
    }
);


/* =========================
   TIMER
========================= */

function startTimer() {

    clearInterval(timerInterval);

    if (gameOver) return;


    timerInterval =
        setInterval(() => {

            time[currentTurn]--;

            updateTimers();


            if (
                time[currentTurn] <= 0
            ) {

                time[currentTurn] = 0;

                gameOver = true;

                clearInterval(
                    timerInterval
                );


                const winner =
                    opposite(currentTurn);


                showResult(
                    "⏱",
                    "Time Out",
                    `${capitalize(winner)} wins on time.`
                );


                playSound("win");

                haptic();
            }

        }, 1000);
}


function updateTimers() {

    whiteTimerElement.textContent =
        formatTime(time.white);

    blackTimerElement.textContent =
        formatTime(time.black);


    whiteTimerElement.classList.toggle(
        "active",
        currentTurn === "white" &&
        !gameOver
    );

    blackTimerElement.classList.toggle(
        "active",
        currentTurn === "black" &&
        !gameOver
    );


    whiteTimerElement.classList.toggle(
        "warning",
        time.white <= 30
    );

    blackTimerElement.classList.toggle(
        "warning",
        time.black <= 30
    );
}


function formatTime(seconds) {

    const min =
        Math.floor(seconds / 60);

    const sec =
        seconds % 60;

    return (
        String(min).padStart(2, "0") +
        ":" +
        String(sec).padStart(2, "0")
    );
}


/* =========================
   MOVE HISTORY UI
========================= */

function renderHistory() {

    moveHistoryElement.innerHTML = "";


    if (
        moveHistory.length === 0
    ) {

        moveHistoryElement.innerHTML =
            `<div class="empty-history">
                Belum ada langkah
             </div>`;

        moveCountElement.textContent =
            "0 moves";

        return;
    }


    for (
        let i = 0;
        i < moveHistory.length;
        i += 2
    ) {

        const row =
            document.createElement("div");

        row.className =
            "move-row";


        const number =
            document.createElement("span");

        number.className =
            "move-number";

        number.textContent =
            `${Math.floor(i / 2) + 1}.`;


        const white =
            document.createElement("span");

        white.className =
            "move-white";

        white.textContent =
            moveHistory[i]
                ? moveHistory[i].notation
                : "";


        const black =
            document.createElement("span");

        black.className =
            "move-black";

        black.textContent =
            moveHistory[i + 1]
                ? moveHistory[i + 1].notation
                : "";


        row.appendChild(number);

        row.appendChild(white);

        row.appendChild(black);

        moveHistoryElement.appendChild(row);
    }


    moveCountElement.textContent =
        `${moveHistory.length} moves`;


    moveHistoryElement.scrollTop =
        moveHistoryElement.scrollHeight;
}


/* =========================
   BUTTON STATES
========================= */

function updateButtons() {

    undoButton.disabled =
        history.length === 0 ||
        gameOver;

    resignButton.disabled =
        gameOver;
}


/* =========================
   RESULT
========================= */

function showResult(
    icon,
    title,
    message
) {

    resultIcon.textContent =
        icon;

    resultTitle.textContent =
        title;

    resultMessage.textContent =
        message;

    openModal(resultModal);
}


/* =========================
   MODALS
========================= */

function openModal(modal) {

    modal.classList.remove("hidden");

    document.body.style.overflow =
        "hidden";
}


function closeModal(modal) {

    modal.classList.add("hidden");

    if (
        promotionModal.classList.contains("hidden") &&
        resultModal.classList.contains("hidden") &&
        settingsModal.classList.contains("hidden")
    ) {

        document.body.style.overflow =
            "";
    }
}


/* =========================
   TOAST
========================= */

let toastTimeout = null;

function showToast(
    message,
    icon = "✓"
) {

    toastMessage.textContent =
        message;

    toastIcon.textContent =
        icon;

    toast.classList.add("show");


    clearTimeout(toastTimeout);


    toastTimeout =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2200);
}


/* =========================
   SOUND
========================= */

let audioContext = null;

function playSound(type) {

    if (!settings.sound) return;


    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }


        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();


        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        let frequency = 420;

        if (type === "capture") {
            frequency = 260;
        }

        if (type === "check") {
            frequency = 620;
        }

        if (type === "win") {
            frequency = 780;
        }

        if (type === "draw") {
            frequency = 320;
        }


        oscillator.frequency.value =
            frequency;

        oscillator.type =
            "sine";


        gain.gain.setValueAtTime(
            .001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            .08,
            audioContext.currentTime + .01
        );

        gain.gain.exponentialRampToValueAtTime(
            .001,
            audioContext.currentTime + .15
        );


        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + .15
        );

    } catch (error) {

        console.log(
            "Audio unavailable"
        );
    }
}


/* =========================
   HAPTIC
========================= */

function haptic() {

    if (
        !settings.haptic
    ) {
        return;
    }


    if (
        "vibrate" in navigator
    ) {

        navigator.vibrate(12);
    }
}


/* =========================
   HELPERS
========================= */

function insideBoard(row, col) {

    return (
        row >= 0 &&
        row < 8 &&
        col >= 0 &&
        col < 8
    );
}


function opposite(color) {

    return color === "white"
        ? "black"
        : "white";
}


function capitalize(text) {

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


function cloneBoard(source) {

    return source.map(
        row =>
            row.map(
                piece =>
                    piece
                        ? {...piece}
                        : null
            )
    );
}


/* =========================
   INITIALIZE
========================= */

startGame();