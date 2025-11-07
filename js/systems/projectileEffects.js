// ============================================
// Projectile Effects System
// ============================================

/**
 * Trigger SECONDARY projectiles from a PRIMARY projectile
 * Used for two-stage weapons (BLASTER, BREAKER, BOMB)
 *
 * @param {Projectile} primaryProjectile - The PRIMARY projectile to trigger from
 * @param {Object} weaponData - Full weapon data (contains secondaryProjectiles config)
 * @param {Matter} Matter - Matter.js library reference
 * @param {Matter.World} world - Matter.js world
 * @param {Array} projectiles - Projectiles array to add SECONDARY projectiles to
 * @param {Class} Projectile - Projectile class constructor
 * @param {Object} ProjectileRenderer - Projectile renderer
 */
export function triggerSecondary(primaryProjectile, weaponData, Matter, world, projectiles, Projectile, ProjectileRenderer) {
    // Get SECONDARY projectile configuration
    const secondaryConfig = weaponData.secondaryProjectiles;

    if (!secondaryConfig) {
        console.error('[triggerSecondary] No secondaryProjectiles config found in weaponData');
        return;
    }

    // Get PRIMARY projectile's current position and velocity
    const primaryPos = primaryProjectile.body.position;
    const primaryVel = primaryProjectile.body.velocity;

    // Determine pattern type
    const pattern = secondaryConfig.pattern || 'RADIAL';
    const count = secondaryConfig.count || 5;

    // Generate spawn positions and velocities based on pattern
    let spawnData = [];

    if (pattern === 'RADIAL') {
        spawnData = createRadialPattern(primaryPos, primaryVel, secondaryConfig, count);
    } else if (pattern === 'CIRCLE') {
        spawnData = createCirclePattern(primaryPos, primaryVel, secondaryConfig, count);
    } else if (pattern === 'SWIRL') {
        spawnData = createSwirlPattern(primaryPos, primaryVel, secondaryConfig, count);
    } else {
        console.error(`[triggerSecondary] Unknown pattern: ${pattern}`);
        return;
    }

    // Create SECONDARY projectiles
    for (const spawn of spawnData) {
        const projectile = new Projectile(
            spawn.x,
            spawn.y,
            spawn.angle,
            weaponData,              // Full weaponData (not just secondaryConfig)
            primaryProjectile.color,
            primaryProjectile.ownerId,
            Matter,
            world,
            ProjectileRenderer,
            'SECONDARY'              // Stage parameter
        );

        projectiles.push(projectile);
    }

    // Destroy PRIMARY projectile (it has split)
    primaryProjectile.destroy();
}

/**
 * Create RADIAL pattern (arc spread)
 * Projectiles spread in an arc centered on PRIMARY's velocity direction
 *
 * @param {Object} pos - PRIMARY position {x, y}
 * @param {Object} vel - PRIMARY velocity {x, y}
 * @param {Object} config - SECONDARY projectile config
 * @param {number} count - Number of projectiles to spawn
 * @returns {Array<{x, y, angle}>} Spawn data for each projectile
 */
function createRadialPattern(pos, vel, config, count) {
    const spawnData = [];

    // Calculate PRIMARY's angle
    const primaryAngle = Math.atan2(vel.y, vel.x);

    // Arc parameters
    const arcAngle = config.arcAngle || (Math.PI / 3);  // Default: 60 degrees
    const startAngle = primaryAngle - arcAngle / 2;
    const angleStep = count > 1 ? arcAngle / (count - 1) : 0;

    // Create projectiles in arc
    for (let i = 0; i < count; i++) {
        const angle = startAngle + angleStep * i;

        spawnData.push({
            x: pos.x,
            y: pos.y,
            angle: angle
        });
    }

    return spawnData;
}

/**
 * Create CIRCLE pattern (360° spread)
 * Projectiles spread evenly in all directions
 *
 * @param {Object} pos - PRIMARY position {x, y}
 * @param {Object} vel - PRIMARY velocity {x, y} (not used, for consistency)
 * @param {Object} config - SECONDARY projectile config
 * @param {number} count - Number of projectiles to spawn
 * @returns {Array<{x, y, angle}>} Spawn data for each projectile
 */
function createCirclePattern(pos, vel, config, count) {
    const spawnData = [];

    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
        const angle = angleStep * i;

        spawnData.push({
            x: pos.x,
            y: pos.y,
            angle: angle
        });
    }

    return spawnData;
}

/**
 * Create SWIRL pattern (rotating arc)
 * Similar to RADIAL but rotates over time
 *
 * @param {Object} pos - PRIMARY position {x, y}
 * @param {Object} vel - PRIMARY velocity {x, y}
 * @param {Object} config - SECONDARY projectile config
 * @param {number} count - Number of projectiles to spawn
 * @returns {Array<{x, y, angle}>} Spawn data for each projectile
 */
function createSwirlPattern(pos, vel, config, count) {
    const spawnData = [];

    // Calculate PRIMARY's angle
    const primaryAngle = Math.atan2(vel.y, vel.x);

    // Swirl parameters
    const swirlRotation = config.swirlRotation || (Math.PI / 4);  // 45 degree rotation
    const arcAngle = config.arcAngle || (Math.PI / 3);  // 60 degree arc
    const startAngle = primaryAngle - arcAngle / 2 + swirlRotation;
    const angleStep = count > 1 ? arcAngle / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
        const angle = startAngle + angleStep * i;

        spawnData.push({
            x: pos.x,
            y: pos.y,
            angle: angle
        });
    }

    return spawnData;
}
