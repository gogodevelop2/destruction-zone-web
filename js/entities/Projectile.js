// ============================================
// Projectile Entity Class
// ============================================

import { COLLISION_CATEGORY, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';

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
     * @param {Object} weaponData - Weapon configuration
     * @param {string} ownerColor - Tank color (for rendering)
     * @param {string} ownerId - Tank ID who fired this projectile
     * @param {Matter} Matter - Matter.js library reference
     * @param {Matter.World} world - Matter.js world
     * @param {Object} ProjectileRenderer - Renderer object for PixiJS sprites
     */
    constructor(x, y, angle, weaponData, ownerColor, ownerId, Matter, world, ProjectileRenderer) {
        this.Matter = Matter;
        this.world = world;
        this.ProjectileRenderer = ProjectileRenderer;

        // === PHYSICS SETUP ===
        // Store weapon data
        this.weaponData = weaponData;
        this.type = weaponData.type;
        this.color = ownerColor || weaponData.color;
        this.ownerId = ownerId;  // Who fired this projectile

        // Calculate actual speed (DOS units → web pixels)
        const SPEED_SCALE_FACTOR = 0.4;  // 5 * 0.4 = 2
        const actualSpeed = weaponData.speed * SPEED_SCALE_FACTOR;

        // Create physics body (sensor or physical based on weapon type)
        // isSensor: true = collision detection only (no physical forces)
        // isSensor: false = full physics collision (applies forces, can push tanks)
        // Matter.js still detects collisions and fires events for both modes
        this.body = Matter.Bodies.circle(x, y, weaponData.size, {
            isSensor: weaponData.isSensor ?? false,  // Use weapon-specific isSensor (default: false)
            label: 'projectile',
            density: weaponData.density || 0.4,  // Use weapon-specific density
            frictionAir: 0,    // No air resistance
            restitution: 0,    // No bounce
            friction: 0.1,
            collisionFilter: {
                category: COLLISION_CATEGORY.PROJECTILE,
                mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.WALL
            }
        });

        // Set initial velocity
        const velocity = {
            x: Math.cos(angle) * actualSpeed,
            y: Math.sin(angle) * actualSpeed
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
        this.lifetime = weaponData.lifetime || null;  // null = infinite lifetime (default)
        this.age = 0;
        this.active = true;

        // === RENDERING SETUP ===
        // Create PixiJS sprite via ProjectileRenderer
        this.pixiSprite = ProjectileRenderer.createGraphics(
            this.type,
            this.color,
            weaponData
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

        // Sync PixiJS sprite position/rotation with physics body
        if (this.pixiSprite) {
            const pos = this.body.position;
            const vel = this.body.velocity;
            const angle = Math.atan2(vel.y, vel.x);

            this.pixiSprite.position.set(pos.x, pos.y);
            this.pixiSprite.rotation = angle;
        }

        // Remove if out of bounds (always check)
        // or if lifetime expired (only if lifetime is set)
        if (this.isOutOfBounds() || (this.lifetime && this.age >= this.lifetime)) {
            this.destroy();
        }
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
