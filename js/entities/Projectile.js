// ============================================
// Projectile Entity Class
// ============================================

import { COLLISION_CATEGORY, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';
import { SPEED_SCALE_FACTOR } from '../config/weapons.js';

/**
 * Projectile class - Physics + Lifetime + PixiJS rendering coordination
 *
 * RESPONSIBILITIES:
 * - Handles: Matter.js physics body, lifetime tracking, PixiJS sprite sync
 * - Does NOT handle: PixiJS graphics creation (delegated to ProjectileRenderer)
 * - Interface with renderer: Creates sprite in constructor, syncs in update(), cleans in destroy()
 */
export default class Projectile {
    /**
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     * @param {number} angle - Fire angle in radians
     * @param {Object} weaponData - Weapon configuration (full weapon data)
     * @param {string} ownerColor - Tank color (for rendering)
     * @param {string} ownerId - Tank ID who fired this projectile
     * @param {Matter} Matter - Matter.js library reference
     * @param {Matter.World} world - Matter.js world
     * @param {Object} ProjectileRenderer - Renderer object for PixiJS sprites
     * @param {string} stage - Projectile stage: 'NORMAL' | 'PRIMARY' | 'SECONDARY' (default: 'NORMAL')
     */
    constructor(x, y, angle, weaponData, ownerColor, ownerId, Matter, world, ProjectileRenderer, stage = 'NORMAL') {
        this.Matter = Matter;
        this.world = world;
        this.ProjectileRenderer = ProjectileRenderer;

        // === STAGE AND WEAPON REFERENCE ===
        this.stage = stage;              // 'NORMAL' | 'PRIMARY' | 'SECONDARY'
        this.weaponData = weaponData;    // Store full weaponData (for triggering SECONDARY later)
        this.ownerId = ownerId;          // Who fired this projectile

        // Select config based on stage
        let projectileConfig;
        if (stage === 'PRIMARY') {
            projectileConfig = weaponData.primaryProjectile;
        } else if (stage === 'SECONDARY') {
            projectileConfig = weaponData.secondaryProjectiles;
        } else {
            // NORMAL: Simple weapon, use weaponData directly
            projectileConfig = weaponData;
        }

        // === PHYSICS SETUP ===
        // Extract properties from selected config
        this.type = weaponData.type;
        this.damage = projectileConfig.damage || projectileConfig.damagePerProjectile;
        this.color = projectileConfig.color || ownerColor;

        // Calculate actual speed (DOS units → web pixels)
        // SPEED_SCALE_FACTOR imported from weapons.js (0.4: 5 DOS units = 2 px/frame)
        const actualSpeed = projectileConfig.speed * SPEED_SCALE_FACTOR;

        // === ACCELERATION SYSTEM ===
        this.hasAcceleration = projectileConfig.hasAcceleration || false;
        if (this.hasAcceleration) {
            const accelConfig = projectileConfig.accelerationConfig;
            const initialSpeedScaled = accelConfig.initialSpeed * SPEED_SCALE_FACTOR;
            this.acceleration = {
                initialSpeed: initialSpeedScaled,
                finalSpeed: accelConfig.finalSpeed * SPEED_SCALE_FACTOR,
                duration: accelConfig.duration || 1.0,  // seconds
                easingType: accelConfig.easingType || 'EASE_OUT_QUAD',
                currentSpeed: initialSpeedScaled,  // Reuse calculated value
                elapsedTime: 0
            };
        }

        // Create physics body (sensor or physical based on weapon type)
        // isSensor: true = collision detection only (no physical forces)
        // isSensor: false = full physics collision (applies forces, can push tanks)
        // Matter.js still detects collisions and fires events for both modes
        this.body = Matter.Bodies.circle(x, y, projectileConfig.size, {
            isSensor: projectileConfig.isSensor ?? false,  // Use weapon-specific isSensor (default: false)
            label: 'projectile',
            density: projectileConfig.density || 0.4,  // Use weapon-specific density
            frictionAir: 0,    // No air resistance
            restitution: 0,    // No bounce
            friction: 0.1,
            collisionFilter: {
                category: COLLISION_CATEGORY.PROJECTILE,
                mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.WALL
            }
        });

        // Set initial velocity
        // If acceleration is enabled, use initial speed instead of actualSpeed
        const initialSpeed = this.hasAcceleration ? this.acceleration.initialSpeed : actualSpeed;
        const velocity = {
            x: Math.cos(angle) * initialSpeed,
            y: Math.sin(angle) * initialSpeed
        };
        Matter.Body.setVelocity(this.body, velocity);

        Matter.World.add(world, this.body);

        // ============================================
        // LIFETIME POLICY (IMPORTANT - DO NOT CHANGE WITHOUT EXPLICIT REQUEST)
        // ============================================
        // - DOS original had NO lifetime limit (projectiles fly until off-screen)
        // - Current implementation: lifetime is OPTIONAL
        // - Default behavior: weaponData.lifetime undefined → this.lifetime = null → infinite flight
        // - Only add lifetime to weaponData when EXPLICITLY requested for special weapons
        // - Example special case: weaponData.lifetime = 2.0 → expires after 2 seconds
        // - Current weapons (MISSILE, LASER, DOUBLE_MISSILE, TRIPLE_MISSILE): NO lifetime property
        // - See weapons.js header for full policy documentation
        // ============================================
        this.lifetime = projectileConfig.lifetime || null;  // null = infinite lifetime (default)
        this.age = 0;
        this.active = true;

        // === GUIDED SYSTEM ===
        this.isGuided = projectileConfig.isGuided || false;
        this.guidedConfig = projectileConfig.guidedConfig || null;

        if (this.isGuided) {
            this.currentTarget = null;           // 현재 추적 중인 타겟
            this.targetUpdateCounter = 0;        // 타겟 업데이트 카운터
        }

        // === TRAIL SYSTEM ===
        this.hasTrail = projectileConfig.hasTrail || false;
        this.trailConfig = projectileConfig.trailConfig || null;

        if (this.hasTrail) {
            this.trail = {
                positions: [],                    // Array of {x, y, alpha}
                maxLength: this.trailConfig?.maxLength || 8,
                fadeRate: this.trailConfig?.fadeRate || 0.12,
                spacing: this.trailConfig?.spacing || 0  // 0 = record every frame
            };
            this.trailDistanceCounter = 0;        // For spacing control
        }

        // === RENDERING SETUP ===
        // Create PixiJS sprite via ProjectileRenderer
        // Uses renderType and renderConfig from projectileConfig
        this.pixiSprite = ProjectileRenderer.createGraphics(
            projectileConfig.renderType || 'SHORT_BEAM',
            this.color,
            projectileConfig  // Includes renderConfig
        );
        this.pixiSprite.position.set(x, y);

        // Set initial rotation based on velocity direction
        const rotationAngle = Math.atan2(velocity.y, velocity.x);
        this.pixiSprite.rotation = rotationAngle;

        ProjectileRenderer.add(this.pixiSprite);
    }

    /**
     * Update projectile lifetime and sync visual with physics
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        this.age += deltaTime;

        // === ACCELERATION UPDATE ===
        if (this.hasAcceleration) {
            this.updateAcceleration(deltaTime);
        }

        // === GUIDED BEHAVIOR ===
        // Guided logic is handled by guidedSystem.js (integrated in Game.js)
        // No projectile-level logic needed here

        // Sync PixiJS sprite position/rotation with physics body
        if (this.pixiSprite) {
            const pos = this.body.position;
            const vel = this.body.velocity;
            const angle = Math.atan2(vel.y, vel.x);

            this.pixiSprite.position.set(pos.x, pos.y);
            this.pixiSprite.rotation = angle;
        }

        // === TRAIL UPDATE ===
        if (this.hasTrail && this.active) {
            this.updateTrail();

            // Update trail graphics via renderer
            if (this.pixiSprite && this.trail.positions.length > 0) {
                this.ProjectileRenderer.updateTrail(this.pixiSprite, this.trail.positions);
            }
        }

        // Remove if out of bounds (always check)
        // or if lifetime expired (only if lifetime is set)
        if (this.isOutOfBounds() || (this.lifetime && this.age >= this.lifetime)) {
            this.destroy();
        }
    }

    /**
     * Update acceleration (Ease-Out Quadratic)
     * Speed increases from initialSpeed to finalSpeed over duration
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateAcceleration(deltaTime) {
        const accel = this.acceleration;

        // Early exit: Already reached final speed
        if (accel.elapsedTime >= accel.duration) {
            return;
        }

        accel.elapsedTime += deltaTime;

        // Calculate progress (0.0 to 1.0)
        const progress = Math.min(accel.elapsedTime / accel.duration, 1.0);

        // Apply easing function
        let eased;
        if (accel.easingType === 'EASE_OUT_QUAD') {
            // Ease-Out Quadratic: Fast initial acceleration, gradual slowdown
            eased = 1 - (1 - progress) * (1 - progress);
        } else if (accel.easingType === 'EASE_OUT_CUBIC') {
            // Ease-Out Cubic: Even faster initial burst
            eased = 1 - Math.pow(1 - progress, 3);
        } else {
            // Linear fallback
            eased = progress;
        }

        // Calculate current speed
        accel.currentSpeed = accel.initialSpeed + (accel.finalSpeed - accel.initialSpeed) * eased;

        // Update velocity (maintain direction, change magnitude)
        // IMPORTANT: Use current velocity vector for angle, NOT initial angle
        // Reason: Guided missiles change direction → initial angle becomes outdated
        // This ensures acceleration works correctly with GUIDED system
        const vel = this.body.velocity;
        const currentAngle = Math.atan2(vel.y, vel.x);
        const newVelocity = {
            x: Math.cos(currentAngle) * accel.currentSpeed,
            y: Math.sin(currentAngle) * accel.currentSpeed
        };
        this.Matter.Body.setVelocity(this.body, newVelocity);
    }

    /**
     * Check if projectile is out of canvas bounds
     * @returns {boolean}
     */
    isOutOfBounds() {
        const pos = this.body.position;
        return pos.x < 0 || pos.x > CANVAS_WIDTH || pos.y < 0 || pos.y > CANVAS_HEIGHT;
    }

    /**
     * Update trail positions and fade
     * Records current position and applies fade-out effect
     */
    updateTrail() {
        const pos = this.body.position;
        const spacing = this.trail.spacing;

        // Check if we should record new position (based on spacing)
        if (spacing > 0) {
            // Calculate distance from last recorded position
            const lastPos = this.trail.positions[0];
            if (lastPos) {
                const dx = pos.x - lastPos.x;
                const dy = pos.y - lastPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.trailDistanceCounter += dist;
            } else {
                // First trail point, always record
                this.trailDistanceCounter = spacing;  // Force record on first update
            }

            // Only record if distance threshold met
            if (this.trailDistanceCounter < spacing) {
                return;
            }
            this.trailDistanceCounter = 0;
        }

        // Add current position to trail (start with initial alpha from config)
        // Store velocity for angle calculation (for line-based trails)
        const vel = this.body.velocity;
        const angle = Math.atan2(vel.y, vel.x);
        const initialAlpha = this.trailConfig?.initialAlpha || 0.6;  // Default 0.6 (60% opacity)
        this.trail.positions.unshift({
            x: pos.x,
            y: pos.y,
            angle: angle,  // Store angle for line-based trail rendering
            alpha: initialAlpha
        });

        // Limit trail length
        if (this.trail.positions.length > this.trail.maxLength) {
            this.trail.positions.pop();
        }

        // Fade out existing trail positions
        for (let i = 1; i < this.trail.positions.length; i++) {
            this.trail.positions[i].alpha -= this.trail.fadeRate;
            if (this.trail.positions[i].alpha < 0) {
                this.trail.positions[i].alpha = 0;
            }
        }
    }

    /**
     * Clean up physics body and rendering
     */
    destroy() {
        if (this.active) {
            this.Matter.World.remove(this.world, this.body);

            // Clean up PixiJS sprite via ProjectileRenderer
            if (this.pixiSprite) {
                this.ProjectileRenderer.remove(this.pixiSprite);
                this.pixiSprite = null;
            }

            this.active = false;
        }
    }

    // NOTE: No render() method - PixiJS handles all rendering automatically
    // Projectile sprites are updated in update() and rendered by PixiJS
}
