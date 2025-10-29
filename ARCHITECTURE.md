# Destruction Zone - Matter.js Architecture

**Version:** 2.0 (Matter.js Rewrite)
**Date:** January 2025
**Status:** Phase 3A Complete → Refactoring Phase

**Last Updated:** October 29, 2025

---

## Document History

### Version 2.1 - October 29, 2025
**Major Update: Refactoring Plan Added**

**What Changed:**
- ✅ Added comprehensive refactoring plan (Stage 1 & 2)
- ✅ Updated file structure with 3 versions (Current → Stage 1 → Stage 2)
- ✅ Documented migration strategy and git workflow
- ✅ Updated status: Phase 3A Complete → Refactoring Phase

**Why:**
- Prototype reached 1,803 lines (68KB) - becoming hard to maintain
- Need modular structure for Phase 3B/4 (34 weapons, shop, rounds)
- Preparing for future features (multiplayer, menu system, audio)

**Key Changes:**
1. **File Structure Evolution** - Shows progression from prototype to production
2. **2-Stage Refactoring** - Stage 1 (now), Stage 2 (before Phase 4)
3. **Detailed Steps** - 8 steps with time estimates and validation criteria
4. **Future-Ready** - Architecture supports multiplayer, menus, and audio

---

### Version 2.0 - January 2025
**Initial Architecture Document**

- Original design for Matter.js rewrite
- Defined core principles and layers
- Created implementation phases (1-4)
- Established file structure vision

---

## Overview

Complete rewrite of Destruction Zone web edition with Matter.js physics engine as the core foundation. This replaces the hybrid approach that attempted to integrate Matter.js into existing DOS-style physics code.

### Goals
- ✅ Single source of truth for all physics (Matter.js)
- ✅ Clean, maintainable, extensible code
- ✅ Modern web game architecture
- ✅ Preserve original game feel and balance
- ✅ 60 FPS stable performance

---

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│           UI Layer (HTML/CSS)               │
│  - Menus, HUD, Scoreboard, Shop             │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│         Game Loop (main.js)                 │
│  - Update (fixed timestep)                  │
│  - Render (variable)                        │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│       Game State Manager (state.js)         │
│  - Round management                         │
│  - Player scores                            │
│  - Game mode                                │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│    Matter.js Physics Engine (core)          │  ← FOUNDATION
│  - All position, velocity, rotation         │
│  - Collision detection                      │
│  - Force application                        │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│      Game Entities (thin wrappers)          │
│  - Tank (wraps Matter body)                 │
│  - Projectile (wraps Matter body)           │
│  - Explosion (visual only)                  │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│     Game Systems (business logic)           │
│  - Weapon system                            │
│  - Damage calculation                       │
│  - AI behavior                              │
│  - Shop/upgrades                            │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│       Renderer (canvas rendering)           │
│  - Read from Matter bodies directly         │
│  - Retro graphics style                     │
│  - Particles & effects                      │
└─────────────────────────────────────────────┘
```

---

## Core Principles

### 1. Matter.js is the Single Source of Truth

**All physical properties come from Matter.js:**
- Position: `body.position.x`, `body.position.y`
- Rotation: `body.angle`
- Velocity: `body.velocity`
- Angular velocity: `body.angularVelocity`

**No manual position/rotation tracking!**

### 2. Entities are Thin Wrappers

```javascript
class Tank {
    constructor(id, x, y, config) {
        this.id = id;
        this.config = config;

        // Create Matter.js body - THIS IS THE TANK
        this.body = Matter.Bodies.circle(x, y, config.size, {
            density: 0.08,
            friction: 0.8,
            frictionAir: 0.12,
            restitution: 0.1
        });

        // Game-specific state (not physics)
        this.shield = config.maxShield;
        this.weaponEnergy = config.maxWeaponEnergy;
        this.weapons = config.weapons;
    }

    // Methods control the Matter.js body
    thrust(power) {
        const force = Matter.Vector.rotate(
            { x: 0, y: -power * this.config.thrustPower },
            this.body.angle
        );
        Matter.Body.applyForce(this.body, this.body.position, force);
    }

    rotate(direction) {
        Matter.Body.setAngularVelocity(
            this.body,
            direction * this.config.rotationSpeed
        );
    }
}
```

### 3. Input → Force Application

User input directly applies forces to Matter.js bodies:

```
Player presses ↑ key
    ↓
