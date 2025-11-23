// ============================================
// TrailManager - Trail Management System (Option D)
// ============================================

/**
 * TrailManager - Manages all trail effects with complete data ownership
 *
 * DESIGN PHILOSOPHY (Option D):
 * - TrailManager owns ALL trail data (positions, config, graphics)
 * - Projectile only stores trail ID (no trail data)
 * - Single Map for both attached and independent trails
 * - Simple flag (attached) to distinguish projectile state
 *
 * RESPONSIBILITIES:
 * - Create trails and return trail ID
 * - Accept position updates from Projectile
 * - Handle spacing, fade, rendering
 * - Manage trail lifecycle (attached → independent → destroy)
 *
 * USAGE:
 * 1. Init: TrailManager.init(pixiContainer)
 * 2. Create: trailId = TrailManager.createTrail(graphics, config)
 * 3. Add Position: TrailManager.addPosition(trailId, {x, y, angle})
 * 4. Detach: TrailManager.detachTrail(trailId)
 * 5. Update: TrailManager.updateTrails(deltaTime) in game loop
 *
 * === FADE RATE SYSTEM (IMPORTANT) ===
 *
 * fadeRate: Per-frame alpha 감소량 (NOT per-second!)
 * - 값이 클수록 빠르게 페이드 (짧은 트레일)
 * - 값이 작을수록 느리게 페이드 (긴 트레일)
 *
 * 계산 예시 (60 FPS):
 * - fadeRate: 0.12, initialAlpha: 0.6 → 5 frames = 0.08초 (짧음)
 * - fadeRate: 0.03, initialAlpha: 0.6 → 20 frames = 0.33초 (길음)
 *
 * 시각적 트레일 길이:
 * - 보이는 위치 개수 = initialAlpha / fadeRate
 * - 트레일 길이(px) = (보이는 위치 개수) × spacing
 *
 * === ATTACHED vs INDEPENDENT TRAILS ===
 *
 * Attached (탄두 생존 중):
 * - positions[0] (머리): 페이드 안함 (매 프레임 새로 추가되므로)
 * - positions[1~N] (꼬리): 페이드 진행
 * - 탄두가 지나간 자리에 잔상을 남김
 *
 * Independent (탄두 소멸 후):
 * - 모든 위치 페이드 진행
 * - 꼬리부터 서서히 사라짐
 * - 모든 위치 사라지면 trail 제거
 */
