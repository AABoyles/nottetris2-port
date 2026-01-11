import * as C from './constants.js';
import { initPhysics, stepWorld, getWorld, getEventQueue, getRAPIER, setGravity, resetWorld, FLOOR_GROUP, SETTLED_GROUP } from './physics.js';
import { Tetromino, getNextPieceType, createTetrominoOfType, resetBag } from './tetromino.js';
import { isKeyDown, wasKeyPressed } from './input.js';
import { checkLines, clearLines, calculateScore } from './lineClear.js';
import { audio } from './audio.js';

export const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LINE_CLEARING: 'line_clearing',
    GAME_OVER: 'game_over'
};

export class Game {
    constructor() {
        this.state = GameState.LOADING;
        this.activePiece = null;
        this.nextPieceType = null; // Just store the type, not the actual piece
        this.settledPieces = [];
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.linesToClear = [];
        this.lineClearTimer = 0;

        this.lastTime = 0;
        this.settleCheckTimer = 0;
        this.pieceSettleStartTime = 0;
    }

    async init(rapierModule) {
        await initPhysics(rapierModule);
        this.state = GameState.MENU;
    }

    startGame() {
        resetWorld();
        resetBag();

        this.activePiece = null;
        this.nextPieceType = null;
        this.settledPieces = [];
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.linesToClear = [];
        this.lineClearTimer = 0;
        this.settleCheckTimer = 0;
        this.pieceSettleStartTime = 0;

        // Prepare first piece type
        this.nextPieceType = getNextPieceType();
        this.spawnNextPiece();

        this.state = GameState.PLAYING;

        // Start game music
        audio.playMusic('themeA');
    }

    spawnNextPiece() {
        console.log('Spawning next piece of type:', this.nextPieceType);

        // Create the active piece from the next type
        this.activePiece = createTetrominoOfType(this.nextPieceType);

        // Get the next piece type (not an actual piece yet)
        this.nextPieceType = getNextPieceType();

        this.pieceSettleStartTime = 0;
        console.log('Next piece type will be:', this.nextPieceType);
    }

    update(deltaTime) {
        if (this.state === GameState.MENU) {
            if (wasKeyPressed('enter')) {
                this.startGame();
            }
            return;
        }

        if (this.state === GameState.GAME_OVER) {
            if (wasKeyPressed('enter')) {
                audio.playMusic('title');
                this.state = GameState.MENU;
            }
            return;
        }

        if (this.state === GameState.PAUSED) {
            if (wasKeyPressed('pause')) {
                this.state = GameState.PLAYING;
                audio.resumeMusic();
            }
            return;
        }

        if (this.state === GameState.LINE_CLEARING) {
            this.lineClearTimer -= deltaTime;
            if (this.lineClearTimer <= 0) {
                this.finishLineClear();
            }
            return;
        }

        // Playing state
        if (wasKeyPressed('pause')) {
            this.state = GameState.PAUSED;
            audio.play('pause');
            audio.pauseMusic();
            return;
        }

        // Handle input for active piece
        if (this.activePiece && this.activePiece.isActive) {
            if (isKeyDown('left')) {
                this.activePiece.applyHorizontalForce(-1);
            }
            if (isKeyDown('right')) {
                this.activePiece.applyHorizontalForce(1);
            }
            if (isKeyDown('rotateLeft')) {
                this.activePiece.applyRotation(-1);
            }
            if (isKeyDown('rotateRight')) {
                this.activePiece.applyRotation(1);
            }
            if (isKeyDown('down')) {
                this.activePiece.applySoftDrop();
            }
            if (wasKeyPressed('hardDrop')) {
                this.activePiece.applyHardDrop();
            }
        }

        // Play movement sounds (throttled to avoid spam)
        if (!this.lastMoveSound) this.lastMoveSound = 0;
        if (!this.lastTurnSound) this.lastTurnSound = 0;
        const now = Date.now();

        if ((isKeyDown('left') || isKeyDown('right')) && now - this.lastMoveSound > 100) {
            audio.play('move');
            this.lastMoveSound = now;
        }
        if ((isKeyDown('rotateLeft') || isKeyDown('rotateRight')) && now - this.lastTurnSound > 100) {
            audio.play('turn');
            this.lastTurnSound = now;
        }

        // Step physics
        stepWorld(deltaTime);

        // Check for collisions
        this.checkCollisions();

        // Check if active piece should settle
        this.checkPieceSettle(deltaTime);
    }