Input handler calls tank.thrust(1.0)
    ↓
Tank applies force to its body in direction of body.angle
    ↓
Matter.js updates position/velocity automatically
    ↓
Renderer reads body.position and draws tank
```

### 4. Collision Events from Matter.js

```javascript
Matter.Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        // Check collision types
        if (bodyA.label === 'tank' && bodyB.label === 'projectile') {
            handleProjectileHit(bodyA, bodyB);
        }
        else if (bodyA.label === 'tank' && bodyB.label === 'tank') {
            handleTankCollision(bodyA, bodyB);
        }
    });
});
```

---

## File Structure Evolution

### Current Structure (Prototype Phase)

**Status:** Single-file prototype (prototype.html - 1,803 lines)

```
destruction-zone-web/
├── prototype.html            # ⚠️ All-in-one prototype (needs refactoring)
├── css/                      # ✅ CSS organized
│   ├── main.css
│   ├── game.css
│   └── ui.css
└── js/                       # 📁 Target structure (prepared but not used yet)
    ├── main.js
    ├── lib/
    ├── core/
    ├── entities/
    ├── systems/
    ├── config/
    └── ui/
```

**Issues:**
- ⚠️ 1,803 lines in single file
- ⚠️ Hard to maintain
- ⚠️ Difficult to extend for Phase 3B/4
- ⚠️ No separation of concerns

---

### Target Structure (Post-Refactoring)

**Goal:** Modular, scalable architecture for future features

#### Stage 1: Basic Modularization (Phase 3A → Phase 3B)

```
destruction-zone-web/
├── index.html                      # Main HTML entry point
├── css/
│   ├── main.css                   # Global styles
│   ├── game.css                   # In-game UI
│   ├── menu.css                   # Menu screens ⭐ NEW
│   └── ui.css                     # UI components
└── js/
    ├── main.js                    # Game initialization & loop
    │
    ├── lib/                       # External libraries
    │   ├── matter.min.js          # Matter.js physics
    │   └── pixi.min.js            # PixiJS rendering
    │
    ├── core/                      # Core game systems
    │   ├── Game.js                # 🎮 Main game controller ⭐ NEW
    │   ├── GameState.js           # 🎯 State machine (menu/game/shop) ⭐ NEW
    │   ├── physics.js             # Matter.js world setup
    │   ├── particles.js           # PixiJS particle system ⭐ NEW
    │   └── renderer.js            # Canvas rendering ⭐ NEW
    │
    ├── entities/                  # Game objects
    │   ├── Tank.js                # Tank class ⭐ NEW
    │   └── Projectile.js          # Projectile class ⭐ NEW
    │
    ├── systems/                   # Game logic systems
    │   ├── collision.js           # Collision handling ⭐ NEW
    │   ├── input.js               # Keyboard/gamepad input ⭐ NEW
    │   ├── ai.js                  # AI behavior ⭐ NEW
    │   └── weapons.js             # Weapon firing logic
    │
    ├── config/                    # Configuration & data
    │   ├── constants.js           # Game constants ⭐ NEW
    │   ├── colors.js              # TRON color palette ⭐ NEW
    │   ├── weapon-data.js         # Weapon definitions (existing)
    │   └── tank-data.js           # Tank stats (existing)
    │
    └── ui/                        # User interface
        └── hud.js                 # In-game HUD ⭐ NEW
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Easy to find and fix bugs
- ✅ Parallel development possible
- ✅ Reusable modules
- ✅ Ready for Phase 3B/4 expansion

---

#### Stage 2: Full Production Structure (Phase 4+)

