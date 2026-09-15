/* =========================================================
   MODERN CHESS V1
   Pure JavaScript
   ========================================================= */


/* =========================================================
   DOM
========================================================= */

const boardElement = document.getElementById("board");

const moveListElement = document.getElementById("moveList");
const moveCountElement = document.getElementById("moveCount");

const whiteTimerElement = document.getElementById("whiteTimer");
const blackTimerElement = document.getElementById("blackTimer");

const whiteStatusElement = document.getElementById("whiteStatus");
const blackStatusElement = document.getElementById("blackStatus");

const undoButton = document.getElementById("undoBtn");
const newGameButton = document.getElementById("newGameBtn");
const resignButton = document.getElementById("resignBtn");

const flipBoardButton = document.getElementById("flipBoardBtn");

const settingsButton = document.getElementById("settingsBtn");

const settingsModal = document.getElementById("settingsModal");
const closeSettingsButton =
    document.getElementById("closeSettingsBtn");

const gameModal = document.getElementById("gameModal");

const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");

const rematchButton = document.getElementById("rematchBtn");
const closeModalButton = document.getElementById("closeModalBtn");

const clearHistoryButton =
    document.getElementById("clearHistoryBtn");

const soundToggle =
    document.getElementById("soundToggle");

const coordinateToggle =
    document.getElementById("coordinateToggle");

const animationToggle =
    document.getElementById("animationToggle");


/* =========================================================
   PIECES
========================================================= */

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


/* =========================================================
   INITIAL POSITION
========================================================= */

const INITIAL_BOARD = [

    [
        { type: "rook", color: "black", moved: false },
        { type: "knight", color: "black", moved: false },
        { type: "bishop", color: "black", moved: false },
        { type: "queen", color: "black", moved: false },
        { type: "king", color: "black", moved: false },
        { type: "bishop", color: "black", moved: false },
        { type: "knight", color: "black", moved: false },
        { type: "rook", color: "black", moved: false }
    ],

    [
        { type: "pawn", color: "black", moved: false },
        { type: "pawn", color: "black", moved: false },
        { type: "pawn", color: "black", moved: false },
        { type: "pawn", color: "black", moved: false },
        { type: "pawn", color: "black", moved: false },
        { type: "pawn", color: "black", moved: false },
        { type: "pawn", color: "black", moved: false },
        { type: "pawn", color: "black", moved: false }
    ],

    Array(8).fill(null),

    Array(8).fill(null),

    Array(8).fill(null),

    Array(8).fill(null),

    [
        { type: "pawn", color: "white", moved: false },
        { type: "pawn", color: "white", moved: false },
        { type: "pawn", color: "white", moved: false },
        { type: "pawn", color: "white", moved: false },
        { type: "pawn", color: "white", moved: false },
        { type: "pawn", color: "white", moved: false },
        { type: "pawn", color: "white", moved: false },
        { type: "pawn", color: "white", moved: false }
    ],

    [
        { type: "rook", color: "white", moved: false },
        { type: "knight", color: "white", moved: false },
        { type: "bishop", color: "white", moved: false },
        { type: "queen", color: "white", moved: false },
        { type: "king", color: "white", moved: false },
        { type: "bishop", color: "white", moved: false },
        { type: "knight", color: "white", moved: false },
        { type: "rook", color: "white", moved: false }
    ]

];


/* =========================================================
   GAME STATE
========================================================= */

let board = cloneBoard(INITIAL_BOARD);

let currentTurn = "white";

let selectedSquare = null;

let legalMoves = [];

let moveHistory = [];

let undoHistory = [];

let lastMove = null;

let boardFlipped = false;

let gameOver = false;

let soundEnabled = true;

let coordinatesEnabled = true;

let animationsEnabled = true;


/* =========================================================
   TIMER
========================================================= */

let whiteTime = 600;

let blackTime = 600;

let timerInterval = null;


/* =========================================================
   UTILITY
========================================================= */

function cloneBoard(source) {

    return source.map(row =>

        row.map(piece =>

            piece
                ? { ...piece }
                : null

        )

    );

}


