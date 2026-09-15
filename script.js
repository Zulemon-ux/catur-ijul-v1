const engine = new ChessEngine();

let mode = "computer";

let difficulty = 2;

let timeLimit = 600;

let selected = null;

let legalMoves = [];

let gameOver = false;

let paused = false;

let aiThinking = false;

let moveHistory = [];

let capturedPieces = [];

let moveNumber = 0;

let checkCount = 0;

let timerInterval = null;

let timers = {
    white: timeLimit,
    black: timeLimit
};


const settings = {

    sound: true,

    coordinates: true,

    animations: true,

    haptic: true

};


const pieceSymbols = {

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


const pieceLetters = {

    king: "K",
    queen: "Q",
    rook: "R",
    bishop: "B",
    knight: "N",
    pawn: ""

};


const boardElement =
    document.getElementById(
        "chessBoard"
    );


function $(id) {
    return document.getElementById(id);
}


// =============================
// SOUND
// =============================

function playSound(type = "move") {

    if (!settings.sound)
        return;

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        const context =
            new AudioContext();

        const oscillator =
            context.createOscillator();

        const gain =
            context.createGain();

        oscillator.connect(gain);

        gain.connect(
            context.destination
        );


        if (
            type === "capture"
        ) {

            oscillator.frequency.value =
                180;

        } else if (
            type === "check"
        ) {

            oscillator.frequency.value =
                650;

        } else {

            oscillator.frequency.value =
                420;
        }


        gain.gain.value = 0.05;

        oscillator.start();


        setTimeout(() => {

            oscillator.stop();

            context.close();

        }, 100);

    } catch (error) {

        console.log(
            "Audio unavailable"
        );
    }
}


function vibrate(pattern = 20) {

    if (
        settings.haptic &&
        navigator.vibrate
    ) {

        navigator.vibrate(
            pattern
        );
    }
}


// =============================
// TOAST
// =============================

function showToast(
    message,
    icon = "✓"
) {

    const toast =
        $("toast");

    if (!toast)
        return;

    $("toastMessage").textContent =
        message;

    $("toastIcon").textContent =
        icon;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        showToast.timeout
    );

    showToast.timeout =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2200);
}


// =============================
// TIMER
// =============================