```
destruction-zone-web/
├── index.html
├── css/
│   ├── main.css
│   ├── game.css
│   ├── menu.css
│   └── ui.css
│
└── js/
    ├── main.js
    │
    ├── lib/
    │   ├── matter.min.js
    │   └── pixi.min.js
    │
    ├── core/
    │   ├── Game.js                # Game controller
    │   ├── GameState.js           # State machine
    │   ├── AssetManager.js        # 📦 Asset loading ⭐ FUTURE
    │   ├── AudioManager.js        # 🔊 Sound system ⭐ FUTURE
    │   ├── physics.js
    │   ├── particles.js
    │   └── renderer.js
    │
    ├── entities/
    │   ├── Tank.js
    │   └── Projectile.js
    │
    ├── systems/
    │   ├── collision.js
    │   ├── input.js
    │   ├── ai.js
    │   ├── weapons.js
    │   ├── round.js               # 🎲 Round management ⭐ FUTURE
    │   └── shop.js                # 🛒 Shop logic ⭐ FUTURE
    │
    ├── network/                   # 🌐 Multiplayer ⭐ FUTURE
    │   ├── NetworkManager.js      # Connection handling
    │   ├── GameClient.js          # Client-side logic
    │   ├── GameServer.js          # Server (Node.js)
    │   └── protocol.js            # Message protocol
    │
    ├── config/
    │   ├── constants.js
    │   ├── colors.js
    │   ├── weapon-data.js
    │   └── tank-data.js
    │
    └── ui/
        ├── screens/               # 🖼️ Full-screen UIs ⭐ FUTURE
        │   ├── MenuScreen.js      # Main menu
        │   ├── GameScreen.js      # In-game HUD
        │   ├── ShopScreen.js      # Between-round shop
        │   ├── SettingsScreen.js  # Settings menu
        │   └── LobbyScreen.js     # Multiplayer lobby
        ├── components/            # 🧩 Reusable components ⭐ FUTURE
        │   ├── Button.js
        │   ├── Modal.js
        │   ├── Slider.js
        │   └── TankSelector.js
        └── hud.js
```

**Additional Benefits:**
- ✅ Multi-screen support (menu, lobby, settings)
- ✅ Multiplayer ready
- ✅ Asset & audio management
- ✅ Component-based UI
- ✅ Fully scalable architecture

---

## Implementation Phases

### Phase 1: Prototype (1-2 hours) ✅ COMPLETED
**Goal:** Prove the architecture works

- [x] Setup Matter.js world
- [x] Create basic Tank class (triangle body)
- [x] Implement movement (thrust + rotation)
- [x] Add keyboard controls
- [x] Render tank on canvas
- [x] Test performance & feel

**Success Criteria:**
- ✅ 1 tank moves smoothly at 60 FPS
- ✅ Rotation feels responsive
- ✅ Controls feel better than hybrid version

---

### Phase 2: Core Features (3-4 hours) ✅ COMPLETED
**Goal:** Complete playable game loop

- [x] Complete Tank class
  - [x] Health system (shield removed for simplicity)
  - [x] Weapon energy with auto-recharge
  - [x] Multiple weapon ports
- [x] Projectile system
  - [x] Different projectile types (MISSILE, LASER)
  - [x] Collision with tanks
  - [x] Collision with walls
  - [x] Collision filtering (projectiles pass through each other)
- [x] Collision handling
  - [x] Projectile → Tank (damage)
  - [x] Tank → Tank (collision damage)
  - [x] Tank → Wall (bounce)
- [x] Basic AI
  - [x] Movement
  - [x] Targeting
  - [x] Firing

**Success Criteria:**
- ✅ 2+ tanks can fight each other
- ✅ All collision types work correctly
- ✅ AI provides challenge

---

### Phase 3A: UI & Weapon System (3-4 hours) ✅ COMPLETED
**Goal:** Build game interface and core weapon mechanics

- [x] UI Layout Design
  - [x] Analyze original DOS game UI
  - [x] Design side-panel layout (left 3, right 3 tanks)
  - [x] Implement minimal, retro-style panels
- [x] UI Implementation
  - [x] Tank stat panels with gauges
  - [x] Health gauge (vertical, bottom-up)
  - [x] Weapon energy gauge (vertical, bottom-up)
  - [x] Real-time UI updates connected to game state
  - [x] Tank name and color display
  - [x] Current weapon display
  - [x] Score display
- [x] Weapon System
  - [x] Weapon data structure (34 weapons documented)
  - [x] Weapon switching (keyboard 1,2,3)
  - [x] Energy consumption on fire
  - [x] Auto-recharge system
  - [x] 3 weapon types implemented:
    - [x] MISSILE (basic projectile)
    - [x] LASER (fast, low density beam)
    - [x] DOUBLE_MISSILE (multi-projectile)
  - [x] Type-based rendering (circle vs beam)
  - [x] Speed scaling system (DOS units → pixels)

**Success Criteria:**
- ✅ UI shows real-time tank stats
- ✅ Weapon switching works smoothly
- ✅ Energy system balanced (consumption + recharge)
- ✅ Multiple weapon types feel different

