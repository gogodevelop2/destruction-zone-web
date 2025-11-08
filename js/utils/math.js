// ============================================
// Math Utilities
// ============================================

/**
 * Normalize angle to -π ~ π range
 * Determines the shortest rotation direction
 *
 * @param {number} angle - Angle in radians
 * @returns {number} Normalized angle in range [-π, π]
 *
 * @example
 * normalizeAngle(Math.PI * 3)   // Returns Math.PI
 * normalizeAngle(-Math.PI * 3)  // Returns -Math.PI
 * normalizeAngle(0.5)           // Returns 0.5
 */
export function normalizeAngle(angle) {
    while (angle > Math.PI) {
        angle -= Math.PI * 2;
    }
    while (angle < -Math.PI) {
        angle += Math.PI * 2;
    }
    return angle;
}
