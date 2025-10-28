# Destruction Zone - Weapon Reference

**Source:** DZONE.DOC v1.3b (1994) by Julian Cochran

---

## Weapon Format

Each weapon is described as: `DAMAGE/ENERGY COST` and `PRICE`

- **Damage**: Damage points per hit
- **Energy Cost**: Weapon energy consumed per shot
- **Price**: Cost to purchase in shop
- **Speed**: Projectile velocity (added from weapon-data.js)
- **Lifetime**: How long projectile stays active (seconds)

---

## PORT 1: Front Fire (6 weapons)

Forward-firing weapons for direct combat.

### 1. MISSILE (MISIL)
- **Stats**: 4 damage / 4 energy / $2
- **Speed**: 200 px/s
- **Lifetime**: 3.0s
- **Description**: Starting weapon for all tanks. Low priced backup weapon, ability often underestimated. [Unlisted for wealthy players]
- **Strategy**: Basic reliable weapon

### 2. DOUBLE MISSILE (DOUBL)
- **Stats**: 6 damage / 4 energy / $100
- **Speed**: 200 px/s
- **Lifetime**: 3.0s
- **Projectiles**: 2 missiles
- **Description**: Improves power without using more energy. Low price makes this good for saving money.

### 3. TRIPLE MISSILE (TRIPL)
- **Stats**: 9 damage / 5 energy / $600
- **Speed**: 150 px/s
- **Lifetime**: 3.5s
- **Projectiles**: 3 missiles
- **Description**: Next step after DOUBLE. Due to slow speed and high damage, best used for **close range combat**.

### 4. BEAM LASER (LASER)
- **Stats**: 6 damage / 6 energy / $150
- **Speed**: 400 px/s (fast!)
- **Lifetime**: 2.0s
- **Description**: Like all low priced weapons, good to master. Expensive weapons don't necessarily make more money per damage unit → **Master the low priced weapons**.

### 5. POWER LASER (POWER)
- **Stats**: 12 damage / 6 energy / $1,650
- **Speed**: 400 px/s
- **Lifetime**: 2.0s
- **Projectiles**: Fires 2 Beam Lasers
- **Description**: Uses energy of only one laser. Should be used for aiming at **specific enemy** rather than closest.

### 6. TRI-STRIKER (STRIK)
- **Stats**: 18 damage / 6 energy / $3,350
- **Speed**: 250 px/s
- **Lifetime**: 3.5s
- **Projectiles**: 3 missiles
- **Description**: **Extremely efficient**, but requires great aiming skills when used in long range firing - the primary purpose for this weapon.

---

## PORT 2: Blasters (5 weapons)

**Double fire system**: First fire sends warhead, second fire breaks it into missiles. Warheads break automatically when hitting walls or tanks.

**Strategy**: Fire at **side of tank** rather than head. Only ~50% of max damage on average.

### 7. BLASTER (BLAST)
- **Stats**: 90 damage / 23 energy / $650
- **Speed**: 150 px/s
- **Lifetime**: 4.0s
- **Explosion Radius**: 30
- **Description**: Standard blaster with double fire system. Breaks into group of missiles.

### 8. GUIDE BLASTER (G.BST)
- **Stats**: 90 damage / 28 energy / $1,200
- **Speed**: 120 px/s
- **Lifetime**: 4.5s
- **Explosion Radius**: 30
- **Special**: Guided warhead
- **Description**: For desperate situations with no time for aiming, or for bad aimers.

### 9. BLAST GUIDER (B.GUI)
- **Stats**: 70 damage / 34 energy / $2,500
- **Speed**: 150 px/s
- **Lifetime**: 4.0s
- **Explosion Radius**: 35
- **Special**: Normal warhead → guided missiles
- **Description**: Opposite of GUIDE BLASTER. In open spaces, **maximum damage easily obtained**. Very good value for money.

