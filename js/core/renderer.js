// Renderer System
// Handles all drawing operations

class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;

        // Background pattern cache
        this.backgroundPattern = null;
        this.generateBackground();

        // Debug mode settings
        this.debugPhysics = false; // Set to true to visualize Matter.js bodies

        console.log('🎨 Renderer initialized');
    }

    setDebugPhysics(enabled) {
        this.debugPhysics = enabled;
        console.log(`🔍 Physics debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    clear() {
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    generateBackground() {
        // Create starfield background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Dark space background
        tempCtx.fillStyle = '#000011';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Add stars
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * tempCanvas.width;
            const y = Math.random() * tempCanvas.height;
            const brightness = Math.random();
            const size = Math.random() * 2;
            
            tempCtx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
            tempCtx.fillRect(x, y, size, size);
        }
        
        // Add grid lines (space station floor)
        tempCtx.strokeStyle = 'rgba(0, 100, 150, 0.2)';
        tempCtx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < tempCanvas.width; x += gridSize) {
            tempCtx.beginPath();
            tempCtx.moveTo(x, 0);
            tempCtx.lineTo(x, tempCanvas.height);
            tempCtx.stroke();
        }
        
        for (let y = 0; y < tempCanvas.height; y += gridSize) {
            tempCtx.beginPath();
            tempCtx.moveTo(0, y);
            tempCtx.lineTo(tempCanvas.width, y);
            tempCtx.stroke();
        }
        
        this.backgroundPattern = tempCanvas;
    }
    
    renderBackground() {
        if (this.backgroundPattern) {
            this.ctx.drawImage(this.backgroundPattern, 0, 0);
        }
    }
    
    renderTank(tank) {
        this.ctx.save();
        
        // Debug log tank position
        if (GAME_CONFIG.DEBUG_MODE && Math.random() < 0.01) { // Only log occasionally
            console.log(`🚗 Rendering tank ${tank.id} at (${tank.x}, ${tank.y}) angle: ${tank.angle}`);
        }
        
        // Move to tank position
        this.ctx.translate(tank.x, tank.y);
        this.ctx.rotate(tank.angle);
        
        // Tank glow effect
        const glowIntensity = tank.shield / tank.maxShield;
        if (glowIntensity > 0) {
            this.ctx.shadowColor = tank.color;
            this.ctx.shadowBlur = 10 + glowIntensity * 20;
        }
        
        // Draw tank body (triangle) - scaled up
        const size = tank.stats.size * 0.8; // Use 80% of tank size for visual
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.75, 0);      // Front point
        this.ctx.lineTo(-size * 0.5, -size * 0.4); // Back left
        this.ctx.lineTo(-size * 0.5, size * 0.4);  // Back right
        this.ctx.closePath();
        
        // Fill tank
        this.ctx.fillStyle = tank.color;
        this.ctx.fill();
        
        // Tank outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw tank details (cylinders representation)
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = tank.color;
        this.ctx.globalAlpha = 0.7;
        
        // Three cylinder indicators - scaled
        const cylinderSize = size * 0.15;
        const cylinderSpacing = size * 0.25;
        this.ctx.fillRect(-size * 0.4, -cylinderSpacing, cylinderSize, cylinderSize);
        this.ctx.fillRect(-size * 0.4, 0, cylinderSize, cylinderSize);
        this.ctx.fillRect(-size * 0.4, cylinderSpacing, cylinderSize, cylinderSize);
        
        this.ctx.globalAlpha = 1;
        
        // Weapon indicator - scaled
        this.ctx.strokeStyle = tank.isPlayer ? '#00ffff' : '#ff4444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.6, 0);
        this.ctx.lineTo(size * 0.9, 0);
        this.ctx.stroke();
        
        // Shield indicator
        if (tank.shield < tank.maxShield * 0.3) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        
        // Tank name/ID
        this.ctx.fillStyle = tank.isPlayer ? '#00ffff' : '#ff4444';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tank.id, tank.x, tank.y - size * 1.5);
    }
    
    renderProjectile(projectile) {
        this.ctx.save();
        
        this.ctx.translate(projectile.x, projectile.y);
        
        // Different rendering based on projectile type
        switch (projectile.type) {
            case 'MISSILE':
                this.renderMissile(projectile);
                break;
            case 'LASER':
                this.renderLaser(projectile);
                break;
            case 'BLASTER':
                this.renderBlaster(projectile);
                break;
            default:
                this.renderGenericProjectile(projectile);
        }
        
        this.ctx.restore();
    }
    
    renderMissile(projectile) {
        const angle = Physics.angle(projectile.velocity);
        this.ctx.rotate(angle);
        
        // Missile body - make it bigger and more visible
        this.ctx.fillStyle = projectile.color || '#ffff00';
        this.ctx.fillRect(-6, -2, 12, 4);
        
        // Missile outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-6, -2, 12, 4);
        
        // Missile trail
        this.ctx.strokeStyle = projectile.color || '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 0);
        this.ctx.lineTo(-6, 0);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
    
    renderLaser(projectile) {
        // Laser beam
        this.ctx.strokeStyle = projectile.color || '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = projectile.color || '#ff0000';
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    renderBlaster(projectile) {
        // Blaster warhead
        this.ctx.fillStyle = projectile.color || '#00ff00';
        this.ctx.shadowColor = projectile.color || '#00ff00';
        this.ctx.shadowBlur = 8;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderGenericProjectile(projectile) {
        this.ctx.fillStyle = projectile.color || '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, projectile.radius || 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderExplosion(explosion) {
        this.ctx.save();
        
        this.ctx.translate(explosion.x, explosion.y);
        
        const progress = explosion.getProgress();
        const radius = explosion.maxRadius * progress;
        const alpha = 1 - progress;
        
        // Explosion ring
        this.ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#ff6400';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Inner flash
        if (progress < 0.3) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 2})`;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderUI(gameState) {
        // Render round info and timer
        this.renderRoundInfo(gameState);

        // Render debug info if enabled
        if (GAME_CONFIG.DEBUG_MODE) {
            this.renderDebugInfo(gameState);
        }
    }

    renderPhysicsDebug(physics) {
        if (!this.debugPhysics || !physics || !physics.engine) return;

        this.ctx.save();

        // Render all Matter.js bodies
        const bodies = Matter.Composite.allBodies(physics.world);

        bodies.forEach(body => {
            // Skip static bodies (boundaries)
            if (body.isStatic) {
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.lineWidth = 1;
            } else {
                this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                this.ctx.lineWidth = 2;
            }

            // Draw body vertices
            const vertices = body.vertices;
            if (vertices && vertices.length > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(vertices[0].x, vertices[0].y);

                for (let i = 1; i < vertices.length; i++) {
                    this.ctx.lineTo(vertices[i].x, vertices[i].y);
                }

                this.ctx.closePath();
                this.ctx.stroke();

                // Draw center of mass
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(body.position.x, body.position.y, 3, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw velocity vector
                if (body.velocity && !body.isStatic) {
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(body.position.x, body.position.y);
                    this.ctx.lineTo(
                        body.position.x + body.velocity.x * 10,
                        body.position.y + body.velocity.y * 10
                    );
                    this.ctx.stroke();
                }
            }
        });

        this.ctx.restore();
    }
    
    renderRoundInfo(gameState) {
        const centerX = this.canvas.width / 2;
        
        // Round number
        this.drawText(`ROUND ${gameState.round}`, centerX, 30, {
            color: '#ffffff',
            fontSize: '24px',
            fontFamily: 'Arial',
            align: 'center',
            weight: 'bold'
        });
        
        // Timer
        const timeRemaining = gameState.getRoundTimeRemaining();
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = Math.floor(timeRemaining % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Color changes as time runs out
        let timeColor = '#00ff00'; // Green
        if (timeRemaining < 60) {
            timeColor = '#ffaa00'; // Orange
        }
        if (timeRemaining < 30) {
            timeColor = '#ff0000'; // Red
        }
        
        this.drawText(`TIME: ${timeString}`, centerX, 60, {
            color: timeColor,
            fontSize: '18px',
            fontFamily: 'Arial',
            align: 'center',
            weight: 'bold'
        });
        
        // Score (if available)
        const currentPlayer = gameState.getCurrentPlayer();
        if (currentPlayer) {
            this.drawText(`SCORE: ${currentPlayer.score}`, 20, 30, {
                color: '#ffffff',
                fontSize: '16px',
                fontFamily: 'Arial',
                align: 'left'
            });
            
            this.drawText(`MONEY: $${currentPlayer.money}`, 20, 55, {
                color: '#00ff00',
                fontSize: '16px',
                fontFamily: 'Arial',
                align: 'left'
            });
        }
        
        // Progress bar for round time
        const progressWidth = 200;
        const progressHeight = 4;
        const progressX = centerX - progressWidth / 2;
        const progressY = 75;
        
        // Background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
        
        // Progress
        const progress = gameState.getRoundProgress();
        this.ctx.fillStyle = timeColor;
        this.ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
    }
    
    renderDebugInfo(gameState) {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${Math.round(1 / (gameState.deltaTime || 0.016))}`,
            `Game Time: ${gameState.gameTime?.toFixed(1) || 0}s`,
            `Round: ${gameState.round || 1}`,
            `Entities: T${gameState.tanks?.length || 0} P${gameState.projectiles?.length || 0} E${gameState.explosions?.length || 0}`
        ];
        
        debugInfo.forEach((text, index) => {
            this.ctx.fillText(text, 10, 30 + index * 20);
        });
    }
    
    // Utility drawing methods
    drawText(text, x, y, options = {}) {
        this.ctx.save();
        
        this.ctx.fillStyle = options.color || '#ffffff';
        
        // Build font string from options
        if (options.fontSize || options.fontFamily || options.weight) {
            const weight = options.weight || '';
            const size = options.fontSize || '16px';
            const family = options.fontFamily || 'monospace';
            this.ctx.font = `${weight} ${size} ${family}`.trim();
        } else {
            this.ctx.font = options.font || '16px monospace';
        }
        
        this.ctx.textAlign = options.align || 'left';
        
        if (options.shadow) {
            this.ctx.shadowColor = options.shadowColor || '#000000';
            this.ctx.shadowBlur = options.shadowBlur || 5;
            this.ctx.shadowOffsetX = options.shadowOffsetX || 2;
            this.ctx.shadowOffsetY = options.shadowOffsetY || 2;
        }
        
        this.ctx.fillText(text, x, y);
        
        if (options.stroke) {
            this.ctx.strokeStyle = options.strokeColor || '#000000';
            this.ctx.lineWidth = options.strokeWidth || 2;
            this.ctx.strokeText(text, x, y);
        }
        
        this.ctx.restore();
    }
    
    drawLine(x1, y1, x2, y2, options = {}) {
        this.ctx.save();
        
        this.ctx.strokeStyle = options.color || '#ffffff';
        this.ctx.lineWidth = options.width || 1;
        
        if (options.dash) {
            this.ctx.setLineDash(options.dash);
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
}