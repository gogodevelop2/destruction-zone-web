// ============================================
// PixiJS Particle System
// ============================================

import { PARTICLE_COLORS } from '../config/colors.js';

// Global PixiJS state
let pixiApp = null;
let particleContainer = null;
let projectileContainer = null;
const activeParticles = [];

/**
 * Initialize PixiJS application with particle and projectile layers
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {PIXI.Application} The PixiJS app instance
 */
export function initPixiJS(width, height) {
    pixiApp = new PIXI.Application({
        width: width,
        height: height,
        backgroundAlpha: 0,  // 완전 투명 배경 (중요!)
        antialias: true
    });

    const container = document.getElementById('pixiContainer');
    if (container) {
        container.appendChild(pixiApp.view);
    }

    // Rendering layer order (bottom to top):
    // 1. Background (canvas 2D)
    // 2. Walls (canvas 2D)
    // 3. Projectiles (PixiJS) ← Layer for projectiles
    // 4. Tanks (canvas 2D)
    // 5. Particles (PixiJS) ← Layer for particles

    projectileContainer = new PIXI.Container();
    pixiApp.stage.addChild(projectileContainer);

    particleContainer = new PIXI.Container();
    pixiApp.stage.addChild(particleContainer);

    console.log('✅ PixiJS initialized (projectile + particle layers)');

    return pixiApp;
}

/**
 * Get the projectile container for rendering projectiles
 * @returns {PIXI.Container}
 */
export function getProjectileContainer() {
    return projectileContainer;
}

/**
 * Get the particle container
 * @returns {PIXI.Container}
 */
export function getParticleContainer() {
    return particleContainer;
}

// ============================================
// Particle Class
// ============================================

/**
 * PixiJS Particle class (native implementation)
 * Extends PIXI.Graphics for efficient rendering
 */
class Particle extends PIXI.Graphics {
    constructor(x, y, vx, vy, config) {
        super();

        // 원형 파티클 그리기
        this.beginFill(config.startColor || PARTICLE_COLORS.EXPLOSION_START);
        this.drawCircle(0, 0, config.radius || 3);
        this.endFill();

        this.position.set(x, y);
        this.vx = vx;
        this.vy = vy;

        this.maxLife = config.lifetime || 1.0;
        this.life = this.maxLife;
        this.startColor = config.startColor || PARTICLE_COLORS.EXPLOSION_START;
        this.endColor = config.endColor || PARTICLE_COLORS.EXPLOSION_END;
        this.damping = config.damping || 0.95;
    }

    update(deltaTime) {
        // 위치 업데이트
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // 속도 감속
        this.vx *= this.damping;
        this.vy *= this.damping;

        // 생명 감소
        this.life -= deltaTime;

        // 투명도
        this.alpha = this.life / this.maxLife;

        // 색상 변화 (간단하게 50% 기준)
        const progress = 1 - (this.life / this.maxLife);
        this.tint = progress < 0.5 ? this.startColor : this.endColor;

        return this.life > 0;
    }
}

// ============================================
// Particle Creation Functions
// ============================================

/**
 * Create tank explosion particles
 * @param {number} x - Explosion center X
 * @param {number} y - Explosion center Y
 */
export function createTankExplosionParticles(x, y) {
    if (!particleContainer) return;

    const count = 80;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 150;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const particle = new Particle(x, y, vx, vy, {
            lifetime: 0.5 + Math.random() * 0.7,
            startColor: PARTICLE_COLORS.EXPLOSION_START,  // 노란색
            endColor: PARTICLE_COLORS.EXPLOSION_END,      // 흰색
            damping: 0.95,
            radius: Math.random() < 0.3 ? 2 : 1  // 크기 2: 30%, 크기 1: 70%
        });

        particleContainer.addChild(particle);
        activeParticles.push(particle);
    }
}

/**
 * Create projectile hit particles (smaller spark effect)
 * @param {number} x - Hit position X
 * @param {number} y - Hit position Y
 */
export function createProjectileHitParticles(x, y) {
    if (!particleContainer) return;

    const count = 5;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const particle = new Particle(x, y, vx, vy, {
            lifetime: 0.2 + Math.random() * 0.3,
            startColor: PARTICLE_COLORS.HIT_START,  // 흰색
            endColor: PARTICLE_COLORS.HIT_END,      // 주황색
            damping: 0.92,
            radius: 1  // 작은 스파크
        });

        particleContainer.addChild(particle);
        activeParticles.push(particle);
    }
}

// ============================================
// Particle Update Loop
// ============================================

/**
 * Update all active particles
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateParticles(deltaTime) {
    // Update all particles
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const particle = activeParticles[i];
        const alive = particle.update(deltaTime);

        if (!alive) {
            // Remove from container and array
            particleContainer.removeChild(particle);
            particle.destroy();
            activeParticles.splice(i, 1);
        }
    }
}

/**
 * Get active particle count (for debugging)
 * @returns {number}
 */
export function getActiveParticleCount() {
    return activeParticles.length;
}