### 10. NUKE BLASTER (N.BST)
- **Stats**: 168 damage / 40 energy / $3,400
- **Speed**: 130 px/s
- **Lifetime**: 5.0s
- **Explosion Radius**: 50
- **Description**: Big version of standard Blaster. **2-3 hits destroy tank**, sometimes only 1 good hit. Very good value but must aim carefully. **Aim at side, not head**.

### 11. SWIRL BLASTER (S.BST)
- **Stats**: 48 damage / 20 energy / $3,800
- **Speed**: 150 px/s
- **Lifetime**: 4.0s
- **Explosion Radius**: 40
- **Special**: Splits into 6 swirlers (8 damage each)
- **Description**: On second fire, warhead splits into six swirlers.

---

## PORT 3: Surprise Attack (5 weapons)

Rear and special attacks.

### 12. REAR DOUBLE (REAR2)
- **Stats**: 8 damage / 5 energy / $130
- **Speed**: 200 px/s
- **Lifetime**: 3.0s
- **Direction**: Rear
- **Projectiles**: 2 parallel missiles
- **Description**: Good surprise attack. Strangely low price for damage. Many like to fire from front using **TURRET**.

### 13. REAR GUIDED (GREAR)
- **Stats**: 8 damage / 5 energy / $650
- **Speed**: 180 px/s
- **Lifetime**: 3.5s
- **Direction**: Rear
- **Special**: Guided
- **Projectiles**: 2 missiles (4 damage each)
- **Description**: Very good for **attacking while being chased**.

### 14. REAR CHAOS (CHAOS)
- **Stats**: 14 damage / 5 energy / $1,000
- **Speed**: 150 px/s
- **Lifetime**: 1.5s (short!)
- **Direction**: Rear
- **Special**: Guided miniatures
- **Description**: Miniature guiders from rear. Short range only. Can be used in interesting ways.

### 15. TELEPORT FOE (TPFOE)
- **Stats**: 0 damage / 4 energy / $1,600
- **Speed**: 0 (instant)
- **Special**: Teleports nearest tank to random location
- **Description**: Useful for escaping closing tank or separating two tanks in close combat.

### 16. REAR TRIPLE (REAR3)
- **Stats**: 15 damage / 6 energy / $2,200
- **Speed**: 200 px/s
- **Lifetime**: 3.0s
- **Direction**: Rear
- **Projectiles**: 3 missiles
- **Description**: Improved REAR DOUBLE. Nearly twice the damage. Good alternative to TRI STRIKER when used with **TURRET**.

---

## PORT 4: Special Front Fire (6 weapons)

Breakers and guided missiles.

**Breaker Strategy**: Make direct hit, warhead breaks up automatically.

### 17. TRI BREAKER (T.BRK)
- **Stats**: 21 damage / 12 energy / $250
- **Speed**: 180 px/s
- **Lifetime**: 3.0s
- **Special**: Breaks into 3 missiles (7 damage each)
- **Description**: **Great starting weapon**. Very high damage per cost. Breaks into 3 on second fire.

### 18. GUIDED (GUIDE)
- **Stats**: 6 damage / 6 energy / $400
- **Speed**: 150 px/s
- **Lifetime**: 4.0s
- **Special**: Guided
- **Description**: Basic guided missile. Only requires approximate aiming. Poor damage/energy ratio - **only valuable to unskilled players**.

### 19. QUINT BREAKER (Q.BRK)
- **Stats**: 30 damage / 12 energy / $1,350
- **Speed**: 180 px/s
- **Lifetime**: 3.0s
- **Special**: Breaks into 5 missiles (6 damage each)
- **Description**: Same as TRI BREAKER but releases 5 instead of 3. **Good value for money**.

### 20. QUINT GUIDER (Q.GUI)
- **Stats**: 30 damage / 20 energy / $2,250
- **Speed**: 150 px/s
- **Lifetime**: 3.5s
- **Special**: Breaks into 5 guided missiles
- **Description**: Identical to QUINT BREAKER but produces guided missiles and uses more energy.

