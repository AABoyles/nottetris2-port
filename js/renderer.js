import * as C from './constants.js';
import { GameState } from './game.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = C.CANVAS_WIDTH + 150; // Extra space for UI
        this.canvas.height = C.CANVAS_HEIGHT;

        // Play area offset (to center it with room for UI on right)
        this.offsetX = 0;
        this.offsetY = 0;
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= C.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX + x * C.BLOCK_SIZE, this.offsetY);
            this.ctx.lineTo(this.offsetX + x * C.BLOCK_SIZE, this.offsetY + C.CANVAS_HEIGHT);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= C.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, this.offsetY + y * C.BLOCK_SIZE);
            this.ctx.lineTo(this.offsetX + C.CANVAS_WIDTH, this.offsetY + y * C.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }

    drawBorder() {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.offsetX, this.offsetY, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    }

    drawPiece(piece, isActive = false) {
        if (!piece || !piece.body) return;

        const blockVertices = piece.getWorldVertices();
        const color = piece.color;

        // Add glow effect for active piece
        if (isActive) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
        }

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = this.lightenColor(color, 40);
        this.ctx.lineWidth = isActive ? 3 : 2;

        for (const vertices of blockVertices) {
            if (vertices.length < 3) continue;

            this.ctx.beginPath();
            this.ctx.moveTo(
                this.offsetX + vertices[0].x,
                this.offsetY + vertices[0].y
            );

            for (let i = 1; i < vertices.length; i++) {
                this.ctx.lineTo(
                    this.offsetX + vertices[i].x,
                    this.offsetY + vertices[i].y
                );
            }

            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }

        // Reset shadow
        if (isActive) {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
    }

    drawLineClearEffect(linesToClear, timer) {
        const maxTime = C.LINE_CLEAR_DELAY;
        const progress = 1 - (timer / maxTime);
        const blink = Math.floor(progress * 8) % 2 === 0;

        if (blink) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (const lineIndex of linesToClear) {
                const y = lineIndex * C.BLOCK_SIZE;
                this.ctx.fillRect(
                    this.offsetX,
                    this.offsetY + y,
                    C.CANVAS_WIDTH,
                    C.BLOCK_SIZE
                );
            }
        }
    }

    drawUI(game) {
        const uiX = C.CANVAS_WIDTH + 20;

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';

        // Score
        this.ctx.fillText('SCORE', uiX, 30);
        this.ctx.fillText(game.getScore().toString(), uiX, 50);

        // Level
        this.ctx.fillText('LEVEL', uiX, 90);
        this.ctx.fillText(game.getLevel().toString(), uiX, 110);

        // Lines
        this.ctx.fillText('LINES', uiX, 150);
        this.ctx.fillText(game.getLinesCleared().toString(), uiX, 170);

        // Next piece preview
        this.ctx.fillText('NEXT', uiX, 220);
        this.drawNextPiecePreview(game.getNextPieceType(), uiX + 30, 280);
    }

    drawNextPiecePreview(pieceType, centerX, centerY) {
        if (!pieceType) return;

        const shape = C.SHAPES[pieceType];
        const color = C.COLORS[pieceType];
        const scale = 0.6;
        const blockSize = C.BLOCK_SIZE * scale;

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = this.lightenColor(color, 30);
        this.ctx.lineWidth = 1;

        for (const block of shape) {
            const x = centerX + block.x * blockSize - blockSize / 2;
            const y = centerY + block.y * blockSize - blockSize / 2;

            this.ctx.fillRect(x, y, blockSize, blockSize);
            this.ctx.strokeRect(x, y, blockSize, blockSize);
        }
    }

    drawMenu() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NOT TETRIS 2', this.canvas.width / 2, 150);

        this.ctx.font = '14px monospace';
        this.ctx.fillText('A physics-based Tetris', this.canvas.width / 2, 180);

        this.ctx.font = '16px monospace';
        this.ctx.fillText('Press ENTER to start', this.canvas.width / 2, 280);

        this.ctx.font = '12px monospace';
        this.ctx.fillText('Controls:', this.canvas.width / 2, 340);
        this.ctx.fillText('Arrow Keys / WASD - Move', this.canvas.width / 2, 360);
        this.ctx.fillText('Z / Up - Rotate Left', this.canvas.width / 2, 380);
        this.ctx.fillText('X - Rotate Right', this.canvas.width / 2, 400);
        this.ctx.fillText('Space - Hard Drop', this.canvas.width / 2, 420);
        this.ctx.fillText('P / Esc - Pause', this.canvas.width / 2, 440);

        this.ctx.textAlign = 'left';
    }

    drawPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '14px monospace';
        this.ctx.fillText('Press P to continue', this.canvas.width / 2, this.canvas.height / 2 + 30);

        this.ctx.textAlign = 'left';
    }

    drawGameOver(game) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#f00';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`Score: ${game.getScore()}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText(`Level: ${game.getLevel()}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText(`Lines: ${game.getLinesCleared()}`, this.canvas.width / 2, this.canvas.height / 2 + 40);

        this.ctx.font = '14px monospace';
        this.ctx.fillText('Press ENTER to restart', this.canvas.width / 2, this.canvas.height / 2 + 90);

        this.ctx.textAlign = 'left';
    }

    drawLoading() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.textAlign = 'left';
    }

    render(game) {
        this.clear();

        const state = game.getState();

        if (state === GameState.LOADING) {
            this.drawLoading();
            return;
        }

        if (state === GameState.MENU) {
            this.drawMenu();
            return;
        }

        // Draw play area
        this.drawGrid();
        this.drawBorder();

        // Draw settled pieces
        for (const piece of game.getSettledPieces()) {
            this.drawPiece(piece, false);
        }

        // Draw active piece with glow
        if (game.getActivePiece()) {
            this.drawPiece(game.getActivePiece(), true);
        }

        // Draw line clear effect
        if (state === GameState.LINE_CLEARING) {
            this.drawLineClearEffect(game.getLinesToClear(), game.lineClearTimer);
        }

        // Draw UI
        this.drawUI(game);

        // Draw overlays
        if (state === GameState.PAUSED) {
            this.drawPaused();
        } else if (state === GameState.GAME_OVER) {
            this.drawGameOver(game);
        }
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;

        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
}
