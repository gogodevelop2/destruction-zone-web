// ============================================
// Wall Generator System - Rectangular Obstacle Placement
// Based on: Procedural Wall Generation.md
// ============================================

import { COLLISION_CATEGORY } from '../config/constants.js';
import { WALL_COLOR } from '../config/colors.js';

/**
 * Spatial Hash Grid for efficient collision detection (O(n) instead of O(n²))
 */
class SpatialHashGrid {
    constructor(bounds, cellSize) {
        this.bounds = bounds;
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    insert(obj, x, y, width, height) {
        const cells = this._getCells(x, y, width, height);
        cells.forEach(key => {
            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key).push(obj);
        });
    }

    query(x, y, width, height) {
        const cells = this._getCells(x, y, width, height);
        const results = new Set();

        cells.forEach(key => {
            const bucket = this.grid.get(key);
            if (bucket) {
                bucket.forEach(obj => results.add(obj));
            }
        });

        return Array.from(results);
    }

    _getCells(x, y, width, height) {
        const minCellX = Math.floor(x / this.cellSize);
        const minCellY = Math.floor(y / this.cellSize);
        const maxCellX = Math.floor((x + width) / this.cellSize);
        const maxCellY = Math.floor((y + height) / this.cellSize);

        const cells = [];
        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                cells.push(`${cx},${cy}`);
            }
        }
        return cells;
    }
}

/**
 * Difficulty presets for wall generation
 */
const DIFFICULTY_PRESETS = {
    easy: {
        obstacleCount: 8,
        minSize: { width: 15, height: 40 },    // Small, thin walls
        maxSize: { width: 25, height: 100 },
        edgePadding: 60,                       // Tuned: moderate edge margin
        minSpacing: 110,                       // Tuned: very wide spacing (open arena style)
        coverageTarget: 0.15,
        cellSize: 80
    },

    medium: {
        obstacleCount: 15,
        minSize: { width: 15, height: 30 },    // Thin walls (15-25px wide)
        maxSize: { width: 25, height: 80 },    // Max 80px tall
        edgePadding: 40,                       // Tuned: closer to edges
        minSpacing: 50,                        // Tuned: comfortable spacing (tank can pass easily)
        coverageTarget: 0.25,
        cellSize: 60
    },

    hard: {
        obstacleCount: 25,
        minSize: { width: 12, height: 25 },    // Very thin walls
        maxSize: { width: 20, height: 60 },
        edgePadding: 40,                       // Tuned: closer to edges
        minSpacing: 40,                        // Tuned: tight but passable (tank 30px + margin 10px)
        coverageTarget: 0.35,
        cellSize: 50
    }
};

/**
 * Wall Generator class
 */
export default class WallGenerator {
    constructor(Matter, config = {}) {
        this.Matter = Matter;
        this.width = config.width || 960;
        this.height = config.height || 720;
        this.difficulty = config.difficulty || 'medium';
        this.seed = config.seed || Date.now();

        // Initialize seeded RNG
        this.rng = this.seedRandom(this.seed);

        // Get difficulty parameters
        this.params = DIFFICULTY_PRESETS[this.difficulty];
    }