### 21. OCTO BREAKER (O.BRK)
- **Stats**: 48 damage / 16 energy / $4,000
- **Speed**: 180 px/s
- **Lifetime**: 3.0s
- **Special**: Breaks into 8 missiles
- **Description**: Next level after QUINT. **2-3 hits destroy tank**. High price means careful aiming required.

### 22. SPARK FIENDS (SPARK)
- **Stats**: 16 damage / 9 energy / $5,400
- **Speed**: 200 px/s
- **Lifetime**: 5.0s
- **Special**: **Never miss target**
- **Description**: Although damage doesn't seem high, never misses. Not for making money, but for **quickly killing rivals** before they score.

---

## PORT 5: Aggressive Defence (4 weapons)

Defensive weapons and bombs.

### 23. SWIRLER (SWIRL)
- **Stats**: 8 damage / 3 energy / $225
- **Speed**: 100 px/s
- **Lifetime**: 2.0s
- **Pattern**: Swirls around tank
- **Description**: **Particularly high damage/price ratio**. Fired in large numbers to get rid of touching/chasing tanks. Skill: Circle robot while firing many swirlers, especially with fast tank.

### 24. ELECTRO BUDS (ELECT)
- **Stats**: 15 damage / 4 energy / $800
- **Speed**: 80 px/s (slow)
- **Lifetime**: 3.0s
- **Special**: Guided
- **Projectiles**: 3 missiles
- **Description**: Three slow guided missiles. When fired in large numbers, act as **"deadly mist"**.

### 25. NORMAL BOMB (NBOMB)
- **Stats**: 100 damage / 25 energy / $500
- **Speed**: 0 (stationary)
- **Lifetime**: 10.0s
- **Type**: Bomb (detonates on second fire or contact)
- **Description**: Usually used against robots. Drop where enemy will move. 2-3 hits usually kill.

### 26. DEATH BOMB (DBOMB)
- **Stats**: 350 damage / 40 energy / $3,250
- **Speed**: 0 (stationary)
- **Lifetime**: 10.0s
- **Type**: Bomb
- **Description**: Destroys anything during detonation. **Cheapest weapon per damage**. Near-maximum damage can be obtained.

---

## PORT 6: Special Defence (4 weapons)

Special defensive systems.

### 27. DEATH TOUCH (TOUCH)
- **Stats**: 15 damage / 7 energy / $350
- **Speed**: 0
- **Duration**: 2.0s
- **Effect**: Tank becomes highly charged
- **Description**: Any touching tanks badly damaged. **Strangely low price** to discourage trapping.

### 28. DEFLECTOR (DEFLE)
- **Stats**: 0 damage / 0 energy / $2,200
- **Speed**: 0
- **Duration**: 1.0s
- **Effect**: Reverses all incoming missiles
- **Description**: Forces all incoming missiles to suddenly reverse direction. Doesn't use weapon energy but excessive use costs money. Can convert enemy SWIRLERS/GUIDERS or detonate bombs.

### 29. ECM WIPER (WIPE)
- **Stats**: 0 damage / 4 energy / $800
- **Speed**: 0
- **Effect**: Destroys all missiles in zone
- **Description**: Usually used to aid friend in teams mode.

### 30. CONFUSOR (ECM)
- **Stats**: 0 damage / 0 energy / $480
- **Speed**: 0
- **Duration**: 3.0s
- **Effect**: Guided missiles ignore tank
- **Description**: Without using energy, causes all guided missiles to ignore tank. Good value but **only useful for fast weapon switchers**.

---

## PORT 7: Harmless Defense (4 weapons)

Support and healing.

### 31. HEALER (HEAL)
- **Stats**: -10 damage (healing) / 10 energy / $350
- **Speed**: 0
- **Effect**: Converts weapon energy → shield energy
- **Description**: Only used when excess weapon energy but critically low shields.

