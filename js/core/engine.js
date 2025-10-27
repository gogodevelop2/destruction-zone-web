// Game Engine Core
// Main game engine that orchestrates all systems

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Core systems
        this.state = new GameState();
        this.renderer = new Renderer(this.ctx);
        this.physics = new Physics();
        this.input = new InputManager();
        
        // Game systems
        this.collisionSystem = new CollisionSystem();
        this.scoringSystem = new ScoringSystem();
        this.shopSystem = new ShopSystem(this.state);
        
        // Game entities
        this.tanks = [];
        this.projectiles = [];
        this.explosions = [];
        
        // Game timing
        this.gameTime = 0;
        this.round = 1;
        this.isPaused = false;
        
        console.log('🎮 GameEngine initialized');
    }
    
    startNewGame() {
        console.log('🚀 Starting new game...');

        // Reset game state
        this.gameTime = 0;
        this.round = 1;
        this.isPaused = false;

        // Clear entities
        this.tanks = [];
        this.projectiles = [];
        this.explosions = [];

        // Create initial tanks
        this.createInitialTanks();

        // Initialize game state
        this.state.init();

        // Add player to game state
        this.state.addPlayer({
            id: 'player1',
            name: 'Player 1',
            isHuman: true,
            score: 0,
            money: 1000
        });

        console.log('✅ New game started');
    }
    
    createInitialTanks() {
        const margin = 80; // Distance from edges
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        console.log(`📐 Canvas dimensions: ${canvasWidth}x${canvasHeight}`);

        // Get player data from game state
        const playerData = this.state.getPlayer('player1');

        // Create player tank (bottom-left corner)
        const playerTank = new Tank({
            id: 'player1',
            x: margin,
            y: canvasHeight - margin,
            angle: Math.PI / 4, // 45 degrees, facing toward center
            type: playerData ? playerData.tankType : 'STANDARD',
            isPlayer: true,
            controls: GAME_CONFIG.CONTROLS.PLAYER1,
            upgrades: playerData ? playerData.upgrades : undefined,
            ownedWeapons: playerData ? playerData.ownedWeapons : undefined
        });

        // Create AI tank (top-right corner)
        const aiTank = new Tank({
            id: 'ai1',
            x: canvasWidth - margin,
            y: margin,
            angle: Math.PI + Math.PI / 4, // 225 degrees, facing toward center
            type: 'STANDARD',
            isPlayer: false,
            aiLevel: 1
        });

        this.tanks.push(playerTank, aiTank);

        console.log(`🤖 Created ${this.tanks.length} tanks at diagonal positions:`,
                   `Player: (${playerTank.x}, ${playerTank.y})`,
                   `AI: (${aiTank.x}, ${aiTank.y})`);
    }
    
    update(deltaTime) {
        if (this.isPaused) return;
        
        this.gameTime += deltaTime;
        
        // Update tanks
        this.tanks.forEach(tank => {
            if (tank.isAlive) {
                if (tank.isPlayer) {
                    this.updatePlayerTank(tank, deltaTime);
                } else {
                    this.updateAITank(tank, deltaTime);
                }
                tank.update(deltaTime);
            }
        });
        
        // Update projectiles
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
        });
        
        // Update explosions
        this.explosions.forEach(explosion => {
            explosion.update(deltaTime);
        });
        
        // Remove expired entities
        this.cleanupEntities();
        
        // Update physics
        this.physics.update(deltaTime);
        
        // Handle collisions
        this.handleCollisions();
        
        // Update game state
        this.state.update(deltaTime);
        
        // Check if round should end due to GameState
        if (this.state.shouldEndRound) {
            const { reason, winner } = this.state.shouldEndRound;
            if (reason === 'timeout') {
                // Find health leader for timeout
                const healthLeader = this.getHealthLeader();
                this.endRound(healthLeader);
            } else {
                this.endRound(winner);
            }
            return; // Don't continue updating if round is over
        }
        
        // Check win conditions
        this.checkWinConditions();
        
        // Update input (MUST be at the end)
        this.input.update();
    }
    
    updatePlayerTank(tank, deltaTime) {
        const input = this.input;
        const controls = tank.controls;
        
        let hasInput = false;
        
        // Movement
        if (input.isKeyPressed(controls.FORWARD)) {
            tank.thrust(1);
            hasInput = true;
        }
        if (input.isKeyPressed(controls.BACKWARD)) {
            tank.thrust(-1);
            hasInput = true;
        }
        if (input.isKeyPressed(controls.TURN_LEFT)) {
            tank.rotate(-1);
            hasInput = true;
        }
        if (input.isKeyPressed(controls.TURN_RIGHT)) {
            tank.rotate(1);
            hasInput = true;
        }
        
        // Weapons - Debug version
        const firePressed = input.isKeyJustPressed(controls.FIRE);
        const changePressed = input.isKeyJustPressed(controls.CHANGE_WEAPON);
        const port2Pressed = input.isKeyJustPressed('KeyS'); // S key for Port 2
        
        if (changePressed) {
            tank.nextWeapon();
            console.log(`🔧 ${tank.id} changed weapon`);
        }
        if (port2Pressed) {
            if (tank.currentWeaponPort === 2) {
                tank.switchPort(1); // Switch back to Port 1
            } else {
                tank.switchPort(2); // Switch to Port 2
            }
        }
        if (firePressed) {
            console.log(`🔥 Fire key just pressed for ${tank.id}`);
            this.fireWeapon(tank);
        }
        
        // Debug removed
        
        // Debug input
        if (hasInput && GAME_CONFIG.DEBUG_MODE && Math.random() < 0.1) {
            console.log(`⌨️ Input detected for ${tank.id} at (${tank.x}, ${tank.y})`);
        }
    }
    
    updateAITank(tank, deltaTime) {
        // Basic AI behavior for testing combat system
        if (!tank.isAlive) return;
        
        const player = this.getPlayerTank();
        if (!player || !player.isAlive) return;
        
        // Calculate distance to player
        const dx = player.x - tank.x;
        const dy = player.y - tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle to player
        const angleToPlayer = Math.atan2(dy, dx);
        const angleDiff = angleToPlayer - tank.angle;
        
        // Normalize angle difference
        let normalizedAngleDiff = angleDiff;
        while (normalizedAngleDiff > Math.PI) normalizedAngleDiff -= 2 * Math.PI;
        while (normalizedAngleDiff < -Math.PI) normalizedAngleDiff += 2 * Math.PI;
        
        // Rotate towards player
        if (Math.abs(normalizedAngleDiff) > 0.1) {
            const rotationDirection = normalizedAngleDiff > 0 ? 1 : -1;
            tank.rotate(rotationDirection * 0.5); // Slower rotation than player
        }
        
        // Fire at player when roughly aimed
        if (Math.abs(normalizedAngleDiff) < 0.3 && distance < 400) {
            const timeSinceLastFire = this.gameTime - tank.lastFireTime;
            if (timeSinceLastFire > tank.fireDelay && tank.canFire()) {
                this.fireWeapon(tank);
                tank.lastFireTime = this.gameTime;
            }
        }
        
        // Move towards player if far away, away if too close
        if (distance > 200) {
            tank.thrust(0.3); // Move towards player
        } else if (distance < 100) {
            tank.thrust(-0.3); // Back away from player
        }
        
        // Debug AI behavior occasionally
        if (GAME_CONFIG.DEBUG_MODE && Math.random() < 0.01) {
            console.log(`🤖 AI ${tank.id}: distance=${distance.toFixed(1)}, angle_diff=${normalizedAngleDiff.toFixed(2)}`);
        }
    }
    
    fireWeapon(tank) {
        console.log(`🎯 ${tank.id} attempting to fire weapon`);
        
        const weapon = tank.getCurrentWeapon();
        if (!weapon) {
            console.log(`❌ ${tank.id} has no weapon equipped`);
            return;
        }
        
        if (!tank.canFire()) {
            console.log(`❌ ${tank.id} cannot fire weapon`);
            return;
        }
        
        const projectile = Weapon.fire(weapon, tank);
        if (projectile) {
            // Handle both single projectiles and arrays of projectiles
            if (Array.isArray(projectile)) {
                // Multiple projectiles (e.g., double/triple missile)
                this.projectiles.push(...projectile);
                console.log(`🔫 ${tank.id} fired ${weapon.type} (${projectile.length} projectiles) - total: ${this.projectiles.length}`);
            } else {
                // Single projectile
                this.projectiles.push(projectile);
                console.log(`🔫 ${tank.id} fired ${weapon.type} - projectiles: ${this.projectiles.length}`);
            }
            
            tank.consumeAmmo();
            tank.consumeEnergy(tank.getWeaponEnergyCost(weapon.type));
        } else {
            console.log(`❌ Failed to create projectile for ${tank.id}`);
        }
    }
    
    handleCollisions() {
        // Tank vs Tank collisions
        for (let i = 0; i < this.tanks.length; i++) {
            for (let j = i + 1; j < this.tanks.length; j++) {
                if (this.collisionSystem.checkTankCollision(this.tanks[i], this.tanks[j])) {
                    this.collisionSystem.resolveTankCollision(this.tanks[i], this.tanks[j]);
                }
            }
        }
        
        // Projectile vs Tank collisions
        this.projectiles.forEach(projectile => {
            this.tanks.forEach(tank => {
                if (tank.isAlive && projectile.ownerId !== tank.id) {
                    if (this.collisionSystem.checkProjectileCollision(projectile, tank)) {
                        this.handleProjectileHit(projectile, tank);
                    }
                }
            });
        });
        
        // Boundary collisions
        this.tanks.forEach(tank => {
            this.collisionSystem.checkBoundaryCollision(tank, this.canvas.width, this.canvas.height);
        });
        
        this.projectiles.forEach(projectile => {
            if (this.collisionSystem.checkProjectileBoundary(projectile, this.canvas.width, this.canvas.height)) {
                projectile.destroy();
            }
        });
    }
    
    handleProjectileHit(projectile, tank) {
        // Create explosion
        const explosion = new Explosion({
            x: projectile.x,
            y: projectile.y,
            damage: projectile.damage,
            radius: projectile.explosionRadius || 20
        });
        this.explosions.push(explosion);
        
        // Damage tank
        tank.takeDamage(projectile.damage);
        
        // Award points to shooter
        const shooter = this.tanks.find(t => t.id === projectile.ownerId);
        if (shooter) {
            this.scoringSystem.awardHitPoints(shooter, projectile.damage);
            if (!tank.isAlive) {
                this.scoringSystem.awardKillPoints(shooter);
            }
        }
        
        // Destroy projectile
        projectile.destroy();
        
        console.log(`💥 Projectile hit! Damage: ${projectile.damage}`);
    }
    
    cleanupEntities() {
        // Remove destroyed projectiles
        this.projectiles = this.projectiles.filter(p => !p.isDestroyed);
        
        // Remove finished explosions
        this.explosions = this.explosions.filter(e => !e.isFinished);
        
        // Remove dead tanks (but keep for scoring)
        // this.tanks = this.tanks.filter(t => t.isAlive);
    }
    
    checkWinConditions() {
        const aliveTanks = this.tanks.filter(t => t.isAlive);
        
        if (aliveTanks.length <= 1) {
            // Round over
            this.endRound(aliveTanks[0] || null);
        }
    }
    
    endRound(winner) {
        console.log(`🏆 Round ${this.round} ended. Winner:`, winner?.id || 'Draw');

        // Let GameState handle round ending logic
        const reason = winner ? 'kill' : 'timeout';
        const nextPhase = this.state.endRound(reason, winner);

        // Handle next phase
        if (nextPhase === 'shop') {
            console.log('🛒 Going to shop...');
            this.openShop();
        } else if (nextPhase === 'game-over') {
            console.log('🏁 Game Over!');
            // TODO: Show game over screen
        } else {
            // Start next round
            this.resetRound();
        }
    }

    openShop() {
        // Pause game
        this.isPaused = true;

        // Open shop for player
        const playerTank = this.getPlayerTank();
        if (playerTank) {
            this.shopSystem.open(playerTank.id);
        }
    }

    continueFromShop() {
        // Resume game and start next round
        this.isPaused = false;

        // Reset round for next battle
        this.resetRound();

        console.log('▶️ Continuing from shop, starting round ' + this.state.round);
    }
    
    getHealthLeader() {
        let leader = null;
        let maxHealth = -1;
        
        this.tanks.forEach(tank => {
            if (tank.isAlive && tank.shield > maxHealth) {
                maxHealth = tank.shield;
                leader = {
                    id: tank.id,
                    name: tank.isPlayer ? 'Player' : 'AI',
                    health: tank.shield
                };
            }
        });
        
        return leader;
    }
    
    resetRound() {
        console.log('🔄 Resetting round...');

        // Recreate tanks to apply any changes from shop (upgrades, tank type, weapons)
        this.tanks = [];
        this.createInitialTanks();

        // Clear projectiles and explosions
        this.projectiles = [];
        this.explosions = [];

        console.log(`🏁 Round ${this.state.round} ready!`);
    }
    
    render() {
        // Clear canvas
        this.renderer.clear();

        // Render background
        this.renderer.renderBackground();

        // Render entities
        this.tanks.forEach(tank => {
            if (tank.isAlive) {
                this.renderer.renderTank(tank);
            }
        });

        this.projectiles.forEach(projectile => {
            this.renderer.renderProjectile(projectile);
        });

        // Debug projectile count
        if (GAME_CONFIG.DEBUG_MODE && this.projectiles.length > 0 && Math.random() < 0.01) {
            console.log(`🎯 Rendering ${this.projectiles.length} projectiles`);
        }

        this.explosions.forEach(explosion => {
            this.renderer.renderExplosion(explosion);
        });

        // Render UI overlay
        this.renderer.renderUI(this.state);

        // Update HUD
        this.updateHUD();
    }
    
    handleKeyDown(e) {
        this.input.setKeyDown(e.code);
    }
    
    handleKeyUp(e) {
        this.input.setKeyUp(e.code);
    }
    
    pause() {
        this.isPaused = true;
        console.log('⏸️ Game paused');
    }
    
    resume() {
        this.isPaused = false;
        console.log('▶️ Game resumed');
    }
    
    // Getters for external access
    getPlayerTank() {
        return this.tanks.find(t => t.isPlayer);
    }
    
    getAllTanks() {
        return this.tanks;
    }
    
    getGameTime() {
        return this.gameTime;
    }
    
    getRound() {
        return this.round;
    }
    
    updateHUD() {
        const playerTank = this.getPlayerTank();
        if (!playerTank) return;
        
        // Update player stats
        const playerNameEl = document.getElementById('player-name');
        const playerScoreEl = document.getElementById('player-score');
        const playerMoneyEl = document.getElementById('player-money');
        
        if (playerNameEl) playerNameEl.textContent = playerTank.id;
        if (playerScoreEl) {
            const player = this.state.getPlayer(playerTank.id);
            playerScoreEl.textContent = `Score: ${player?.score || 0}`;
        }
        if (playerMoneyEl) {
            const player = this.state.getPlayer(playerTank.id);
            playerMoneyEl.textContent = `Money: ${player?.money || 0}`;
        }
        
        // Update tank stats
        const shieldFillEl = document.querySelector('.shield-fill');
        const energyFillEl = document.querySelector('.energy-fill');
        
        if (shieldFillEl) {
            const shieldPercent = (playerTank.shield / playerTank.maxShield) * 100;
            shieldFillEl.style.width = `${shieldPercent}%`;
        }
        
        if (energyFillEl) {
            const energyPercent = (playerTank.weaponEnergy / playerTank.maxWeaponEnergy) * 100;
            energyFillEl.style.width = `${energyPercent}%`;
        }
        
        // Update weapon display
        const currentWeaponEl = document.getElementById('current-weapon');
        const weaponAmmoEl = document.getElementById('weapon-ammo');
        
        const weapon = playerTank.getCurrentWeapon();
        if (currentWeaponEl) {
            currentWeaponEl.textContent = weapon?.type || 'NONE';
        }
        if (weaponAmmoEl) {
            if (weapon) {
                weaponAmmoEl.textContent = weapon.ammo === Infinity ? '∞' : weapon.ammo;
            } else {
                weaponAmmoEl.textContent = '0';
            }
        }
    }
}