---

### Phase 3B: Game Flow Systems (2-3 hours) ⏳ PENDING
**Goal:** Complete game loop mechanics

- [ ] Additional Weapons
  - [ ] TRIPLE_MISSILE (3 projectiles with spread)
  - [ ] TRI-STRIKER (3 projectiles, efficient)
  - [ ] POWER LASER (2x laser beams)
  - [ ] BLASTER (2-stage explosion system)
  - [ ] Add 10+ more weapons gradually
- [ ] Round Management
  - [ ] Round timer
  - [ ] Round start/end transitions
  - [ ] Victory conditions
  - [ ] Score tracking and accumulation
- [ ] Shop System
  - [ ] Between-round shopping screen
  - [ ] Weapon purchases
  - [ ] Tank upgrades (speed, armor, rotation)
  - [ ] Discount cards
- [ ] Player Registration
  - [ ] Tank selection screen
  - [ ] Player name input
  - [ ] Team setup (optional)

**Success Criteria:**
- Complete game loop from registration → rounds → shop → victory
- Shop allows meaningful progression
- All core game modes playable

---

### Phase 4: Polish & Content (2-3 hours) ⏳ PENDING
**Goal:** Production ready with full weapon roster

- [ ] Weapon Implementation (remaining ~25 weapons)
  - [ ] BREAKER series (3 types)
  - [ ] BLASTER series (5 types)
  - [ ] GUIDED weapons
  - [ ] REAR weapons
  - [ ] Special weapons (SWIRLER, BOMBS, etc.)
  - [ ] Defensive weapons (SHIELDS, TELEPORT, etc.)
- [ ] Balance Tuning
  - [ ] Movement speeds
  - [ ] Weapon damage
  - [ ] AI difficulty
  - [ ] Energy costs and recharge rates
- [ ] Visual Polish
  - [ ] Particle effects
  - [ ] Screen shake on impacts
  - [ ] Better explosion effects
  - [ ] Weapon-specific visual effects
- [ ] Bug Fixes & Optimization
  - [ ] Performance optimization
  - [ ] Edge case handling
  - [ ] Final testing

**Success Criteria:**
- All 34 weapons implemented and balanced
- Feels like original game
- No major bugs
- Stable 60 FPS with 6 tanks + projectiles

---

## Key Design Decisions

### Movement Control

**Thrust:**
```javascript
thrust(power) {
    // Convert power (-1 to 1) to force vector
    const forceMagnitude = power * this.config.thrustPower;

    // Apply in direction tank is facing
    const force = {
        x: Math.cos(this.body.angle) * forceMagnitude,
        y: Math.sin(this.body.angle) * forceMagnitude
    };

    Matter.Body.applyForce(this.body, this.body.position, force);
}
```

**Rotation:**
```javascript
rotate(direction) {
    // Set angular velocity directly for responsive controls
    // direction: -1 (left), 0 (stop), 1 (right)
    const targetAngularVelocity = direction * this.config.rotationSpeed;

    Matter.Body.setAngularVelocity(this.body, targetAngularVelocity);
}
```

**Braking:**
```javascript
brake() {
    // Apply counter-force proportional to current velocity
    const brakeFactor = 0.95;
    Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x * (1 - brakeFactor),
        y: this.body.velocity.y * (1 - brakeFactor)
    });
}
```

### Projectile Physics

All projectiles are Matter.js bodies with sensors enabled:

```javascript
class Projectile {
    constructor(type, x, y, angle, speed) {
        this.type = type;

        // Create as sensor (no physical collision, only detection)
        this.body = Matter.Bodies.circle(x, y, 3, {
            isSensor: true,
            label: 'projectile'
        });

        // Set initial velocity
        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        Matter.Body.setVelocity(this.body, velocity);

        this.damage = WEAPON_DATA[type].damage;
        this.lifetime = 5.0; // seconds
    }
}
```

### Damage System

Damage is calculated in collision handler, not in physics:

```javascript
function handleProjectileHit(tankBody, projectileBody) {
    const tank = getTankFromBody(tankBody);
    const projectile = getProjectileFromBody(projectileBody);

    // Apply damage (game logic)
    tank.shield -= projectile.damage;

    // Remove projectile
    removeProjectile(projectile);

    // Create explosion (visual only)
    createExplosion(projectileBody.position);
}
```

