// ============================================
// Renderer - Canvas 2D Rendering System
// ============================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';
import { GRID_COLOR, WALL_COLOR } from '../config/colors.js';

/**
 * Renderer class - Handles Canvas 2D rendering
 * Does NOT handle PixiJS rendering (projectiles, particles)
 */
export default class Renderer {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas element
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.Matter = null;  // Will be set externally
    }

    /**
     * Set Matter.js reference for vector operations
     * @param {Matter} Matter - Matter.js library
     */
    setMatter(Matter) {
        this.Matter = Matter;
    }

    /**
     * Main render function
     * @param {Object} game - Game state containing tanks and walls
     */
    render(game) {
        const ctx = this.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background (TRON style glossy surface)
        this.drawBackground();

        // Draw grid
        this.drawGrid();

        // Draw walls
        this.drawWalls(game.obstacleWalls);

        // Draw canvas boundary
        this.drawBoundary();

        // Draw spawn zones (debug)
        this.drawSpawnZones(game);

        // Draw all tanks
        game.tanks.forEach(tank => {
            if (tank && tank.alive) {
                tank.render(ctx);
            }
        });

        // Note: Projectiles and particles are rendered by PixiJS automatically
    }

    /**
     * Draw TRON style background with radial gradient
     */
    drawBackground() {
        const ctx = this.ctx;

        ctx.save();

        // Large radial gradient for glossy floor effect (center brighter)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const gradientRadius = Math.max(this.canvas.width, this.canvas.height) * 0.7;

        const floorGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, gradientRadius
        );
        floorGradient.addColorStop(0, '#1a1a1a');    // Center brighter
        floorGradient.addColorStop(0.5, '#121212');  // Mid tone
        floorGradient.addColorStop(1, '#080808');    // Edges darker

        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.restore();
    }

    /**
     * Draw TRON style grid with glow effect
     */
    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 60;  // Grid spacing
        const gridAlpha = 0.3;
        const glowIntensity = 15;

        ctx.save();

        // Draw grid lines with glow effect
        ctx.strokeStyle = `rgba(0, 204, 255, ${gridAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = GRID_COLOR;
        ctx.shadowBlur = glowIntensity;

        // Vertical lines (inner grid only, skip edges)
        for (let x = gridSize; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // Horizontal lines (inner grid only, skip edges)
        for (let y = gridSize; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // Draw brighter intersection points for extra glow
        ctx.fillStyle = `rgba(0, 204, 255, ${gridAlpha * 0.5})`;
        ctx.shadowBlur = glowIntensity * 1.5;
        for (let x = gridSize; x < this.canvas.width; x += gridSize) {
            for (let y = gridSize; y < this.canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    /**
     * Draw obstacle walls (TRON style)
     * @param {Array<Matter.Body>} walls - Array of wall bodies
     */
    drawWalls(walls) {
        if (!walls || !this.Matter) return;

        const ctx = this.ctx;
        const { Vector } = this.Matter;

        walls.forEach(wall => {
            const pos = wall.position;
            const vertices = wall.vertices;

            ctx.save();

            // Shrink vertices 3px inward to prevent visual clipping
            const shrinkAmount = 3;
            const visualVertices = [];
            for (let i = 0; i < vertices.length; i++) {
                const offset = Vector.sub(vertices[i], pos);
                const length = Vector.magnitude(offset);
                const shrinkRatio = Math.max(0, (length - shrinkAmount) / length);
                const shrunkenOffset = Vector.mult(offset, shrinkRatio);
                const visualVertex = Vector.add(pos, shrunkenOffset);
                visualVertices.push(visualVertex);
            }

            // Draw using shrunken vertices
            ctx.beginPath();
            ctx.moveTo(visualVertices[0].x, visualVertices[0].y);
            for (let i = 1; i < visualVertices.length; i++) {
                ctx.lineTo(visualVertices[i].x, visualVertices[i].y);
            }
            ctx.closePath();

            // TRON style: Dark interior
            ctx.fillStyle = '#0a0a0a';
            ctx.fill();

            // TRON style: Outer bright neon glow
            ctx.strokeStyle = WALL_COLOR;
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.shadowColor = WALL_COLOR;
            ctx.shadowBlur = 15;
            ctx.stroke();

            // TRON style: Inner white core (bright center line)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.lineJoin = 'round';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 5;
            ctx.stroke();

            ctx.restore();
        });
    }

    /**
     * Draw spawn zones (debug mode)
     * Shows safe zone boundaries and spawn points
     */
    drawSpawnZones(game) {
        const ctx = this.ctx;
        const spawns = game.gameMode.getSpawnPositions();

        ctx.save();

        spawns.forEach((spawn, i) => {
            // Get tank color for this spawn
            const tank = game.tanks[i];
            const tankColor = tank ? tank.config.color : '#ffffff';

            // Draw spawn point (center)
            ctx.fillStyle = tankColor;
            ctx.shadowColor = tankColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(spawn.x, spawn.y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw safe zone boundary (89x89 square centered on spawn, 2/3 of original 133)
            const safeZoneSize = 89;
            const x = spawn.x - safeZoneSize / 2;
            const y = spawn.y - safeZoneSize / 2;

            ctx.strokeStyle = tankColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.shadowColor = tankColor;
            ctx.shadowBlur = 8;
            ctx.strokeRect(x, y, safeZoneSize, safeZoneSize);

            // Draw spawn label
            ctx.setLineDash([]);
            ctx.fillStyle = tankColor;
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5;
            ctx.fillText(`Spawn ${i + 1}`, spawn.x, spawn.y - 75);

            // Draw team label (if team mode)
            if (spawn.team === 1) {
                ctx.fillText('RED', spawn.x, spawn.y + 85);
            } else if (spawn.team === 2) {
                ctx.fillText('BLUE', spawn.x, spawn.y + 85);
            }
        });

        ctx.restore();
    }

    /**
     * Draw canvas boundary
     */
    drawBoundary() {
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 102, 136, 0.6)';  // Darker cyan
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 102, 136, 0.3)';
        ctx.shadowBlur = 8;
        ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
        ctx.restore();
    }
}
