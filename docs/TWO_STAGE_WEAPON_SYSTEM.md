# Two-Stage Weapon System Design

**Date:** 2025-11-07 (Updated: 2025-11-23)
**Version:** 1.1
**Status:** ✅ **FULLY IMPLEMENTED + EXTENDED**
**Purpose:** Design specification for BLASTER, BREAKER, and BOMB weapon families

## Implementation Status Summary

**Implementation Complete:** All 8 phases completed successfully + BLASTER variants

**Completed Phases:**
- ✅ Phase 2-1: Foundation (Data Structures)
- ✅ Phase 2-2: Rendering Extension (CIRCLE, SMALL_CIRCLE)
- ✅ Phase 2-3: Fire Logic Split
- ✅ Phase 2-4: PRIMARY Fire Implementation
- ✅ Phase 2-5: Trigger System (Manual + Auto, 3 patterns)
- ✅ Phase 2-6: BLASTER Weapon (with user modifications)
- ✅ Phase 2-7: Weapon Switching
- ✅ Phase 2-8: Additional Patterns (CIRCLE, SWIRL)

**Implemented Weapons:**
- ✅ BLASTER (360° spread, 12 missiles, CIRCLE pattern)
- ✅ GUIDE_BLASTER (guided warhead + normal missiles, 2025-11-23)
- ✅ BLAST_GUIDER (normal warhead + guided missiles, 2025-11-23)

**System Features:**
- Two-stage lifecycle (PRIMARY → TRIGGER → SECONDARY)
- Generic naming (PRIMARY/SECONDARY/TRIGGER)
- Pattern system (RADIAL, CIRCLE, SWIRL)
- Manual and auto-triggering support
- Tank state management (activePrimary, canFirePrimary)
- Stage-based Projectile system
- Null safety with optional chaining
- Code quality improvements (refactoring, debug log removal)

**Key Implementation Differences:**
- BLASTER uses 360° CIRCLE pattern (not 180° RADIAL)
- SECONDARY renders as 2px SMALL_CIRCLE (not SHORT_BEAM)
- All weapons inherit tank color (no color overrides)
- PRIMARY does 0 damage (SECONDARY does all damage)

**See Section 8 for detailed implementation differences**

---

## Table of Contents