### 32. GLOW SHIELD (GLOW)
- **Stats**: 0 damage / 15 energy / $800
- **Speed**: 0
- **Duration**: 3.0s
- **Effect**: Complete invincibility
- **Description**: Complete protection for few seconds. Used for escaping or attacking safely. **Best use**: Turn shield on, move close to tank, fire high damage short range weapon (QUINT BREAKER).

### 33. FADE SHIELD (FADE)
- **Stats**: 0 damage / 20 energy / $1,200
- **Speed**: 0
- **Duration**: 6.0s
- **Effect**: Cloaking (invisibility)
- **Description**: Bends light around tank. Lasts **twice as long** as GLOW SHIELD.

### 34. TELEPORT SELF (TELEP)
- **Stats**: 0 damage / 4 energy / $2,000
- **Speed**: 0
- **Effect**: Teleport to random location
- **Description**: Useful for escaping desperate situations or freeing when stuck. **Very little energy** for fantastic power. Useful in Team mode.

---

## Weapon Categories by Behavior

### Projectile Weapons (direct fire)
- MISSILE, DOUBLE, TRIPLE
- LASER, POWER LASER
- TRI-STRIKER
- REAR DOUBLE, REAR TRIPLE

### Explosive Weapons (2-stage)
- All BLASTERS (5 types)
- All BREAKERS (3 types)

### Guided Weapons (tracking)
- GUIDED, REAR GUIDED
- GUIDE BLASTER, BLAST GUIDER
- QUINT GUIDER
- ELECTRO BUDS
- SPARK FIENDS (never miss)

### Stationary Weapons
- BOMBS (2 types)

### Special Effects (no projectile)
- TELEPORT FOE, TELEPORT SELF
- DEFLECTOR, ECM WIPER, CONFUSOR
- DEATH TOUCH
- HEALER, SHIELDS

### Defensive Patterns
- SWIRLER (orbits tank)
- REAR CHAOS (short range rear)

---

## Implementation Priority

### Phase 1: Basic Projectiles
1. **MISSILE** - Already implemented
2. **LASER** - Fast straight line
3. **TRIPLE MISSILE** - 3 projectiles spread

### Phase 2: Multi-projectile
4. **DOUBLE MISSILE** - 2 parallel
5. **TRI-STRIKER** - 3 with spread
6. **REAR DOUBLE** - Rear firing

### Phase 3: Advanced
7. **BLASTER** - 2-stage explosion
8. **TRI BREAKER** - 2-stage split
9. **SWIRLER** - Orbital pattern

### Phase 4: Special
10. **GUIDED** - Target tracking
11. **BOMB** - Stationary trap
12. **TELEPORT** - Special effects

---

## Key Design Notes

### Collision Rules
- **Missile vs Missile**: Should collide and explode
- **Laser vs Laser**: Pass through each other
- **Laser vs Missile**: Pass through
- **Blaster vs anything**: Collides and triggers explosion
- **Swirler**: Collides with everything

### Energy System
- Weapon energy separate from shields
- Fast recharge rate (configurable)
- Some weapons use 0 energy but cost money per use

### Turret System
- Allows independent aiming separate from tank direction
- Essential for REAR weapons fired forward
- Must be repurchased when buying new tank

### Price vs Performance
- Low priced weapons (MISSILE, LASER) emphasized as worth mastering
- Expensive ≠ better money-making
- Skill > expensive weapons

---

## Strategy Tips from Manual

1. **Master low priced weapons** - More profit per damage
2. **Aim at tank sides** - Not heads (for blasters)
3. **Close range** - Triple Missile, Quint Breaker
4. **Long range** - Tri-Striker, Power Laser
5. **Chasing**: Rear Guided
6. **Being chased**: Rear weapons, Swirlers
7. **Quick kills**: Spark Fiends, Nuke Blaster
8. **Money saving**: Double Missile, Swirler
