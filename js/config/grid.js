// ============================================
// Grid System Configuration
// ============================================

/**
 * Grid size in pixels (matches visual background grid)
 */
export const GRID_SIZE = 60;

/**
 * Grid dimensions
 * Canvas: 960x720
 * Cols: 960 / 60 = 16
 * Rows: 720 / 60 = 12
 */
export const GRID_COLS = 16;
export const GRID_ROWS = 12;

/**
 * Grid utility functions
 */
export const Grid = {
    /**
     * Convert grid column to world X coordinate (cell center)
     * @param {number} col - Grid column (0-15)
     * @returns {number} World X coordinate
     */
    toWorldX(col) {
        return col * GRID_SIZE + GRID_SIZE / 2;
    },

    /**
     * Convert grid row to world Y coordinate (cell center)
     * @param {number} row - Grid row (0-11)
     * @returns {number} World Y coordinate
     */
    toWorldY(row) {
        return row * GRID_SIZE + GRID_SIZE / 2;
    },

    /**
     * Convert world X coordinate to grid column
     * @param {number} worldX - World X coordinate
     * @returns {number} Grid column
     */
    toGridCol(worldX) {
        return Math.floor(worldX / GRID_SIZE);
    },

    /**
     * Convert world Y coordinate to grid row
     * @param {number} worldY - World Y coordinate
     * @returns {number} Grid row
     */
    toGridRow(worldY) {
        return Math.floor(worldY / GRID_SIZE);
    },

    /**
     * Check if grid cell is valid (within bounds)
     * @param {number} col - Grid column
     * @param {number} row - Grid row
     * @returns {boolean}
     */
    isValid(col, row) {
        return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
    },

    /**
     * Get safe zone cells around a spawn point
     * Returns the 4 closest grid cells to the spawn point
     *
     * @param {number} spawnX - Spawn point X coordinate
     * @param {number} spawnY - Spawn point Y coordinate
     * @returns {Array<{col: number, row: number}>} Array of 4 closest grid cells
     */
    getSafeZoneCells(spawnX, spawnY) {
        // Get all candidate cells in a 3x3 area around spawn
        const centerCol = this.toGridCol(spawnX);
        const centerRow = this.toGridRow(spawnY);

        const candidates = [];

        for (let dc = -1; dc <= 1; dc++) {
            for (let dr = -1; dr <= 1; dr++) {
                const col = centerCol + dc;
                const row = centerRow + dr;

                if (this.isValid(col, row)) {
                    // Calculate distance from spawn to cell center
                    const cellCenterX = this.toWorldX(col);
                    const cellCenterY = this.toWorldY(row);
                    const dx = spawnX - cellCenterX;
                    const dy = spawnY - cellCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    candidates.push({ col, row, distance });
                }
            }
        }

        // Sort by distance and take closest 4
        candidates.sort((a, b) => a.distance - b.distance);

        return candidates.slice(0, 4).map(c => ({ col: c.col, row: c.row }));
    },

    /**
     * Check if a grid cell is in any safe zone
     * @param {number} col - Grid column to check
     * @param {number} row - Grid row to check
     * @param {Array<{x, y}>} spawnPoints - Array of spawn points
     * @returns {boolean} True if cell is in any safe zone
     */
    isInSafeZone(col, row, spawnPoints) {
        for (const spawn of spawnPoints) {
            const safeCells = this.getSafeZoneCells(spawn.x, spawn.y);
            if (safeCells.some(cell => cell.col === col && cell.row === row)) {
                return true;
            }
        }
        return false;
    }
};
