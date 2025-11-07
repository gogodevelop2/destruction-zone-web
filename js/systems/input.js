// ============================================
// Input System
// ============================================

import { triggerSecondary } from './projectileEffects.js';

// Keyboard state
const keys = {};

/**
 * Setup keyboard event listeners
 */
export function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        // Prevent arrow key scrolling and space bar scrolling
        if (e.code.startsWith('Arrow') || e.code === 'Space') {
            e.preventDefault();
        }
        keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
        // Prevent arrow key scrolling and space bar scrolling
        if (e.code.startsWith('Arrow') || e.code === 'Space') {
            e.preventDefault();
        }
        keys[e.code] = false;

        // Reset fire flag for Space
        if (e.code === 'Space') {
            keys['Space_fired'] = false;
        }
    });
}

/**
 * Handle player input and update tank
 * @param {Tank} playerTank - Player tank object
 * @param {Function} fireProjectile - Callback to fire projectile
 * @param {Object} WEAPON_DATA - Weapon data registry
 * @param {Matter} Matter - Matter.js library reference
 * @param {Matter.World} world - Matter.js world
 * @param {Array} projectiles - Projectiles array
 * @param {Class} Projectile - Projectile class constructor
 * @param {Object} ProjectileRenderer - Projectile renderer
 */
export function handleInput(playerTank, fireProjectile, WEAPON_DATA, Matter, world, projectiles, Projectile, ProjectileRenderer) {
    // Thrust
    if (keys['ArrowUp']) {
        playerTank.thrust = 1;
    } else if (keys['ArrowDown']) {
        playerTank.thrust = -1;
    }

    // Rotation (car-like steering)
    const steeringDirection = playerTank.thrust >= 0 ? 1 : -1;

    if (keys['ArrowLeft']) {
        playerTank.rotation = -1 * steeringDirection;
    } else if (keys['ArrowRight']) {
        playerTank.rotation = 1 * steeringDirection;
    }

    // Fire projectile (Space key)
    if (keys['Space'] && !keys['Space_fired']) {
        const weaponData = WEAPON_DATA[playerTank.currentWeapon];

        if (!weaponData.projectileType || weaponData.projectileType === 'SIMPLE') {
            // Simple weapon: Use existing fireProjectile()
            fireProjectile(playerTank);
        } else if (weaponData.projectileType === 'TWO_STAGE') {
            // Two-stage weapon: Toggle fire/trigger
            fireTwoStageWeapon(playerTank, weaponData, Matter, world, projectiles, Projectile, ProjectileRenderer);
        }

        keys['Space_fired'] = true;
    }

    // Weapon switching (1, 2, 3, 4, 5, 6 keys)
    if (keys['Digit1']) {
        playerTank.switchWeapon('MISSILE', WEAPON_DATA);
        keys['Digit1'] = false;
    }
    if (keys['Digit2']) {
        playerTank.switchWeapon('LASER', WEAPON_DATA);
        keys['Digit2'] = false;
    }
    if (keys['Digit3']) {
        playerTank.switchWeapon('DOUBLE_MISSILE', WEAPON_DATA);
        keys['Digit3'] = false;
    }
    if (keys['Digit4']) {
        playerTank.switchWeapon('TRIPLE_MISSILE', WEAPON_DATA);
        keys['Digit4'] = false;
    }
    if (keys['Digit5']) {
        playerTank.switchWeapon('POWER_LASER', WEAPON_DATA);
        keys['Digit5'] = false;
    }
    if (keys['Digit6']) {
        playerTank.switchWeapon('BLASTER', WEAPON_DATA);
        keys['Digit6'] = false;
    }

    // Debug toggle - Moved to Renderer.js (D key)
}

/**
 * Calculate firing positions based on fire pattern
 * @param {Tank} tank - Tank object
 * @param {string} firePattern - 'CENTER', 'SIDES', or 'ALL'
 * @returns {Array<{x, y}>} Array of spawn positions
 */
function getFirePoints(tank, firePattern) {
    const size = tank.config.size * 0.8;
    const tankPos = tank.body.position;
    const tankAngle = tank.body.angle;
    const perpAngle = tankAngle + Math.PI / 2;

    // Center point: triangle front tip (0.75 * size forward)
    const centerDistance = size * 0.75 + 5;
    // Side points: 5px back from center
    const sideDistance = centerDistance - 5;
    // Side spacing: ±6px from centerline
    const sideSpacing = 6;

    const points = [];

    // CENTER pattern or ALL pattern includes center point
    if (firePattern === 'CENTER' || firePattern === 'ALL') {
        points.push({
            x: tankPos.x + Math.cos(tankAngle) * centerDistance,
            y: tankPos.y + Math.sin(tankAngle) * centerDistance
        });
    }

    // SIDES pattern or ALL pattern includes left and right points
    if (firePattern === 'SIDES' || firePattern === 'ALL') {
        // Left point (negative perpendicular offset)
        points.push({
            x: tankPos.x + Math.cos(tankAngle) * sideDistance + Math.cos(perpAngle) * (-sideSpacing),
            y: tankPos.y + Math.sin(tankAngle) * sideDistance + Math.sin(perpAngle) * (-sideSpacing)
        });
        // Right point (positive perpendicular offset)
        points.push({
            x: tankPos.x + Math.cos(tankAngle) * sideDistance + Math.cos(perpAngle) * sideSpacing,
            y: tankPos.y + Math.sin(tankAngle) * sideDistance + Math.sin(perpAngle) * sideSpacing
        });
    }

    return points;
}