    checkCollisions() {
        const eventQueue = getEventQueue();
        const world = getWorld();

        if (!eventQueue || !world || !this.activePiece) return;

        eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            if (!started) return;

            const collider1 = world.getCollider(handle1);
            const collider2 = world.getCollider(handle2);

            if (!collider1 || !collider2) return;

            // Check if active piece is involved
            const activeColliders = this.activePiece.colliders;
            const isActiveInvolved = activeColliders.some(c =>
                c.handle === handle1 || c.handle === handle2
            );

            if (isActiveInvolved) {
                // Check if collided with floor or settled piece
                // Membership group is in upper 16 bits
                const membership1 = (collider1.collisionGroups() >> 16) & 0xFFFF;
                const membership2 = (collider2.collisionGroups() >> 16) & 0xFFFF;

                const collidedWithFloorOrSettled =
                    (membership1 & (FLOOR_GROUP | SETTLED_GROUP)) ||
                    (membership2 & (FLOOR_GROUP | SETTLED_GROUP));

                if (collidedWithFloorOrSettled) {
                    this.activePiece.hasCollided = true;
                }
            }
        });
    }

    checkPieceSettle(deltaTime) {
        if (!this.activePiece || !this.activePiece.isActive) return;

        const pos = this.activePiece.getPosition();

        // Force settle if piece has fallen through the floor somehow
        if (pos.y > C.CANVAS_HEIGHT + 100) {
            this.settlePiece();
            return;
        }

        // Check if piece has low velocity and has collided
        const velocity = this.activePiece.body.linvel();
        const angVel = this.activePiece.body.angvel();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

        const isNearlyStationary = speed < 50 && Math.abs(angVel) < 2;

        // Fallback: if piece is near the bottom and nearly stopped, consider it collided
        // This handles cases where collision events might not fire properly
        if (pos.y > C.CANVAS_HEIGHT - C.BLOCK_SIZE * 3 && isNearlyStationary) {
            this.activePiece.hasCollided = true;
        }

        if (this.activePiece.hasCollided && isNearlyStationary) {
            if (this.pieceSettleStartTime === 0) {
                this.pieceSettleStartTime = Date.now();
            } else if (Date.now() - this.pieceSettleStartTime > C.SETTLE_DELAY) {
                this.settlePiece();
            }
        } else {
            this.pieceSettleStartTime = 0;
        }
    }

    settlePiece() {
        if (!this.activePiece) return;

        console.log('Settling piece...');

        // Check for game over (piece above play area)
        const pos = this.activePiece.getPosition();
        console.log('Piece position:', pos.y, 'LOSE_Y:', C.LOSE_Y);
        if (pos.y < C.LOSE_Y) {
            this.state = GameState.GAME_OVER;
            audio.stopMusic();
            audio.play('gameover');
            return;
        }

        // Settle the piece
        this.activePiece.settle();
        audio.play('blockfall');
        this.settledPieces.push(this.activePiece);

        // Check for line clears
        try {
            this.linesToClear = checkLines(this.settledPieces);
            console.log('Lines to clear:', this.linesToClear.length);
        } catch (e) {
            console.error('Error checking lines:', e);
            this.linesToClear = [];
        }

        if (this.linesToClear.length > 0) {
            this.state = GameState.LINE_CLEARING;
            this.lineClearTimer = C.LINE_CLEAR_DELAY;
        } else {
            console.log('No lines to clear, spawning next piece');
            this.spawnNextPiece();
        }
    }

    finishLineClear() {
        // Calculate score before clearing
        const numLines = this.linesToClear.length;
        const lineScore = calculateScore(numLines, 1.0);
        this.score += lineScore;
        this.linesCleared += numLines;

        // Play line clear sound
        if (numLines >= 4) {
            audio.play('lineclear4');
        } else {
            audio.play('lineclear');
        }

        // Level up
        const newLevel = Math.floor(this.linesCleared / C.LINES_PER_LEVEL) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            const newGravity = C.GRAVITY + (this.level - 1) * C.GRAVITY_INCREMENT;
            setGravity(newGravity);
            audio.play('newlevel');
        }

        // Actually clear the lines
        this.settledPieces = clearLines(this.settledPieces, this.linesToClear);
        this.linesToClear = [];

        // Spawn next piece
        this.spawnNextPiece();
        this.state = GameState.PLAYING;
    }

    getState() {
        return this.state;
    }

    getScore() {
        return this.score;
    }

    getLevel() {
        return this.level;
    }

    getLinesCleared() {
        return this.linesCleared;
    }

    getActivePiece() {
        return this.activePiece;
    }

    getNextPieceType() {
        return this.nextPieceType;
    }

    getSettledPieces() {
        return this.settledPieces;
    }

    getLinesToClear() {
        return this.linesToClear;
    }
}