function insideBoard(row, col) {

    return (
        row >= 0 &&
        row < 8 &&
        col >= 0 &&
        col < 8
    );

}


function oppositeColor(color) {

    return color === "white"
        ? "black"
        : "white";

}


function squareName(row, col) {

    const files = "abcdefgh";

    return files[col] + (8 - row);

}


function cloneGameState() {

    return {

        board: cloneBoard(board),

        currentTurn,

        whiteTime,

        blackTime,

        lastMove: lastMove
            ? { ...lastMove }
            : null

    };

}


/* =========================================================
   RENDER BOARD
========================================================= */

function renderBoard() {

    boardElement.innerHTML = "";

    const rows = boardFlipped
        ? [...Array(8).keys()].reverse()
        : [...Array(8).keys()];

    const cols = boardFlipped
        ? [...Array(8).keys()].reverse()
        : [...Array(8).keys()];


    for (const row of rows) {

        for (const col of cols) {

            createSquare(row, col);

        }

    }

}


function createSquare(row, col) {

    const square = document.createElement("div");

    square.className = "square";


    if ((row + col) % 2 === 0) {

        square.classList.add("light");

    } else {

        square.classList.add("dark");

    }


    square.dataset.row = row;
    square.dataset.col = col;


    /* Last move */

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


    /* Selected */

    if (
        selectedSquare &&
        selectedSquare.row === row &&
        selectedSquare.col === col
    ) {

        square.classList.add("selected");

    }


    /* Legal move */

    const isLegal = legalMoves.some(move =>

        move.row === row &&
        move.col === col

    );


    if (isLegal) {

        square.classList.add("legal");

        if (board[row][col]) {

            square.classList.add("capture");

        }

    }


    /* Check */

    const piece = board[row][col];

    if (
        piece &&
        piece.type === "king" &&
        isInCheck(piece.color, board)
    ) {

        square.classList.add("check");

    }


    /* Coordinates */

    if (coordinatesEnabled) {

        const files = "abcdefgh";

        if (col === (boardFlipped ? 7 : 0)) {

            const rank = document.createElement("span");

            rank.className = "coordinate rank";

            rank.textContent = 8 - row;

            square.appendChild(rank);

        }


        if (row === (boardFlipped ? 0 : 7)) {

            const file = document.createElement("span");

            file.className = "coordinate file";

            file.textContent = files[col];

            square.appendChild(file);

        }

    }


    /* Piece */

    if (piece) {

        const pieceElement =
            document.createElement("div");

        pieceElement.className =
            `piece ${piece.color}`;

        pieceElement.textContent =
            PIECES[piece.color][piece.type];


        if (animationsEnabled) {

            pieceElement.style.transition =
                "transform .18s cubic-bezier(.2,.8,.2,1), filter .18s ease";

        }


        square.appendChild(pieceElement);

    }


    square.addEventListener("click", () => {

        handleSquareClick(row, col);

    });


    boardElement.appendChild(square);

}


/* =========================================================
   CLICK HANDLER
========================================================= */

function handleSquareClick(row, col) {

    if (gameOver) return;


    const piece = board[row][col];


    /* Selecting a piece */

    if (!selectedSquare) {

        if (
            piece &&
            piece.color === currentTurn
        ) {

            selectSquare(row, col);

        }

        return;

    }


    /* Clicking selected square */

    if (
        selectedSquare.row === row &&
        selectedSquare.col === col
    ) {

        deselectSquare();

        return;

    }


    /* Clicking another own piece */

    if (
        piece &&
        piece.color === currentTurn
    ) {

        selectSquare(row, col);

        return;

    }


    /* Try move */

    const move = legalMoves.find(m =>

        m.row === row &&
        m.col === col

    );


    if (move) {

        makeMove(
            selectedSquare.row,
            selectedSquare.col,
            row,
            col,
            move

        );

    }

}


/* =========================================================
   SELECT
========================================================= */

function selectSquare(row, col) {

    selectedSquare = {
        row,
        col
    };


    legalMoves =
        getLegalMoves(row, col);


    renderBoard();

}


function deselectSquare() {

    selectedSquare = null;

    legalMoves = [];

    renderBoard();

}


