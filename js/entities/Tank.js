// ============================================
// Tank Entity Class
// ============================================

import { COLLISION_CATEGORY } from '../config/constants.js';
import { debugManager } from '../systems/DebugManager.js';

/**
 * Tank class - Matter.js wrapper with game logic
 * Represents a player or AI controlled tank
 */
export default class Tank {
    /**
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     * @param {Object} config - Tank configuration
     * @param {Matter} Matter - Matter.js library reference
     * @param {Matter.World} world - Matter.js world
     * @param {Function} onDestroy - Callback when tank is destroyed (for particles)
     * @param {boolean} isPlayer - Whether this is the player tank (default: false)
     */
    constructor(x, y, config, Matter, world, onDestroy = null, isPlayer = false) {
        this.Matter = Matter;
        this.world = world;
        this.onDestroy = onDestroy;
        this.isPlayer = isPlayer;

        this.config = {
            size: config.size || 30,
            thrustPower: config.thrustPower || 0.0003,
            rotationSpeed: config.rotationSpeed || 3.0,
            density: config.density || 0.1,
            friction: config.friction || 0.8,
            frictionAir: config.frictionAir || 0.12,
            color: config.color || '#00ffff',
            maxHealth: config.maxHealth || 100,
            team: config.team || 0  // Team ID (0 = no team, 1 = RED, 2 = BLUE)
        };

        // Game state
        this.team = this.config.team;

        // Define tank shape as triangle vertices (relative to center)
        const size = this.config.size * 0.8;
        const vertices = [
            { x: size * 0.75, y: 0 },              // Front point
            { x: -size * 0.5, y: -size * 0.4 },    // Back left
            { x: -size * 0.5, y: size * 0.4 }      // Back right
        ];

        // Create Matter.js body from vertices
        this.body = Matter.Bodies.fromVertices(x, y, [vertices], {
            density: this.config.density,
            friction: this.config.friction,
            frictionAir: this.config.frictionAir,
            frictionStatic: 1.0,
            restitution: 0.0,  // No bounce
            chamfer: { radius: 2 },  // Round corners to reduce jitter
            label: 'tank',
            collisionFilter: {
                category: COLLISION_CATEGORY.TANK,
                mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE | COLLISION_CATEGORY.WALL
            }
        }, true);  // true = flagInternal (auto-decompose if needed)

        Matter.World.add(world, this.body);

        // High rotational inertia for stability with slight rotation on impact
        // Higher value = more stable, less bounce on corner collisions
        Matter.Body.setInertia(this.body, this.body.mass * 50);

        // Set initial rotation to face center of arena
        const centerX = 480;
        const centerY = 360;
        const angleToCenter = Math.atan2(centerY - y, centerX - x);
        Matter.Body.setAngle(this.body, angleToCenter);

        // Health state (no shield)
        this.maxHealth = this.config.maxHealth;  // Store maxHealth for AI
        this.health = this.maxHealth;
        this.alive = true;

        // Weapon state
        this.currentWeapon = 'MISSILE';  // Default weapon
        this.maxWeaponEnergy = 100;
        this.weaponEnergy = 100;
        this.weaponRechargeRate = 20; // per second

        // Two-stage weapon state (BLASTER, BREAKER, BOMB)
        this.activePrimary = null;      // Current active PRIMARY projectile (warhead/bomb)
        this.canFirePrimary = true;     // Can fire new PRIMARY projectile?

        // Score
        this.score = 0;

        // Input state
        this.thrust = 0;      // -1, 0, 1
        this.rotation = 0;    // -1, 0, 1

        // ID (set externally)
        this.id = null;

        // Combat awareness: 공격자 추적
        // { 'TANK 2': { lastHitTime: 12345, lastPos: {x, y} } }
        this.attackers = {};
    }

    /**
     * Switch to a different weapon
     * @param {string} weaponType - Weapon type key (e.g., 'MISSILE', 'LASER')
     * @param {Object} WEAPON_DATA - Weapon data registry
     */
    switchWeapon(weaponType, WEAPON_DATA) {
        if (WEAPON_DATA[weaponType]) {
            this.currentWeapon = weaponType;

            // Reset two-stage weapon state when switching
            this.activePrimary = null;
            this.canFirePrimary = true;

            console.log(`${this.id} switched to ${WEAPON_DATA[weaponType].name}`);
        } else {
            console.error(`Unknown weapon: ${weaponType}`);
        }
    }

