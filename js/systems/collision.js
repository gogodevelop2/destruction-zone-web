// ============================================
// Collision System
// ============================================

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
                handleProjectileHit(bodyA, bodyB, game, createHitEffect, createProjectileHitParticles);
            } else if (bodyA.label === 'tank' && bodyB.label === 'projectile') {
                handleProjectileHit(bodyB, bodyA, game, createHitEffect, createProjectileHitParticles);
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
 * Handle projectile hitting a tank
 * @param {Matter.Body} projectileBody - Projectile physics body
 * @param {Matter.Body} tankBody - Tank physics body
 * @param {Object} game - Game state
 * @param {Function} createHitEffect - Shockwave ring effect callback
 * @param {Function} createProjectileHitParticles - Spark particle effect callback
 */
function handleProjectileHit(projectileBody, tankBody, game, createHitEffect, createProjectileHitParticles) {
    // Find projectile object
    const projectile = game.projectiles.find(p => p.body === projectileBody);
    if (!projectile || !projectile.active) return;

    // Find which tank was hit
    const hitTank = game.tanks.find(t => t.body === tankBody);
    if (!hitTank || !hitTank.alive) return;

    // Apply damage
    hitTank.takeDamage(projectile.weaponData.damage);

    // Create visual effects (PixiJS)
    createHitEffect(projectileBody.position.x, projectileBody.position.y);
    createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);

    // Remove projectile
    projectile.destroy();

    console.log('Hit! Damage:', projectile.weaponData.damage,
        'Weapon:', projectile.weaponData.name,
        'Tank:', hitTank.id,
        'Health:', Math.round(hitTank.health));
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

    // Create visual effects (PixiJS)
    createHitEffect(projectileBody.position.x, projectileBody.position.y);
    createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);

    // Remove projectile
    projectile.destroy();

    console.log('Projectile hit wall');
}