/* =========================================================
   LEGAL MOVES
========================================================= */

function getLegalMoves(row, col) {

    const piece = board[row][col];

    if (!piece) return [];

    if (piece.color !== currentTurn) return [];


    const pseudoMoves =
        getPseudoLegalMoves(
            row,
            col,
            board
        );


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
            move
        );


        if (
            !isInCheck(
                piece.color,
                testBoard
            )
        ) {

            legal.push(move);

        }

    }


    return legal;

}


/* =========================================================
   PSEUDO MOVES
========================================================= */

function getPseudoLegalMoves(row, col, stateBoard) {

    const piece = stateBoard[row][col];

    if (!piece) return [];


    switch (piece.type) {

        case "pawn":
            return getPawnMoves(
                row,
                col,
                stateBoard
            );

        case "knight":
            return getKnightMoves(
                row,
                col,
                stateBoard
            );

        case "bishop":
            return getSlidingMoves(
                row,
                col,
                stateBoard,
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
                stateBoard,
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
                stateBoard,
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
                stateBoard
            );

    }


    return [];

}


/* =========================================================
   PAWN
========================================================= */

function getPawnMoves(row, col, stateBoard) {

    const piece = stateBoard[row][col];

    const moves = [];

    const direction =
        piece.color === "white"
            ? -1
            : 1;


    const startRow =
        piece.color === "white"
            ? 6
            : 1;


    /* Forward */

    const oneRow = row + direction;


    if (
        insideBoard(oneRow, col) &&
        !stateBoard[oneRow][col]
    ) {

        moves.push({
            row: oneRow,
            col
        });


        /* Double move */

        const twoRow =
            row + direction * 2;


        if (
            row === startRow &&
            !stateBoard[twoRow][col]
        ) {

            moves.push({
                row: twoRow,
                col,
                doublePawn: true
            });

        }

    }


    /* Captures */

    for (const dc of [-1, 1]) {

        const captureCol =
            col + dc;


        if (!insideBoard(
            oneRow,
            captureCol
        )) continue;


        const target =
            stateBoard[oneRow][captureCol];


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


    /* En passant */

    if (lastMove) {

        const movedPiece =
            stateBoard[
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

                enPassant: true

            });

        }

    }


    return moves;

}


/* =========================================================
   KNIGHT
========================================================= */

