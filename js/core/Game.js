// ============================================
// Game - Main Game Controller
// ============================================

import { COLLISION_CATEGORY, VISUAL_MARGIN, WALL_THICKNESS, PHYSICS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';
import { TRON_COLORS } from '../config/colors.js';
import { WEAPON_DATA } from '../config/weapons.js';
import { GAME_MODE, TEAM_COLORS } from '../config/gameModes.js';
import FreeForAllMode from '../modes/FreeForAllMode.js';
import TeamBattleMode from '../modes/TeamBattleMode.js';
import { initPixiJS, createExplosion, createTankExplosionParticles, createHitEffect, createProjectileHitParticles, updateParticles, getProjectileContainer } from './particles.js';
import ProjectileRenderer from './ProjectileRenderer.js';
import Renderer from './Renderer.js';
import Tank from '../entities/Tank.js';
import Projectile from '../entities/Projectile.js';
import { setupCollisionHandlers } from '../systems/collision.js';
import { setupKeyboardControls, handleInput, fireProjectile } from '../systems/input.js';
import { initAI, updateAI } from '../systems/ai.js';
import { updateUI } from '../ui/hud.js';
import WallGenerator from '../systems/wallGenerator.js';

/**
 * Main Game class - Coordinates all game systems
 */
export default class Game {
    /**
     * @param {string} modeType - Game mode type (GAME_MODE.FREE_FOR_ALL or GAME_MODE.TEAM_BATTLE)
     */
    constructor(modeType = GAME_MODE.FREE_FOR_ALL) {
        // Matter.js (global reference)
        this.Matter = window.Matter;

        // Physics
        this.engine = null;
        this.world = null;

        // Entities
        this.tanks = [];
        this.projectiles = [];
        this.obstacleWalls = [];

        // Rendering
        this.renderer = null;
        this.pixiApp = null;

        // References
        this.playerTank = null;
        this.aiTanks = [];

        // Game mode
        this.gameMode = this.createGameMode(modeType);
        console.log(`🎮 Game Mode: ${this.gameMode.getName()}`);
    }

    /**
     * Create game mode instance based on type
     * @param {string} modeType - Mode type constant
     * @returns {GameMode} Game mode instance
     */
    createGameMode(modeType) {
        switch(modeType) {
            case GAME_MODE.TEAM_BATTLE:
                return new TeamBattleMode(this);
            case GAME_MODE.FREE_FOR_ALL:
            default:
                return new FreeForAllMode(this);
        }
    }

    /**
     * Initialize the game
     * @param {HTMLCanvasElement} canvas - Main canvas element
     */
    async init(canvas) {
        console.log('🎮 Initializing game...');

        // Initialize PixiJS
        this.pixiApp = initPixiJS(CANVAS_WIDTH, CANVAS_HEIGHT);
        ProjectileRenderer.init(getProjectileContainer());

        // Initialize renderer
        this.renderer = new Renderer(canvas);
        this.renderer.setMatter(this.Matter);

        // Create physics world
        this.createPhysicsWorld();

        // Create walls
        this.createWalls();

        // Create obstacle walls
        this.createObstacleWalls();

        // Create tanks
        this.createTanks();

        // Setup systems
        setupKeyboardControls();
        setupCollisionHandlers(this.engine, this, createHitEffect, createProjectileHitParticles);

        // Initialize AI for all non-player tanks
        this.aiTanks.forEach(tank => initAI(tank));

        console.log('✅ Game initialized');
    }

    /**
     * Create Matter.js physics world
     */
    createPhysicsWorld() {
        const { Engine, World } = this.Matter;

        this.engine = Engine.create();
        this.world = this.engine.world;

        // Configure physics
        this.engine.gravity.y = PHYSICS.GRAVITY_Y;
        this.engine.positionIterations = PHYSICS.POSITION_ITERATIONS;
        this.engine.velocityIterations = PHYSICS.VELOCITY_ITERATIONS;
    }

    /**
     * Create boundary walls
     */
    createWalls() {
        const { Bodies, World } = this.Matter;

        const walls = [
            // Top wall
            Bodies.rectangle(480, VISUAL_MARGIN - WALL_THICKNESS/2, 960 + WALL_THICKNESS * 2, WALL_THICKNESS, {
                isStatic: true,
                label: 'wall',
                collisionFilter: {
                    category: COLLISION_CATEGORY.WALL,
                    mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE
                }
            }),
            // Bottom wall
            Bodies.rectangle(480, 720 - VISUAL_MARGIN + WALL_THICKNESS/2, 960 + WALL_THICKNESS * 2, WALL_THICKNESS, {
                isStatic: true,
                label: 'wall',
                collisionFilter: {
                    category: COLLISION_CATEGORY.WALL,
                    mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE
                }
            }),
            // Left wall
            Bodies.rectangle(VISUAL_MARGIN - WALL_THICKNESS/2, 360, WALL_THICKNESS, 720 + WALL_THICKNESS * 2, {
                isStatic: true,
                label: 'wall',
                collisionFilter: {
                    category: COLLISION_CATEGORY.WALL,
                    mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE
                }
            }),
            // Right wall
            Bodies.rectangle(960 - VISUAL_MARGIN + WALL_THICKNESS/2, 360, WALL_THICKNESS, 720 + WALL_THICKNESS * 2, {
                isStatic: true,
                label: 'wall',
                collisionFilter: {
                    category: COLLISION_CATEGORY.WALL,
                    mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE
                }
            })
        ];

        World.add(this.world, walls);
    }

    /**
     * Create obstacle walls in the arena using procedural generation
     */
    createObstacleWalls() {
        const { World } = this.Matter;

        // Get spawn positions to avoid (safe zones)
        const spawnPoints = this.gameMode.getSpawnPositions();

        // Random difficulty selection (core game concept)
        const difficulties = ['easy', 'medium', 'hard'];
        const randomDifficulty = difficulties[Math.floor(Math.random() * 3)];

        console.log(`🎲 Random Difficulty: ${randomDifficulty.toUpperCase()}`);

        // Create wall generator with random configuration
        const wallGenerator = new WallGenerator(this.Matter, {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            difficulty: randomDifficulty,  // Random: 'easy', 'medium', or 'hard'
            seed: Date.now()               // Use timestamp for random maps
        });

        // Generate walls (includes validation and collision filtering)
        const walls = wallGenerator.generateWalls(spawnPoints);

        // Add to world and store reference
        this.obstacleWalls = walls;
        World.add(this.world, walls);
    }

    /**
     * Create all tanks based on game mode
     */
    createTanks() {
        // Get spawn positions from game mode
        const spawns = this.gameMode.getSpawnPositions();

        spawns.forEach((spawn, i) => {
            // Get color based on team (for team mode) or index (for FFA)
            let color;
            if (spawn.team === 1) {  // RED team
                color = TEAM_COLORS.RED[i % 3];
            } else if (spawn.team === 2) {  // BLUE team
                color = TEAM_COLORS.BLUE[i % 3];
            } else {  // FFA mode - use original colors
                color = TRON_COLORS[i];
            }

            const tank = new Tank(
                spawn.x,
                spawn.y,
                {
                    size: 30,
                    thrustPower: 0.01,
                    rotationSpeed: 0.01,
                    color: color,
                    maxHealth: 100,
                    team: spawn.team  // Pass team info
                },
                this.Matter,
                this.world,
                (x, y) => {
                    // Create explosion rings (shockwave)
                    createExplosion(x, y);
                    // Create explosion particles (sparks)
                    createTankExplosionParticles(x, y);
                }
            );
            tank.id = `TANK ${i + 1}`;
            this.tanks.push(tank);

            // First tank is player
            if (i === 0) {
                this.playerTank = tank;
            } else {
                this.aiTanks.push(tank);
            }
        });
    }

    /**
     * Update game state
     * @param {number} deltaTime - Fixed timestep (1/60)
     */
    update(deltaTime) {
        // Handle player input
        if (this.playerTank && this.playerTank.alive) {
            handleInput(
                this.playerTank,
                (tank) => this.fireProjectileFromTank(tank),
                WEAPON_DATA
            );
        }

        // Update AI tanks (mode-based targeting)
        this.aiTanks.forEach(aiTank => {
            if (!aiTank.alive) return;

            // Get target from game mode
            const target = this.gameMode.getAITarget(aiTank, this.tanks);

            if (target) {
                // Use existing AI logic with mode-provided target
                updateAI(aiTank, target, deltaTime, (tank) => this.fireProjectileFromTank(tank));
            }
        });

        // Update all tanks
        this.tanks.forEach(tank => tank.update());

        // Update physics with provided fixed timestep (converted to milliseconds)
        this.Matter.Engine.update(this.engine, deltaTime * 1000);

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime);
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }

        // Update particles
        updateParticles(deltaTime);

        // Check win condition
        const result = this.gameMode.checkWinCondition(this.tanks);
        if (result.won) {
            console.log(`🏆 Winner: ${result.winner}`);
            // TODO: Handle game end (pause, show winner screen, etc.)
        }
    }

    /**
     * Render game
     */
    render() {
        this.renderer.render(this);
        updateUI(this.tanks, WEAPON_DATA);
    }

    /**
     * Fire projectile from a tank
     * @param {Tank} tank - Tank firing the projectile
     */
    fireProjectileFromTank(tank) {
        fireProjectile(
            tank,
            WEAPON_DATA,
            this.projectiles,
            Projectile,
            this.Matter,
            this.world,
            ProjectileRenderer
        );
    }
}
