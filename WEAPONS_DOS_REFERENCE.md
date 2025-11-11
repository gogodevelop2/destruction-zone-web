# Destruction Zone - DOS Original Weapon Reference

**Source:** DZONE.EXE v1.3 (1994) + DZONE.DOC
**Author:** Julian Cochran
**Purpose:** Complete weapon data extracted from original DOS game binary

---

## 🎮 Implementation Status

| Weapon | Port | Status | Notes |
|--------|------|--------|-------|
| MISSILE | 1 | ✅ Implemented | Basic weapon |
| DOUBLE_MISSILE | 1 | ✅ Implemented | Parallel fire pattern |
| TRIPLE_MISSILE | 1 | ✅ Implemented | 3-way fire pattern |
| LASER | 1 | ✅ Implemented | High-speed beam |
| POWER_LASER | 1 | ✅ Implemented | Dual laser |
| TRI-STRIKER | 1 | ✅ Implemented | **With acceleration system** (2025-11-11) |
| BLASTER | 2 | ✅ Implemented | Two-stage system, **with acceleration** (2025-11-11) |
| GUIDED | 4 | ✅ Implemented | Smart targeting + trail (2025-11-08) |

**Latest Updates:**
- 2025-11-11: TRI-STRIKER completed (acceleration + MEDIUM_BEAM rendering)
- 2025-11-11: BLASTER acceleration added (0.7s warhead boost)
- 2025-11-08: GUIDED completed (SMART targeting, trail effects)
- 2025-11-07: BLASTER completed (two-stage weapon system)

---

## Data Sources

1. **Binary Analysis:** Weapon stats extracted from DZONE.EXE using reverse engineering
2. **Manual:** Descriptions and strategy from DZONE.DOC
3. **Extracted Data:** `docs/DOS_WEAPON_DATA.tsv`

---

## Binary Structure

Each weapon occupies **10 bytes** in the executable:

```
Offset  Size  Field         Description
------  ----  -----------   ------------------------------------------
+0      1     port          Weapon port (1-7)
+1      1     damage        Damage per hit
+2      1     special_flag  Special behavior (0=normal, 1=multi-hit)
+3      1     energy        Energy cost per shot
+4      2     speed         Speed in DOS units (little-endian)
+6      1     weapon_id     Weapon behavior type ID (0-35)
+7      2     price         Price in credits (little-endian)
+9      1     reserved      Always 0 (unused)
```

---

## Weapon Format

Each weapon entry shows:
- **Damage/Energy/Price** - From binary extraction
- **Speed** - DOS units (2-45 range)
- **Weapon ID** - Behavior type identifier
- **Special Flag** - Multi-hit explosion flag (DEATH BOMB only)
- **Description** - From original manual

---

## PORT 1: Front Fire (6 weapons)

Forward-firing weapons for direct combat.

### MISSILE (MISIL)
- **Binary Stats:** Damage=4, Energy=4, Speed=5, Price=$2
- **Weapon ID:** 0 (basic projectile)
- **Description:** Starting weapon for all tanks. Low priced backup weapon, ability often underestimated. [Unlisted for wealthy players]
- **Strategy:** Basic reliable weapon

### DOUBLE MISSILE (DOUBL)
- **Binary Stats:** Damage=6, Energy=4, Speed=6, Price=$100
- **Weapon ID:** 8
- **Description:** Improves power without using more energy. Low price makes this good for saving money.
- **Projectiles:** 2 missiles fired in parallel

### TRIPLE MISSILE (TRIPL)
- **Binary Stats:** Damage=9, Energy=5, Speed=7, Price=$600
- **Weapon ID:** 10
- **Description:** Next step after DOUBLE. Due to slow speed and high damage, best used for **close range combat**.
- **Projectiles:** 3 missiles
- **Note:** Speed=7 is "slow" relative to lasers (45), but faster than basic missile (5)

### BEAM LASER (LASER)
- **Binary Stats:** Damage=6, Energy=6, Speed=45, Price=$150
- **Weapon ID:** 0 (basic projectile)
- **Description:** Like all low priced weapons, good to master. Expensive weapons don't necessarily make more money per damage unit → **Master the low priced weapons**.
- **Note:** 9x faster than MISSILE (45 vs 5)

