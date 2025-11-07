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
         * SHORT_BEAM: Short beam projectile (current: MISSILE, DOUBLE_MISSILE)
         * Config: { length, width, coreWidth, hasCore }
         */
        'SHORT_BEAM': (graphics, color, config) => {
            const colorHex = parseInt(color.replace('#', ''), 16);
            const length = config.length || 8;
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
     * @returns {PIXI.Graphics} PixiJS graphics object
     */
    createGraphics(type, color, weaponData) {
        const graphics = new PIXI.Graphics();

        // Get render type and config from weapon data
        const renderType = weaponData.renderType || 'SHORT_BEAM';  // Default fallback
        const renderConfig = weaponData.renderConfig || {
            length: 8,
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
        this.container.removeChild(sprite);
        sprite.destroy();
    }
};

export default ProjectileRenderer;
