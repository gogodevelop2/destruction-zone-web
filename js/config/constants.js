// ============================================
// Game Constants
// ============================================

/**
 * Collision Categories (bit flags)
 * Used by Matter.js collision filtering system
 */
export const COLLISION_CATEGORY = {
    TANK: 0x0001,        // 0001
    PROJECTILE: 0x0002,  // 0010
    WALL: 0x0004         // 0100
};

/**
 * Safe zone spawn positions (center of each safe zone)
 * Each position is the center of a 133x133 safe zone
 */
export const SAFE_ZONE_SPAWNS = [
    { x: 0 + 133/2, y: 0 + 133/2 },           // 1: Top-left center (66.5, 66.5)
    { x: 827 + 133/2, y: 587 + 133/2 },       // 2: Bottom-right center (893.5, 653.5)
    { x: 827 + 133/2, y: 0 + 133/2 },         // 3: Top-right center (893.5, 66.5)
    { x: 0 + 133/2, y: 587 + 133/2 },         // 4: Bottom-left center (66.5, 653.5)
    { x: 413 + 133/2, y: 0 + 133/2 },         // 5: Top-middle center (479.5, 66.5)
    { x: 413 + 133/2, y: 587 + 133/2 }        // 6: Bottom-middle center (479.5, 653.5)
];

/**
 * Canvas dimensions
 */
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 720;

/**
 * Visual margin to prevent stroke/shadow clipping
 * Physics boundaries are inset by this amount
 */
export const VISUAL_MARGIN = 3;

/**
 * Wall thickness
 */
export const WALL_THICKNESS = 10;

/**
 * Game physics settings
 */
export const PHYSICS = {
    GRAVITY_Y: 0,
    POSITION_ITERATIONS: 10,
    VELOCITY_ITERATIONS: 8,
    FIXED_TIMESTEP: 1/60  // 60 FPS
};

/**
 * Tank configuration
 */
export const TANK_CONFIG = {
    SIZE: 30,
    THRUST_POWER: 0.01,
    ROTATION_SPEED: 0.01,
    MAX_HEALTH: 100,
    MAX_ENERGY: 100,
    ENERGY_RECHARGE_RATE: 10  // per second
};