### POWER LASER (POWER)
- **Binary Stats:** Damage=12, Energy=6, Speed=45, Price=$1,650
- **Weapon ID:** 8
- **Description:** Fires two Beam Lasers while using energy of only one. Should be used for aiming at **specific enemy** rather than closest.
- **Projectiles:** 2 lasers

### TRI-STRIKER (STRIK)
- **Binary Stats:** Damage=18, Energy=6, Speed=45, Price=$3,350
- **Weapon ID:** 10
- **Description:** **Extremely efficient**, but requires great aiming skills when used in long range firing - the primary purpose for this weapon.
- **Projectiles:** 3 missiles
- **Note:** Laser-speed missiles (45), highest damage/energy ratio in Port 1

---

## PORT 2: Blasters (5 weapons)

**Double fire system:** First fire sends warhead, second fire breaks it into missiles. Warheads break automatically when hitting walls or tanks.

**Strategy:** Fire at **side of tank** rather than head. Only ~50% of max damage on average.

### BLASTER (BLAST)
- **Binary Stats:** Damage=90, Energy=22, Speed=12, Price=$650
- **Weapon ID:** 3
- **Description:** Standard blaster with double fire system. Breaks into group of missiles.
- **Note:** Binary shows Energy=22 (manual says 23, likely typo in manual)

### GUIDE BLASTER (G.BST)
- **Binary Stats:** Damage=90, Energy=28, Speed=7, Price=$1,200
- **Weapon ID:** 16
- **Description:** Blaster with guided warhead. For desperate situations with no time for aiming, or for bad aimers.
- **Special:** Guided warhead (slower than standard)

### BLAST GUIDER (B.GUI)
- **Binary Stats:** Damage=70, Energy=34, Speed=7, Price=$2,500
- **Weapon ID:** 17
- **Description:** Opposite of GUIDE BLASTER. Normal warhead → guided missiles. In open spaces, **maximum damage easily obtained**. Very good value for money.
- **Special:** Warhead breaks into guided missiles

### NUKE BLASTER (N.BST)
- **Binary Stats:** Damage=168, Energy=40, Speed=12, Price=$3,400
- **Weapon ID:** 4
- **Description:** Big version of standard Blaster. **2-3 hits destroy tank**, sometimes only 1 good hit. Very good value but must aim carefully. **Aim at side, not head**.
- **Note:** Highest single-hit damage weapon in game

### SWIRL BLASTER (S.BST)
- **Binary Stats:** Damage=48, Energy=20, Speed=8, Price=$3,800
- **Weapon ID:** 34
- **Description:** On second fire, warhead splits into six swirlers (8 damage each).
- **Special:** Creates 6 swirling projectiles

---

## PORT 3: Surprise Attack (5 weapons)

Rear-firing and special tactical weapons.

### REAR DOUBLE (REAR2)
- **Binary Stats:** Damage=8, Energy=5, Speed=12, Price=$130
- **Weapon ID:** 9
- **Direction:** Rear
- **Description:** Two missiles fired parallel from rear. Good surprise attack. **Strangely low price** for damage. Many like to fire from front using **TURRET**.
- **Projectiles:** 2 parallel rear missiles

### REAR GUIDED (GREAR)
- **Binary Stats:** *Not found in binary* (different abbreviation)
- **Manual Stats:** Damage=8, Energy=5, Price=$650
- **Direction:** Rear
- **Description:** Releases two guided missiles from rear (4 damage each). Very good for **attacking while being chased**.
- **Projectiles:** 2 guided missiles

### REAR CHAOS (CHAOS)
- **Binary Stats:** Damage=14, Energy=5, Speed=4, Price=$1,000
- **Weapon ID:** 25
- **Direction:** Rear
- **Description:** Miniature guiders from rear. Missiles die after short period - **short range only**. Can be used in interesting ways.
- **Note:** Slowest weapon except ELECTRO BUDS (Speed=4 vs 2)

