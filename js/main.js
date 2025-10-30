// ============================================
// Main Entry Point
// ============================================

import Game from './core/Game.js';
import { PHYSICS } from './config/constants.js';
import { GAME_MODE } from './config/gameModes.js';

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

    // Select game mode (TODO: Add UI for mode selection in lobby screen)
    // For now, can be changed here manually
    const selectedMode = GAME_MODE.FREE_FOR_ALL;  // or GAME_MODE.TEAM_BATTLE

    // Create and initialize game with selected mode
    const game = new Game(selectedMode);
    await game.init(canvas);

    // Game loop with Fixed Timestep Accumulator
    let lastTime = performance.now();
    let accumulator = 0;
    const maxFrameTime = 0.25; // Prevent spiral of death

    function gameLoop(currentTime) {
        // Calculate actual elapsed time
        let deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Clamp deltaTime to prevent spiral of death
        if (deltaTime > maxFrameTime) {
            deltaTime = maxFrameTime;
        }

        // Accumulate time
        accumulator += deltaTime;

        // Update physics in fixed timesteps
        while (accumulator >= PHYSICS.FIXED_TIMESTEP) {
            game.update(PHYSICS.FIXED_TIMESTEP);
            accumulator -= PHYSICS.FIXED_TIMESTEP;
        }

        // Render (always render once per frame, regardless of update count)
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
