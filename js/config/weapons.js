// ============================================
// Weapon Data Configuration
// ============================================

/**
 * Speed scale factor: DOS game units → Web canvas pixels
 * DOS game had smaller resolution, so we scale down
 * Original MISSILE speed: 200 (DOS units) → 2 px/s (web)
 */
export const SPEED_SCALE_FACTOR = 0.01;  // 200 * 0.01 = 2

/**
 * Weapon Data (from original game, speeds in DOS units)
 * Each weapon has damage, energy cost, speed, price, visual properties
 */
export const WEAPON_DATA = {
    MISSILE: {
        name: 'MISSILE',
        type: 'MISSILE',
        damage: 4,
        energyCost: 4,
        speed: 200,        // DOS units
        price: 2,
        color: '#ffff00',  // Yellow
        lifetime: 3.0,
        size: 2
    },
    LASER: {
        name: 'BEAM LASER',
        type: 'LASER',
        damage: 6,
        energyCost: 6,
        speed: 400,        // DOS units (2x faster than missile)
        price: 150,
        color: '#ff0000',  // Red
        lifetime: 2.0,
        size: 1.5
    },
    DOUBLE_MISSILE: {
        name: 'DOUBLE MISSILE',
        type: 'DOUBLE_MISSILE',
        damage: 6,
        energyCost: 4,
        speed: 200,        // DOS units
        price: 100,
        color: '#ffff00',  // Yellow
        lifetime: 3.0,
        size: 2,
        projectileCount: 2  // Fires 2 projectiles
    }
};