### TELEPORT FOE (TPFOE)
- **Binary Stats:** *Special weapon, not in standard data*
- **Manual Stats:** Damage=0, Energy=4, Price=$1,600
- **Description:** Forces nearest tank to teleport to random location. Useful for escaping closing tank or separating two tanks in close combat.
- **Special:** Instant effect, no projectile

### REAR TRIPLE (REAR3)
- **Binary Stats:** Damage=15, Energy=6, Speed=30, Price=$2,200
- **Weapon ID:** 29
- **Direction:** Rear
- **Description:** Improved REAR DOUBLE. Nearly twice the damage. Good alternative to TRI STRIKER when used with **TURRET**.
- **Projectiles:** 3 rear missiles
- **Note:** Fast rear weapon (Speed=30)

---

## PORT 4: Special Front Fire (6 weapons)

Breakers and guided missiles.

**Breaker Strategy:** Make direct hit, warhead breaks up automatically.

### TRI BREAKER (T.BRK)
- **Binary Stats:** Damage=21, Energy=12, Speed=8, Price=$250
- **Weapon ID:** 1
- **Description:** **Great starting weapon**. Very high damage per cost. Breaks into 3 on second fire (7 damage each).
- **Special:** 2-stage: warhead → 3 missiles

### GUIDED (GUIDE)
- **Binary Stats:** Damage=6, Energy=6, Speed=7, Price=$400
- **Weapon ID:** 7
- **Description:** Basic guided missile. Only requires approximate aiming. Poor damage/energy ratio - **only valuable to unskilled players**.
- **Special:** Target tracking

### QUINT BREAKER (Q.BRK)
- **Binary Stats:** Damage=30, Energy=12, Speed=8, Price=$1,350
- **Weapon ID:** 2
- **Description:** Same as TRI BREAKER but releases 5 instead of 3 (6 damage each). **Good value for money**.
- **Special:** 2-stage: warhead → 5 missiles

### QUINT GUIDER (Q.GUI)
- **Binary Stats:** Damage=30, Energy=20, Speed=6, Price=$2,250
- **Weapon ID:** 18
- **Description:** Identical to QUINT BREAKER but produces guided missiles and uses more energy.
- **Special:** 2-stage: warhead → 5 guided missiles

### OCTO BREAKER (O.BRK)
- **Binary Stats:** Damage=48, Energy=16, Speed=8, Price=$4,000
- **Weapon ID:** 35
- **Description:** Next level after QUINT. **2-3 hits destroy tank**. High price means careful aiming required.
- **Special:** 2-stage: warhead → 8 missiles

### SPARK FIENDS (SPARK)
- **Binary Stats:** Damage=16, Energy=9, Speed=40, Price=$5,400
- **Weapon ID:** 31
- **Description:** Although damage doesn't seem high, **never misses target**. Not for making money, but for **quickly killing rivals** before they score.
- **Special:** Homing projectiles that never miss
- **Note:** Nearly as fast as lasers (Speed=40 vs 45)

---

## PORT 5: Aggressive Defence (4 weapons)

Defensive weapons and bombs.

### SWIRLER (SWIRL)
- **Binary Stats:** Damage=8, Energy=3, Speed=5, Price=$225
- **Weapon ID:** 11
- **Pattern:** Orbits around tank
- **Description:** **Particularly high damage/price ratio**. Fired in large numbers to get rid of touching/chasing tanks.
- **Skill:** Circle robot while firing many swirlers, especially with fast tank.

### ELECTRO BUDS (ELECT)
- **Binary Stats:** Damage=15, Energy=4, Speed=2, Price=$800
- **Weapon ID:** 26
- **Description:** Three slow guided missiles. When fired in large numbers, act as **"deadly mist"**.
- **Projectiles:** 3 slow guided missiles
- **Note:** Slowest weapon in game (Speed=2)

### NORMAL BOMB (NBOMB)
- **Binary Stats:** Damage=100, Energy=25, Speed=20, Price=$500
- **Weapon ID:** 13
- **Type:** Stationary (drops and detonates on second fire)
- **Description:** Usually used against robots. Drop where enemy will move. 2-3 hits usually kill.
- **Strategy:** Predict enemy path and place trap

