// ============================================
// Game - Main Game Controller
// ============================================

import { COLLISION_CATEGORY, SAFE_ZONE_SPAWNS, VISUAL_MARGIN, WALL_THICKNESS, PHYSICS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';
import { TRON_COLORS } from '../config/colors.js';
import { WEAPON_DATA } from '../config/weapons.js';
import { initPixiJS, createTankExplosionParticles, createProjectileHitParticles, updateParticles, getProjectileContainer } from './particles.js';
import ProjectileRenderer from './ProjectileRenderer.js';
import Renderer from './Renderer.js';
import Tank from '../entities/Tank.js';
import Projectile from '../entities/Projectile.js';
import { setupCollisionHandlers } from '../systems/collision.js';
import { setupKeyboardControls, handleInput, fireProjectile } from '../systems/input.js';
import { initAI, updateAllAI } from '../systems/ai.js';
import { updateUI } from '../ui/hud.js';

/**
 * Main Game class - Coordinates all game systems
 */
export default class Game {
    constructor() {
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
        setupCollisionHandlers(this.engine, this, createProjectileHitParticles);

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
     * Create obstacle walls in the arena
     */
    createObstacleWalls() {
        const { Bodies, World } = this.Matter;

        // Center obstacles
        const obstacles = [
            { x: 480, y: 360, width: 80, height: 80 }  // Center square
        ];

        obstacles.forEach(({ x, y, width, height }) => {
            const wall = Bodies.rectangle(x, y, width, height, {
                isStatic: true,
                label: 'obstacle_wall',
                collisionFilter: {
                    category: COLLISION_CATEGORY.WALL,
                    mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE
                },
                friction: 0.9,
                restitution: 0.1
            });

            this.obstacleWalls.push(wall);
            World.add(this.world, wall);
        });
    }

    /**
     * Create all tanks
     */
    createTanks() {
        for (let i = 0; i < 6; i++) {
            const spawn = SAFE_ZONE_SPAWNS[i];
            const tank = new Tank(
                spawn.x,
                spawn.y,
                {
                    size: 30,
                    thrustPower: 0.0003,
                    rotationSpeed: 3.0,
                    color: TRON_COLORS[i],
                    maxHealth: 100
                },
                this.Matter,
                this.world,
                (x, y) => createTankExplosionParticles(x, y)  // Explosion callback
            );
            tank.id = `TANK ${i + 1}`;
            this.tanks.push(tank);

            // First tank is player
            if (i === 0) {
                this.playerTank = tank;
            } else {
                this.aiTanks.push(tank);
            }
        }
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

        // Update AI tanks
        updateAllAI(
            this.aiTanks,
            this.playerTank,
            deltaTime,
            (tank) => this.fireProjectileFromTank(tank)
        );

        // Update all tanks
        this.tanks.forEach(tank => tank.update());

        // Update physics
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
