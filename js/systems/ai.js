// ============================================
// AI System
// ============================================

const AI_FIRE_COOLDOWN = 1.5;  // seconds
const aiState = new Map();  // Store AI state per tank

/**
 * Initialize AI state for a tank
 * @param {Tank} tank - Tank to initialize AI for
 */
export function initAI(tank) {
    aiState.set(tank, {
        fireCooldown: 0
    });
}

/**
 * Update AI for a tank
 * @param {Tank} aiTank - AI controlled tank
 * @param {Tank} targetTank - Target tank (usually player)
 * @param {number} deltaTime - Time since last frame
 * @param {Function} fireProjectile - Callback to fire projectile
 */
export function updateAI(aiTank, targetTank, deltaTime, fireProjectile) {
    // Don't do anything if either tank is destroyed
    if (!aiTank.alive || !targetTank.alive) return;

    // Get or initialize AI state
    let state = aiState.get(aiTank);
    if (!state) {
        initAI(aiTank);
        state = aiState.get(aiTank);
    }

    // Calculate vector to target
    const dx = targetTank.body.position.x - aiTank.body.position.x;
    const dy = targetTank.body.position.y - aiTank.body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToTarget = Math.atan2(dy, dx);

    // Calculate angle difference
    let angleDiff = angleToTarget - aiTank.body.angle;

    // Normalize angle difference to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Rotate towards target
    if (Math.abs(angleDiff) > 0.05) {  // 약 3도 - 더 정밀한 조준
        aiTank.rotation = angleDiff > 0 ? 1 : -1;
    } else {
        aiTank.rotation = 0;
    }

    // Move towards target if too far, back away if too close
    if (distance > 200) {
        aiTank.thrust = 1;
    } else if (distance < 150) {
        aiTank.thrust = -1;
    } else {
        aiTank.thrust = 0;
    }

    // Fire at target if aimed correctly (약 3도 이내)
    state.fireCooldown -= deltaTime;
    if (Math.abs(angleDiff) < 0.05 && state.fireCooldown <= 0) {
        fireProjectile(aiTank);
        state.fireCooldown = AI_FIRE_COOLDOWN;
    }
}

/**
 * Update all AI tanks
 * @param {Array<Tank>} aiTanks - Array of AI tanks
 * @param {Tank} targetTank - Target tank
 * @param {number} deltaTime - Time since last frame
 * @param {Function} fireProjectile - Callback to fire projectile
 */
export function updateAllAI(aiTanks, targetTank, deltaTime, fireProjectile) {
    aiTanks.forEach(aiTank => {
        updateAI(aiTank, targetTank, deltaTime, fireProjectile);
    });
}
