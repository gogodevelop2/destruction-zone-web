// ============================================
// Collision System
// ============================================

import { triggerSecondary } from './projectileEffects.js';

/**
 * Setup collision event handlers for the physics engine
 * @param {Matter.Engine} engine - Matter.js engine
 * @param {Object} game - Game state object containing tanks and projectiles
 * @param {Function} createHitEffect - Shockwave ring effect callback
 * @param {Function} createProjectileHitParticles - Spark particle effect callback
 */
export function setupCollisionHandlers(engine, game, createHitEffect, createProjectileHitParticles) {
    const Matter = game.Matter;

    Matter.Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;

            // Check projectile → tank collision
            if (bodyA.label === 'projectile' && bodyB.label === 'tank') {
                handleProjectileHit(bodyA, bodyB, game, createHitEffect, createProjectileHitParticles, pair);
            } else if (bodyA.label === 'tank' && bodyB.label === 'projectile') {
                handleProjectileHit(bodyB, bodyA, game, createHitEffect, createProjectileHitParticles, pair);
            }
            // Check projectile → wall collision
            else if (bodyA.label === 'projectile' && (bodyB.label === 'wall' || bodyB.label === 'obstacle_wall')) {
                handleProjectileWallHit(bodyA, game, createHitEffect, createProjectileHitParticles);
            } else if ((bodyA.label === 'wall' || bodyA.label === 'obstacle_wall') && bodyB.label === 'projectile') {
                handleProjectileWallHit(bodyB, game, createHitEffect, createProjectileHitParticles);
            }

            // TODO: projectile vs projectile collision
            // Will be implemented with weapon system
            // e.g., missile vs missile = explode, missile vs laser = pass through
        });
    });
}

/**
 * Handle two-stage weapon collision (BLASTER, BREAKER, BOMB)
 * Triggers SECONDARY projectiles and resets tank state
 *
 * @param {Projectile} projectile - PRIMARY projectile that collided
 * @param {Object} weaponData - Weapon data
 * @param {Object} game - Game state
 * @param {Tank|null} attacker - Tank that fired the projectile (can be null if not found)
 * @param {Object} position - Collision position {x, y}
 * @param {Function} createHitEffect - Shockwave ring effect callback
 * @param {Function} createProjectileHitParticles - Spark particle effect callback
 */
function handleTwoStageCollision(projectile, weaponData, game, attacker, position, createHitEffect, createProjectileHitParticles) {
    // Trigger SECONDARY projectiles (split effect)
    triggerSecondary(
        projectile,
        weaponData,
        game.Matter,
        game.world,
        game.projectiles,
        game.Projectile,
        game.ProjectileRenderer
    );

    // Reset tank state to allow firing new PRIMARY
    if (attacker && attacker.alive) {
        attacker.activePrimary = null;
        attacker.canFirePrimary = true;
    }

    // Create visual effects (PixiJS)
    createHitEffect(position.x, position.y);
    createProjectileHitParticles(position.x, position.y);

    // Note: triggerSecondary() already destroys the PRIMARY projectile
}

/**
 * Handle projectile hitting a tank
 * @param {Matter.Body} projectileBody - Projectile physics body
 * @param {Matter.Body} tankBody - Tank physics body
 * @param {Object} game - Game state
 * @param {Function} createHitEffect - Shockwave ring effect callback
 * @param {Function} createProjectileHitParticles - Spark particle effect callback
 * @param {Object} pair - Collision pair from Matter.js
 */
function handleProjectileHit(projectileBody, tankBody, game, createHitEffect, createProjectileHitParticles, pair) {
    // Find projectile object
    const projectile = game.projectiles.find(p => p.body === projectileBody);
    if (!projectile || !projectile.active) return;

    // Find which tank was hit
    const hitTank = game.tanks.find(t => t.body === tankBody);
    if (!hitTank || !hitTank.alive) return;

    // Find attacker
    const attacker = game.tanks.find(t => t.id === projectile.ownerId);

    if (attacker && attacker.alive) {
        // Record hit (공격자 추적)
        hitTank.recordHit(attacker.id, attacker.body.position);
    }

    // === COLLISION HANDLING LOGIC ===
    // Two paths:
    // 1. Two-stage weapon (PRIMARY stage + AUTO/BOTH trigger) → Split into SECONDARY projectiles
    // 2. Normal projectile → Apply damage and remove

    const weaponData = projectile.weaponData;
    // Use optional chaining (?.) to safely check weaponData properties
    // If weaponData is null/undefined, expression evaluates to false (no crash)
    const shouldAutoTrigger = projectile.stage === 'PRIMARY' &&
                             weaponData?.projectileType === 'TWO_STAGE' &&
                             (weaponData?.triggerType === 'AUTO' || weaponData?.triggerType === 'BOTH');

    if (shouldAutoTrigger) {
        // Path 1: Two-stage weapon auto-trigger
        handleTwoStageCollision(
            projectile,
            weaponData,
            game,
            attacker,
            projectileBody.position,
            createHitEffect,
            createProjectileHitParticles
        );

    } else {
        // Path 2: Normal projectile or MANUAL-only trigger
        // Apply damage (use projectile.damage, which is already stage-specific)
        hitTank.takeDamage(projectile.damage);

        // Create visual effects (PixiJS)
        createHitEffect(projectileBody.position.x, projectileBody.position.y);
        createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);

        // Remove projectile
        projectile.destroy();
    }
}

/**
 * Handle projectile hitting a wall
 * @param {Matter.Body} projectileBody - Projectile physics body
 * @param {Object} game - Game state
 * @param {Function} createHitEffect - Shockwave ring effect callback
 * @param {Function} createProjectileHitParticles - Spark particle effect callback
 */
function handleProjectileWallHit(projectileBody, game, createHitEffect, createProjectileHitParticles) {
    // Find projectile object
    const projectile = game.projectiles.find(p => p.body === projectileBody);
    if (!projectile || !projectile.active) return;

    // === COLLISION HANDLING LOGIC ===
    // Two paths:
    // 1. Two-stage weapon (PRIMARY stage + AUTO/BOTH trigger) → Split into SECONDARY projectiles
    // 2. Normal projectile → Remove on wall hit

    const weaponData = projectile.weaponData;
    // Use optional chaining (?.) to safely check weaponData properties
    // If weaponData is null/undefined, expression evaluates to false (no crash)
    const shouldAutoTrigger = projectile.stage === 'PRIMARY' &&
                             weaponData?.projectileType === 'TWO_STAGE' &&
                             (weaponData?.triggerType === 'AUTO' || weaponData?.triggerType === 'BOTH');

    if (shouldAutoTrigger) {
        // Path 1: Two-stage weapon auto-trigger
        // Find attacker to reset tank state
        const attacker = game.tanks.find(t => t.id === projectile.ownerId);

        handleTwoStageCollision(
            projectile,
            weaponData,
            game,
            attacker,
            projectileBody.position,
            createHitEffect,
            createProjectileHitParticles
        );

    } else {
        // Path 2: Normal projectile
        // Create visual effects (PixiJS)
        createHitEffect(projectileBody.position.x, projectileBody.position.y);
        createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);

        // Remove projectile
        projectile.destroy();
    }
}