### DEATH BOMB (DBOMB)
- **Binary Stats:** Damage=94, Energy=40, Speed=20, Price=$3,250
- **Weapon ID:** 14
- **Special Flag:** 1 (ONLY weapon with multi-hit flag)
- **Type:** Stationary bomb
- **Description:** Destroys anything during detonation. **Cheapest weapon per damage**. Near-maximum damage can be obtained.
- **Note:** Binary shows 94 damage (manual says 350 total - likely multiple hits)

---

## PORT 6: Special Defence (4 weapons)

*Not extracted from binary - manual data only*

### DEATH TOUCH (TOUCH)
- **Manual Stats:** Damage=15, Energy=7, Price=$350
- **Effect:** Tank becomes highly charged (2.0s duration)
- **Description:** Any touching tanks badly damaged. **Strangely low price** to discourage trapping.

### DEFLECTOR (DEFLE)
- **Manual Stats:** Damage=0, Energy=0, Price=$2,200
- **Effect:** Reverses all incoming missiles (1.0s duration)
- **Description:** Forces all incoming missiles to reverse direction. Doesn't use weapon energy but excessive use costs money. Can convert enemy SWIRLERS/GUIDERS or detonate bombs.

### ECM WIPER (WIPE)
- **Manual Stats:** Damage=0, Energy=4, Price=$800
- **Effect:** Destroys all missiles in zone
- **Description:** Usually used to aid friend in teams mode.

### CONFUSOR (ECM)
- **Manual Stats:** Damage=0, Energy=0, Price=$480
- **Effect:** Guided missiles ignore tank (3.0s duration)
- **Description:** Without using energy, causes all guided missiles to ignore tank. Good value but **only useful for fast weapon switchers**.

---

## PORT 7: Harmless Defense (4 weapons)

*Not extracted from binary - manual data only*

### HEALER (HEAL)
- **Manual Stats:** Damage=-10 (healing), Energy=10, Price=$350
- **Effect:** Converts weapon energy → shield energy
- **Description:** Only used when excess weapon energy but critically low shields.

### GLOW SHIELD (GLOW)
- **Manual Stats:** Damage=0, Energy=15, Price=$800
- **Effect:** Complete invincibility (3.0s duration)
- **Description:** Complete protection for few seconds. **Best use:** Turn shield on, move close to tank, fire high damage short range weapon (QUINT BREAKER).

### FADE SHIELD (FADE)
- **Manual Stats:** Damage=0, Energy=20, Price=$1,200
- **Effect:** Cloaking/invisibility (6.0s duration)
- **Description:** Bends light around tank. Lasts **twice as long** as GLOW SHIELD.

### TELEPORT SELF (TELEP)
- **Manual Stats:** Damage=0, Energy=4, Price=$2,000
- **Effect:** Teleport to random location
- **Description:** Useful for escaping desperate situations or freeing when stuck. **Very little energy** for fantastic power. Useful in Team mode.

---

## Speed Categories

**DOS Speed Units (extracted from binary):**

| Category | Speed Range | Weapons |
|----------|-------------|---------|
| Very Slow | 2-4 | ELECTRO BUDS (2), REAR CHAOS (4) |
| Slow | 5-8 | MISSILE (5), SWIRLER (5), DOUBLE (6), TRIPLE (7), GUIDED (7), TRI BREAKER (8), QUINT BREAKER (8), OCTO BREAKER (8), SWIRL BLASTER (8) |
| Medium | 12-30 | BLASTER (12), NUKE BLASTER (12), REAR DOUBLE (12), NORMAL BOMB (20), DEATH BOMB (20), REAR TRIPLE (30) |
| Fast | 40-45 | SPARK FIENDS (40), LASER (45), POWER LASER (45), TRI-STRIKER (45) |

**Key Relationships:**
- Lasers are **9x faster** than missiles (45 vs 5)
- TRIPLE is **1.4x faster** than MISSILE (7 vs 5)
- Guided weapons are slower (Speed=6-7) for balance

---

## Weapon ID Patterns

The **Weapon ID** field (Byte 6) shows interesting patterns:

