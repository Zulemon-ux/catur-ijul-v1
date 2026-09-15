class ChessEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = this.createInitialBoard();
        this.turn = "white";
        this.castling = {
            whiteKing: true,
            whiteQueen: true,
            blackKing: true,
            blackQueen: true
        };
        this.enPassant = null;
    }

    createInitialBoard() {
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));

        const back = [
            "rook", "knight", "bishop", "queen",
            "king", "bishop", "knight", "rook"
        ];

        for (let c = 0; c < 8; c++) {
            board[0][c] = {
                type: back[c],
                color: "black",
                moved: false
            };

            board[1][c] = {
                type: "pawn",
                color: "black",
                moved: false
            };

            board[6][c] = {
                type: "pawn",
                color: "white",
                moved: false
            };

            board[7][c] = {
                type: back[c],
                color: "white",
                moved: false
            };
        }

        return board;
    }

    cloneBoard(board) {
        return board.map(row =>
            row.map(piece => piece ? { ...piece } : null)
        );
    }

    inside(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    opposite(color) {
        return color === "white" ? "black" : "white";
    }

    getPiece(r, c, board = this.board) {
        if (!this.inside(r, c)) return null;
        return board[r][c];
    }

    generatePseudoMoves(r, c, board = this.board, options = {}) {
        const piece = board[r][c];
        if (!piece) return [];

        const moves = [];
        const color = piece.color;
        const enemy = this.opposite(color);

        const add = (toR, toC, extra = {}) => {
            if (!this.inside(toR, toC)) return;

            const target = board[toR][toC];

            if (target && target.color === color) return;

            moves.push({
                from: { r, c },
                to: { r: toR, c: toC },
                piece: { ...piece },
                captured: target ? { ...target } : null,
                ...extra
            });
        };

        if (piece.type === "pawn") {
            const dir = color === "white" ? -1 : 1;
            const startRow = color === "white" ? 6 : 1;

            if (
                this.inside(r + dir, c) &&
                !board[r + dir][c]
            ) {
                add(r + dir, c);

                if (
                    r === startRow &&
                    !board[r + dir * 2][c]
                ) {
                    add(r + dir * 2, c, {
                        doublePawn: true
                    });
                }
            }

            for (const dc of [-1, 1]) {
                const nr = r + dir;
                const nc = c + dc;

                if (!this.inside(nr, nc)) continue;

                const target = board[nr][nc];

                if (target && target.color === enemy) {
                    add(nr, nc);
                }

                if (
                    options.enPassant &&
                    this.enPassant &&
                    this.enPassant.r === nr &&
                    this.enPassant.c === nc
                ) {
                    add(nr, nc, {
                        enPassant: true,
                        capturedPawn: {
                            r: r,
                            c: nc
                        }
                    });
                }
            }
        }

        if (piece.type === "knight") {
            const jumps = [
                [-2, -1], [-2, 1],
                [-1, -2], [-1, 2],
                [1, -2], [1, 2],
                [2, -1], [2, 1]
            ];

            for (const [dr, dc] of jumps) {
                add(r + dr, c + dc);
            }
        }

        if (
            piece.type === "bishop" ||
            piece.type === "rook" ||
            piece.type === "queen"
        ) {
            let directions = [];

            if (
                piece.type === "bishop" ||
                piece.type === "queen"
            ) {
                directions.push(
                    [-1, -1],
                    [-1, 1],
                    [1, -1],
                    [1, 1]
                );
            }

            if (
                piece.type === "rook" ||
                piece.type === "queen"
            ) {
                directions.push(
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1]
                );
            }

            for (const [dr, dc] of directions) {
                let nr = r + dr;
                let nc = c + dc;

                while (this.inside(nr, nc)) {
                    const target = board[nr][nc];

                    if (!target) {
                        add(nr, nc);
                    } else {
                        if (target.color !== color) {
                            add(nr, nc);
                        }
                        break;
                    }

                    nr += dr;
                    nc += dc;
                }
            }
        }

        if (piece.type === "king") {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    add(r + dr, c + dc);
                }
            }

            if (!options.ignoreCastle) {
                this.addCastlingMoves(r, c, board, moves);
            }
        }

        return moves;
    }

    addCastlingMoves(r, c, board, moves) {
        const king = board[r][c];

        if (!king || king.type !== "king" || king.moved) return;

        const color = king.color;
        const enemy = this.opposite(color);
        const row = color === "white" ? 7 : 0;

        if (r !== row || c !== 4) return;

        if (this.isSquareAttacked(row, 4, enemy, board)) return;

        // King side
        if (
            this.castling[color + "King"] &&
            board[row][7] &&
            board[row][7].type === "rook" &&
            !board[row][5] &&
            !board[row][6] &&
            !this.isSquareAttacked(row, 5, enemy, board) &&
            !this.isSquareAttacked(row, 6, enemy, board)
        ) {
            moves.push({
                from: { r, c },
                to: { r: row, c: 6 },
                piece: { ...king },
                castle: "king"
            });
        }

        // Queen side
        if (
            this.castling[color + "Queen"] &&
            board[row][0] &&
            board[row][0].type === "rook" &&
            !board[row][1] &&
            !board[row][2] &&
            !board[row][3] &&
            !this.isSquareAttacked(row, 3, enemy, board) &&
            !this.isSquareAttacked(row, 2, enemy, board)
        ) {
            moves.push({
                from: { r, c },
                to: { r: row, c: 2 },
                piece: { ...king },
                castle: "queen"
            });
        }
    }

    isSquareAttacked(r, c, byColor, board = this.board) {
        for (let pr = 0; pr < 8; pr++) {
            for (let pc = 0; pc < 8; pc++) {
                const piece = board[pr][pc];

                if (!piece || piece.color !== byColor) continue;

                if (piece.type === "pawn") {
                    const dir = byColor === "white" ? -1 : 1;

                    if (
                        pr + dir === r &&
                        Math.abs(pc - c) === 1
                    ) {
                        return true;
                    }
                }

                if (piece.type === "king") {
                    if (
                        Math.max(
                            Math.abs(pr - r),
                            Math.abs(pc - c)
                        ) === 1
                    ) {
                        return true;
                    }
                }

                if (piece.type === "knight") {
                    const dr = Math.abs(pr - r);
                    const dc = Math.abs(pc - c);

                    if (
                        (dr === 2 && dc === 1) ||
                        (dr === 1 && dc === 2)
                    ) {
                        return true;
                    }
                }

                if (
                    piece.type === "bishop" ||
                    piece.type === "rook" ||
                    piece.type === "queen"
                ) {
                    const dr = r - pr;
                    const dc = c - pc;

                    let valid = false;

                    if (
                        piece.type === "bishop" ||
                        piece.type === "queen"
                    ) {
                        valid ||= Math.abs(dr) === Math.abs(dc);
                    }

                    if (
                        piece.type === "rook" ||
                        piece.type === "queen"
                    ) {
                        valid ||= dr === 0 || dc === 0;
                    }

                    if (!valid) continue;

                    const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
                    const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;

                    let nr = pr + stepR;
                    let nc = pc + stepC;
                    let blocked = false;

                    while (nr !== r || nc !== c) {
                        if (board[nr][nc]) {
                            blocked = true;
                            break;
                        }

                        nr += stepR;
                        nc += stepC;
                    }

                    if (!blocked) return true;
                }
            }
        }

        return false;
    }

    findKing(color, board = this.board) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];

                if (
                    piece &&
                    piece.color === color &&
                    piece.type === "king"
                ) {
                    return { r, c };
                }
            }
        }

        return null;
    }

    isInCheck(color, board = this.board) {
        const king = this.findKing(color, board);

        if (!king) return true;

        return this.isSquareAttacked(
            king.r,
            king.c,
            this.opposite(color),
            board
        );
    }

    makeMoveOnBoard(board, move) {
        const newBoard = this.cloneBoard(board);

        const piece = {
            ...newBoard[move.from.r][move.from.c],
            moved: true
        };

        newBoard[move.from.r][move.from.c] = null;

        if (move.enPassant && move.capturedPawn) {
            newBoard[
                move.capturedPawn.r
            ][
                move.capturedPawn.c
            ] = null;
        }

        newBoard[move.to.r][move.to.c] = piece;

        if (move.castle === "king") {
            const row = move.from.r;

            newBoard[row][5] = {
                ...newBoard[row][7],
                moved: true
            };

            newBoard[row][7] = null;
        }

        if (move.castle === "queen") {
            const row = move.from.r;

            newBoard[row][3] = {
                ...newBoard[row][0],
                moved: true
            };

            newBoard[row][0] = null;
        }

        return newBoard;
    }

    getLegalMoves(color = this.turn, board = this.board) {
        const legal = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];

                if (!piece || piece.color !== color) continue;

                const pseudo = this.generatePseudoMoves(
                    r,
                    c,
                    board,
                    { enPassant: true }
                );

                for (const move of pseudo) {
                    const testBoard = this.makeMoveOnBoard(
                        board,
                        move
                    );

                    if (!this.isInCheck(color, testBoard)) {
                        legal.push(move);
                    }
                }
            }
        }

        return legal;
    }

    getMovesForSquare(r, c) {
        return this.getLegalMoves(this.turn).filter(
            move =>
                move.from.r === r &&
                move.from.c === c
        );
    }

    move(move, promotion = "queen") {
        const piece = this.board[move.from.r][move.from.c];

        if (!piece) return null;

        const captured =
            move.enPassant
                ? this.board[move.capturedPawn.r][move.capturedPawn.c]
                : this.board[move.to.r][move.to.c];

        this.board = this.makeMoveOnBoard(
            this.board,
            move
        );

        const movedPiece =
            this.board[move.to.r][move.to.c];

        if (
            movedPiece.type === "pawn" &&
            (move.to.r === 0 || move.to.r === 7)
        ) {
            movedPiece.type = promotion;
        }

        this.updateCastlingRights(
            piece,
            move,
            captured
        );

        this.enPassant = null;

        if (
            piece.type === "pawn" &&
            Math.abs(move.to.r - move.from.r) === 2
        ) {
            this.enPassant = {
                r: (move.to.r + move.from.r) / 2,
                c: move.from.c
            };
        }

        this.turn = this.opposite(this.turn);

        return {
            move,
            piece,
            captured,
            promotion
        };
    }

    updateCastlingRights(piece, move, captured) {
        if (piece.type === "king") {
            this.castling[piece.color + "King"] = false;
            this.castling[piece.color + "Queen"] = false;
        }

        if (piece.type === "rook") {
            if (piece.color === "white") {
                if (move.from.r === 7 && move.from.c === 0)
                    this.castling.whiteQueen = false;

                if (move.from.r === 7 && move.from.c === 7)
                    this.castling.whiteKing = false;
            }

            if (piece.color === "black") {
                if (move.from.r === 0 && move.from.c === 0)
                    this.castling.blackQueen = false;

                if (move.from.r === 0 && move.from.c === 7)
                    this.castling.blackKing = false;
            }
        }

        if (captured && captured.type === "rook") {
            if (captured.color === "white") {
                if (move.to.r === 7 && move.to.c === 0)
                    this.castling.whiteQueen = false;

                if (move.to.r === 7 && move.to.c === 7)
                    this.castling.whiteKing = false;
            }

            if (captured.color === "black") {
                if (move.to.r === 0 && move.to.c === 0)
                    this.castling.blackQueen = false;

                if (move.to.r === 0 && move.to.c === 7)
                    this.castling.blackKing = false;
            }
        }
    }

    getGameState(color = this.turn) {
        const moves = this.getLegalMoves(color);
        const check = this.isInCheck(color);

        if (moves.length === 0) {
            if (check) {
                return "checkmate";
            }

            return "stalemate";
        }

        if (check) {
            return "check";
        }

        return "playing";
    }

    evaluate(board) {
        const values = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };

        let score = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];

                if (!piece) continue;

                let value = values[piece.type];

                // Positional bonuses
                const centerDistance =
                    Math.abs(3.5 - r) +
                    Math.abs(3.5 - c);

                const centerBonus =
                    Math.max(0, 4 - centerDistance) * 5;

                if (piece.type === "pawn") {
                    const advance =
                        piece.color === "white"
                            ? 6 - r
                            : r - 1;

                    value += advance * 6;
                }

                if (
                    piece.type === "knight" ||
                    piece.type === "bishop"
                ) {
                    value += centerBonus;
                }

                if (piece.type === "king") {
                    value -= centerBonus * 2;
                }

                if (piece.color === "black") {
                    score += value;
                } else {
                    score -= value;
                }
            }
        }

        return score;
    }

    minimax(board, depth, alpha, beta, maximizing) {
        const color =
            maximizing ? "black" : "white";

        const moves = this.getLegalMoves(
            color,
            board
        );

        if (depth === 0 || moves.length === 0) {
            if (moves.length === 0) {
                if (this.isInCheck(color, board)) {
                    return {
                        score: maximizing
                            ? -999999
                            : 999999
                    };
                }

                return { score: 0 };
            }

            return {
                score: this.evaluate(board)
            };
        }

        if (maximizing) {
            let best = -Infinity;
            let bestMove = null;

            for (const move of moves) {
                const next = this.makeMoveOnBoard(
                    board,
                    move
                );

                const result = this.minimax(
                    next,
                    depth - 1,
                    alpha,
                    beta,
                    false
                );

                if (result.score > best) {
                    best = result.score;
                    bestMove = move;
                }

                alpha = Math.max(alpha, best);

                if (beta <= alpha) break;
            }

            return {
                score: best,
                move: bestMove
            };
        }

        let best = Infinity;
        let bestMove = null;

        for (const move of moves) {
            const next = this.makeMoveOnBoard(
                board,
                move
            );

            const result = this.minimax(
                next,
                depth - 1,
                alpha,
                beta,
                true
            );

            if (result.score < best) {
                best = result.score;
                bestMove = move;
            }

            beta = Math.min(beta, best);

            if (beta <= alpha) break;
        }

        return {
            score: best,
            move: bestMove
        };
    }

    getBestMove(difficulty = 2) {
        const moves = this.getLegalMoves(
            "black",
            this.board
        );

        if (!moves.length) return null;

        // Easy = random
        if (difficulty === 1) {
            return moves[
                Math.floor(Math.random() * moves.length)
            ];
        }

        const depth =
            difficulty === 2 ? 2 : 3;

        const result = this.minimax(
            this.board,
            depth,
            -Infinity,
            Infinity,
            true
        );

        if (result.move) {
            return result.move;
        }

        return moves[0];
    }
}