function getKnightMoves(row, col, stateBoard) {

    const piece = stateBoard[row][col];

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


        const target =
            stateBoard[r][c];


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


/* =========================================================
   SLIDING PIECES
========================================================= */

function getSlidingMoves(
    row,
    col,
    stateBoard,
    directions
) {

    const piece = stateBoard[row][col];

    const moves = [];


    for (const [dr, dc] of directions) {

        let r = row + dr;
        let c = col + dc;


        while (
            insideBoard(r, c)
        ) {

            const target =
                stateBoard[r][c];


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


/* =========================================================
   KING
========================================================= */

function getKingMoves(row, col, stateBoard) {

    const piece = stateBoard[row][col];

    const moves = [];


    for (let dr = -1; dr <= 1; dr++) {

        for (let dc = -1; dc <= 1; dc++) {

            if (
                dr === 0 &&
                dc === 0
            ) continue;


            const r = row + dr;
            const c = col + dc;


            if (!insideBoard(r, c)) continue;


            const target =
                stateBoard[r][c];


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


    /* Castling */

    if (
        !piece.moved &&
        !isInCheck(
            piece.color,
            stateBoard
        )
    ) {

        const rowHome =
            piece.color === "white"
                ? 7
                : 0;


        /* Kingside */

        const kingRook =
            stateBoard[rowHome][7];


        if (
            kingRook &&
            kingRook.type === "rook" &&
            kingRook.color === piece.color &&
            !kingRook.moved &&
            !stateBoard[rowHome][5] &&
            !stateBoard[rowHome][6] &&
            !isSquareAttacked(
                rowHome,
                5,
                oppositeColor(piece.color),
                stateBoard
            ) &&
            !isSquareAttacked(
                rowHome,
                6,
                oppositeColor(piece.color),
                stateBoard
            )
        ) {

            moves.push({
                row: rowHome,
                col: 6,
                castle: "king"
            });

        }


        /* Queenside */

        const queenRook =
            stateBoard[rowHome][0];


        if (
            queenRook &&
            queenRook.type === "rook" &&
            queenRook.color === piece.color &&
            !queenRook.moved &&
            !stateBoard[rowHome][1] &&
            !stateBoard[rowHome][2] &&
            !stateBoard[rowHome][3] &&
            !isSquareAttacked(
                rowHome,
                3,
                oppositeColor(piece.color),
                stateBoard
            ) &&
            !isSquareAttacked(
                rowHome,
                2,
                oppositeColor(piece.color),
                stateBoard
            )
        ) {

            moves.push({
                row: rowHome,
                col: 2,
                castle: "queen"
            });

        }

    }


    return moves;

}


/* =========================================================
   APPLY MOVE TO TEST BOARD
========================================================= */

function applyMoveToBoard(
    stateBoard,
    fromRow,
    fromCol,
    toRow,
    toCol,
    move
) {

    const piece =
        stateBoard[fromRow][fromCol];


    stateBoard[toRow][toCol] = {
        ...piece,
        moved: true
    };


    stateBoard[fromRow][fromCol] = null;


    /* En passant */

    if (move.enPassant) {

        const capturedRow =
            piece.color === "white"
                ? toRow + 1
                : toRow - 1;


        stateBoard[capturedRow][toCol] = null;

    }


    /* Castling */

    if (move.castle) {

        const row = fromRow;


        if (move.castle === "king") {

            stateBoard[row][5] = {
                ...stateBoard[row][7],
                moved: true
            };

            stateBoard[row][7] = null;

        }


        if (move.castle === "queen") {

            stateBoard[row][3] = {
                ...stateBoard[row][0],
                moved: true
            };

            stateBoard[row][0] = null;

        }

    }

}


/* =========================================================
   MAKE MOVE
========================================================= */

function makeMove(
    fromRow,
    fromCol,
    toRow,
    toCol,
    move
) {

    undoHistory.push(
        cloneGameState()
    );


    const piece =
        board[fromRow][fromCol];


    const capturedPiece =
        board[toRow][toCol];


    const notation =
        createNotation(
            piece,
            fromRow,
            fromCol,
            toRow,
            toCol,
            capturedPiece,
            move
        );


    applyMoveToBoard(
        board,
        fromRow,
        fromCol,
        toRow,
        toCol,
        move
    );


    /* Promotion */

    const movedPiece =
        board[toRow][toCol];


    if (
        movedPiece &&
        movedPiece.type === "pawn" &&
        (
            toRow === 0 ||
            toRow === 7
        )
    ) {

        promotePawn(
            toRow,
            toCol
        );

    }


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


    moveHistory.push({

        notation,

        color: piece.color,

        piece: piece.type,

        captured: !!capturedPiece

    });


    playMoveSound(
        capturedPiece
    );


    currentTurn =
        oppositeColor(currentTurn);


    selectedSquare = null;

    legalMoves = [];


    updateStatus();

    renderBoard();

    renderHistory();


    checkGameState();

}


/* =========================================================
   PROMOTION
========================================================= */

function promotePawn(row, col) {

    const choice =
        prompt(
            "Promote pawn: queen, rook, bishop, knight",
            "queen"
        );


    const allowed = [
        "queen",
        "rook",
        "bishop",
        "knight"
    ];


    const selected =
        allowed.includes(
            String(choice).toLowerCase()
        )
            ? String(choice).toLowerCase()
            : "queen";


    board[row][col].type =
        selected;

}


/* =========================================================
   NOTATION
========================================================= */

function createNotation(
    piece,
    fromRow,
    fromCol,
    toRow,
    toCol,
    capturedPiece,
    move
) {

    if (move.castle === "king") {

        return "O-O";

    }


    if (move.castle === "queen") {

        return "O-O-O";

    }


    const symbols = {

        king: "K",
        queen: "Q",
        rook: "R",
        bishop: "B",
        knight: "N",
        pawn: ""

    };


    let notation =
        symbols[piece.type];


    if (
        piece.type === "pawn" &&
        capturedPiece
    ) {

        notation =
            "abcdefgh"[fromCol];

    }


    if (capturedPiece) {

        notation += "x";

    }


    notation +=
        squareName(
            toRow,
            toCol
        );


    return notation;

}


/* =========================================================
   CHECK
========================================================= */

function isInCheck(color, stateBoard) {

    let kingPosition = null;


    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const piece =
                stateBoard[row][col];


            if (
                piece &&
                piece.color === color &&
                piece.type === "king"
            ) {

                kingPosition = {
                    row,
                    col
                };

                break;

            }

        }

        if (kingPosition) break;

    }


    if (!kingPosition) {

        return true;

    }


    return isSquareAttacked(

        kingPosition.row,

        kingPosition.col,

        oppositeColor(color),

        stateBoard

    );

}


/* =========================================================
   ATTACK DETECTION
========================================================= */

function isSquareAttacked(
    row,
    col,
    attackerColor,
    stateBoard
) {


    /* Pawn attacks */

    const pawnRow =
        attackerColor === "white"
            ? row + 1
            : row - 1;


    for (const dc of [-1, 1]) {

        const c = col + dc;


        if (
            insideBoard(
                pawnRow,
                c
            )
        ) {

            const piece =
                stateBoard[pawnRow][c];


            if (
                piece &&
                piece.color === attackerColor &&
                piece.type === "pawn"
            ) {

                return true;

            }

        }

    }


    /* Knight attacks */

    const knightOffsets = [

        [-2, -1],
        [-2, 1],

        [-1, -2],
        [-1, 2],

        [1, -2],
        [1, 2],

        [2, -1],
        [2, 1]

    ];


    for (const [dr, dc] of knightOffsets) {

        const r = row + dr;
        const c = col + dc;


        if (!insideBoard(r, c)) continue;


        const piece =
            stateBoard[r][c];


        if (
            piece &&
            piece.color === attackerColor &&
            piece.type === "knight"
        ) {

            return true;

        }

    }


    /* King attacks */

    for (let dr = -1; dr <= 1; dr++) {

        for (let dc = -1; dc <= 1; dc++) {

            if (
                dr === 0 &&
                dc === 0
            ) continue;


            const r = row + dr;
            const c = col + dc;


            if (!insideBoard(r, c)) continue;


            const piece =
                stateBoard[r][c];


            if (
                piece &&
                piece.color === attackerColor &&
                piece.type === "king"
            ) {

                return true;

            }

        }

    }


    /* Sliding attacks */

    const directions = [

        {
            pieces: [
                "rook",
                "queen"
            ],

            vectors: [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1]
            ]

        },

        {
            pieces: [
                "bishop",
                "queen"
            ],

            vectors: [
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1]
            ]

        }

    ];


    for (const group of directions) {

        for (const [dr, dc] of group.vectors) {

            let r = row + dr;
            let c = col + dc;


            while (
                insideBoard(r, c)
            ) {

                const piece =
                    stateBoard[r][c];


                if (piece) {

                    if (
                        piece.color === attackerColor &&
                        group.pieces.includes(
                            piece.type
                        )
                    ) {

                        return true;

                    }

                    break;

                }


                r += dr;
                c += dc;

            }

        }

    }


    return false;

}


/* =========================================================
   GAME STATE CHECK
========================================================= */

function checkGameState() {

    const color = currentTurn;


    const hasLegalMove =
        playerHasLegalMove(color);


    if (!hasLegalMove) {

        gameOver = true;

        stopTimer();


        if (
            isInCheck(
                color,
                board
            )
        ) {

            const winner =
                oppositeColor(color);


            showGameResult(

                winner === "white"
                    ? "♕"
                    : "♛",

                "Checkmate!",

                `${capitalize(winner)} wins the game.`

            );

        } else {

            showGameResult(

                "½",

                "Stalemate",

                "The game ends in a draw."

            );

        }


        return;

    }


    if (
        isInCheck(
            color,
            board
        )
    ) {

        playCheckSound();

        updateStatus(true);

    }

}


/* =========================================================
   PLAYER HAS LEGAL MOVE
========================================================= */

function playerHasLegalMove(color) {

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const piece =
                board[row][col];


            if (
                piece &&
                piece.color === color
            ) {

                const originalTurn =
                    currentTurn;


                currentTurn = color;


                const moves =
                    getLegalMoves(
                        row,
                        col
                    );


                currentTurn =
                    originalTurn;


                if (moves.length > 0) {

                    return true;

                }

            }

        }

    }


    return false;

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    moveCountElement.textContent =
        `${moveHistory.length} moves`;


    if (moveHistory.length === 0) {

        moveListElement.innerHTML = `

            <div class="empty-history">

                <div>♟</div>

                <p>No moves yet</p>

                <span>Make your first move</span>

            </div>

        `;

        return;

    }


    moveListElement.innerHTML = "";


    for (
        let i = 0;
        i < moveHistory.length;
        i += 2
    ) {

        const row =
            document.createElement("div");


        row.className = "move-row";


        const number =
            Math.floor(i / 2) + 1;


        const whiteMove =
            moveHistory[i]
                ? moveHistory[i].notation
                : "";


        const blackMove =
            moveHistory[i + 1]
                ? moveHistory[i + 1].notation
                : "";


        row.innerHTML = `

            <span class="move-number">
                ${number}.
            </span>

            <span class="move">
                ${whiteMove}
            </span>

            <span class="move">
                ${blackMove}
            </span>

        `;


        moveListElement.appendChild(row);

    }


    moveListElement.scrollTop =
        moveListElement.scrollHeight;

}


