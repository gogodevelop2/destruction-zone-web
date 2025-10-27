// Explosion Entity
// Visual and damage effect for explosions

class Explosion {
    constructor(options) {
        this.id = options.id || Math.random().toString(36).substr(2, 9);
        this.x = options.x || 0;
        this.y = options.y || 0;
        
        // Visual properties
        this.maxRadius = options.radius || GAME_CONFIG.EFFECTS.EXPLOSION_MAX_RADIUS;
        this.currentRadius = 0;
        this.color = options.color || GAME_CONFIG.COLORS.EXPLOSION;
        
        // Timing
        this.duration = options.duration || GAME_CONFIG.EFFECTS.EXPLOSION_DURATION;
        this.maxDuration = this.duration;
        
        // Damage properties
        this.damage = options.damage || 0;
        this.damageRadius = options.damageRadius || this.maxRadius;
        this.hasDamaged = false;
        
        // State
        this.isFinished = false;
        
        console.log(`💥 Explosion created at (${this.x}, ${this.y})`);
    }
    
    update(deltaTime) {
        if (this.isFinished) return;
        
        this.duration -= deltaTime;
        
        // Update visual radius
        const progress = this.getProgress();
        this.currentRadius = this.maxRadius * progress;
        
        // Check if finished
        if (this.duration <= 0) {
            this.isFinished = true;
        }
    }
    
    getProgress() {
        return 1 - (this.duration / this.maxDuration);
    }
    
    getAlpha() {
        const progress = this.getProgress();
        return Math.max(0, 1 - progress);
    }
    
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    getDamageRadius() {
        return this.damageRadius;
    }
    
    canDamage() {
        return this.damage > 0 && !this.hasDamaged;
    }
    
    setDamaged() {
        this.hasDamaged = true;
    }
}