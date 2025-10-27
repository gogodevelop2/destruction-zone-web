// Collision System
// Handles all collision detection and response

class CollisionSystem {
    constructor() {
        console.log('💥 Collision System initialized');
    }
    
    checkTankCollision(tank1, tank2) {
        if (!tank1.isAlive || !tank2.isAlive) return false;
        
        // Use triangle collision for tanks
        const triangle1 = tank1.getTrianglePoints();
        const triangle2 = tank2.getTrianglePoints();
        
        return Physics.polygonCollision(triangle1, triangle2);
    }
    
    resolveTankCollision(tank1, tank2) {
        // Simple elastic collision response
        const dx = tank2.x - tank1.x;
        const dy = tank2.y - tank1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // Prevent division by zero
        
        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separate tanks
        const overlap = (tank1.stats.size + tank2.stats.size) - distance;
        const separation = overlap * 0.5;
        
        tank1.x -= nx * separation;
        tank1.y -= ny * separation;
        tank2.x += nx * separation;
        tank2.y += ny * separation;
        
        // Apply velocity changes
        const relativeVelocityX = tank2.velocity.x - tank1.velocity.x;
        const relativeVelocityY = tank2.velocity.y - tank1.velocity.y;
        const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;
        
        if (velocityAlongNormal > 0) return; // Tanks separating
        
        const restitution = GAME_CONFIG.PHYSICS.RESTITUTION;
        const impulse = -(1 + restitution) * velocityAlongNormal;
        
        tank1.velocity.x -= impulse * nx * 0.5;
        tank1.velocity.y -= impulse * ny * 0.5;
        tank2.velocity.x += impulse * nx * 0.5;
        tank2.velocity.y += impulse * ny * 0.5;
        
        console.log(`🎯 Tank collision: ${tank1.id} vs ${tank2.id}`);
    }
    
    checkProjectileCollision(projectile, tank) {
        if (!tank.isAlive) return false;
        
        // Check if projectile is inside tank triangle
        const tankTriangle = tank.getTrianglePoints();
        const projectilePos = { x: projectile.x, y: projectile.y };
        
        return Physics.pointInPolygon(projectilePos, tankTriangle);
    }
    
    checkBoundaryCollision(tank, canvasWidth, canvasHeight) {
        const margin = tank.stats.size;
        let collided = false;
        
        // Left boundary
        if (tank.x < margin) {
            tank.x = margin;
            tank.velocity.x = Math.abs(tank.velocity.x) * GAME_CONFIG.PHYSICS.RESTITUTION;
            collided = true;
        }
        
        // Right boundary
        if (tank.x > canvasWidth - margin) {
            tank.x = canvasWidth - margin;
            tank.velocity.x = -Math.abs(tank.velocity.x) * GAME_CONFIG.PHYSICS.RESTITUTION;
            collided = true;
        }
        
        // Top boundary
        if (tank.y < margin) {
            tank.y = margin;
            tank.velocity.y = Math.abs(tank.velocity.y) * GAME_CONFIG.PHYSICS.RESTITUTION;
            collided = true;
        }
        
        // Bottom boundary
        if (tank.y > canvasHeight - margin) {
            tank.y = canvasHeight - margin;
            tank.velocity.y = -Math.abs(tank.velocity.y) * GAME_CONFIG.PHYSICS.RESTITUTION;
            collided = true;
        }
        
        return collided;
    }
    
    checkProjectileBoundary(projectile, canvasWidth, canvasHeight) {
        return projectile.x < 0 || 
               projectile.x > canvasWidth || 
               projectile.y < 0 || 
               projectile.y > canvasHeight;
    }
    
    checkExplosionDamage(explosion, tank) {
        if (!explosion.canDamage() || !tank.isAlive) return false;
        
        const distance = Physics.distance(explosion.getPosition(), tank.getPosition());
        return distance <= explosion.getDamageRadius();
    }
    
    applyExplosionDamage(explosion, tank) {
        const distance = Physics.distance(explosion.getPosition(), tank.getPosition());
        const damageRadius = explosion.getDamageRadius();
        
        if (distance <= damageRadius) {
            // Damage falls off with distance
            const damageFactor = 1 - (distance / damageRadius);
            const actualDamage = explosion.damage * damageFactor;
            
            tank.takeDamage(actualDamage);
            
            // Apply knockback
            const knockbackForce = 100 * damageFactor;
            const dx = tank.x - explosion.x;
            const dy = tank.y - explosion.y;
            const knockbackDistance = Math.sqrt(dx * dx + dy * dy);
            
            if (knockbackDistance > 0) {
                const knockbackX = (dx / knockbackDistance) * knockbackForce;
                const knockbackY = (dy / knockbackDistance) * knockbackForce;
                
                tank.velocity.x += knockbackX;
                tank.velocity.y += knockbackY;
            }
            
            return actualDamage;
        }
        
        return 0;
    }
}