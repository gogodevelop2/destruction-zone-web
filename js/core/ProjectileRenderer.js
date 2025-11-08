// ============================================
// ProjectileRenderer - PixiJS Projectile Rendering
// ============================================

/**
 * ProjectileRenderer - Manages all projectile rendering with PixiJS
 *
 * RESPONSIBILITIES:
 * - Create PixiJS sprites for projectiles using render type system
 * - Manage projectile container
 * - Handle sprite lifecycle (add/remove)
 *
 * DOES NOT HANDLE:
 * - Physics, collision, lifetime management (handled by Projectile class)
 *
 * === RENDER TYPE SYSTEM ===
 * Uses Strategy Pattern: Each render type has its own handler function
 * - Handler receives: (graphics, color, config)
 * - Weapon data specifies: renderType + renderConfig
 * - Easy to extend: Just add new handler to renderHandlers map
 *
 * === RENDER CONFIG INHERITANCE (IMPORTANT!) ===
 *
 * Each weapon in weapons.js specifies its own renderConfig:
 *
 *   MISSILE: {
 *       renderType: 'SHORT_BEAM',
 *       renderConfig: { length: 6, width: 2 }  // ← Individual config
 *   }
 *
 * The render handler uses these values:
 *
 *   'SHORT_BEAM': (graphics, color, config) => {
 *       const length = config.length || 6;  // ← Fallback if not specified
 *   }
 *
 * DESIGN DECISION (Option B):
 * - Each weapon explicitly specifies its renderConfig in weapons.js
 * - Renderer default values (||) are FALLBACK ONLY (safety net)
 * - Allows per-weapon customization (e.g., GUIDED=6, MISSILE=8)
 *
 * TO CHANGE ALL SHORT_BEAM WEAPONS:
 * - You must update each weapon's renderConfig in weapons.js
 * - Renderer defaults do NOT control weapon appearance
 *
 * ALTERNATIVE (Not implemented):
 * - Remove renderConfig from weapons.js entirely
 * - Renderer defaults become the single source of truth
 * - One change affects all weapons of that type
 */