1. [Overview](#1-overview)
2. [Why This Design](#2-why-this-design)
3. [Core Concepts](#3-core-concepts)
4. [Data Structures](#4-data-structures)
5. [Implementation Logic](#5-implementation-logic)
6. [Rendering System Integration](#6-rendering-system-integration)
7. [Implementation Phases](#7-implementation-phases)
8. [Implementation Differences from Original Design](#8-implementation-differences-from-original-design)
9. [Testing Scenarios](#9-testing-scenarios)
10. [Future Extensions](#10-future-extensions)

---

## 1. Overview

### 1.1 Problem Statement

The game requires weapons with **two-stage lifecycle**:
- **Stage 1:** Fire a primary projectile (warhead/bomb)
- **Stage 2:** Trigger secondary projectiles (split into multiple missiles)

**Affected Weapons (from DOS original):**
- **BLASTER family (5 weapons):** Warhead → Split → Missiles
- **BREAKER family (5 weapons):** Warhead → Break → Missiles
- **BOMB family (2 weapons):** Bomb → Detonate → Explosion

**Total:** 12 out of 34 weapons (35% of all weapons)

### 1.2 Design Goals

1. **Generic System:** Single implementation supports all two-stage weapons
2. **Reuse Existing Systems:** Integrate with current rendering and physics
3. **Clear Separation:** Simple vs Two-stage weapons
4. **Extensible:** Easy to add new trigger patterns and behaviors
5. **DOS Accurate:** Match original game mechanics

---

## 2. Why This Design

### 2.1 Generic Naming

**Why not "warhead" and "split"?**

```
❌ Bad (weapon-specific):
- warhead → Only makes sense for BLASTER
- split → Doesn't describe BOMB detonation
- missiles → BOMB creates explosion, not missiles

✅ Good (generic):
- PRIMARY → Works for warhead, bomb, any initial projectile
- TRIGGER → Works for split, break, detonate, any activation
- SECONDARY → Works for missiles, explosion, any resulting projectiles
```

**Future-proof:** New weapon types (mines, traps, turrets) can use same system.

### 2.2 Unified Trigger System

**Why `triggerType: 'MANUAL' | 'AUTO' | 'BOTH'`?**

Different weapons have different activation mechanics:

| Weapon | Manual Trigger | Auto Trigger | triggerType |
|--------|---------------|--------------|-------------|
| BLASTER | ✅ Fire key again | ✅ Collision | 'BOTH' |
| BREAKER | ✅ Fire key again | ✅ Collision | 'BOTH' |
| BOMB | ✅ Fire key again | ❌ No auto | 'MANUAL' |

**Design Decision:** Single `triggerType` field handles all cases, avoiding weapon-specific conditionals.

### 2.3 Stage-Based Projectile System

**Why `stage: 'NORMAL' | 'PRIMARY' | 'SECONDARY'`?**

**Problem:** Projectile needs different properties depending on stage:
- PRIMARY: Large, slow, high damage if triggered
- SECONDARY: Small, fast, split damage

**Solution:** Single Projectile class with stage parameter:

```javascript
// ❌ Bad: Separate classes
class Warhead extends Projectile { ... }
class SplitMissile extends Projectile { ... }

// ✅ Good: Unified with stage
new Projectile(x, y, angle, weaponData, 'PRIMARY')
new Projectile(x, y, angle, weaponData, 'SECONDARY')
```

**Benefits:**
- One physics implementation
- One collision handler
- One rendering pipeline
- Stage-specific config selected in constructor

### 2.4 Config Separation in weaponData

**Why separate `primaryProjectile` and `secondaryProjectiles`?**

**Problem:** PRIMARY and SECONDARY have completely different properties:

```javascript
// PRIMARY (1 large warhead)
damage: 90, speed: 12, size: 3, renderType: 'CIRCLE'

// SECONDARY (5 small missiles)
count: 5, damagePerProjectile: 18, speed: 10, size: 2, renderType: 'SHORT_BEAM'
```

**Solution:** Separate config objects in weaponData:

```javascript
BLASTER: {
    primaryProjectile: {
        damage: 90,
        speed: 12,
        renderType: 'CIRCLE'
    },
    secondaryProjectiles: {
        count: 5,
        damagePerProjectile: 18,
        speed: 10,
        renderType: 'SHORT_BEAM'
    }
}
```

**Alternative Rejected:** Single config with optional fields → Too confusing

### 2.5 Tank State Management

**Why `activePrimary` and `canFirePrimary`?**

**Problem:** BLASTER firing sequence requires state:

```
1. Fire → Warhead launched → Can't fire again
2. Trigger → Warhead splits → Can fire again
```

**Solution:** Track active PRIMARY projectile in Tank:

```javascript
class Tank {
    activePrimary: null,      // Current warhead waiting for trigger
    canFirePrimary: true      // Can fire new warhead?
}
```

**Why in Tank, not global?**
- Each tank has independent state
- AI tanks can also use two-stage weapons
- Multiplayer support

**Firing Logic:**
```javascript
if (activePrimary) {
    // Trigger mode: Split the warhead
    triggerSecondary(activePrimary)
    activePrimary = null
    canFirePrimary = true
} else if (canFirePrimary) {
    // Fire mode: Launch new warhead
    activePrimary = firePrimary()
    canFirePrimary = false
}
```

### 2.6 Rendering System Reuse

**Why reuse existing renderType system?**

**Design Principle:** PRIMARY and SECONDARY are just projectiles with different visuals.

**Implementation:**
```javascript
// PRIMARY uses existing 'CIRCLE' type (new)
primaryProjectile: {
    renderType: 'CIRCLE',
    renderConfig: { radius: 3 }
}

// SECONDARY uses existing 'SHORT_BEAM' type
secondaryProjectiles: {
    renderType: 'SHORT_BEAM',
    renderConfig: { length: 8 }
}
```

**Benefits:**
- No duplicate rendering code
- New renderTypes automatically work for both stages
- Consistent visual system

**New Type Added:** `'CIRCLE'` for warheads (can also be used for simple weapons)

### 2.7 Pattern System for Secondary Spread

**Why `pattern: 'RADIAL' | 'CIRCLE' | 'SWIRL'`?**

**Problem:** Different weapons split in different ways:
- BLASTER: Forward arc (RADIAL, 180°)
- SWIRL BLASTER: Full circle (CIRCLE, 360°)
- ELECTRO BUDS: Swirling paths (SWIRL)

**Solution:** Pattern parameter in secondaryProjectiles:

```javascript
secondaryProjectiles: {
    count: 5,
    pattern: 'RADIAL',
    spreadAngle: Math.PI  // 180 degrees
}
```

**Pattern Functions:**
```javascript
createRadialPattern(pos, angle, config)  // Arc spread
createCirclePattern(pos, config)         // 360° spread
createSwirlPattern(pos, config)          // Rotating spread
```

**Extensible:** New patterns can be added without changing core logic.

---

## 3. Core Concepts

### 3.1 Weapon Types

```javascript
projectileType: 'SIMPLE' | 'TWO_STAGE'
```

| Type | Description | Examples |
|------|-------------|----------|
| `SIMPLE` | Single-stage projectile | MISSILE, LASER, DOUBLE_MISSILE |
| `TWO_STAGE` | Primary → Trigger → Secondary | BLASTER, BREAKER, BOMB |

**Default:** If `projectileType` is omitted, assumed to be `SIMPLE`.

### 3.2 Trigger Types

```javascript
triggerType: 'MANUAL' | 'AUTO' | 'BOTH'
```

| Type | Description | Fire Key Behavior | Collision Behavior |
|------|-------------|-------------------|-------------------|
| `MANUAL` | Manual only | Triggers split | No split, just damage |
| `AUTO` | Auto only | Not applicable | Triggers split |
| `BOTH` | Manual or Auto | Triggers split | Triggers split |

**Only applies to TWO_STAGE weapons.**

### 3.3 Projectile Stages

```javascript
stage: 'NORMAL' | 'PRIMARY' | 'SECONDARY'
```

| Stage | Description | Used By |
|-------|-------------|---------|
| `NORMAL` | Simple single-stage projectile | MISSILE, LASER, etc. |
| `PRIMARY` | First stage (warhead, bomb) | BLASTER, BREAKER, BOMB |
| `SECONDARY` | Split projectiles | BLASTER missiles, etc. |

**Stage determines which config to use from weaponData.**

---

## 4. Data Structures

### 4.1 Simple Weapon (Existing)

```javascript
MISSILE: {
    name: 'MISSILE',
    type: 'MISSILE',
    // projectileType: 'SIMPLE' (implicit default)

    damage: 4,
    energyCost: 4,
    speed: 5,
    price: 2,
    color: '#ffff00',
    size: 2,
    density: 0.4,
    isSensor: false,

    firePattern: 'CENTER',

    renderType: 'SHORT_BEAM',
    renderConfig: {
        length: 8,
        width: 2,
        coreWidth: 1,
        hasCore: true
    }
}
```

**Key Points:**
- Flat structure (no nesting)
- Direct damage/speed/size values
- Single renderType/renderConfig

### 4.2 Two-Stage Weapon (New)

```javascript
BLASTER: {
    name: 'BLASTER',
    type: 'BLASTER',
    projectileType: 'TWO_STAGE',    // Required
    triggerType: 'BOTH',             // Required

    energyCost: 22,   // Consumed on PRIMARY fire only
    price: 650,       // DOS original

    // === PRIMARY PROJECTILE (Warhead) ===
    primaryProjectile: {
        damage: 90,        // Damage if hits without triggering
        speed: 12,         // DOS: 12 * 0.4 = 4.8 px/frame
        size: 3,
        color: '#00ff00',  // Green warhead
        density: 0.4,
        isSensor: false,

        firePattern: 'CENTER',  // Always single warhead

        renderType: 'CIRCLE',
        renderConfig: {
            radius: 3,
            fillAlpha: 1,
            hasOutline: true
        }
    },

    // === SECONDARY PROJECTILES (Split Missiles) ===
    secondaryProjectiles: {
        count: 5,                    // Number of split projectiles
        damagePerProjectile: 18,     // Each missile: 18 (5 × 18 = 90 total)
        speed: 10,                   // Speed after split
        size: 2,
        color: '#ffff00',            // Yellow missiles
        density: 0.4,
        isSensor: false,

        pattern: 'RADIAL',           // Spread pattern
        spreadAngle: Math.PI,        // 180 degrees (π radians)

        renderType: 'SHORT_BEAM',
        renderConfig: {
            length: 8,
            width: 2,
            coreWidth: 1,
            hasCore: true
        }
    }
}
```

**Key Points:**
- `projectileType: 'TWO_STAGE'` enables two-stage system
- `triggerType` defines activation method
- `primaryProjectile`: Config for initial warhead
- `secondaryProjectiles`: Config for split missiles
- `energyCost` at top level (only PRIMARY consumes energy)

**Why `damagePerProjectile` instead of `damage`?**
- Clarifies this is per-missile damage
- Total damage = `count × damagePerProjectile`
- Matches DOS original (BLASTER: 90 total, 5 missiles = 18 each)

### 4.3 Tank State Extension

```javascript
class Tank {
    constructor(x, y, config, Matter, world, onDestroy, isPlayer) {
        // ... existing properties ...

        // Weapon state
        this.currentWeapon = 'MISSILE';
        this.maxWeaponEnergy = 100;
        this.weaponEnergy = 100;
        this.weaponRechargeRate = 20;

        // Two-stage weapon state
        this.activePrimary = null;      // Current active PRIMARY projectile
        this.canFirePrimary = true;     // Can fire new PRIMARY?
    }

    switchWeapon(weaponType, WEAPON_DATA) {
        this.currentWeapon = weaponType;

        // Reset two-stage state when switching weapons
        this.activePrimary = null;
        this.canFirePrimary = true;
    }
}
```

**State Transitions:**

```
Initial State:
    activePrimary = null
    canFirePrimary = true

Fire PRIMARY:
    activePrimary = <projectile>
    canFirePrimary = false

Trigger SECONDARY (manual or auto):
    activePrimary = null
    canFirePrimary = true

Switch Weapon:
    activePrimary = null  (reset)
    canFirePrimary = true (reset)
```

### 4.4 Projectile Extension

```javascript
class Projectile {
    constructor(x, y, angle, weaponData, ownerColor, ownerId, Matter, world, ProjectileRenderer, stage = 'NORMAL') {
        this.Matter = Matter;
        this.world = world;
        this.ProjectileRenderer = ProjectileRenderer;

        // Stage and weapon reference
        this.stage = stage;              // 'NORMAL' | 'PRIMARY' | 'SECONDARY'
        this.weaponData = weaponData;    // Full weapon data (for triggering)
        this.ownerId = ownerId;

        // Select config based on stage
        let projectileConfig;
        if (stage === 'PRIMARY') {
            projectileConfig = weaponData.primaryProjectile;
        } else if (stage === 'SECONDARY') {
            projectileConfig = weaponData.secondaryProjectiles;
        } else {
            // NORMAL: Simple weapon, use weaponData directly
            projectileConfig = weaponData;
        }

        // Extract properties from selected config
        this.damage = projectileConfig.damage || projectileConfig.damagePerProjectile;
        this.speed = projectileConfig.speed;
        this.size = projectileConfig.size;
        this.color = projectileConfig.color || ownerColor;
        this.density = projectileConfig.density;
        this.isSensor = projectileConfig.isSensor;

        // Calculate actual speed (DOS units → web pixels)
        const SPEED_SCALE_FACTOR = 0.4;
        const actualSpeed = this.speed * SPEED_SCALE_FACTOR;

        // Create Matter.js body
        this.body = Matter.Bodies.circle(x, y, this.size, {
            isSensor: this.isSensor,
            label: 'projectile',
            density: this.density,
            frictionAir: 0,
            restitution: 0,
            friction: 0.1,
            collisionFilter: {
                category: COLLISION_CATEGORY.PROJECTILE,
                mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.WALL
            }
        });

        // Set velocity
        const velocity = {
            x: Math.cos(angle) * actualSpeed,
            y: Math.sin(angle) * actualSpeed
        };
        Matter.Body.setVelocity(this.body, velocity);
        Matter.World.add(world, this.body);

        // Lifetime (optional)
        this.lifetime = projectileConfig.lifetime || null;
        this.age = 0;
        this.active = true;

        // === RENDERING (Reuse existing system) ===
        this.pixiSprite = ProjectileRenderer.createGraphics(
            projectileConfig.renderType || 'SHORT_BEAM',
            this.color,
            projectileConfig  // Includes renderConfig
        );
        this.pixiSprite.position.set(x, y);
        this.pixiSprite.rotation = Math.atan2(velocity.y, velocity.x);

        ProjectileRenderer.add(this.pixiSprite);
    }

    // ... update(), destroy() methods unchanged ...
}
```

**Key Design Points:**

1. **Stage Parameter:** Optional, defaults to `'NORMAL'`
2. **Config Selection:** Stage determines which config object to use
3. **Property Extraction:** Pull damage/speed/size from selected config
4. **Rendering Reuse:** Same `ProjectileRenderer.createGraphics()` call
5. **weaponData Reference:** Stored for triggering SECONDARY later

---

## 5. Implementation Logic

### 5.1 Fire Input Handling (input.js)

```javascript
export function handleInput(playerTank, fireProjectile, WEAPON_DATA) {
    // ... movement/rotation logic ...

    // Fire projectile (Space key)
    if (keys['Space'] && !keys['Space_fired']) {
        const weaponData = WEAPON_DATA[playerTank.currentWeapon];

        if (!weaponData.projectileType || weaponData.projectileType === 'SIMPLE') {
            // Simple weapon: Use existing fireProjectile()
            fireProjectile(playerTank);
        } else if (weaponData.projectileType === 'TWO_STAGE') {
            // Two-stage weapon: Toggle fire/trigger
            fireTwoStageWeapon(playerTank, weaponData, WEAPON_DATA);
        }

        keys['Space_fired'] = true;
    }

    // ... weapon switching logic ...
}
```

**Why two paths?**
- Simple weapons: No changes to existing behavior
- Two-stage weapons: New state machine logic

### 5.2 Two-Stage Fire Logic

```javascript
/**
 * Handle two-stage weapon firing (BLASTER, BREAKER, BOMB)
 * Fire key toggles between PRIMARY fire and SECONDARY trigger
 */
function fireTwoStageWeapon(tank, weaponData, WEAPON_DATA) {
    if (tank.activePrimary) {
        // MODE 2: Trigger existing PRIMARY → Create SECONDARY
        triggerSecondary(tank.activePrimary, game);

        // Reset state
        tank.activePrimary = null;
        tank.canFirePrimary = true;

    } else if (tank.canFirePrimary) {
        // MODE 1: Fire new PRIMARY

        // Check energy
        if (tank.weaponEnergy < weaponData.energyCost) {
            return; // Not enough energy
        }

        // Consume energy
        tank.weaponEnergy -= weaponData.energyCost;

        // Fire PRIMARY projectile
        const primary = firePrimaryProjectile(tank, weaponData);

        // Update state
        tank.activePrimary = primary;
        tank.canFirePrimary = false;
    }
}
```

**State Machine:**

```
State 1: No Active Primary
    - activePrimary = null
    - canFirePrimary = true
    - Space → Fire PRIMARY → Go to State 2

State 2: Active Primary Waiting
    - activePrimary = <projectile>
    - canFirePrimary = false
    - Space → Trigger SECONDARY → Go to State 1
    - Auto collision → Trigger SECONDARY → Go to State 1
```

### 5.3 Fire PRIMARY Projectile

```javascript
/**
 * Fire PRIMARY projectile (warhead, bomb)
 * @returns {Projectile} The created PRIMARY projectile
 */
function firePrimaryProjectile(tank, weaponData) {
    const primaryConfig = weaponData.primaryProjectile;
    const firePattern = primaryConfig.firePattern || 'CENTER';
    const firePoints = getFirePoints(tank, firePattern);

    // PRIMARY usually fires 1 projectile (but firePattern supported)
    const point = firePoints[0];

    const projectile = new Projectile(
        point.x,
        point.y,
        tank.body.angle,
        weaponData,              // Full weaponData (not just primaryConfig)
        tank.config.color,
        tank.id,
        Matter,
        world,
        ProjectileRenderer,
        'PRIMARY'                // Stage parameter
    );

    projectiles.push(projectile);
    return projectile;
}
```

**Why pass full `weaponData` instead of `primaryConfig`?**
- Projectile needs full weaponData to access `secondaryProjectiles` config
- Enables triggering SECONDARY later

### 5.4 Trigger SECONDARY Projectiles

**File:** `js/systems/projectileEffects.js` (new file)

```javascript
import { COLLISION_CATEGORY, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';

/**
 * Trigger secondary projectiles from primary
 * Handles split, break, detonate logic
 *
 * @param {Projectile} primaryProjectile - PRIMARY projectile to trigger
 * @param {Object} game - Game state (projectiles array, Matter, world, etc.)
 */
export function triggerSecondary(primaryProjectile, game) {
    const weaponData = primaryProjectile.weaponData;
    const secondaryConfig = weaponData.secondaryProjectiles;

    const primaryPos = primaryProjectile.body.position;
    const primaryAngle = primaryProjectile.body.angle;

    // Create SECONDARY projectiles based on pattern
    switch (secondaryConfig.pattern) {
        case 'RADIAL':
            createRadialPattern(primaryPos, primaryAngle, secondaryConfig, weaponData, game);
            break;
        case 'CIRCLE':
            createCirclePattern(primaryPos, secondaryConfig, weaponData, game);
            break;
        case 'SWIRL':
            createSwirlPattern(primaryPos, secondaryConfig, weaponData, game);
            break;
        default:
            console.warn(`Unknown pattern: ${secondaryConfig.pattern}`);
            createRadialPattern(primaryPos, primaryAngle, secondaryConfig, weaponData, game);
    }

    // Remove PRIMARY projectile
    primaryProjectile.destroy();
}

/**
 * Create radial spread pattern (forward arc)
 * Used by: BLASTER, BREAKER
 */
function createRadialPattern(pos, baseAngle, config, weaponData, game) {
    const count = config.count;
    const spreadAngle = config.spreadAngle;

    // Calculate angle step
    const angleStep = spreadAngle / (count - 1);
    const startAngle = baseAngle - spreadAngle / 2;

    for (let i = 0; i < count; i++) {
        const angle = startAngle + angleStep * i;

        const secondary = new game.Projectile(
            pos.x,
            pos.y,
            angle,
            weaponData,              // Full weaponData
            config.color,
            game.playerTank.id,      // TODO: Get from primaryProjectile.ownerId
            game.Matter,
            game.world,
            game.ProjectileRenderer,
            'SECONDARY'              // Stage parameter
        );

        game.projectiles.push(secondary);
    }
}

/**
 * Create full circle pattern (360° spread)
 * Used by: SWIRL BLASTER, ELECTRO BUDS
 */
function createCirclePattern(pos, config, weaponData, game) {
    const count = config.count;
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
        const angle = angleStep * i;

        const secondary = new game.Projectile(
            pos.x,
            pos.y,
            angle,
            weaponData,
            config.color,
            game.playerTank.id,
            game.Matter,
            game.world,
            game.ProjectileRenderer,
            'SECONDARY'
        );

        game.projectiles.push(secondary);
    }
}

/**
 * Create swirling pattern (rotating spread)
 * Used by: SWIRL BLASTER
 * TODO: Implement swirl physics (rotating velocity)
 */
function createSwirlPattern(pos, config, weaponData, game) {
    // Placeholder: Use circle pattern for now
    createCirclePattern(pos, config, weaponData, game);

    // TODO: Add swirl velocity:
    // - Each projectile rotates around center
    // - Angular velocity + radial velocity
}
```

**Pattern Comparison:**

| Pattern | Spread | Use Case |
|---------|--------|----------|
| `RADIAL` | Forward arc (e.g., 180°) | BLASTER, BREAKER |
| `CIRCLE` | Full 360° | SWIRL BLASTER, ELECTRO BUDS |
| `SWIRL` | 360° with rotation | SWIRL BLASTER |

### 5.5 Collision Handling (collision.js)

```javascript
function handleProjectileHit(projectileBody, tankBody, game, createHitEffect, createProjectileHitParticles, pair) {
    const projectile = game.projectiles.find(p => p.body === projectileBody);
    if (!projectile || !projectile.active) return;

    const hitTank = game.tanks.find(t => t.body === tankBody);
    if (!hitTank || !hitTank.alive) return;

    // === PRIMARY COLLISION ===
    if (projectile.stage === 'PRIMARY') {
        const weaponData = projectile.weaponData;
        const triggerType = weaponData.triggerType;

        if (triggerType === 'AUTO' || triggerType === 'BOTH') {
            // Auto-trigger: Split on collision
            triggerSecondary(projectile, game);

            // Reset owner's state
            const owner = game.tanks.find(t => t.id === projectile.ownerId);
            if (owner && owner.activePrimary === projectile) {
                owner.activePrimary = null;
                owner.canFirePrimary = true;
            }

            // Visual effects at collision point
            createHitEffect(projectileBody.position.x, projectileBody.position.y);
            createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);

            return; // Don't apply PRIMARY damage (SECONDARY will hit)
        } else {
            // MANUAL only: Apply PRIMARY damage, no split
            hitTank.takeDamage(weaponData.primaryProjectile.damage);
            projectile.destroy();

            // Reset owner's state
            const owner = game.tanks.find(t => t.id === projectile.ownerId);
            if (owner && owner.activePrimary === projectile) {
                owner.activePrimary = null;
                owner.canFirePrimary = true;
            }

            createHitEffect(projectileBody.position.x, projectileBody.position.y);
            createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);
            return;
        }
    }

    // === NORMAL / SECONDARY COLLISION (Existing logic) ===
    const attacker = game.tanks.find(t => t.id === projectile.ownerId);
    if (attacker && attacker.alive) {
        hitTank.recordHit(attacker.id, attacker.body.position);
    }

    hitTank.takeDamage(projectile.damage);
    createHitEffect(projectileBody.position.x, projectileBody.position.y);
    createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);
    projectile.destroy();
}
```

**Collision Flow for PRIMARY:**

```
PRIMARY Collision:
    ↓
Check triggerType:
    ↓
├─ AUTO or BOTH:
│   ├─ Trigger SECONDARY (split)
│   ├─ Reset owner.activePrimary
│   ├─ Visual effects
│   └─ No PRIMARY damage (SECONDARY will apply damage)
│
└─ MANUAL:
    ├─ Apply PRIMARY damage
    ├─ Reset owner.activePrimary
    ├─ Visual effects
    └─ Destroy projectile (no split)
```

**Why reset `activePrimary` on auto-trigger?**
- Auto-trigger acts as implicit "trigger" action
- Owner can fire new PRIMARY immediately

---

## 6. Rendering System Integration

### 6.1 New Render Type: CIRCLE

**File:** `js/core/ProjectileRenderer.js`

```javascript
const ProjectileRenderer = {
    container: null,

    renderHandlers: {
        // Existing types
        'SHORT_BEAM': (graphics, color, config) => { /* ... */ },
        'LONG_BEAM': (graphics, color, config) => { /* ... */ },

        // New type for warheads
        'CIRCLE': (graphics, color, config) => {
            const colorHex = parseInt(color.replace('#', ''), 16);
            const radius = config.radius || 3;
            const fillAlpha = config.fillAlpha !== undefined ? config.fillAlpha : 1;

            // Fill circle
            graphics.beginFill(colorHex, fillAlpha);
            graphics.drawCircle(0, 0, radius);
            graphics.endFill();

            // Optional outline (for warheads)
            if (config.hasOutline) {
                graphics.lineStyle(1, 0xffffff, 0.8);
                graphics.drawCircle(0, 0, radius);
            }
        }
    },

    // ... rest unchanged ...
}
```

**Config Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `radius` | number | 3 | Circle radius in pixels |
| `fillAlpha` | number | 1.0 | Fill opacity (0.0-1.0) |
| `hasOutline` | boolean | false | Draw white outline |

**Example Usage:**

```javascript
// Solid warhead
renderConfig: {
    radius: 3,
    fillAlpha: 1,
    hasOutline: true
}

// Semi-transparent projectile
renderConfig: {
    radius: 2,
    fillAlpha: 0.7,
    hasOutline: false
}
```

### 6.2 Rendering Flow

**All stages use same rendering pipeline:**

```javascript
// SIMPLE weapon (NORMAL stage)
new Projectile(x, y, angle, MISSILE_DATA, ..., 'NORMAL')
    → config = MISSILE_DATA
    → renderType = 'SHORT_BEAM'
    → ProjectileRenderer.createGraphics('SHORT_BEAM', ...)

// PRIMARY stage
new Projectile(x, y, angle, BLASTER_DATA, ..., 'PRIMARY')
    → config = BLASTER_DATA.primaryProjectile
    → renderType = 'CIRCLE'
    → ProjectileRenderer.createGraphics('CIRCLE', ...)

// SECONDARY stage
new Projectile(x, y, angle, BLASTER_DATA, ..., 'SECONDARY')
    → config = BLASTER_DATA.secondaryProjectiles
    → renderType = 'SHORT_BEAM'
    → ProjectileRenderer.createGraphics('SHORT_BEAM', ...)
```

**Zero Code Duplication:**
- Same `createGraphics()` function
- Same `renderHandlers` map
- Same PixiJS sprite management

---

## 7. Implementation Phases

### Phase 2-1: Foundation (Data Structures) ✅ COMPLETED

**Goal:** Add two-stage concepts without breaking existing weapons

**Files:**
- `js/config/weapons.js`
- `js/entities/Tank.js`
- `js/entities/Projectile.js`

**Tasks:**
- [x] Add `projectileType` field to weapon data (optional, default 'SIMPLE')
- [x] Add `triggerType` field for two-stage weapons
- [x] Add `Tank.activePrimary` and `Tank.canFirePrimary` properties
- [x] Add `stage` parameter to Projectile constructor (default 'NORMAL')
- [x] Implement stage-based config selection in Projectile constructor
- [x] Test: Existing weapons still work (implicit 'SIMPLE', 'NORMAL')

**Implementation Notes:**
- Tank.js lines 89-91: Added two-stage state properties
- Tank.js lines 117-119: Reset state on weapon switch
- Projectile.js lines 28-47: Stage parameter and config selection
- All existing weapons work without changes (backward compatible)

### Phase 2-2: Rendering Extension ✅ COMPLETED

**Goal:** Add CIRCLE render type for warheads

**Files:**
- `js/core/ProjectileRenderer.js`

**Tasks:**
- [x] Add `'CIRCLE'` handler to `renderHandlers` map
- [x] Support `radius`, `fillAlpha`, `hasOutline` config options
- [x] Add `'SMALL_CIRCLE'` handler for SECONDARY projectiles
- [x] Test: Create test projectile with `renderType: 'CIRCLE'`

**Implementation Notes:**
- ProjectileRenderer.js lines 90-123: Added CIRCLE handler
- ProjectileRenderer.js lines 129-137: Added SMALL_CIRCLE handler (2px diameter)
- Tested with BLASTER weapon (3px PRIMARY, 2px SECONDARY)
- Note: Glow effect (hasGlow) was implemented and then removed per user preference

### Phase 2-3: Fire Logic Split ✅ COMPLETED

**Goal:** Separate simple and two-stage firing logic

**Files:**
- `js/systems/input.js`

**Tasks:**
- [x] Add `projectileType` check in `handleInput()`
- [x] Create `fireTwoStageWeapon()` function (stub)
- [x] Create `firePrimaryProjectile()` function (stub)
- [x] Test: Simple weapons still fire normally
- [x] Test: Two-stage weapon call reaches stub (console.log)

**Implementation Notes:**
- input.js lines 64-77: Added projectileType branching in handleInput()
- input.js lines 165-191: Implemented fireTwoStageWeapon() with full state machine
- input.js lines 205-228: Implemented firePrimaryProjectile() with firePattern support
- input.js lines 45-47: Modified handleInput signature to accept Matter, world, projectiles, etc.
- Game.js lines 278-287: Updated to pass additional parameters
- All existing weapons (SIMPLE type) continue to work through existing fireProjectile path

### Phase 2-4: PRIMARY Fire Implementation ✅ COMPLETED

**Goal:** Fire PRIMARY projectiles (warheads)

**Files:**
- `js/systems/input.js`

**Tasks:**
- [x] Implement `firePrimaryProjectile()` (create PRIMARY stage projectile)
- [x] Update `fireTwoStageWeapon()` to track `activePrimary`
- [x] Prevent firing when `canFirePrimary = false`
- [x] Add energy consumption
- [x] Test: Fire PRIMARY, can't fire again until triggered

**Implementation Notes:**
- input.js lines 205-228: Full firePrimaryProjectile() implementation
- input.js lines 165-191: State machine tracks activePrimary
- Energy consumed only on PRIMARY fire (line 180-185)
- Tank.activePrimary prevents duplicate PRIMARY firing
- Game.js lines 47-49: Added Projectile and ProjectileRenderer class references for system access

### Phase 2-5: Trigger System ✅ COMPLETED

**Goal:** Implement SECONDARY triggering (manual and auto)

**Files:**
- `js/systems/projectileEffects.js` (new file)
- `js/systems/input.js`
- `js/systems/collision.js`

**Tasks:**
- [x] Create `projectileEffects.js` file
- [x] Implement `triggerSecondary()` function
- [x] Implement `createRadialPattern()` function
- [x] Implement `createCirclePattern()` function (360° spread)
- [x] Implement `createSwirlPattern()` function (rotating spread)
- [x] Add manual trigger in `fireTwoStageWeapon()`
- [x] Add auto trigger in collision handler
- [x] Reset `activePrimary` state after trigger
- [x] Test: Manual split (fire → fire again → splits)
- [x] Test: Auto split (fire → hit wall → splits)

**Implementation Notes:**
- projectileEffects.js lines 1-169: Complete pattern system with 3 patterns
- projectileEffects.js lines 17-68: triggerSecondary() with pattern selection
- input.js lines 169-175: Manual trigger via triggerSecondary() call
- collision.js lines 5: Import triggerSecondary
- collision.js lines 53-76: handleTwoStageCollision() for auto-trigger
- collision.js lines 112-127, 162-179: Auto-trigger logic in collision handlers
- State reset: activePrimary = null, canFirePrimary = true after split
- Tested with both MANUAL trigger (fire button) and AUTO trigger (wall/tank collision)

### Phase 2-6: BLASTER Weapon ✅ COMPLETED (with modifications)

**Goal:** Add complete BLASTER weapon

**Files:**
- `js/config/weapons.js`
- `js/systems/input.js` (key binding)

**Tasks:**
- [x] Add BLASTER data to weapons.js (DOS specs)
- [x] Add key binding (key 6)
- [x] Test: Full BLASTER lifecycle
  - Fire → warhead
  - Fire → manual split
  - Fire → new warhead
  - Fire → wall hit → auto split

**Implementation Notes:**
- weapons.js lines 222-274: BLASTER weapon configuration
- input.js lines 100-102: Key 6 binding for BLASTER
- Tested all scenarios: manual trigger, auto trigger, state reset
- User requested modifications (see Implementation Differences section below):
  - Changed to 360° CIRCLE pattern with 12 missiles (not 180° RADIAL with 5)
  - SECONDARY renders as SMALL_CIRCLE (2px diameter) instead of SHORT_BEAM
  - PRIMARY is 3px diameter (size: 1.5 radius) without outline
  - All projectiles use tank color (no color overrides)
  - PRIMARY does 0 damage (only SECONDARY does damage: 7.5 each, 90 total)
  - SECONDARY speed: 5 px/frame (DOS original, not 10)

### Phase 2-7: Weapon Switching ✅ COMPLETED

**Goal:** Clean state when switching weapons

**Files:**
- `js/entities/Tank.js`

**Tasks:**
- [x] Update `Tank.switchWeapon()` to reset `activePrimary`
- [x] Reset `canFirePrimary` on weapon switch
- [x] Test: Fire BLASTER warhead → switch to MISSILE → switch back → can fire

**Implementation Notes:**
- Tank.js lines 117-119: State reset in switchWeapon()
- Prevents orphaned PRIMARY projectiles from blocking new weapon
- Tested: Fire BLASTER → switch to LASER → switch back → can fire immediately

### Phase 2-8: Additional Patterns ✅ COMPLETED

**Goal:** Add CIRCLE and SWIRL patterns

**Files:**
- `js/systems/projectileEffects.js`

**Tasks:**
- [x] Implement `createCirclePattern()` (360° spread)
- [x] Implement `createSwirlPattern()` (rotating spread)
- [x] Test patterns with BLASTER weapon

**Implementation Notes:**
- projectileEffects.js lines 115-131: createCirclePattern() for 360° spread
- projectileEffects.js lines 143-166: createSwirlPattern() for rotating arc
- BLASTER uses CIRCLE pattern with 12 missiles
- All 3 patterns (RADIAL, CIRCLE, SWIRL) ready for future weapons

---

## 8. Implementation Differences from Original Design

During implementation, several modifications were made based on user feedback and testing:

### 8.1 BLASTER Pattern Change (360° Spread)

**Original Design:**
- Pattern: RADIAL (180° arc spread)
- Count: 5 missiles
- Spread: Forward-facing arc

**Actual Implementation:**
- Pattern: CIRCLE (360° spread)
- Count: 12 missiles
- Spread: All directions

**Reason:** User requirement - "블라스터 계열의 무기는 2차 격발시 분열하면서 사방으로 자탄이 날아가는 구조야" (BLASTER splits in all directions)

### 8.2 SECONDARY Rendering (Small Circles)

**Original Design:**
- renderType: 'SHORT_BEAM'
- Visual: 8px beam, same as basic missiles

**Actual Implementation:**
- renderType: 'SMALL_CIRCLE'
- Visual: 2px diameter solid circle

**Reason:** User requirement - "자탄의 모양은 원형으로 해줘. 지름 2px 로" (Secondary missiles as 2px diameter circles)

### 8.3 PRIMARY Warhead Design

**Original Design:**
- size: 3 (physics body)
- radius: 3px (6px diameter)
- hasOutline: true (white outline)

**Actual Implementation:**
- size: 1.5 (physics body)
- radius: 1.5px (3px diameter)
- hasOutline: false (no outline)

**Reason:** User requirement - "모탄 지름을 3px로 해줘. 외곽선은 빼고" (PRIMARY warhead 3px diameter without outline)

### 8.4 Color System (Tank Color Inheritance)

**Original Design:**
- PRIMARY: color: '#00ff00' (green)
- SECONDARY: color: '#ffff00' (yellow)
- Each weapon specifies colors

**Actual Implementation:**
- All weapons: color property removed
- Automatic inheritance from tank color

**Reason:** User requirement - "모든 무기는 다 탱크 색상 따라가는 것이 규칙이야" (All weapons follow tank color). Implementation: `this.color = projectileConfig.color || ownerColor` in Projectile.js

### 8.5 Damage Distribution

**Original Design:**
- PRIMARY: damage: 90 (warhead does damage)
- SECONDARY: damagePerProjectile: 18

**Actual Implementation:**
- PRIMARY: damage: 0 (no damage)
- SECONDARY: damage: 7.5 (90 total / 12 missiles)

**Reason:** Game balance - PRIMARY is delivery mechanism, SECONDARY missiles do the actual damage. This matches bomb behavior where the bomb itself doesn't damage, only the explosion does.

### 8.6 SECONDARY Speed

**Original Design:**
- speed: 10 (4.0 px/frame)

**Actual Implementation:**
- speed: 5 (2.0 px/frame, same as basic MISSILE)

**Reason:** DOS original reference (weapons.txt shows BLASTER speed: 5)

### 8.7 Glow Effect (Attempted and Removed)

**Attempted Implementation:**
- hasGlow: true
- Dual-layer rendering (glow + core)
- PixiJS BlurFilter with blur=1-2

**Final Implementation:**
- hasGlow: removed
- Single-layer solid circle

**Reason:** User feedback - "그냥 블러 필터 없는게 낫다. 제거해줘" (Better without blur, remove it). Simpler rendering performs better and looks cleaner.

### 8.8 Wall Spawn Offset (Attempted and Removed)

**Attempted Implementation:**
- 5px offset away from wall collision
- Then 1px offset

**Final Implementation:**
- No offset, spawn at exact collision point

**Reason:** User feedback - "아니야. 지금 동작이 맞아" (Current behavior is correct). Natural behavior where some SECONDARY missiles immediately hit walls is acceptable and realistic.

### 8.9 Code Quality Improvements (Not in Original Design)

**Added During Implementation:**

1. **Code Refactoring (collision.js)**
   - Extracted duplicate collision handling into `handleTwoStageCollision()` function
   - Reduced 40 duplicate lines to 8-line function call
   - Consistent behavior between tank and wall collisions

2. **Null Safety (optional chaining)**
   - Added `?.` operator for `weaponData` checks
   - Prevents crashes if weaponData is null/undefined
   - Example: `weaponData?.projectileType === 'TWO_STAGE'`

3. **Debug Log Removal**
   - Removed all console.log debug statements
   - Production-ready code without verbose logging

4. **Comment Documentation**
   - Added detailed comments explaining collision logic paths
   - Documented two-stage behavior in function headers

**Reason:** Code quality review requested by user - "여기서 무기 로직에 중복, 오류, 비효율 없는지 검토" (Review weapon logic for duplication, errors, inefficiency)

---

## 9. Testing Scenarios

### 9.1 BLASTER Manual Split

**Steps:**
1. Press `6` → Select BLASTER
2. Press `Space` → Warhead fires forward (tank color)
3. Wait 0.5s
4. Press `Space` → Warhead splits into 12 missiles (360° spread)
5. Press `Space` → New warhead fires
6. All 12 previous missiles still flying

**Expected:**
- Warhead: 3px diameter circle (tank color), speed 4.8 px/frame
- Split: 12 small 2px circles (tank color), speed 2.0 px/frame, 30° spacing
- State: Can fire new warhead immediately after split

**Actual Implementation:**
- ✅ All behaviors work as expected
- ✅ CIRCLE pattern with 12 missiles
- ✅ Tank color inheritance working

### 9.2 BLASTER Auto Split (Wall)

**Steps:**
1. Press `6` → Select BLASTER
2. Press `Space` → Warhead fires toward wall
3. Warhead hits wall → Auto-splits into 12 missiles
4. Press `Space` → New warhead fires immediately

**Expected:**
- Auto-split occurs on collision
- No manual trigger needed
- State reset automatically
- Visual effects at split point

**Actual Implementation:**
- ✅ Auto-trigger working on wall collision
- ✅ Some SECONDARY missiles may immediately hit walls (natural behavior)
- ✅ State reset allows immediate new PRIMARY fire

### 9.3 BLASTER Auto Split (Tank)

**Steps:**
1. Press `6` → Select BLASTER
2. Fire warhead at enemy tank
3. Warhead hits tank → Auto-splits
4. Split missiles hit nearby tanks/walls

**Expected:**
- No PRIMARY damage (warhead does 0 damage on auto-split)
- Split missiles each deal 7.5 damage
- Maximum 90 damage if all 12 hit same tank

**Actual Implementation:**
- ✅ PRIMARY does 0 damage (only delivery mechanism)
- ✅ SECONDARY missiles each do 7.5 damage
- ✅ Total damage potential: 90 (12 × 7.5)

### 9.4 Weapon Switching During Active PRIMARY

**Steps:**
1. Press `6` → Select BLASTER
2. Press `Space` → Warhead fires
3. Press `1` → Switch to MISSILE (before warhead triggers)
4. Press `Space` → MISSILE fires normally
5. Press `6` → Switch back to BLASTER
6. Press `Space` → New BLASTER warhead fires

**Expected:**
- Old warhead still exists (becomes orphaned)
- Old warhead can still auto-split on collision
- New BLASTER warhead fires normally (state reset)

**Actual Implementation:**
- ✅ State reset in Tank.switchWeapon() (lines 117-119)
- ✅ Can fire new weapon immediately after switch
- ✅ Orphaned PRIMARY projectiles still functional

### 9.5 Energy Management

**Steps:**
1. Press `6` → Select BLASTER
2. Drain energy to 21 (below 22)
3. Press `Space` → Nothing happens (insufficient energy)
4. Wait for recharge to 22+
5. Press `Space` → Warhead fires
6. Press `Space` → Split (no energy cost)
7. Energy still at 22+

**Expected:**
- PRIMARY fire costs 22 energy
- SECONDARY trigger costs 0 energy
- Energy check only on PRIMARY fire

**Actual Implementation:**
- ✅ Energy check in fireTwoStageWeapon() (lines 180-185)
- ✅ Only PRIMARY fire consumes energy
- ✅ Manual trigger is free

### 9.6 Rapid Fire After Split

**Steps:**
1. Press `6` → Select BLASTER
2. Press `Space` → Warhead fires
3. Press `Space` immediately → Warhead splits
4. Press `Space` immediately → New warhead fires
5. Repeat 10 times rapidly

**Expected:**
- No double-fire
- No skipped inputs
- Clean state transitions
- All projectiles render correctly

**Actual Implementation:**
- ✅ State machine prevents double-fire
- ✅ Space_fired flag prevents input repeat
- ✅ All transitions clean and deterministic

---

## 10. Future Extensions

### 10.1 BREAKER Family

**Differences from BLASTER:**
- Same two-stage system
- Different damage/speed values
- Some have different split counts (3, 5, 8 missiles)
- QUINT GUIDER: Split missiles are guided

**Implementation:**
```javascript
TRI_BREAKER: {
    projectileType: 'TWO_STAGE',
    triggerType: 'BOTH',
    primaryProjectile: { damage: 21, ... },
    secondaryProjectiles: {
        count: 3,  // Not 5
        damagePerProjectile: 7,
        ...
    }
}
```

**No code changes needed** (uses same system).

### 9.2 BOMB Family

**Differences:**
- PRIMARY has zero velocity (drops in place)
- MANUAL trigger only
- CIRCLE pattern (360° explosion)

**Implementation:**
```javascript
NORMAL_BOMB: {
    projectileType: 'TWO_STAGE',
    triggerType: 'MANUAL',  // No auto-split
    primaryProjectile: {
        speed: 0,  // Stationary bomb
        renderType: 'CIRCLE',
        ...
    },
    secondaryProjectiles: {
        pattern: 'CIRCLE',  // 360° spread
        ...
    }
}
```

**Special Handling:**
- Bomb doesn't move (velocity = 0)
- Render as pulsing circle (animation)
- Large explosion radius

### 9.3 Guided Missiles (QUINT GUIDER)

**New Feature:** Split missiles track targets

**Implementation:**
```javascript
secondaryProjectiles: {
    count: 5,
    isGuided: true,  // New property
    guidedConfig: {
        turnRate: 0.05,      // rad/frame
        targetType: 'NEAREST' // 'NEAREST' | 'SPECIFIC'
    },
    ...
}
```

**Code Changes:**
- Projectile.update(): Add guidance logic for SECONDARY
- Track nearest enemy tank
- Adjust velocity toward target

### 9.4 SWIRL BLASTER

**Special Pattern:** Rotating spread

**Implementation:**
```javascript
secondaryProjectiles: {
    count: 6,
    pattern: 'SWIRL',
    swirlConfig: {
        rotationSpeed: 0.1,  // rad/frame
        radius: 30            // orbit radius
    },
    ...
}
```

**Physics:**
- Each missile orbits around center point
- Radial velocity + tangential velocity
- Spiral outward pattern

### 9.5 Multi-Stage Splits

**Concept:** SECONDARY can split again (chain reaction)

**Not in DOS original, but possible extension:**

```javascript
secondaryProjectiles: {
    count: 5,
    projectileType: 'TWO_STAGE',  // SECONDARY can also split
    triggerType: 'AUTO',
    secondaryProjectiles: {  // Nested!
        count: 3,
        ...
    }
}
```

**Recursive system:** Same logic applies at any depth.

---

## 10. Design Rationale Summary

### 10.1 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Generic naming (PRIMARY/SECONDARY) | Works for BLASTER, BREAKER, BOMB, future weapons |
| Unified `triggerType` | Single field handles all activation methods |
| Stage-based Projectile | One class for all projectile types |
| Separate configs in weaponData | Clear separation, different properties |
| Tank state tracking | Each tank independent, supports AI/multiplayer |
| Reuse rendering system | Zero duplication, consistent visuals |
| Pattern system | Extensible for new spread types |
| Optional `projectileType` | Backward compatible with simple weapons |

### 10.2 Trade-offs

**Complexity vs. Flexibility:**
- ✅ More complex than simple weapons
- ✅ But handles 35% of all weapons (12/34)
- ✅ Extensible to future weapon types

**State Management:**
- ✅ Tank state adds complexity
- ✅ But enables proper two-stage behavior
- ✅ Clean separation from simple weapons

**Config Structure:**
- ✅ Nested configs (primaryProjectile, secondaryProjectiles)
- ✅ More verbose but clearer intent
- ✅ Type-safe (different properties)

### 10.3 Alternatives Considered

**Alternative 1: Separate Warhead/Missile classes**
```javascript
class Warhead extends Projectile { ... }
class SplitMissile extends Projectile { ... }
```
❌ Rejected: Code duplication, separate rendering logic

**Alternative 2: Weapon-specific logic**
```javascript
if (weapon.type === 'BLASTER') {
    // BLASTER-specific code
} else if (weapon.type === 'BREAKER') {
    // BREAKER-specific code
}
```
❌ Rejected: Not scalable, hard to maintain

**Alternative 3: Event-based system**
```javascript
projectile.on('collision', () => { split() })
```
❌ Rejected: Over-engineered for current needs

**Chosen Approach: Stage-based unified system**
✅ Single implementation, generic concepts, extensible

---

## 11. Conclusion

This two-stage weapon system provides a **generic, extensible foundation** for BLASTER, BREAKER, and BOMB families (12 weapons total).

**Core Principles:**
1. **Generic concepts** (PRIMARY/SECONDARY/TRIGGER) work for all weapon types
2. **Reuse existing systems** (rendering, physics, collision)
3. **Clean separation** from simple weapons (opt-in via `projectileType`)
4. **Extensible patterns** for future weapons

**Implementation Path:**
- 8 phases, gradual complexity increase
- Each phase testable independently
- Backward compatible with existing weapons

**Next Steps:**
- Begin Phase 2-1 (foundation)
- Test thoroughly at each phase
- Add BLASTER in Phase 2-6
- Extend to BREAKER/BOMB with minimal changes

---

## 12. BLASTER Variants Implementation (2025-11-23)

### 12.1 Overview

Two BLASTER variants were implemented, combining the two-stage system with the GUIDED system:

- **GUIDE_BLASTER:** Guided warhead + normal missiles
- **BLAST_GUIDER:** Normal warhead + guided missiles

Both weapons integrate:
- Two-stage weapon system (PRIMARY → TRIGGER → SECONDARY)
- GUIDED system (target tracking, trail effects)
- Trail system with differentiated fadeRate
- Acceleration system (warhead boost)

### 12.2 GUIDE_BLASTER Implementation

**Concept:** Guided warhead that splits into normal missiles

**PRIMARY Projectile (Warhead):**
- `isGuided: true` - SMART targeting system
- `guidedConfig`: turnRate 0.01, detectionRange 100, updateInterval 10
- `hasTrail: true` - Long trail (fadeRate 0.03)
- `hasAcceleration: true` - Speed boost (5 → 7 DOS units, 0.5s)
- Renders as CIRCLE (radius 1.5px)

**SECONDARY Projectiles (Split Missiles):**
- `isGuided: false` - Normal missiles
- 12 missiles in CIRCLE pattern (360°)
- Renders as SMALL_CIRCLE (radius 1px)
- No trail, no acceleration

**Stats:**
- Energy: 28 (27% more than BLASTER)
- Price: $1,200 (DOS original)
- Total damage: 90 (same as BLASTER)

**Use Case:** "For desperate situations with no time for aiming, or for bad aimers" (DOS manual)

### 12.3 BLAST_GUIDER Implementation

**Concept:** Normal warhead that splits into guided missiles

**PRIMARY Projectile (Warhead):**
- `isGuided: false` - Normal warhead
- `hasAcceleration: true` - Speed boost (5 → 7 DOS units, 0.5s)
- Renders as CIRCLE (radius 1.5px)
- No trail

**SECONDARY Projectiles (Split Missiles):**
- `isGuided: true` - SMART targeting system
- `hasTrail: true` - Short trail (fadeRate 0.12)
- `lifetime: 2.0s` - Auto-destruct after 2 seconds
- 12 missiles in CIRCLE pattern (360°)
- Renders as SMALL_CIRCLE (radius 1px)

**Stats:**
- Energy: 34 (21% more than GUIDE_BLASTER)
- Price: $2,500 (DOS original)
- Total damage: 70 (less than BLASTER, but guided)

**Use Case:** "In open spaces, maximum damage easily obtained. Very good value for money." (DOS manual)

### 12.4 Trail System Integration

Both weapons use the Trail system with differentiated fadeRate:

**GUIDE_BLASTER PRIMARY (Guided Warhead):**
- fadeRate: 0.03 (long trail, 20 frames ≈ 0.33s)
- Reason: No lifetime limit, warhead flies until collision
- Visual effect: Clear trail showing warhead's curved path

**BLAST_GUIDER SECONDARY (Guided Missiles):**
- fadeRate: 0.12 (short trail, 5 frames ≈ 0.08s)
- Reason: lifetime 2.0s, auto-destruct prevents screen clutter
- Visual effect: Brief trail showing missile tracking

**fadeRate Calculation:**
```
Visual trail length (positions) = initialAlpha / fadeRate
GUIDE_BLASTER: 0.6 / 0.03 = 20 positions → 60px trail
BLAST_GUIDER:  0.6 / 0.12 = 5 positions  → 15px trail
```

### 12.5 System Integration

**Two-Stage System:**
- Both weapons use `projectileType: 'TWO_STAGE'`
- `triggerType: 'BOTH'` (manual fire key OR auto collision)
- PRIMARY → TRIGGER → SECONDARY flow identical to BLASTER

**GUIDED System:**
- Reuses existing guidedSystem.js
- findBestTarget() with SMART algorithm
- adjustVelocityTowardTarget() with turnRate
- No modifications needed (system fully generic)

**Trail System:**
- Managed by TrailManager.js (Option D architecture)
- Projectile stores only trailId
- TrailManager owns all trail data
- Attached/Independent state transition

**Acceleration System:**
- Both warheads use Ease-Out Quadratic
- GUIDE_BLASTER: 5 → 7 DOS units (0.5s)
- BLAST_GUIDER: 5 → 7 DOS units (0.5s)
- Shorter duration than BLASTER (0.5s vs 0.7s)

### 12.6 Code Example

```javascript
// weapons.js - GUIDE_BLASTER
GUIDE_BLASTER: {
    name: 'GUIDE BLASTER',
    displayName: 'G.BST',
    type: 'GUIDE_BLASTER',
    energyCost: 28,
    price: 1200,

    projectileType: 'TWO_STAGE',
    triggerType: 'BOTH',

    primaryProjectile: {
        damage: 0,
        speed: 5,
        size: 1.5,

        // Guided warhead
        isGuided: true,
        guidedConfig: {
            turnRate: 0.01,
            targetType: 'SMART',
            detectionRange: 100,
            updateInterval: 10
        },

        // Long trail for guided path visualization
        hasTrail: true,
        trailConfig: {
            maxLength: 36,
            fadeRate: 0.03,  // Long trail
            width: 1,
            length: 3,
            spacing: 3,
            initialAlpha: 0.6,
            color: '#ffffff'
        },

        // Acceleration
        hasAcceleration: true,
        accelerationConfig: {
            initialSpeed: 5,
            finalSpeed: 7,
            duration: 0.5,
            easingType: 'EASE_OUT_QUAD'
        },

        renderType: 'CIRCLE',
        renderConfig: { radius: 1.5, fillAlpha: 1, hasOutline: false }
    },

    secondaryProjectiles: {
        damage: 7.5,  // 90 / 12 = 7.5
        speed: 5,
        size: 2,
        lifetime: 2.0,

        // Normal missiles (not guided)
        isGuided: false,

        pattern: 'CIRCLE',
        count: 12,

        renderType: 'SMALL_CIRCLE',
        renderConfig: { radius: 1 }
    }
}

// weapons.js - BLAST_GUIDER
BLAST_GUIDER: {
    // ... (similar structure)

    primaryProjectile: {
        // Normal warhead (not guided)
        isGuided: false,
        hasAcceleration: true
    },

    secondaryProjectiles: {
        // Guided missiles with short trail
        isGuided: true,
        guidedConfig: { ... },
        hasTrail: true,
        trailConfig: {
            fadeRate: 0.12  // Short trail (lifetime weapon)
        },
        lifetime: 2.0
    }
}
```

### 12.7 Testing Notes

**GUIDE_BLASTER:**
- ✅ Warhead tracks nearest tank
- ✅ Long trail shows curved path
- ✅ Warhead acceleration visible
- ✅ Missiles spread 360° on trigger
- ✅ Missiles are NOT guided (correct)

**BLAST_GUIDER:**
- ✅ Warhead flies straight with acceleration
- ✅ No warhead trail (correct)
- ✅ 12 missiles track targets individually
- ✅ Short trails on missiles (correct)
- ✅ Missiles auto-destruct at 2.0s

**Trail System:**
- ✅ fadeRate difference visible (0.03 vs 0.12)
- ✅ 4x visual trail length difference
- ✅ TrailManager handles both correctly
- ✅ Independent trails fade after projectile death

### 12.8 Lessons Learned

**System Modularity:**
- Two-stage, GUIDED, Trail, and Acceleration systems compose perfectly
- No conflicts or special cases needed
- Each system remains independent and reusable

**fadeRate Differentiation:**
- Per-frame vs per-second confusion resolved
- Visual trail length formula: `initialAlpha / fadeRate`
- Lifetime weapons benefit from shorter trails (less clutter)

**Display Names:**
- Added `displayName` field to all weapons
- HUD uses DOS-style abbreviations (G.BST, B.GUI)
- Improves authenticity and readability

---

**Document Version:** 1.1
**Last Updated:** 2025-11-23
**Status:** Implemented and Extended (3 BLASTER variants complete)
