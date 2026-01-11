import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { initInput, cleanupInput, clearPressedKeys } from './input.js';
import { audio } from './audio.js';

let game = null;
let renderer = null;
let lastTime = 0;
let running = true;

async function init() {
    // Get canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }

    // Initialize renderer
    renderer = new Renderer(canvas);

    // Initialize input
    initInput();

    // Create game instance
    game = new Game();

    // Draw loading screen
    renderer.render(game);

    // Load Rapier with retry
    let RAPIER = null;
    const urls = [
        'https://cdn.skypack.dev/@dimforge/rapier2d-compat',
        'https://esm.sh/@dimforge/rapier2d-compat',
        'https://unpkg.com/@dimforge/rapier2d-compat/rapier.es.js'
    ];

    for (const url of urls) {
        try {
            console.log(`Loading Rapier from ${url}...`);
            RAPIER = await import(url);
            console.log('Rapier loaded successfully!');
            break;
        } catch (error) {
            console.warn(`Failed to load from ${url}:`, error.message);
        }
    }

    if (!RAPIER) {
        console.error('Failed to load Rapier from all sources');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f00';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Failed to load physics engine.', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Please check your internet connection.', canvas.width / 2, canvas.height / 2 + 20);
        return;
    }

    try {
        await game.init(RAPIER);
    } catch (error) {
        console.error('Failed to initialize game:', error);
        return;
    }

    // Initialize audio
    await audio.init();
    audio.playMusic('title');

    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!running) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Cap delta time to prevent huge jumps
    const cappedDelta = Math.min(deltaTime, 50);

    // Update game
    game.update(cappedDelta);

    // Clear single-frame key presses
    clearPressedKeys();

    // Render
    renderer.render(game);

    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        running = false;
    } else {
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    cleanupInput();
});

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
