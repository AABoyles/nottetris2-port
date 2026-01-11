// Game constants
export const BLOCK_SIZE = 25;
export const BOARD_WIDTH = 10;  // in blocks
export const BOARD_HEIGHT = 20; // in blocks
export const CANVAS_WIDTH = BLOCK_SIZE * BOARD_WIDTH;  // 250px
export const CANVAS_HEIGHT = BLOCK_SIZE * BOARD_HEIGHT; // 500px

// Physics constants
export const GRAVITY = 100;  // Reduced to prevent tunneling
export const GRAVITY_INCREMENT = 8;
export const HORIZONTAL_FORCE = 8000;
export const ROTATION_TORQUE = 800;  // Increased for noticeable rotation
export const MAX_ANGULAR_VELOCITY = 10;
export const SOFT_DROP_FORCE = 500;
export const HARD_DROP_IMPULSE = 30;
export const LINEAR_DAMPING = 0.3;
export const ANGULAR_DAMPING = 0.2;  // Reduced so rotation persists
export const RESTITUTION = 0.05;
export const FRICTION = 0.9;

// Game mechanics
export const LINE_CLEAR_THRESHOLD = 0.80;
export const LINES_PER_LEVEL = 10;
export const SPAWN_Y = -BLOCK_SIZE * 2;
export const SPAWN_X = CANVAS_WIDTH / 2;
export const LOSE_Y = BLOCK_SIZE * 2; // If piece center settles above this, game over

// Timing
export const SETTLE_DELAY = 300; // ms before piece is considered settled
export const LINE_CLEAR_DELAY = 500; // ms for line clear animation

// Tetromino colors
export const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
};

// Tetromino shapes - each block is relative to center (0,0)
// Coordinates are in block units, will be multiplied by BLOCK_SIZE
export const SHAPES = {
    I: [
        { x: -1.5, y: -0.5, w: 1, h: 1 },
        { x: -0.5, y: -0.5, w: 1, h: 1 },
        { x: 0.5, y: -0.5, w: 1, h: 1 },
        { x: 1.5, y: -0.5, w: 1, h: 1 }
    ],
    O: [
        { x: -0.5, y: -0.5, w: 1, h: 1 },
        { x: 0.5, y: -0.5, w: 1, h: 1 },
        { x: -0.5, y: 0.5, w: 1, h: 1 },
        { x: 0.5, y: 0.5, w: 1, h: 1 }
    ],
    T: [
        { x: -1, y: 0, w: 1, h: 1 },
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
        { x: 0, y: -1, w: 1, h: 1 }
    ],
    S: [
        { x: 0, y: -0.5, w: 1, h: 1 },
        { x: 1, y: -0.5, w: 1, h: 1 },
        { x: -1, y: 0.5, w: 1, h: 1 },
        { x: 0, y: 0.5, w: 1, h: 1 }
    ],
    Z: [
        { x: -1, y: -0.5, w: 1, h: 1 },
        { x: 0, y: -0.5, w: 1, h: 1 },
        { x: 0, y: 0.5, w: 1, h: 1 },
        { x: 1, y: 0.5, w: 1, h: 1 }
    ],
    J: [
        { x: -1, y: -0.5, w: 1, h: 1 },
        { x: -1, y: 0.5, w: 1, h: 1 },
        { x: 0, y: 0.5, w: 1, h: 1 },
        { x: 1, y: 0.5, w: 1, h: 1 }
    ],
    L: [
        { x: 1, y: -0.5, w: 1, h: 1 },
        { x: -1, y: 0.5, w: 1, h: 1 },
        { x: 0, y: 0.5, w: 1, h: 1 },
        { x: 1, y: 0.5, w: 1, h: 1 }
    ]
};

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
