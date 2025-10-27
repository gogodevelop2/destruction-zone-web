// Main Entry Point
// Destruction Zone Web Edition

// ========================================
// Debug Mode System (Matter.js v2)
// ========================================
window.debugMode = {
    physics: false,           // 'P' 키 - Matter.js 물리 디버그 렌더링
    velocityVectors: false,   // 'V' 키 - 속도 벡터 표시
    stats: false,             // 'I' 키 - 실시간 통계 표시
    comparison: false,        // 'C' 키 - 원본 vs Matter 비교
    tuning: false             // 'T' 키 - 파라미터 튜닝 모드
};

// 튜닝 파라미터 (실시간 조정 가능)
window.tuningParams = {
    BRAKE_STRENGTH: 12.0,
    ROTATION_BRAKE: 0.4,
    FORCE_SCALE: 0.00015,  // 0.00012 → 0.00015 (87.5% 증가)
    friction: 0.8,
    frictionAir: 0.12,
    density: 0.08
};

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

            // ========================================
            // Debug Mode Toggles (Matter.js v2)
            // ========================================
            case 'KeyP': // Toggle physics debug
                window.debugMode.physics = !window.debugMode.physics;
                if (this.engine && this.engine.renderer) {
                    this.engine.renderer.setDebugPhysics(window.debugMode.physics);
                }
                console.log(`🔧 Physics Debug: ${window.debugMode.physics ? 'ON' : 'OFF'}`);
                break;

            case 'KeyV': // Toggle velocity vectors
                window.debugMode.velocityVectors = !window.debugMode.velocityVectors;
                console.log(`🔧 Velocity Vectors: ${window.debugMode.velocityVectors ? 'ON' : 'OFF'}`);
                break;

            case 'KeyI': // Toggle stats (Info)
                window.debugMode.stats = !window.debugMode.stats;
                console.log(`🔧 Stats: ${window.debugMode.stats ? 'ON' : 'OFF'}`);
                break;

            case 'KeyC': // Toggle comparison mode
                window.debugMode.comparison = !window.debugMode.comparison;
                console.log(`🔧 Comparison Mode: ${window.debugMode.comparison ? 'ON' : 'OFF'}`);
                break;

            case 'KeyT': // Toggle tuning mode
                window.debugMode.tuning = !window.debugMode.tuning;
                if (window.debugMode.tuning) {
                    console.log('🔧 Tuning Mode ON');
                    console.log('  1/2: BRAKE_STRENGTH ±1');
                    console.log('  3/4: ROTATION_BRAKE ±0.05');
                    console.log('  5/6: FORCE_SCALE ±0.00001');
                    console.log('  7/8: frictionAir ±0.01');
                } else {
                    console.log('🔧 Tuning Mode OFF');
                }
                break;

            // ========================================
            // Tuning Mode Hotkeys (Matter.js v2)
            // ========================================
            case 'Digit1': // BRAKE_STRENGTH 증가
                if (window.debugMode.tuning) {
                    window.tuningParams.BRAKE_STRENGTH += 1;
                    this.updateTankParams();
                    console.log(`⬆️ BRAKE_STRENGTH: ${window.tuningParams.BRAKE_STRENGTH.toFixed(1)}`);
                }
                break;
            case 'Digit2': // BRAKE_STRENGTH 감소
                if (window.debugMode.tuning) {
                    window.tuningParams.BRAKE_STRENGTH = Math.max(1, window.tuningParams.BRAKE_STRENGTH - 1);
                    this.updateTankParams();
                    console.log(`⬇️ BRAKE_STRENGTH: ${window.tuningParams.BRAKE_STRENGTH.toFixed(1)}`);
                }
                break;
            case 'Digit3': // ROTATION_BRAKE 증가
                if (window.debugMode.tuning) {
                    window.tuningParams.ROTATION_BRAKE += 0.05;
                    this.updateTankParams();
                    console.log(`⬆️ ROTATION_BRAKE: ${window.tuningParams.ROTATION_BRAKE.toFixed(2)}`);
                }
                break;
            case 'Digit4': // ROTATION_BRAKE 감소
                if (window.debugMode.tuning) {
                    window.tuningParams.ROTATION_BRAKE = Math.max(0.1, window.tuningParams.ROTATION_BRAKE - 0.05);
                    this.updateTankParams();
                    console.log(`⬇️ ROTATION_BRAKE: ${window.tuningParams.ROTATION_BRAKE.toFixed(2)}`);
                }
                break;
            case 'Digit5': // FORCE_SCALE 증가
                if (window.debugMode.tuning) {
                    window.tuningParams.FORCE_SCALE += 0.00001;
                    this.updateTankParams();
                    console.log(`⬆️ FORCE_SCALE: ${window.tuningParams.FORCE_SCALE.toFixed(5)}`);
                }
                break;
            case 'Digit6': // FORCE_SCALE 감소
                if (window.debugMode.tuning) {
                    window.tuningParams.FORCE_SCALE = Math.max(0.00001, window.tuningParams.FORCE_SCALE - 0.00001);
                    this.updateTankParams();
                    console.log(`⬇️ FORCE_SCALE: ${window.tuningParams.FORCE_SCALE.toFixed(5)}`);
                }
                break;
            case 'Digit7': // frictionAir 증가
                if (window.debugMode.tuning) {
                    window.tuningParams.frictionAir += 0.01;
                    this.updateTankParams();
                    console.log(`⬆️ frictionAir: ${window.tuningParams.frictionAir.toFixed(2)}`);
                }
                break;
            case 'Digit8': // frictionAir 감소
                if (window.debugMode.tuning) {
                    window.tuningParams.frictionAir = Math.max(0.01, window.tuningParams.frictionAir - 0.01);
                    this.updateTankParams();
                    console.log(`⬇️ frictionAir: ${window.tuningParams.frictionAir.toFixed(2)}`);
                }
                break;
        }
    }

    updateTankParams() {
        // Tank 클래스의 static 속성 업데이트
        if (typeof Tank !== 'undefined') {
            Tank.BRAKE_STRENGTH = window.tuningParams.BRAKE_STRENGTH;
            Tank.ROTATION_BRAKE = window.tuningParams.ROTATION_BRAKE;
            Tank.FORCE_SCALE = window.tuningParams.FORCE_SCALE;

            console.log('✅ Tank static params updated:', {
                BRAKE_STRENGTH: Tank.BRAKE_STRENGTH,
                ROTATION_BRAKE: Tank.ROTATION_BRAKE,
                FORCE_SCALE: Tank.FORCE_SCALE
            });
        } else {
            console.warn('⚠️ Tank class not found');
        }

        // 현재 탱크들의 물리 바디 업데이트
        if (this.engine && this.engine.tanks) {
            this.engine.tanks.forEach(tank => {
                if (tank.body) {
                    tank.body.frictionAir = window.tuningParams.frictionAir;
                    tank.body.friction = window.tuningParams.friction;
                    console.log(`✅ Tank ${tank.id} body updated: frictionAir=${tank.body.frictionAir}`);
                }
            });
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