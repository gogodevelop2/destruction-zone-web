// ============================================
// Input System
// ============================================

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
 */
export function handleInput(playerTank, fireProjectile, WEAPON_DATA) {
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
        fireProjectile(playerTank);
        keys['Space_fired'] = true;
    }

    // Weapon switching (1, 2, 3 keys)
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

    // Debug toggle - Moved to Renderer.js (D key)
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

    const size = tank.config.size * 0.8;
    // 삼각형 앞 끝에서 생성
    const barrelLength = size * 0.75 + 5;

    // Multi-projectile weapons
    const projectileCount = weaponData.projectileCount || 1;

    if (projectileCount === 1) {
        // Single projectile (MISSILE, LASER)
        const spawnX = tank.body.position.x + Math.cos(tank.body.angle) * barrelLength;
        const spawnY = tank.body.position.y + Math.sin(tank.body.angle) * barrelLength;

        const projectile = new Projectile(
            spawnX,
            spawnY,
            tank.body.angle,
            weaponData,
            tank.config.color,
            tank.id,  // ownerId
            Matter,
            world,
            ProjectileRenderer
        );
        projectiles.push(projectile);
    } else {
        // Multiple projectiles (DOUBLE_MISSILE: 2개를 좌우로)
        const spacing = 6;
        const perpAngle = tank.body.angle + Math.PI / 2;

        for (let i = 0; i < projectileCount; i++) {
            const offset = (i - (projectileCount - 1) / 2) * spacing;

            const spawnX = tank.body.position.x +
                           Math.cos(tank.body.angle) * barrelLength +
                           Math.cos(perpAngle) * offset;
            const spawnY = tank.body.position.y +
                           Math.sin(tank.body.angle) * barrelLength +
                           Math.sin(perpAngle) * offset;

            const projectile = new Projectile(
                spawnX,
                spawnY,
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
}