/* =========================================================
   UNDO
========================================================= */

function undoMove() {

    if (
        undoHistory.length === 0 ||
        gameOver
    ) {

        return;

    }


    const previous =
        undoHistory.pop();


    board =
        cloneBoard(
            previous.board
        );


    currentTurn =
        previous.currentTurn;


    whiteTime =
        previous.whiteTime;


    blackTime =
        previous.blackTime;


    lastMove =
        previous.lastMove;


    moveHistory.pop();


    selectedSquare = null;

    legalMoves = [];


    updateStatus();

    renderBoard();

    renderHistory();

}


/* =========================================================
   NEW GAME
========================================================= */

function newGame() {

    stopTimer();


    board =
        cloneBoard(
            INITIAL_BOARD
        );


    currentTurn = "white";

    selectedSquare = null;

    legalMoves = [];

    moveHistory = [];

    undoHistory = [];

    lastMove = null;

    gameOver = false;


    whiteTime = 600;

    blackTime = 600;


    hideGameModal();


    updateStatus();

    renderBoard();

    renderHistory();


    startTimer();

}


/* =========================================================
   RESIGN
========================================================= */

function resignGame() {

    if (gameOver) return;


    const winner =
        oppositeColor(
            currentTurn
        );


    gameOver = true;

    stopTimer();


    showGameResult(

        winner === "white"
            ? "♕"
            : "♛",

        "Game Over",

        `${capitalize(winner)} wins by resignation.`

    );

}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    stopTimer();


    timerInterval =
        setInterval(() => {

            if (gameOver) return;


            if (currentTurn === "white") {

                whiteTime--;

            } else {

                blackTime--;

            }


            updateTimerDisplay();


            if (whiteTime <= 0) {

                endByTime("white");

            }


            if (blackTime <= 0) {

                endByTime("black");

            }

        }, 1000);

}