---

## Matter.js Configuration

### World Settings
```javascript
const engine = Matter.Engine.create({
    gravity: { x: 0, y: 0 },  // Top-down, no gravity
    timing: {
        timeScale: 1.0
    }
});

// Performance settings
engine.positionIterations = 6;  // Default: 6
engine.velocityIterations = 4;  // Default: 4
engine.constraintIterations = 2; // Default: 2
```

### Tank Body Settings
```javascript
{
    density: 0.08,           // Mass distribution
    friction: 0.8,           // Surface friction
    frictionAir: 0.12,       // Air resistance
    frictionStatic: 1.0,     // Static friction
    restitution: 0.1,        // Bounciness (low)
    slop: 0.05              // Collision tolerance
}
```

### Boundary Walls
```javascript
const thickness = 50;
const walls = [
    // Top
    Matter.Bodies.rectangle(480, -25, 960, thickness, { isStatic: true }),
    // Bottom
    Matter.Bodies.rectangle(480, 745, 960, thickness, { isStatic: true }),
    // Left
    Matter.Bodies.rectangle(-25, 360, thickness, 720, { isStatic: true }),
    // Right
    Matter.Bodies.rectangle(985, 360, thickness, 720, { isStatic: true })
];
```

---

## Performance Targets

- **Frame Rate:** 60 FPS stable
- **Update Rate:** 60 Hz fixed timestep
- **Max Entities:** 100+ simultaneous
- **Physics Bodies:** 50+ active

---

## Migration Notes

### What We Keep from Original
- Game config (speeds, damage, etc.)
- Tank data (types, stats)
- Weapon data (types, costs)
- UI/UX flow
- Visual style

### What Changes
- **Physics engine:** Custom → Matter.js
- **Tank class:** Hybrid → Matter.js wrapper
- **Projectile class:** Custom → Matter.js wrapper
- **Collision system:** Manual → Matter.js events
- **Movement:** Manual position → Force application

### Estimated Time Savings
- No manual collision detection: **-50% debugging time**
- No synchronization bugs: **-30% bug fixing time**
- Matter.js optimizations: **+20% performance**
- Cleaner code: **+50% maintainability**

---

## Testing Plan

### Unit Tests
- Tank movement (thrust, rotate, brake)
- Projectile creation and velocity
- Collision detection (all types)
- Damage calculation

### Integration Tests
- Complete game round
- AI vs Player
- Shop purchases
- Round transitions

### Performance Tests
- 4 tanks + 20 projectiles at 60 FPS
- Memory stability over 100 rounds
- No physics jitter or tunneling

---

## Refactoring Plan (Phase 3A → Phase 3B Transition)

### Overview

**Current State:** prototype.html (1,803 lines, 68KB)
**Target State:** Modular architecture with ~15 files
**Timeline:** 4-5 hours (2-stage approach)
**Date:** October 29, 2025

---

### Stage 1: Core Refactoring (Now)

**Goal:** Split prototype into maintainable modules while preserving all functionality

**Estimated Time:** 4-5 hours

#### Step 1: Configuration & Constants (30 min)

**Files to Create:**
- `js/config/constants.js` - Game constants
- `js/config/colors.js` - TRON color palette

**Content:**
```javascript
// js/config/constants.js
export const COLLISION_CATEGORY = {
    TANK: 0x0001,
    PROJECTILE: 0x0002,
    WALL: 0x0004
};

export const SAFE_ZONE_SPAWNS = [
    { x: 66.5, y: 66.5 },      // Tank 1: Top-left
    { x: 893.5, y: 653.5 },    // Tank 2: Bottom-right
    { x: 893.5, y: 66.5 },     // Tank 3: Top-right
    { x: 66.5, y: 653.5 },     // Tank 4: Bottom-left
    { x: 479.5, y: 66.5 },     // Tank 5: Top-middle
    { x: 479.5, y: 653.5 }     // Tank 6: Bottom-middle
];

// js/config/colors.js
export const TRON_COLORS = [
    '#00ffff',  // Tank 1: Cyan
    '#ff6600',  // Tank 2: Orange
    '#bb88ff',  // Tank 3: Light Purple
    '#00ff88',  // Tank 4: Emerald Green
    '#cccc00',  // Tank 5: Dark Yellow
    '#ff0055'   // Tank 6: Red Pink
];

export const WALL_COLOR = '#88ddff';  // Bright sky blue
export const GRID_COLOR = '#00ccff';  // Cyan grid
```

