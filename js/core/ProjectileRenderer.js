// ============================================
// ProjectileRenderer - PixiJS Projectile Rendering
// ============================================

/**
 * ProjectileRenderer - Manages all projectile rendering with PixiJS
 *
 * RESPONSIBILITIES:
 * - Create PixiJS sprites for projectiles
 * - Manage projectile container
 * - Handle sprite lifecycle (add/remove)
 *
 * DOES NOT HANDLE:
 * - Physics, collision, lifetime management (handled by Projectile class)
 */
const ProjectileRenderer = {
    container: null,

    /**
     * Initialize renderer with PixiJS container
     * @param {PIXI.Container} pixiContainer - PixiJS container for projectiles
     */
    init(pixiContainer) {
        this.container = pixiContainer;
    },

    /**
     * Create PixiJS Graphics object for projectile
     * @param {string} type - Projectile type ('LASER' or 'MISSILE')
     * @param {string} color - CSS color string (e.g., '#00ff00')
     * @param {Object} weaponData - Weapon configuration data
     * @returns {PIXI.Graphics} PixiJS graphics object
     */
    createGraphics(type, color, weaponData) {
        const graphics = new PIXI.Graphics();

        // Convert CSS color string to hex number (e.g., '#00ff00' → 0x00ff00)
        const colorHex = parseInt(color.replace('#', ''), 16);

        if (type === 'LASER') {
            // Laser: Long beam with white core
            const beamLength = 20;

            // Outer colored beam
            graphics.lineStyle(2, colorHex, 1);
            graphics.moveTo(-beamLength/2, 0);
            graphics.lineTo(beamLength/2, 0);

            // Inner white core
            graphics.lineStyle(1, 0xffffff, 1);
            graphics.moveTo(-beamLength/2, 0);
            graphics.lineTo(beamLength/2, 0);

            // No BlurFilter for clean rendering and better performance

        } else {
            // Missile/Other: Circle
            graphics.beginFill(colorHex, 1);
            graphics.drawCircle(0, 0, weaponData.size);
            graphics.endFill();

            // No BlurFilter for clean rendering and better performance
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