    /**
     * Update tank physics and state
     * Called every frame
     */
    update() {
        // Don't update if destroyed
        if (!this.alive) return;

        const { Body } = this.Matter;

        // Apply thrust force
        if (this.thrust !== 0) {
            const forceMagnitude = this.thrust * this.config.thrustPower;
            const force = {
                x: Math.cos(this.body.angle) * forceMagnitude,
                y: Math.sin(this.body.angle) * forceMagnitude
            };
            Body.applyForce(this.body, this.body.position, force);
        } else {
            // Brake when no thrust
            const brakeFactor = 0.05;
            Body.setVelocity(this.body, {
                x: this.body.velocity.x * (1 - brakeFactor),
                y: this.body.velocity.y * (1 - brakeFactor)
            });
        }

        // Apply rotation
        if (this.rotation !== 0) {
            const targetAngularVelocity = this.rotation * this.config.rotationSpeed;
            Body.setAngularVelocity(this.body, targetAngularVelocity);
        } else {
            // Stop rotation when no input
            const rotationBrake = 0.2;
            Body.setAngularVelocity(this.body, this.body.angularVelocity * (1 - rotationBrake));
        }

        // Recharge weapon energy (fixed 60 FPS, so 1/60 = 0.0167s per frame)
        if (this.weaponEnergy < this.maxWeaponEnergy) {
            this.weaponEnergy = Math.min(
                this.maxWeaponEnergy,
                this.weaponEnergy + this.weaponRechargeRate / 60
            );
        }

        // Reset inputs (only for player tank, AI controls persist)
        if (this.isPlayer) {
            this.thrust = 0;
            this.rotation = 0;
        }
    }

    /**
     * Take damage from a projectile or collision
     * @param {number} damage - Amount of damage to take
     */
    takeDamage(damage) {
        if (!this.alive) return;

        // Damage health directly (no shield)
        this.health -= damage;

        // Check if destroyed
        if (this.health <= 0) {
            this.health = 0;
            this.destroy();
        }
    }

    /**
     * Record hit from an attacker
     * @param {string} attackerId - ID of the attacking tank
     * @param {Object} attackerPos - Position {x, y} of attacker
     */
    recordHit(attackerId, attackerPos) {
        this.attackers[attackerId] = {
            lastHitTime: Date.now(),
            lastPos: { x: attackerPos.x, y: attackerPos.y }
        };
    }

    /**
     * Get count of active attackers (within 3-second window)
     * @returns {number} Number of active attackers
     */
    getActiveAttackerCount() {
        const now = Date.now();
        const ACTIVE_WINDOW = 3000; // 3초

        let count = 0;
        for (const data of Object.values(this.attackers)) {
            if (now - data.lastHitTime < ACTIVE_WINDOW) {
                count++;
            }
        }
        return count;
    }

    /**
     * Destroy the tank
     * Removes from physics world and triggers explosion
     */
    destroy() {
        if (!this.alive) return;

        this.alive = false;
        console.log(`Tank ${this.id} destroyed!`);

        // Call destroy callback (for particle effects)
        if (this.onDestroy) {
            this.onDestroy(this.body.position.x, this.body.position.y);
        }

        // Remove body from world
        this.Matter.World.remove(this.world, this.body);
    }

    /**
     * Render tank to canvas (TRON style)
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     */
    render(ctx) {
        // Don't render if destroyed
        if (!this.alive) return;

        const { Vector } = this.Matter;
        const pos = this.body.position;
        const angle = this.body.angle;
        const size = this.config.size * 0.8;

        ctx.save();

        // Move to tank position and rotate
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        // Draw tank body using Matter.js vertices (for perfect match)
        const vertices = this.body.vertices;
        ctx.beginPath();
        const v0 = Vector.sub(vertices[0], pos);
        const v0Rotated = Vector.rotate(v0, -angle);
        ctx.moveTo(v0Rotated.x, v0Rotated.y);

        for (let i = 1; i < vertices.length; i++) {
            const v = Vector.sub(vertices[i], pos);
            const vRotated = Vector.rotate(v, -angle);
            ctx.lineTo(vRotated.x, vRotated.y);
        }
        ctx.closePath();

        // TRON style: Dark interior
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();

        // TRON style: Outer neon glow (player color)
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 20;
        ctx.stroke();

        // Inner white core (bright center line)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.stroke();

        // Tank detail (single glowing neon accent point)
        const accentSize = size * 0.2;
        const accentX = -size * 0.4;
        const accentY = -accentSize / 2;

        // Outer neon glow (player color)
        ctx.fillStyle = this.config.color;
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(accentX, accentY, accentSize, accentSize);

        // Inner white core (bright center)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        const coreSize = accentSize * 0.4;
        const coreX = accentX + (accentSize - coreSize) / 2;
        const coreY = accentY + (accentSize - coreSize) / 2;
        ctx.fillRect(coreX, coreY, coreSize, coreSize);

        // Weapon indicator
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size * 0.6, 0);
        ctx.lineTo(size * 0.9, 0);
        ctx.stroke();

        ctx.restore();

        // Debug: Physics body outline (if debug mode enabled)
        if (debugManager.isEnabled() && this.body.vertices) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const debugVertices = this.body.vertices;
            ctx.moveTo(debugVertices[0].x, debugVertices[0].y);
            for (let i = 1; i < debugVertices.length; i++) {
                ctx.lineTo(debugVertices[i].x, debugVertices[i].y);
            }
            ctx.closePath();
            ctx.stroke();

            // Draw center point
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
