# Destruction Zone - Matter.js Architecture

**Version:** 2.0 (Matter.js Rewrite)
**Date:** January 2025
**Status:** Design Phase

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

## File Structure

```
destruction-zone-web/
├── index.html                 # Main HTML
├── css/
│   ├── main.css              # Layout & screens
│   ├── game.css              # Canvas & game UI
│   └── ui.css                # Menus & HUD
├── js/
│   ├── main.js               # Game loop & initialization
│   ├── lib/
│   │   └── matter.min.js     # Matter.js physics engine
│   ├── core/
│   │   ├── physics.js        # Matter.js setup & world
│   │   ├── renderer.js       # Canvas rendering
│   │   └── state.js          # Game state management
│   ├── entities/
│   │   ├── Tank.js           # Tank entity (wraps Matter body)
│   │   ├── Projectile.js     # Projectile entity
│   │   └── Explosion.js      # Explosion effect
│   ├── systems/
│   │   ├── input.js          # Keyboard/input handling
│   │   ├── weapons.js        # Weapon firing & logic
│   │   ├── collision.js      # Collision handling
│   │   ├── ai.js             # AI behavior
│   │   └── shop.js           # Shop & upgrades
│   ├── config/
│   │   ├── game-config.js    # Game constants
│   │   ├── tank-data.js      # Tank types & stats
│   │   └── weapon-data.js    # Weapon definitions
│   └── ui/
│       ├── hud.js            # Heads-up display
│       ├── menu.js           # Menu system
│       └── scoreboard.js     # Scoring UI
└── ARCHITECTURE.md           # This file
```

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

## Future Enhancements

Once base game is stable:
- [ ] Particle system for explosions
- [ ] Screen shake on impacts
- [ ] Power-ups (health packs, ammo)
- [ ] Terrain obstacles
- [ ] Team play mode
- [ ] Multiplayer (WebRTC/WebSocket)
- [ ] Mobile controls
- [ ] Sound effects & music

---

## References

- [Matter.js Documentation](https://brm.io/matter-js/docs/)
- [Matter.js Examples](https://brm.io/matter-js/demo/)
- Original Destruction Zone (1992) - Julian Cochran
