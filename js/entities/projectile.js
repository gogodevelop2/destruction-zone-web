// Projectile Entity
// Represents bullets, missiles, lasers, etc.

class Projectile {
    constructor(options) {
        this.id = options.id || Math.random().toString(36).substr(2, 9);
        this.ownerId = options.ownerId;
        this.type = options.type || 'MISSILE';
        
        // Position and movement
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.velocity = options.velocity || { x: 0, y: 0 };
        this.angle = options.angle || 0;
        
        // Properties
        this.damage = options.damage || 1;
        this.radius = options.radius || 2;
        this.color = options.color || '#ffffff';
        this.lifetime = options.lifetime || 5.0; // seconds
        this.maxLifetime = this.lifetime;
        
        // Special properties
        this.isGuided = options.isGuided || false;
        this.target = options.target || null;
        this.guidanceStrength = options.guidanceStrength || 0.1;
        this.explosionRadius = options.explosionRadius || 0;
        
        // State
        this.isDestroyed = false;
        this.hasExploded = false;
        
        // Debug: console.log(`🚀 Projectile created: ${this.type} by ${this.ownerId}`);
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // Update physics
        Physics.updateProjectileMovement(this, deltaTime);
        
        // Check if lifetime expired
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // Create explosion if needed
        if (this.explosionRadius > 0 && !this.hasExploded) {
            this.explode();
        }
    }
    
    explode() {
        this.hasExploded = true;
        // Explosion logic will be handled by the game engine
    }
    
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
    
    setTarget(target) {
        this.target = target;
        this.isGuided = true;
    }
    
    getLifetimeProgress() {
        return 1 - (this.lifetime / this.maxLifetime);
    }
}