function formatTime(
    seconds
) {

    seconds =
        Math.max(
            0,
            seconds
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const secs =
        seconds % 60;

    return (
        String(minutes)
            .padStart(2, "0")
        +
        ":" +
        String(secs)
            .padStart(2, "0")
    );
}


function updateTimers() {

    $("whiteTimer").textContent =
        formatTime(
            timers.white
        );

    $("blackTimer").textContent =
        formatTime(
            timers.black
        );


    const whiteTimer =
        $("whiteTimer")
            .parentElement;

    const blackTimer =
        $("blackTimer")
            .parentElement;


    whiteTimer?.classList.toggle(
        "active",

        engine.turn === "white" &&
        !paused &&
        !gameOver
    );


    blackTimer?.classList.toggle(
        "active",

        engine.turn === "black" &&
        !paused &&
        !gameOver
    );
}


function startTimer() {

    clearInterval(
        timerInterval
    );

    timerInterval =
        setInterval(() => {

            if (
                paused ||
                gameOver
            ) {
                return;
            }

            const color =
                engine.turn;

            timers[color]--;

            updateTimers();


            if (
                timers[color] <= 0
            ) {

                timers[color] = 0;

                endGame(

                    color === "white"
                        ? "black"
                        : "white",

                    "Waktu habis"
                );
            }

        }, 1000);
}


function stopTimer() {

    clearInterval(
        timerInterval
    );
}


// =============================
// BOARD
// =============================

function renderBoard() {

    boardElement.innerHTML = "";

    const board =
        engine.board;


    for (
        let r = 0;
        r < 8;
        r++
    ) {

        for (
            let c = 0;
            c < 8;
            c++
        ) {

            const square =
                document.createElement(
                    "div"
                );


            square.className =
                "square " +
                (
                    (r + c) % 2 === 0
                        ? "light"
                        : "dark"
                );


            square.dataset.row =
                r;

            square.dataset.col =
                c;


            const piece =
                board[r][c];


            // COORDINATES

            if (
                settings.coordinates
            ) {

                if (c === 0) {

                    const rank =
                        document.createElement(
                            "span"
                        );

                    rank.className =
                        "rank";

                    rank.textContent =
                        8 - r;

                    square.appendChild(
                        rank
                    );
                }


                if (r === 7) {

                    const file =
                        document.createElement(
                            "span"
                        );

                    file.className =
                        "file";

                    file.textContent =
                        String.fromCharCode(
                            97 + c
                        );

                    square.appendChild(
                        file
                    );
                }
            }


            // SELECTED

            if (
                selected &&
                selected.r === r &&
                selected.c === c
            ) {

                square.classList.add(
                    "selected"
                );
            }


            // LEGAL MOVE

            const legal =
                legalMoves.find(
                    move =>
                        move.to.r === r &&
                        move.to.c === c
                );


            if (legal) {

                square.classList.add(

                    legal.captured ||
                    legal.enPassant

                        ? "capture-target"

                        : "legal-target"
                );
            }


            // PIECE

            if (piece) {

                const pieceElement =
                    document.createElement(
                        "div"
                    );

                pieceElement.className =
                    "piece " +
                    piece.color;

                pieceElement.textContent =
                    pieceSymbols[
                        piece.color
                    ][
                        piece.type
                    ];


                pieceElement.draggable =
                    true;


                pieceElement.addEventListener(
                    "dragstart",
                    event => {

                        if (
                            gameOver ||
                            paused ||
                            aiThinking
                        ) {

                            event.preventDefault();

                            return;
                        }


                        if (
                            mode === "computer" &&
                            engine.turn !== "white"
                        ) {

                            event.preventDefault();

                            return;
                        }


                        selected = {
                            r,
                            c
                        };


                        legalMoves =
                            engine.getMovesForSquare(
                                r,
                                c
                            );


                        event.dataTransfer.setData(
                            "text/plain",
                            `${r},${c}`
                        );


                        renderBoard();
                    }
                );


                square.appendChild(
                    pieceElement
                );
            }


            // CLICK

            square.addEventListener(
                "click",
                () => {

                    handleSquareClick(
                        r,
                        c
                    );

                }
            );


            // DROP

            square.addEventListener(
                "dragover",
                event => {

                    event.preventDefault();

                }
            );


            square.addEventListener(
                "drop",
                event => {

                    event.preventDefault();

                    if (!selected)
                        return;

                    tryMove(

                        selected.r,
                        selected.c,
                        r,
                        c
                    );
                }
            );


            boardElement.appendChild(
                square
            );
        }
    }


    updatePlayerStatus();
}


// =============================
// CLICK MOVE
// =============================

function handleSquareClick(
    r,
    c
) {

    if (
        gameOver ||
        paused ||
        aiThinking
    ) {
        return;
    }


    if (
        mode === "computer" &&
        engine.turn !== "white"
    ) {
        return;
    }


    const piece =
        engine.board[r][c];


    // SELECT PIECE

    if (!selected) {

        if (
            piece &&
            piece.color === engine.turn
        ) {

            selected = {
                r,
                c
            };

            legalMoves =
                engine.getMovesForSquare(
                    r,
                    c
                );

            renderBoard();
        }

        return;
    }


    // TRY MOVE

    const targetMove =
        legalMoves.find(
            move =>
                move.to.r === r &&
                move.to.c === c
        );


    if (targetMove) {

        tryMove(
            selected.r,
            selected.c,
            r,
            c
        );

        return;
    }


    // SELECT ANOTHER PIECE

    if (
        piece &&
        piece.color === engine.turn
    ) {

        selected = {
            r,
            c
        };

        legalMoves =
            engine.getMovesForSquare(
                r,
                c
            );

        renderBoard();

        return;
    }


    selected = null;

    legalMoves = [];

    renderBoard();
}


// =============================
// TRY MOVE
// =============================

function tryMove(
    fromR,
    fromC,
    toR,
    toC
) {

    if (
        gameOver ||
        paused ||
        aiThinking
    ) {
        return;
    }


    const moves =
        engine.getMovesForSquare(
            fromR,
            fromC
        );


    const move =
        moves.find(
            m =>
                m.to.r === toR &&
                m.to.c === toC
        );


    if (!move)
        return;


    // PROMOTION

    if (
        move.piece.type === "pawn" &&
        (
            move.to.r === 0 ||
            move.to.r === 7
        )
    ) {

        openPromotion(
            move
        );

        return;
    }


    executeMove(
        move,
        "queen"
    );
}


// =============================
// EXECUTE MOVE
// =============================

function executeMove(
    move,
    promotion = "queen"
) {

    const snapshot = {

        board:
            engine.cloneBoard(
                engine.board
            ),

        turn:
            engine.turn,

        castling: {
            ...engine.castling
        },

        enPassant:
            engine.enPassant
                ? {
                    ...engine.enPassant
                }
                : null,

        timers: {
            ...timers
        },

        moveHistory: [
            ...moveHistory
        ],

        capturedPieces: [
            ...capturedPieces
        ],

        moveNumber,

        checkCount
    };


    move._snapshot =
        snapshot;


    const result =
        engine.move(
            move,
            promotion
        );


    moveHistory.push({

        ...result,

        notation:
            createNotation(
                result
            ),

        _snapshot:
            snapshot
    });


    if (
        result.captured
    ) {

        capturedPieces.push(
            result.captured
        );

        playSound(
            "capture"
        );

        vibrate([
            15,
            30,
            15
        ]);

    } else {

        playSound(
            "move"
        );

        vibrate(15);
    }


    moveNumber++;


    selected = null;

    legalMoves = [];


    const state =
        engine.getGameState();


    if (
        state === "check"
    ) {

        checkCount++;

        playSound(
            "check"
        );

        showToast(
            `${
                engine.turn === "white"
                    ? "Putih"
                    : "Hitam"
            } sedang skak!`,
            "!"
        );
    }


    updateStats();

    updateHistory();

    renderBoard();

    updateTimers();


    // CHECKMATE

    if (
        state === "checkmate"
    ) {

        endGame(

            engine.opposite(
                engine.turn
            ),

            "Skakmat"
        );

        return;
    }


    // STALEMATE

    if (
        state === "stalemate"
    ) {

        endGame(
            null,
            "Remis — stalemate"
        );

        return;
    }


    // AI TURN

    if (
        mode === "computer" &&
        engine.turn === "black"
    ) {

        makeAIMove();
    }
}


// =============================
// NOTATION
// =============================

function createNotation(
    result
) {

    const move =
        result.move;

    const piece =
        result.piece;


    if (
        move.castle === "king"
    ) {
        return "O-O";
    }


    if (
        move.castle === "queen"
    ) {
        return "O-O-O";
    }


    const file =
        String.fromCharCode(
            97 + move.from.c
        );


    const targetFile =
        String.fromCharCode(
            97 + move.to.c
        );


    const targetSquare =
        targetFile +
        (8 - move.to.r);


    let notation =
        pieceLetters[
            piece.type
        ];


    if (
        piece.type === "pawn" &&
        result.captured
    ) {

        notation += file;
    }


    if (
        result.captured
    ) {

        notation += "x";
    }


    notation +=
        targetSquare;


    if (
        result.promotion
    ) {

        if (
            piece.type === "pawn" &&
            (
                move.to.r === 0 ||
                move.to.r === 7
            )
        ) {

            notation +=
                "=" +
                pieceLetters[
                    result.promotion
                ];
        }
    }


    return notation;
}


// =============================
// PROMOTION
// =============================

function openPromotion(
    move
) {

    const modal =
        $("promotionModal");


    if (!modal) {

        executeMove(
            move,
            "queen"
        );

        return;
    }


    modal.classList.add(
        "show"
    );


    const options =
        modal.querySelectorAll(
            ".promotion-piece"
        );


    options.forEach(
        option => {

            option.onclick = () => {

                const type =
                    option.dataset.piece ||
                    "queen";


                modal.classList.remove(
                    "show"
                );


                executeMove(
                    move,
                    type
                );
            };
        }
    );
}


// =============================
// AI
// =============================

function makeAIMove() {

    if (
        gameOver ||
        paused ||
        mode !== "computer" ||
        engine.turn !== "black"
    ) {
        return;
    }


    aiThinking = true;

    updatePlayerStatus();


    showToast(
        "Computer sedang berpikir...",
        "♟"
    );


    const delay =
        difficulty === 3
            ? 550
            : 300;


    setTimeout(() => {

        if (
            gameOver ||
            paused ||
            engine.turn !== "black"
        ) {

            aiThinking = false;

            return;
        }


        const move =
            engine.getBestMove(
                difficulty
            );


        aiThinking = false;


        if (move) {

            executeMove(
                move,
                "queen"
            );
        }

    }, delay);
}


// =============================
// HISTORY
// =============================

function updateHistory() {

    const container =
        $("moveHistory");


    if (!container)
        return;


    container.innerHTML = "";


    for (
        let i = 0;
        i < moveHistory.length;
        i++
    ) {

        const move =
            moveHistory[i];


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "history-row";


        row.innerHTML = `

            <span>
                ${Math.floor(i / 2) + 1}
            </span>

            <span>
                ${
                    move.piece.color === "white"
                        ? move.notation
                        : ""
                }
            </span>

            <span>
                ${
                    move.piece.color === "black"
                        ? move.notation
                        : ""
                }
            </span>

        `;


        container.appendChild(
            row
        );
    }


    container.scrollTop =
        container.scrollHeight;
}


// =============================
// STATS
// =============================

function updateStats() {

    if (
        $("statMoves")
    ) {

        $("statMoves").textContent =
            moveNumber;
    }


    if (
        $("statCaptures")
    ) {

        $("statCaptures").textContent =
            capturedPieces.length;
    }


    if (
        $("statChecks")
    ) {

        $("statChecks").textContent =
            checkCount;
    }
}


// =============================
// PLAYER STATUS
// =============================

function updatePlayerStatus() {

    if (
        $("blackName")
    ) {

        $("blackName").textContent =
            mode === "computer"
                ? "Computer"
                : "Player 2";
    }


    if (
        $("whiteStatus")
    ) {

        $("whiteStatus").textContent =

            engine.turn === "white"
                ? "Your turn"
                : "Waiting";
    }


    if (
        $("blackStatus")
    ) {

        $("blackStatus").textContent =

            aiThinking
                ? "Thinking..."
                : engine.turn === "black"
                    ? "Your turn"
                    : "Waiting";
    }
}


// =============================
// MODE
// =============================

function updateModeButtons() {

    $("aiModeBtn")?.classList.toggle(
        "active",
        mode === "computer"
    );


    $("twoPlayerBtn")?.classList.toggle(
        "active",
        mode === "twoPlayer"
    );


    $("aiSettings")?.classList.toggle(
        "hidden",
        mode !== "computer"
    );
}


// =============================
// NEW GAME
// =============================

function newGame() {

    engine.reset();


    selected = null;

    legalMoves = [];


    gameOver = false;

    paused = false;

    aiThinking = false;


    moveHistory = [];

    capturedPieces = [];


    moveNumber = 0;

    checkCount = 0;


    timers = {

        white:
            timeLimit,

        black:
            timeLimit
    };


    stopTimer();

    startTimer();


    $("pauseModal")
        ?.classList.remove(
            "show"
        );


    $("resultModal")
        ?.classList.remove(
            "show"
        );


    updateModeButtons();

    updateStats();

    updateHistory();

    updateTimers();

    renderBoard();


    showToast(
        "Game baru dimulai",
        "♟"
    );
}


// =============================
// UNDO
// =============================

function undoMove() {

    if (
        gameOver ||
        aiThinking ||
        !moveHistory.length
    ) {
        return;
    }


    // Computer mode:
    // undo player + AI move

    const count =
        mode === "computer"
            ? Math.min(
                2,
                moveHistory.length
            )
            : 1;


    const index =
        moveHistory.length -
        count;


    const snapshot =
        moveHistory[
            index
        ]?._snapshot;


    if (!snapshot)
        return;


    engine.board =
        engine.cloneBoard(
            snapshot.board
        );


    engine.turn =
        snapshot.turn;


    engine.castling = {
        ...snapshot.castling
    };


    engine.enPassant =
        snapshot.enPassant
            ? {
                ...snapshot.enPassant
            }
            : null;


    timers = {
        ...snapshot.timers
    };


    moveHistory =
        moveHistory.slice(
            0,
            index
        );


    capturedPieces =
        snapshot.capturedPieces
            ? [
                ...snapshot.capturedPieces
            ]
            : [];


    moveNumber =
        snapshot.moveNumber;


    checkCount =
        snapshot.checkCount;


    selected = null;

    legalMoves = [];


    renderBoard();

    updateHistory();

    updateStats();

    updateTimers();


    showToast(
        "Langkah dibatalkan",
        "↶"
    );
}


// =============================
// RESIGN
// =============================

function resignGame() {

    if (gameOver)
        return;


    endGame(

        engine.opposite(
            engine.turn
        ),

        "Menyerah"
    );
}


// =============================
// GAME OVER
// =============================

function endGame(
    winner,
    reason
) {

    gameOver = true;

    stopTimer();


    const title =
        $("resultTitle");

    const message =
        $("resultMessage");

    const icon =
        $("resultIcon");


    if (
        winner === null
    ) {

        if (title)
            title.textContent =
                "Draw";


        if (message)
            message.textContent =
                reason;


        if (icon)
            icon.textContent =
                "½";

    } else {

        const winnerName =

            winner === "white"
                ? "Putih"
                : mode === "computer"
                    ? "Computer"
                    : "Hitam";


        if (title)
            title.textContent =
                `${winnerName} Menang`;


        if (message)
            message.textContent =
                reason;


        if (icon)
            icon.textContent =
                "♛";
    }


    setTimeout(() => {

        $("resultModal")
            ?.classList.add(
                "show"
            );

    }, 400);
}


// =============================
// PAUSE
// =============================

function togglePause() {

    if (gameOver)
        return;


    paused = !paused;


    $("pauseModal")
        ?.classList.toggle(
            "show",
            paused
        );


    updateTimers();

    updatePlayerStatus();
}


// =============================
// FLIP
// =============================

function flipBoard() {

    boardElement.classList.toggle(
        "flipped"
    );
}


// =============================
// SETTINGS
// =============================

function setupSettings() {

    $("settingsBtn")
        ?.addEventListener(
            "click",
            () => {

                $("settingsModal")
                    ?.classList.add(
                        "show"
                    );
            }
        );


    $("closeSettings")
        ?.addEventListener(
            "click",
            () => {

                $("settingsModal")
                    ?.classList.remove(
                        "show"
                    );
            }
        );


    setupToggle(
        "soundToggle",
        "sound"
    );


    setupToggle(
        "coordinatesToggle",
        "coordinates"
    );


    setupToggle(
        "animationsToggle",
        "animations"
    );


    setupToggle(
        "hapticToggle",
        "haptic"
    );
}


function setupToggle(
    id,
    setting
) {

    const element =
        $(id);


    if (!element)
        return;


    element.checked =
        settings[setting];


    element.addEventListener(
        "change",
        () => {

            settings[setting] =
                element.checked;


            if (
                setting ===
                "coordinates"
            ) {

                renderBoard();
            }
        }
    );
}


// =============================
// CONTROLS
// =============================

function setupControls() {

    $("newGameBtn")
        ?.addEventListener(
            "click",
            newGame
        );


    $("resultNewGame")
        ?.addEventListener(
            "click",
            () => {

                $("resultModal")
                    ?.classList.remove(
                        "show"
                    );

                newGame();
            }
        );


    $("undoBtn")
        ?.addEventListener(
            "click",
            undoMove
        );


    $("resignBtn")
        ?.addEventListener(
            "click",
            resignGame
        );


    $("pauseBtn")
        ?.addEventListener(
            "click",
            togglePause
        );


    $("resumeBtn")
        ?.addEventListener(
            "click",
            togglePause
        );


    $("flipBtn")
        ?.addEventListener(
            "click",
            flipBoard
        );


    // COMPUTER MODE

    $("aiModeBtn")
        ?.addEventListener(
            "click",
            () => {

                mode =
                    "computer";

                updateModeButtons();

                newGame();
            }
        );


    // 2 PLAYER MODE

    $("twoPlayerBtn")
        ?.addEventListener(
            "click",
            () => {

                mode =
                    "twoPlayer";

                updateModeButtons();

                newGame();
            }
        );


    // DIFFICULTY

    $("difficultySelect")
        ?.addEventListener(
            "change",
            event => {

                difficulty =
                    Number(
                        event.target.value
                    );
            }
        );


    // TIME

    $("timeSelect")
        ?.addEventListener(
            "change",
            event => {

                timeLimit =
                    Number(
                        event.target.value
                    );

                newGame();
            }
        );
}


// =============================
// START
// =============================

function startGame() {

    setupControls();

    setupSettings();

    updateModeButtons();

    updateStats();

    updateHistory();

    updateTimers();

    renderBoard();

    startTimer();
}


startGame();