**Validation:** Import and verify constants work

---

#### Step 2: Particle System (30 min)

**Files to Create:**
- `js/core/particles.js` - Complete PixiJS particle system

**Content:**
- Particle class
- createTankExplosionParticles()
- createProjectileHitParticles()
- updateParticles()
- initPixiApp()

**Validation:** Tank explosions and projectile hits show particles

---

#### Step 3: Entity Classes (45 min)

**Files to Create:**
- `js/entities/Tank.js` - Tank class with all methods
- `js/entities/Projectile.js` - Projectile class

**Content:**
```javascript
// js/entities/Tank.js
import { TRON_COLORS } from '../config/colors.js';

export default class Tank {
    constructor(x, y, config) {
        // All tank logic from prototype
    }

    update() { ... }
    render(ctx) { ... }
    destroy() { ... }
    fire() { ... }
}

// js/entities/Projectile.js
export default class Projectile {
    constructor(type, x, y, angle, speed, ownerId) {
        // All projectile logic
    }

    update(deltaTime) { ... }
    render(ctx) { ... }
}
```

**Validation:** Tanks move, fire, and render correctly

---

#### Step 4: Systems (60 min)

**Files to Create:**
- `js/systems/collision.js` - Collision handlers
- `js/systems/input.js` - Keyboard controls
- `js/systems/ai.js` - AI logic
- `js/ui/hud.js` - UI updates

**Content:**
```javascript
// js/systems/collision.js
export function setupCollisionHandlers(engine, game) {
    Matter.Events.on(engine, 'collisionStart', (event) => {
        // All collision logic
    });
}

export function handleTankCollision(bodyA, bodyB) { ... }
export function handleProjectileHit(tankBody, projectileBody) { ... }
export function handleProjectileWallHit(projectileBody) { ... }

// js/systems/input.js
export function setupKeyboardControls(tank) {
    document.addEventListener('keydown', (e) => { ... });
    document.addEventListener('keyup', (e) => { ... });
}

// js/systems/ai.js
export function updateAI(tank, targets, deltaTime) {
    // AI decision making
}

// js/ui/hud.js
export function updateUI(tanks) {
    tanks.forEach((tank, index) => {
        // Update tank stat panels
    });
}
```

**Validation:** Collisions, input, AI, and UI all work

---

#### Step 5: Renderer (30 min)

**Files to Create:**
- `js/core/renderer.js` - Canvas rendering

**Content:**
```javascript
// js/core/renderer.js
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    render(game) {
        // Clear
        // Draw background
        // Draw grid
        // Draw walls
        // Draw tanks
        // Draw projectiles
    }

    drawBackground() { ... }
    drawGrid() { ... }
    drawWalls(walls) { ... }
}
```

**Validation:** All rendering works

---

#### Step 6: Core Game Classes (45 min)

**Files to Create:**
- `js/core/Game.js` - Main game controller
- `js/core/GameState.js` - State machine

**Content:**
```javascript
// js/core/Game.js
export class Game {
    constructor() {
        this.state = new GameState();
        this.world = null;
        this.engine = null;
        this.tanks = [];
        this.projectiles = [];
        this.renderer = null;
    }

    async init() {
        // Setup physics
        // Create tanks
        // Setup systems
        // Setup renderer
    }

    update(deltaTime) {
        // Update physics
        // Update tanks
        // Update projectiles
        // Update AI
        // Update particles
    }

    render() {
        this.renderer.render(this);
    }
}

// js/core/GameState.js
export class GameState {
    constructor() {
        this.current = 'PLAYING';  // Simple for now
        this.listeners = [];
    }

    changeState(newState, data = {}) {
        this.current = newState;
        this.notifyListeners(newState);
    }

    onStateChange(callback) {
        this.listeners.push(callback);
    }
}
```

**Validation:** Game initializes and runs

---

#### Step 7: Main Entry Point (45 min)

**Files to Create:**
- `js/main.js` - Application entry
- `index.html` - Updated HTML with module imports