    /**
     * Simple seeded random number generator (Mulberry32)
     * @param {number} seed - Seed value
     * @returns {Function} Random function returning [0, 1)
     */
    seedRandom(seed) {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    /**
     * Generate arena walls with validation
     * @param {Array<{x, y}>} spawnPoints - Spawn positions to avoid
     * @returns {Array<Matter.Body>} Array of wall bodies
     */
    generateWalls(spawnPoints) {
        const startTime = performance.now();
        let attempts = 0;
        const maxRetries = 3;

        while (attempts < maxRetries) {
            attempts++;

            // Generate obstacles
            const obstacles = this.generateObstacles(spawnPoints);

            // Validate arena
            if (this.validateArena(obstacles, spawnPoints)) {
                const genTime = (performance.now() - startTime).toFixed(2);
                console.log(`✅ Wall generation complete: ${obstacles.length} walls in ${genTime}ms (attempt ${attempts})`);

                // Convert to Matter.js bodies
                return this.createMatterBodies(obstacles);
            }

            console.warn(`⚠️ Arena validation failed (attempt ${attempts}/${maxRetries}), regenerating...`);

            // Change seed for next attempt
            this.rng = this.seedRandom(this.seed + attempts);
        }

        // Fallback: return minimal safe obstacles
        console.error('❌ Failed to generate valid arena after 3 attempts, using fallback');
        return this.createFallbackWalls();
    }

    /**
     * Generate random rectangular obstacles
     * @param {Array<{x, y}>} spawnPoints - Spawn positions to avoid
     * @returns {Array<Object>} Array of obstacles {x, y, width, height}
     */
    generateObstacles(spawnPoints) {
        const obstacles = [];
        const spatialHash = new SpatialHashGrid(
            { width: this.width, height: this.height },
            this.params.cellSize
        );

        // Define safe zones (spawn areas with margin)
        const safeZones = spawnPoints.map(spawn => ({
            x: spawn.x - 120,
            y: spawn.y - 120,
            width: 240,
            height: 240
        }));

        const maxAttempts = this.params.obstacleCount * 20;
        const startTime = performance.now();

        for (let i = 0; i < maxAttempts && obstacles.length < this.params.obstacleCount; i++) {
            // Performance budget check (max 100ms)
            if (performance.now() - startTime > 100) {
                console.warn(`Generation stopped at ${obstacles.length} obstacles after 100ms`);
                break;
            }

            // Generate random obstacle dimensions
            // 50% chance: vertical wall (narrow + tall)
            // 50% chance: horizontal wall (wide + short)
            const obstacle = {};

            if (this.rng() < 0.5) {
                // Vertical wall
                obstacle.width = Math.floor(
                    this.rng() * (this.params.maxSize.width - this.params.minSize.width) +
                    this.params.minSize.width
                );
                obstacle.height = Math.floor(
                    this.rng() * (this.params.maxSize.height - this.params.minSize.height) +
                    this.params.minSize.height
                );
            } else {
                // Horizontal wall (swap width and height)
                obstacle.width = Math.floor(
                    this.rng() * (this.params.maxSize.height - this.params.minSize.height) +
                    this.params.minSize.height
                );
                obstacle.height = Math.floor(
                    this.rng() * (this.params.maxSize.width - this.params.minSize.width) +
                    this.params.minSize.width
                );
            }

            // Random position (avoiding edges)
            obstacle.x = Math.floor(
                this.rng() * (this.width - obstacle.width - 2 * this.params.edgePadding) +
                this.params.edgePadding
            );
            obstacle.y = Math.floor(
                this.rng() * (this.height - obstacle.height - 2 * this.params.edgePadding) +
                this.params.edgePadding
            );

            // Check constraints
            if (this.isInSafeZone(obstacle, safeZones)) continue;
            if (this.hasOverlap(obstacle, spatialHash)) continue;

            // Valid placement
            obstacles.push(obstacle);
            spatialHash.insert(obstacle, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }

        return obstacles;
    }

    /**
     * Check if obstacle overlaps with safe zones
     * @param {Object} obstacle - Obstacle to check
     * @param {Array<Object>} safeZones - Safe zone rectangles
     * @returns {boolean}
     */
    isInSafeZone(obstacle, safeZones) {
        return safeZones.some(zone =>
            !(obstacle.x + obstacle.width < zone.x ||
              obstacle.x > zone.x + zone.width ||
              obstacle.y + obstacle.height < zone.y ||
              obstacle.y > zone.y + zone.height)
        );
    }

    /**
     * Check if obstacle overlaps with existing obstacles (using spatial hash)
     * @param {Object} newObstacle - New obstacle to check
     * @param {SpatialHashGrid} spatialHash - Spatial hash grid
     * @returns {boolean}
     */
    hasOverlap(newObstacle, spatialHash) {
        const nearby = spatialHash.query(
            newObstacle.x - this.params.minSpacing,
            newObstacle.y - this.params.minSpacing,
            newObstacle.width + 2 * this.params.minSpacing,
            newObstacle.height + 2 * this.params.minSpacing
        );

        for (const other of nearby) {
            if (this.rectanglesOverlapWithSpacing(newObstacle, other, this.params.minSpacing)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if two rectangles overlap with minimum spacing
     * @param {Object} rect1 - First rectangle
     * @param {Object} rect2 - Second rectangle
     * @param {number} spacing - Minimum spacing
     * @returns {boolean}
     */
    rectanglesOverlapWithSpacing(rect1, rect2, spacing) {
        return !(
            rect1.x + rect1.width + spacing < rect2.x ||
            rect2.x + rect2.width + spacing < rect1.x ||
            rect1.y + rect1.height + spacing < rect2.y ||
            rect2.y + rect2.height + spacing < rect1.y
        );
    }

    /**
     * Validate arena layout
     * @param {Array<Object>} obstacles - Generated obstacles
     * @param {Array<{x, y}>} spawnPoints - Spawn positions
     * @returns {boolean}
     */
    validateArena(obstacles, spawnPoints) {
        // 1. Check minimum obstacle count (at least 60% of target)
        if (obstacles.length < this.params.obstacleCount * 0.6) {
            console.log(`Validation failed: Too few obstacles (${obstacles.length}/${this.params.obstacleCount})`);
            return false;
        }

        // 2. Check connectivity (all spawns can reach each other)
        if (!this.areSpawnsConnected(obstacles, spawnPoints)) {
            console.log('Validation failed: Spawns not connected');
            return false;
        }

        // 3. Check spawn balance (equal distances to center)
        if (!this.checkSpawnBalance(spawnPoints)) {
            console.log('Validation failed: Unbalanced spawn positions');
            return false;
        }

        // 4. LOS check disabled for FFA mode (spawn camping less critical in fast-paced combat)
        // Fast-paced tank combat benefits from more open layouts
        // If needed for competitive modes, this can be re-enabled per game mode

        return true;
    }

    /**
     * Check if all spawns are connected via flood fill
     * @param {Array<Object>} obstacles - Wall obstacles
     * @param {Array<{x, y}>} spawnPoints - Spawn positions
     * @returns {boolean}
     */
    areSpawnsConnected(obstacles, spawnPoints) {
        const gridSize = 20; // 20px grid cells for flood fill
        const gridWidth = Math.ceil(this.width / gridSize);
        const gridHeight = Math.ceil(this.height / gridSize);

        // Create walkable grid (true = walkable, false = wall)
        const grid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(true));

        // Mark wall cells
        obstacles.forEach(wall => {
            const minX = Math.floor(wall.x / gridSize);
            const minY = Math.floor(wall.y / gridSize);
            const maxX = Math.ceil((wall.x + wall.width) / gridSize);
            const maxY = Math.ceil((wall.y + wall.height) / gridSize);

            for (let y = minY; y < maxY && y < gridHeight; y++) {
                for (let x = minX; x < maxX && x < gridWidth; x++) {
                    grid[y][x] = false;
                }
            }
        });

        // Flood fill from first spawn
        const startX = Math.floor(spawnPoints[0].x / gridSize);
        const startY = Math.floor(spawnPoints[0].y / gridSize);
        const visited = new Set();
        const queue = [[startX, startY]];

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
            if (!grid[y][x]) continue;

            visited.add(key);

            queue.push([x + 1, y]);
            queue.push([x - 1, y]);
            queue.push([x, y + 1]);
            queue.push([x, y - 1]);
        }

        // Check if all spawns are reachable
        for (let i = 1; i < spawnPoints.length; i++) {
            const targetX = Math.floor(spawnPoints[i].x / gridSize);
            const targetY = Math.floor(spawnPoints[i].y / gridSize);
            if (!visited.has(`${targetX},${targetY}`)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check spawn balance (equal distances to center)
     * @param {Array<{x, y}>} spawnPoints - Spawn positions
     * @returns {boolean}
     */
    checkSpawnBalance(spawnPoints) {
        const center = { x: this.width / 2, y: this.height / 2 };

        const distances = spawnPoints.map(spawn =>
            Math.sqrt(
                Math.pow(spawn.x - center.x, 2) +
                Math.pow(spawn.y - center.y, 2)
            )
        );

        const maxDiff = Math.max(...distances) - Math.min(...distances);
        const tolerance = this.width * 0.15; // 15% difference allowed

        return maxDiff < tolerance;
    }

    /**
     * Check if two points have direct line of sight
     * @param {Object} point1 - First point {x, y}
     * @param {Object} point2 - Second point {x, y}
     * @param {Array<Object>} obstacles - Wall obstacles
     * @returns {boolean}
     */
    hasDirectLineOfSight(point1, point2, obstacles) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / 5); // Check every 5 pixels

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = point1.x + dx * t;
            const y = point1.y + dy * t;

            // Check if this point intersects any wall
            for (const wall of obstacles) {
                if (
                    x >= wall.x && x <= wall.x + wall.width &&
                    y >= wall.y && y <= wall.y + wall.height
                ) {
                    return false; // Blocked by wall
                }
            }
        }

        return true; // Clear line of sight
    }

    /**
     * Convert obstacles to Matter.js bodies
     * @param {Array<Object>} obstacles - Obstacle data
     * @returns {Array<Matter.Body>} Matter.js bodies
     */
    createMatterBodies(obstacles) {
        const { Bodies } = this.Matter;
        const bodies = [];

        obstacles.forEach((obstacle, index) => {
            // Regular rectangle (vertical or horizontal)
            const body = Bodies.rectangle(
                obstacle.x + obstacle.width / 2,  // Matter.js uses center position
                obstacle.y + obstacle.height / 2,
                obstacle.width,
                obstacle.height,
                {
                    isStatic: true,
                    label: 'obstacle_wall',
                    collisionFilter: {
                        category: COLLISION_CATEGORY.WALL,
                        mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE
                    },
                    friction: 0.9,
                    restitution: 0.1,
                    render: {
                        fillStyle: WALL_COLOR,
                        strokeStyle: WALL_COLOR,
                        lineWidth: 2
                    }
                }
            );
            bodies.push(body);
        });

        return bodies;
    }

    /**
     * Create fallback walls (simple, guaranteed to work)
     * @returns {Array<Matter.Body>} Fallback wall bodies
     */
    createFallbackWalls() {
        const { Bodies } = this.Matter;

        // Simple cross pattern in center
        const walls = [
            { x: 380, y: 330, width: 200, height: 60 },  // Horizontal bar
            { x: 450, y: 260, width: 60, height: 200 }   // Vertical bar
        ];

        return walls.map(wall =>
            Bodies.rectangle(
                wall.x + wall.width / 2,
                wall.y + wall.height / 2,
                wall.width,
                wall.height,
                {
                    isStatic: true,
                    label: 'obstacle_wall',
                    collisionFilter: {
                        category: COLLISION_CATEGORY.WALL,
                        mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE
                    },
                    friction: 0.9,
                    restitution: 0.1
                }
            )
        );
    }
}
