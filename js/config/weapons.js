// ============================================
// Weapon Data Configuration
// ============================================

/**
 * Speed scale factor: DOS game units → Web canvas pixels
 * DOS original MISSILE speed: 5 (DOS units) → 2 px/frame (web)
 * Scale factor: 2 / 5 = 0.4
 */
export const SPEED_SCALE_FACTOR = 0.4;  // 5 * 0.4 = 2

/**
 * Weapon Data (from original game, speeds in DOS units)
 * Each weapon has damage, energy cost, speed, price, visual properties
 *
 * isSensor property:
 * - false: Physical projectile (applies collision forces, can push tanks)
 * - true: Energy weapon (collision detection only, no physical forces)
 *
 * Note: High-speed projectiles (e.g., LASER at 18 px/frame) with isSensor=false
 * can cause excessive tank push due to deep penetration (>4px) between physics steps.
 * Setting isSensor=true prevents this while maintaining accurate collision detection.
 */
export const WEAPON_DATA = {
    MISSILE: {
        name: 'MISSILE',
        type: 'MISSILE',
        damage: 4,
        energyCost: 4,
        speed: 5,          // DOS original (5 * 0.4 = 2.0 px/frame)
        price: 2,
        color: '#ffff00',  // Yellow
        lifetime: 3.0,
        size: 2,
        density: 0.4,      // Matter.js density (affects mass and collision impact)
        isSensor: false    // Physical projectile (can push tanks slightly)
    },
    LASER: {
        name: 'BEAM LASER',
        type: 'LASER',
        damage: 6,
        energyCost: 6,
        speed: 45,         // DOS original (45 * 0.4 = 18.0 px/frame, 9x faster than MISSILE)
        price: 150,
        color: '#ff0000',  // Red
        lifetime: 2.0,
        size: 1.5,
        density: 0.00001,  // Extremely light (light beam, almost massless)
        isSensor: true     // Energy weapon (no physical impact, prevents excessive push from high-speed penetration)
    },
    DOUBLE_MISSILE: {
        name: 'DOUBLE MISSILE',
        type: 'DOUBLE_MISSILE',
        damage: 6,
        energyCost: 4,
        speed: 6,          // DOS original (6 * 0.4 = 2.4 px/frame, 1.2x faster than MISSILE)
        price: 100,
        color: '#ffff00',  // Yellow
        lifetime: 3.0,
        size: 2,
        density: 0.4,      // Same as MISSILE
        isSensor: false,   // Physical projectile (can push tanks slightly)
        projectileCount: 2  // Fires 2 projectiles
    }
};
