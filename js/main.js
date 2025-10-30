// ============================================
// Main Entry Point
// ============================================

import Game from './core/Game.js';
import { PHYSICS } from './config/constants.js';

/**
 * Initialize and start the game
 */
async function main() {
    console.log('🚀 Starting Destruction Zone...');

    // Get canvas element
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Create and initialize game
    const game = new Game();
    await game.init(canvas);

    // Game loop
    let lastTime = performance.now();

    function gameLoop(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Update with fixed timestep
        game.update(PHYSICS.FIXED_TIMESTEP);

        // Render
        game.render();

        requestAnimationFrame(gameLoop);
    }

    // Start game loop
    gameLoop(performance.now());

    console.log('✅ Game started!');
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
