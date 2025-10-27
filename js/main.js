// Main Entry Point
// Destruction Zone Web Edition

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.engine = null;
        this.currentScreen = 'loading';
        this.isRunning = false;
        
        this.init();
    }
    
    async init() {
        console.log('🎮 Initializing Destruction Zone...');
        
        // Show loading screen
        this.showScreen('loading');
        
        // Simulate loading time for effect
        await this.simulateLoading();
        
        // Initialize canvas
        this.setupCanvas();
        
        // Initialize game engine
        this.engine = new GameEngine(this.canvas);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show main menu
        this.showScreen('main-menu');
        
        console.log('✅ Game initialized successfully!');
    }
    
    async simulateLoading() {
        const progressBar = document.querySelector('.loading-progress');
        
        for (let i = 0; i <= 100; i += 2) {
            progressBar.style.width = i + '%';
            await new Promise(resolve => setTimeout(resolve, 30));
        }
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to match config
        this.canvas.width = GAME_CONFIG.CANVAS.WIDTH;   // 960px
        this.canvas.height = GAME_CONFIG.CANVAS.HEIGHT; // 720px
        
        // Ensure canvas is displayed at proper size
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
        
        console.log(`📺 Canvas initialized: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    setupEventListeners() {
        // Menu button handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-btn')) {
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
            }
        });
        
        // Keyboard handlers
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    handleMenuAction(action) {
        console.log(`🎯 Menu action: ${action}`);
        
        switch (action) {
            case 'new-game':
                this.startNewGame();
                break;
            case 'load-game':
                this.loadGame();
                break;
            case 'options':
                this.showOptions();
                break;
            case 'about':
                this.showAbout();
                break;
        }
    }
    
    startNewGame() {
        console.log('🚀 Starting new game...');
        
        // TODO: Show player setup screen first
        // For now, jump straight to game
        this.showScreen('game-screen');
        
        if (this.engine) {
            this.engine.startNewGame();
            this.startGameLoop();
        }
    }
    
    loadGame() {
        console.log('💾 Load game not implemented yet');
        // TODO: Implement save/load system
    }
    
    showOptions() {
        console.log('⚙️ Options not implemented yet');
        // TODO: Implement options menu
    }
    
    showAbout() {
        console.log('ℹ️ About: Destruction Zone Web Edition');
        // TODO: Show about dialog
    }
    
    startGameLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (!this.isRunning) return;

            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            // Update game (skip update if paused, but keep rendering)
            if (this.engine && this.currentScreen === 'game-screen') {
                this.engine.update(deltaTime);
                this.engine.render();
            }

            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
        console.log('🔄 Game loop started');
    }
    
    stopGameLoop() {
        this.isRunning = false;
        console.log('⏸️ Game loop stopped');
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            console.log(`📱 Switched to screen: ${screenId}`);
        }
    }
    
    handleKeyDown(e) {
        // Debug key presses
        if (GAME_CONFIG.DEBUG_MODE) {
            console.log(`🔤 Key pressed: ${e.code}`);
        }
        
        if (this.engine) {
            this.engine.handleKeyDown(e);
        }
        
        // Global hotkeys
        switch (e.code) {
            case 'Escape':
                if (this.currentScreen === 'game-screen') {
                    this.pauseGame();
                }
                break;
            case 'F11':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'KeyT': // Test key
                if (GAME_CONFIG.DEBUG_MODE) {
                    this.testTankPositions();
                }
                break;
            case 'KeyP': // Toggle physics debug
                if (GAME_CONFIG.DEBUG_MODE && this.engine) {
                    this.engine.renderer.setDebugPhysics(!this.engine.renderer.debugPhysics);
                }
                break;
        }
    }
    
    testTankPositions() {
        if (this.engine && this.engine.tanks) {
            console.log('🧪 Tank Test:');
            this.engine.tanks.forEach(tank => {
                console.log(`  ${tank.id}: (${tank.x}, ${tank.y}) alive: ${tank.isAlive}`);
            });
            console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height}`);
        }
    }
    
    handleKeyUp(e) {
        if (this.engine) {
            this.engine.handleKeyUp(e);
        }
    }
    
    pauseGame() {
        // TODO: Implement pause menu
        console.log('⏸️ Game paused');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    handleResize() {
        // TODO: Handle responsive canvas resize
        console.log('📐 Window resized');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Destruction Zone Web Edition');
    console.log('💻 Based on the classic 1992 DOS game by Julian Cochran');
    
    window.game = new Game();
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('❌ Game Error:', e.error);
});

// Prevent default browser shortcuts that might interfere
document.addEventListener('keydown', (e) => {
    // Prevent F5 refresh, Ctrl+R, etc. during gameplay
    if (window.game && window.game.currentScreen === 'game-screen') {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
        }
    }
});