| ID Range | Category | Examples |
|----------|----------|----------|
| 0 | Basic projectiles | MISSILE, LASER |
| 1-4 | Breaker family | TRI BREAKER (1), QUINT BREAKER (2), BLASTER (3), NUKE (4) |
| 7-10 | Guided weapons | GUIDED (7), DOUBLE (8), POWER (8), REAR DOUBLE (9), TRIPLE (10), TRI-STRIKER (10) |
| 11-14 | Defensive/Bombs | SWIRLER (11), NORMAL BOMB (13), DEATH BOMB (14) |
| 16-18 | Advanced blasters | GUIDE BLASTER (16), BLAST GUIDER (17), QUINT GUIDER (18) |
| 25-35 | Special weapons | REAR CHAOS (25), ELECTRO BUDS (26), REAR TRIPLE (29), SPARK FIENDS (31), SWIRL BLASTER (34), OCTO BREAKER (35) |

**Purpose:** Likely determines projectile behavior, animation type, or special effects.

---

## Special Flags

### Multi-Hit Flag (Byte 2)
- **0:** Normal weapons (23/24 weapons)
- **1:** DEATH BOMB only

**Hypothesis:** DEATH BOMB's flag=1 triggers special explosion logic:
- Binary damage: 94
- Manual damage: 350
- Ratio: 350/94 ≈ 3.7 (multiple hits or area multiplier)

---

## Key Strategy Notes from Manual

1. **"Master the low priced weapons"** - More profit per damage (MISSILE, LASER emphasized)
2. **Blasters:** Aim at tank sides, not heads (~50% damage on average)
3. **Close range:** TRIPLE MISSILE, QUINT BREAKER
4. **Long range:** TRI-STRIKER, POWER LASER
5. **Being chased:** Rear weapons, SWIRLER
6. **Quick kills:** SPARK FIENDS (never miss), NUKE BLASTER
7. **Money saving:** DOUBLE MISSILE, SWIRLER (high damage/price ratio)

---

## Discrepancies: Binary vs Manual

1. **BLASTER Energy:**
   - Manual: 23
   - Binary: 22 ✓ (binary is authoritative)

2. **DEATH BOMB Damage:**
   - Manual: 350
   - Binary: 94 (with special flag=1)
   - Explanation: Multi-hit explosion logic

---

## Data Files

- **Binary extraction:** `docs/DOS_WEAPON_DATA.tsv`
- **Full analysis:** `docs/DOS_BINARY_ANALYSIS.md`
- **Original manual:** `docs/DOS_WEAPONS_ORIGINAL.md`
- **Original executable:** `dos-original/dzone-v1.3/DZONE.EXE`

---

## Total Weapons: 34

- **Extracted from binary:** 24 weapons (Ports 1-5)
- **Manual only:** 10 weapons (Ports 6-7, special weapons)
- **Coverage:** 70% binary-verified, 100% documented

---

## Web Implementation Notes

**Date**: 2025-11-06

### Speed Scaling

DOS speeds are converted to web pixels using a scale factor:
```
SPEED_SCALE_FACTOR = 0.4
Web speed (px/frame) = DOS speed × 0.4

Examples:
- MISSILE: 5 × 0.4 = 2.0 px/frame
- LASER: 45 × 0.4 = 18.0 px/frame (9x faster)
```

### Physical Properties (Web-specific)

Each weapon has additional properties for Matter.js physics:

**Density**:
- Missiles: `0.4` (normal physical projectile)
- Lasers: `0.00001` (almost massless energy beam)

**isSensor**:
- `false` (Missiles): Apply physical forces, can push tanks slightly
- `true` (Lasers): Collision detection only, no physical impact

**Rationale**: High-speed projectiles (e.g., LASER at 18 px/frame) with `isSensor=false` can cause excessive tank push due to deep penetration (>4px) between physics steps. Setting `isSensor=true` prevents this while maintaining accurate collision detection via Matter.js events.

### Collision Handling

- Physics sub-stepping: 2x per frame (reduces tunneling for high-speed projectiles)
- Collision detection: Matter.js `collisionStart` event (works for both sensor and physical bodies)
- Damage application: Custom event handler (same for all weapon types)

---

**This document represents the authoritative DOS original weapon specifications for faithful recreation.**