/**
 * Handle two-stage weapon firing (BLASTER, BREAKER, BOMB)
 * Fire key toggles between PRIMARY fire and SECONDARY trigger
 * @param {Tank} tank - Tank firing the weapon
 * @param {Object} weaponData - Weapon data
 * @param {Matter} Matter - Matter.js library reference
 * @param {Matter.World} world - Matter.js world
 * @param {Array} projectiles - Projectiles array
 * @param {Class} Projectile - Projectile class constructor
 * @param {Object} ProjectileRenderer - Projectile renderer
 */
function fireTwoStageWeapon(tank, weaponData, Matter, world, projectiles, Projectile, ProjectileRenderer) {
    if (tank.activePrimary) {
        // MODE 2: Trigger existing PRIMARY → Create SECONDARY
        triggerSecondary(tank.activePrimary, weaponData, Matter, world, projectiles, Projectile, ProjectileRenderer);

        // Reset state
        tank.activePrimary = null;
        tank.canFirePrimary = true;

    } else if (tank.canFirePrimary) {
        // MODE 1: Fire new PRIMARY

        // Check energy
        if (tank.weaponEnergy < weaponData.energyCost) {
            return; // Not enough energy
        }

        // Consume energy
        tank.weaponEnergy -= weaponData.energyCost;

        // Fire PRIMARY projectile
        const primary = firePrimaryProjectile(tank, weaponData, Matter, world, projectiles, Projectile, ProjectileRenderer);

        // Update state
        tank.activePrimary = primary;
        tank.canFirePrimary = false;
    }
}

/**
 * Fire PRIMARY projectile (warhead, bomb)
 * @param {Tank} tank - Tank firing the weapon
 * @param {Object} weaponData - Weapon data
 * @param {Matter} Matter - Matter.js reference
 * @param {Matter.World} world - Matter.js world
 * @param {Array} projectiles - Projectiles array
 * @param {Class} Projectile - Projectile class
 * @param {Object} ProjectileRenderer - Projectile renderer
 * @returns {Projectile} The created PRIMARY projectile
 */
function firePrimaryProjectile(tank, weaponData, Matter, world, projectiles, Projectile, ProjectileRenderer) {
    const primaryConfig = weaponData.primaryProjectile;
    const firePattern = primaryConfig.firePattern || 'CENTER';
    const firePoints = getFirePoints(tank, firePattern);

    // PRIMARY usually fires 1 projectile (but firePattern supported)
    const point = firePoints[0];

    const projectile = new Projectile(
        point.x,
        point.y,
        tank.body.angle,
        weaponData,              // Full weaponData (not just primaryConfig)
        tank.config.color,
        tank.id,
        Matter,
        world,
        ProjectileRenderer,
        'PRIMARY'                // Stage parameter
    );

    projectiles.push(projectile);
    return projectile;
}

/**
 * Fire a projectile from a tank
 * @param {Tank} tank - Tank firing the projectile
 * @param {Object} WEAPON_DATA - Weapon data registry
 * @param {Array} projectiles - Projectiles array
 * @param {Class} Projectile - Projectile class constructor
 * @param {Matter} Matter - Matter.js reference
 * @param {Matter.World} world - Matter.js world
 * @param {Object} ProjectileRenderer - Projectile renderer
 */
export function fireProjectile(tank, WEAPON_DATA, projectiles, Projectile, Matter, world, ProjectileRenderer) {
    // Can't fire if destroyed
    if (!tank.alive) return;

    // Get weapon data from tank's current weapon
    const weaponData = WEAPON_DATA[tank.currentWeapon];
    if (!weaponData) {
        console.error(`Unknown weapon type: ${tank.currentWeapon}`);
        return;
    }

    // Check if enough energy
    if (tank.weaponEnergy < weaponData.energyCost) {
        return; // Not enough energy
    }

    // Consume weapon energy
    tank.weaponEnergy -= weaponData.energyCost;

    // Get fire pattern from weapon data
    const firePattern = weaponData.firePattern || 'CENTER';

    // Get firing positions based on pattern
    const firePoints = getFirePoints(tank, firePattern);

    // Create projectile at each fire point
    for (const point of firePoints) {
        const projectile = new Projectile(
            point.x,
            point.y,
            tank.body.angle,
            weaponData,
            tank.config.color,
            tank.id,  // ownerId
            Matter,
            world,
            ProjectileRenderer
        );
        projectiles.push(projectile);
    }
}