**Content:**
```javascript
// js/main.js
import { Game } from './core/Game.js';

// Initialize game
const game = new Game();
await game.init();

// Game loop
let lastTime = performance.now();

function gameLoop() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    game.update(1/60);  // Fixed timestep
    game.render();

    requestAnimationFrame(gameLoop);
}

gameLoop();
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Destruction Zone</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/game.css">
    <link rel="stylesheet" href="css/ui.css">
</head>
<body>
    <!-- Game UI structure -->
    <div id="gameContainer">
        <!-- Tank stat panels -->
        <!-- Canvas -->
        <!-- PixiJS container -->
    </div>

    <!-- Load libraries -->
    <script src="js/lib/matter.min.js"></script>
    <script src="js/lib/pixi.min.js"></script>

    <!-- Load game as module -->
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

**Validation:** Full game works from index.html

---

#### Step 8: Testing & Debugging (30-60 min)

**Checklist:**
- [ ] All 6 tanks spawn correctly
- [ ] Player controls work (WASD, arrows, space, 1/2/3)
- [ ] AI tanks move and fire
- [ ] Tank-tank collisions work
- [ ] Projectile-tank collisions work
- [ ] Projectile-wall collisions work
- [ ] Particle effects show on explosions
- [ ] UI updates (health, energy, weapons, score)
- [ ] TRON style rendering (tanks, walls, grid)
- [ ] 60 FPS performance maintained

---

### Stage 2: Advanced Features (Later)

**Goal:** Add systems for Phase 4+ features

**Estimated Time:** 3-4 hours

**When:** Before implementing Phase 4 content

#### Additional Files:

```
js/core/
  ├── AssetManager.js        # Image/sound loading
  └── AudioManager.js        # Sound effects/music

js/systems/
  ├── round.js               # Round management
  └── shop.js                # Shop logic

js/network/                  # Multiplayer
  ├── NetworkManager.js
  ├── GameClient.js
  ├── GameServer.js
  └── protocol.js

js/ui/screens/               # Multi-screen UI
  ├── MenuScreen.js
  ├── GameScreen.js
  ├── ShopScreen.js
  ├── SettingsScreen.js
  └── LobbyScreen.js

js/ui/components/            # Reusable UI
  ├── Button.js
  ├── Modal.js
  ├── Slider.js
  └── TankSelector.js
```

---

### Benefits Summary

#### Before Refactoring:
- ⚠️ 1,803 lines in one file
- ⚠️ Hard to navigate
- ⚠️ Difficult to debug
- ⚠️ Can't work in parallel
- ⚠️ Limited extensibility

#### After Stage 1:
- ✅ ~15 focused modules (~100-200 lines each)
- ✅ Clear file organization
- ✅ Easy to find bugs
- ✅ Parallel development possible
- ✅ Ready for Phase 3B/4

#### After Stage 2:
- ✅ Full menu system
- ✅ Multiplayer capable
- ✅ Asset & audio management
- ✅ Component-based UI
- ✅ Production-ready architecture

---

### Migration Strategy

**Backup Plan:**
1. Keep `prototype.html` as reference
2. Create new `index.html` with modular structure
3. Test both versions during transition
4. Once validated, archive prototype

**Git Strategy:**
```bash
# Current state
git add prototype.html
git commit -m "feat: Phase 3A complete - TRON style + 6 tanks + UI"

# Create refactoring branch
git checkout -b refactor/modular-architecture

# Work on refactoring
# ... (create files, test)

# Commit each step
git commit -m "refactor: Step 1 - Extract config and constants"
git commit -m "refactor: Step 2 - Extract particle system"
# ...

# When complete and tested
git checkout main
git merge refactor/modular-architecture
```

---

## Future Enhancements

Once base game is stable:
- [x] Particle system for explosions ✅ (Phase 2)
- [ ] Screen shake on impacts
- [ ] Power-ups (health packs, ammo)
- [ ] Terrain obstacles (partial - walls done)
- [ ] Team play mode
- [ ] Multiplayer (WebRTC/WebSocket) - Architecture ready after Stage 2
- [ ] Mobile controls
- [ ] Sound effects & music - AudioManager in Stage 2
- [ ] Menu system - Stage 2
- [ ] Settings screen - Stage 2
- [ ] Shop system - Phase 3B

---

## References

- [Matter.js Documentation](https://brm.io/matter-js/docs/)
- [Matter.js Examples](https://brm.io/matter-js/demo/)
- Original Destruction Zone (1992) - Julian Cochran