const ProjectileRenderer = {
    container: null,

    /**
     * Render type handlers map
     * Each handler is a function: (graphics, color, config) => void
     *
     * Current implemented types:
     * - SHORT_BEAM: Short beam (8px), for missiles
     * - LONG_BEAM: Long beam (20px), for lasers
     *
     * Future expansion examples (commented out):
     * - CIRCLE: Traditional circular projectile
     * - STAR: Star-shaped projectile (for SWIRLER)
     * - HEXAGON: Hexagonal projectile (for BLASTER warhead)
     * - TRIANGLE: Triangle projectile
     */
    renderHandlers: {
        /**
         * SHORT_BEAM: Short beam projectile (current: MISSILE, DOUBLE_MISSILE, GUIDED)
         * Config: { length, width, coreWidth, hasCore }
         */
        'SHORT_BEAM': (graphics, color, config) => {
            const colorHex = parseInt(color.replace('#', ''), 16);
            const length = config.length || 6;  // Default changed from 8 to 6
            const width = config.width || 2;
            const coreWidth = config.coreWidth || 1;

            // Outer colored beam
            graphics.lineStyle(width, colorHex, 1);
            graphics.moveTo(-length/2, 0);
            graphics.lineTo(length/2, 0);

            // Inner white core (optional)
            if (config.hasCore) {
                graphics.lineStyle(coreWidth, 0xffffff, 1);
                graphics.moveTo(-length/2, 0);
                graphics.lineTo(length/2, 0);
            }
        },

        /**
         * LONG_BEAM: Long beam projectile (current: LASER)
         * Config: { length, width, coreWidth, hasCore }
         */
        'LONG_BEAM': (graphics, color, config) => {
            const colorHex = parseInt(color.replace('#', ''), 16);
            const length = config.length || 20;
            const width = config.width || 2;
            const coreWidth = config.coreWidth || 1;

            // Outer colored beam
            graphics.lineStyle(width, colorHex, 1);
            graphics.moveTo(-length/2, 0);
            graphics.lineTo(length/2, 0);

            // Inner white core (optional)
            if (config.hasCore) {
                graphics.lineStyle(coreWidth, 0xffffff, 1);
                graphics.moveTo(-length/2, 0);
                graphics.lineTo(length/2, 0);
            }
        },

        /**
         * CIRCLE: Circular projectile (current: BLASTER warheads, BOMB)
         * Config: { radius, fillAlpha, hasOutline, hasGlow }
         */
        'CIRCLE': (graphics, color, config) => {
            const colorHex = parseInt(color.replace('#', ''), 16);
            const radius = config.radius || 3;
            const fillAlpha = config.fillAlpha !== undefined ? config.fillAlpha : 1;

            // Optional glow effect (for warheads) - Draw first as background layer
            if (config.hasGlow) {
                // Create separate graphics for glow layer
                const glowGraphics = new PIXI.Graphics();
                glowGraphics.beginFill(colorHex, 0.8);  // Semi-transparent for glow
                glowGraphics.drawCircle(0, 0, radius * 1.5);  // Slightly larger
                glowGraphics.endFill();

                // Apply blur filter only to glow layer
                const blurFilter = new PIXI.filters.BlurFilter();
                blurFilter.blur = 2;
                blurFilter.quality = 2;
                glowGraphics.filters = [blurFilter];

                // Add glow layer to main graphics
                graphics.addChild(glowGraphics);
            }

            // Draw solid core (sharp, no blur)
            graphics.beginFill(colorHex, fillAlpha);
            graphics.drawCircle(0, 0, radius);
            graphics.endFill();

            // Optional white outline (for warheads)
            if (config.hasOutline) {
                graphics.lineStyle(1, 0xffffff, 0.8);
                graphics.drawCircle(0, 0, radius);
            }
        },

        /**
         * SMALL_CIRCLE: Small circular projectile (current: BLASTER secondary missiles)
         * Config: { radius }
         */
        'SMALL_CIRCLE': (graphics, color, config) => {
            const colorHex = parseInt(color.replace('#', ''), 16);
            const radius = config.radius || 1;  // Default 1px radius (2px diameter)

            // Solid filled circle
            graphics.beginFill(colorHex, 1);
            graphics.drawCircle(0, 0, radius);
            graphics.endFill();
        }

        // === FUTURE RENDER TYPES (Not implemented yet) ===
        // Add new types here when needed. Examples:
        //
        // 'STAR': (graphics, color, config) => {
        //     const colorHex = parseInt(color.replace('#', ''), 16);
        //     const points = config.points || 5;
        //     const outerRadius = config.outerRadius || 4;
        //     const innerRadius = config.innerRadius || 2;
        //
        //     graphics.beginFill(colorHex, 1);
        //     for (let i = 0; i < points * 2; i++) {
        //         const radius = i % 2 === 0 ? outerRadius : innerRadius;
        //         const angle = (Math.PI * i) / points;
        //         const x = Math.cos(angle) * radius;
        //         const y = Math.sin(angle) * radius;
        //         if (i === 0) graphics.moveTo(x, y);
        //         else graphics.lineTo(x, y);
        //     }
        //     graphics.closePath();
        //     graphics.endFill();
        // }
    },

    /**
     * Initialize renderer with PixiJS container
     * @param {PIXI.Container} pixiContainer - PixiJS container for projectiles
     */
    init(pixiContainer) {
        this.container = pixiContainer;
    },

    /**
     * Create PixiJS Graphics object using render type system
     * @param {string} type - Projectile type (not used anymore, kept for compatibility)
     * @param {string} color - CSS color string (e.g., '#00ff00')
     * @param {Object} weaponData - Weapon configuration data (must include renderType and renderConfig)
     * @returns {PIXI.Container|PIXI.Graphics} PixiJS container (if has trail) or graphics object
     */
    createGraphics(type, color, weaponData) {
        const graphics = new PIXI.Graphics();

        // Get render type and config from weapon data
        const renderType = weaponData.renderType || 'SHORT_BEAM';  // Default fallback
        const renderConfig = weaponData.renderConfig || {
            length: 6,  // Default changed from 8 to 6
            width: 2,
            coreWidth: 1,
            hasCore: true
        };

        // Get handler for this render type
        const handler = this.renderHandlers[renderType];

        if (handler) {
            handler(graphics, color, renderConfig);
        } else {
            // Fallback if handler not found
            console.warn(`[ProjectileRenderer] Unknown renderType: '${renderType}', using SHORT_BEAM fallback`);
            this.renderHandlers['SHORT_BEAM'](graphics, color, renderConfig);
        }

        // === TRAIL SUPPORT ===
        // If weapon has trail, create separate trail graphics (not as child)
        if (weaponData.hasTrail) {
            // Create trail graphics separately (will be added to main container, not as child)
            const trailGraphics = new PIXI.Graphics();
            trailGraphics.name = 'trail';

            // Store trail reference and config in main graphics
            graphics.trailGraphics = trailGraphics;
            graphics.color = color;
            graphics.trailConfig = weaponData.trailConfig || {};
            graphics.hasTrail = true;

            // Add trail graphics to main container first (render behind)
            this.container.addChild(trailGraphics);
        }

        return graphics;
    },

    /**
     * Add sprite to container
     * @param {PIXI.Graphics} sprite - PixiJS sprite to add
     */
    add(sprite) {
        this.container.addChild(sprite);
    },

    /**
     * Remove sprite from container and destroy
     * @param {PIXI.Graphics} sprite - PixiJS sprite to remove
     */
    remove(sprite) {
        // Remove trail graphics if exists
        if (sprite.trailGraphics) {
            this.container.removeChild(sprite.trailGraphics);
            sprite.trailGraphics.destroy();
        }

        // Remove main sprite
        this.container.removeChild(sprite);
        sprite.destroy();
    },

    /**
     * Update trail graphics for a projectile
     * @param {PIXI.Container} sprite - Projectile sprite (container with trail)
     * @param {Array<{x, y, angle, alpha}>} trailPositions - Trail position data from Projectile
     */
    updateTrail(sprite, trailPositions) {
        // Check if this sprite has trail graphics
        if (!sprite.trailGraphics) return;

        const trailGraphics = sprite.trailGraphics;
        const trailConfig = sprite.trailConfig;
        const lineWidth = trailConfig.width || 1;      // Line thickness
        const lineLength = trailConfig.length || 3;    // Line length

        // Clear previous trail
        trailGraphics.clear();

        // Don't render if no positions
        if (!trailPositions || trailPositions.length === 0) return;

        // Draw trail as series of small line segments with fading alpha
        // Use trail color if specified, otherwise use projectile color
        const trailColor = trailConfig.color || sprite.color;
        const colorHex = parseInt(trailColor.replace('#', ''), 16);

        for (let i = 0; i < trailPositions.length; i++) {
            const pos = trailPositions[i];

            // Skip if alpha is too low
            if (pos.alpha <= 0.01) continue;

            // Calculate line endpoints based on angle and length
            const halfLength = lineLength / 2;
            const x1 = pos.x - Math.cos(pos.angle) * halfLength;
            const y1 = pos.y - Math.sin(pos.angle) * halfLength;
            const x2 = pos.x + Math.cos(pos.angle) * halfLength;
            const y2 = pos.y + Math.sin(pos.angle) * halfLength;

            // Draw line segment
            trailGraphics.lineStyle(lineWidth, colorHex, pos.alpha);
            trailGraphics.moveTo(x1, y1);
            trailGraphics.lineTo(x2, y2);
        }
    }
};

export default ProjectileRenderer;