function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }

}


function endByTime(color) {

    gameOver = true;

    stopTimer();


    const winner =
        oppositeColor(color);


    showGameResult(

        winner === "white"
            ? "♕"
            : "♛",

        "Time Out",

        `${capitalize(winner)} wins on time.`

    );

}


function updateTimerDisplay() {

    whiteTimerElement.textContent =
        formatTime(whiteTime);


    blackTimerElement.textContent =
        formatTime(blackTime);


    whiteTimerElement.classList.toggle(
        "active",
        currentTurn === "white"
    );


    blackTimerElement.classList.toggle(
        "active",
        currentTurn === "black"
    );

}


function formatTime(seconds) {

    seconds = Math.max(
        0,
        seconds
    );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remaining =
        seconds % 60;


    return (

        String(minutes).padStart(2, "0")

        +

        ":"

        +

        String(remaining).padStart(2, "0")

    );

}


/* =========================================================
   STATUS
========================================================= */

function updateStatus(check = false) {

    if (currentTurn === "white") {

        whiteStatusElement.textContent =
            check
                ? "Check!"
                : "Your turn";

        blackStatusElement.textContent =
            "Waiting";

    } else {

        whiteStatusElement.textContent =
            "Waiting";

        blackStatusElement.textContent =
            check
                ? "Check!"
                : "Your turn";

    }


    updateTimerDisplay();

}