const TrailManager = {
    // === STATE ===
    trails: new Map(),           // Map<id, Trail> - All trails (attached and independent)
    nextId: 1,                   // Auto-increment ID
    container: null,             // PixiJS Container reference

    /**
     * Initialize TrailManager with PixiJS container
     * @param {PIXI.Container} pixiContainer - PixiJS container for trails
     */
    init(pixiContainer) {
        this.container = pixiContainer;
        this.trails.clear();
        this.nextId = 1;
        console.log('[TrailManager] Initialized');
    },

    /**
     * Create a new trail (called from Projectile constructor)
     * @param {PIXI.Graphics} graphics - PixiJS graphics object
     * @param {Object} config - Trail configuration
     * @returns {number} Trail ID
     */
    createTrail(graphics, config) {
        const id = this.nextId++;

        const trail = {
            id: id,
            graphics: graphics,
            positions: [],
            config: {
                maxLength: config.maxLength || 36,
                fadeRate: config.fadeRate || 0.12,
                spacing: config.spacing || 0,
                color: config.color || '#ffffff',
                width: config.width || 1,
                length: config.length || 3,
                initialAlpha: config.initialAlpha || 0.6
            },
            attached: true,          // true = projectile alive, false = independent
            lastPosition: null,      // For spacing calculation
            distanceCounter: 0
        };

        this.trails.set(id, trail);
        console.log(`[TrailManager] Created trail #${id}`);
        return id;
    },

    /**
     * Add position to trail (called from Projectile.update)
     * @param {number} trailId - Trail ID
     * @param {Object} position - {x, y, angle}
     */
    addPosition(trailId, position) {
        const trail = this.trails.get(trailId);
        if (!trail) return;

        // Spacing check
        if (trail.config.spacing > 0 && trail.lastPosition) {
            const dx = position.x - trail.lastPosition.x;
            const dy = position.y - trail.lastPosition.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            trail.distanceCounter += dist;

            if (trail.distanceCounter < trail.config.spacing) {
                return;  // Skip this position
            }
            trail.distanceCounter = 0;
        }

        // Add position with initial alpha
        trail.positions.unshift({
            x: position.x,
            y: position.y,
            angle: position.angle,
            alpha: trail.config.initialAlpha
        });

        trail.lastPosition = position;

        // Limit length
        if (trail.positions.length > trail.config.maxLength) {
            trail.positions.pop();
        }
    },

    /**
     * Detach trail from projectile (called from Projectile.destroy)
     * @param {number} trailId - Trail ID
     */
    detachTrail(trailId) {
        const trail = this.trails.get(trailId);
        if (!trail) return;

        trail.attached = false;  // Simple flag change!
        console.log(`[TrailManager] Detached trail #${trailId}`);
    },

    /**
     * Update all trails (called from Game.js)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateTrails(deltaTime) {
        const toDelete = [];

        for (const [id, trail] of this.trails) {
            // === FADE POSITIONS ===
            if (trail.attached) {
                // Attached trail - fade normally (skip first position)
                // positions[0]은 매 프레임 새로 추가되는 최신 위치이므로 페이드 안함
                // positions[1~N]은 과거 위치이므로 페이드 진행
                for (let i = 1; i < trail.positions.length; i++) {
                    trail.positions[i].alpha -= trail.config.fadeRate;
                    if (trail.positions[i].alpha < 0) trail.positions[i].alpha = 0;
                }
            } else {
                // Independent trail - fade all positions
                // 탄두 소멸 후 독립 트레일: 모든 위치가 페이드되어 사라짐
                for (const pos of trail.positions) {
                    pos.alpha -= trail.config.fadeRate;
                    if (pos.alpha < 0) pos.alpha = 0;
                }
            }

            // === REMOVE FADED POSITIONS ===
            // 꼬리(마지막 위치)부터 제거 (머리는 유지)
            // positions 배열: [0]=머리(최신), [N]=꼬리(오래됨)
            while (trail.positions.length > 0 &&
                   trail.positions[trail.positions.length - 1].alpha <= 0.01) {
                trail.positions.pop();
            }

            // Render trail
            this.renderTrail(trail);

            // Mark for cleanup if independent and empty
            if (!trail.attached && trail.positions.length === 0) {
                toDelete.push(id);
            }
        }

        // Clean up completed trails
        for (const id of toDelete) {
            this.destroyTrail(id);
        }
    },

    /**
     * Render trail graphics
     * @param {Object} trail - Trail object
     */
    renderTrail(trail) {
        const graphics = trail.graphics;
        const config = trail.config;
        const positions = trail.positions;

        // Clear previous frame
        graphics.clear();

        if (positions.length === 0) return;

        // Parse color
        const colorHex = parseInt(config.color.replace('#', ''), 16);

        // Draw trail as series of line segments
        for (const pos of positions) {
            // Skip if too faded
            if (pos.alpha <= 0.01) continue;

            // Calculate line endpoints
            const halfLength = config.length / 2;
            const x1 = pos.x - Math.cos(pos.angle) * halfLength;
            const y1 = pos.y - Math.sin(pos.angle) * halfLength;
            const x2 = pos.x + Math.cos(pos.angle) * halfLength;
            const y2 = pos.y + Math.sin(pos.angle) * halfLength;

            // Draw line segment
            graphics.lineStyle(config.width, colorHex, pos.alpha);
            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
        }
    },

    /**
     * Destroy a specific trail
     * @param {number} id - Trail ID
     */
    destroyTrail(id) {
        const trail = this.trails.get(id);
        if (!trail) return;

        // Remove graphics from container
        if (trail.graphics && this.container) {
            this.container.removeChild(trail.graphics);
            trail.graphics.destroy();
        }

        // Remove from map
        this.trails.delete(id);

        console.log(`[TrailManager] Destroyed trail #${id}`);
    },

    /**
     * Clean up all trails (for scene reset)
     */
    cleanup() {
        for (const [id] of this.trails) {
            this.destroyTrail(id);
        }
        this.trails.clear();
        console.log('[TrailManager] Cleaned up all trails');
    }
};

export default TrailManager;