/* =========================================================
   BOARD FLIP
========================================================= */

function flipBoard() {

    boardFlipped =
        !boardFlipped;


    renderBoard();

}


/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {

    settingsModal.classList.remove(
        "hidden"
    );

}


function closeSettings() {

    settingsModal.classList.add(
        "hidden"
    );

}


/* =========================================================
   GAME MODAL
========================================================= */

function showGameResult(
    icon,
    title,
    message
) {

    resultIcon.textContent = icon;

    resultTitle.textContent = title;

    resultMessage.textContent = message;


    gameModal.classList.remove(
        "hidden"
    );

}


function hideGameModal() {

    gameModal.classList.add(
        "hidden"
    );

}


/* =========================================================
   SOUND
========================================================= */

function playMoveSound(captured) {

    if (!soundEnabled) return;


    /* Placeholder beep using Web Audio */

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        const audio =
            new AudioContext();


        const oscillator =
            audio.createOscillator();


        const gain =
            audio.createGain();


        oscillator.connect(
            gain
        );

        gain.connect(
            audio.destination
        );


        oscillator.frequency.value =
            captured
                ? 180
                : 420;


        gain.gain.setValueAtTime(
            0.04,
            audio.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.08
        );


        oscillator.start();

        oscillator.stop(
            audio.currentTime + 0.08
        );

    } catch (error) {

        /* Audio unavailable */

    }

}


function playCheckSound() {

    if (!soundEnabled) return;


    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        const audio =
            new AudioContext();


        const oscillator =
            audio.createOscillator();


        const gain =
            audio.createGain();


        oscillator.connect(gain);

        gain.connect(
            audio.destination
        );


        oscillator.frequency.value =
            700;


        gain.gain.setValueAtTime(
            0.03,
            audio.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.15
        );


        oscillator.start();

        oscillator.stop(
            audio.currentTime + 0.15
        );

    } catch (error) {}

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(text) {

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}


/* =========================================================
   EVENTS
========================================================= */

undoButton.addEventListener(
    "click",
    undoMove
);


newGameButton.addEventListener(
    "click",
    newGame
);


resignButton.addEventListener(
    "click",
    resignGame
);


flipBoardButton.addEventListener(
    "click",
    flipBoard
);


settingsButton.addEventListener(
    "click",
    openSettings
);


closeSettingsButton.addEventListener(
    "click",
    closeSettings
);


rematchButton.addEventListener(
    "click",
    newGame
);


closeModalButton.addEventListener(
    "click",
    hideGameModal
);


clearHistoryButton.addEventListener(
    "click",
    () => {

        moveHistory = [];

        renderHistory();

    }
);


soundToggle.addEventListener(
    "change",
    () => {

        soundEnabled =
            soundToggle.checked;

    }
);


coordinateToggle.addEventListener(
    "change",
    () => {

        coordinatesEnabled =
            coordinateToggle.checked;

        renderBoard();

    }
);


animationToggle.addEventListener(
    "change",
    () => {

        animationsEnabled =
            animationToggle.checked;

        renderBoard();

    }
);


/* Close modal when clicking background */

settingsModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            settingsModal
        ) {

            closeSettings();

        }

    }
);


gameModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            gameModal
        ) {

            hideGameModal();

        }

    }
);


/* =========================================================
   START
========================================================= */

renderBoard();

renderHistory();

updateStatus();

updateTimerDisplay();

startTimer();