// Tank Entity
// Represents a tank in the game

class Tank {
    // ========================================
    // Matter.js v2: Static Constants
    // ========================================
    static BRAKE_STRENGTH = 12.0;      // 이동 브레이크 강도
    static ROTATION_BRAKE = 0.4;       // 회전 브레이크 강도
    static FORCE_SCALE = 0.00008;      // Matter.js 힘 스케일

    constructor(options) {
        // Position and movement
        this.id = options.id;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.angle = options.angle || 0;
        this.velocity = { x: 0, y: 0 };
        this.angularVelocity = 0;

        // Matter.js physics body (will be created later)
        this.body = null;
        this.physics = options.physics || null;

        // Debug tank creation
        console.log(`🏗️ Tank ${this.id} initial position: (${this.x}, ${this.y})`);

        // Control inputs
        this.thrustPower = 0; // -1 to 1
        this.rotationPower = 0; // -1 to 1

        // Tank properties
        this.type = options.type || 'STANDARD';
        this.isPlayer = options.isPlayer || false;
        this.isAlive = true;
        this.color = options.color || (this.isPlayer ? GAME_CONFIG.COLORS.PLAYER : GAME_CONFIG.COLORS.AI);

        // Upgrades (must be set before getTankStats)
        this.upgrades = options.upgrades || {
            speed: 0,
            rotation: 0,
            armor: 0,
            energy: 0
        };

        // Stats (will be set by tank type and upgrades)
        this.stats = this.getTankStats(this.type);

        // Apply upgrades to stats
        this.applyUpgrades();

        // Health and energy
        this.shield = this.stats.maxShield;
        this.maxShield = this.stats.maxShield;
        this.weaponEnergy = this.stats.maxWeaponEnergy;
        this.maxWeaponEnergy = this.stats.maxWeaponEnergy;

        // Owned weapons (from player inventory)
        this.ownedWeapons = options.ownedWeapons || null;

        // Weapons
        this.weapons = options.weapons || this.getDefaultWeapons();
        this.currentWeaponPort = 1;

        // Debug weapon setup
        console.log(`🔫 ${this.id} weapons loaded:`, Object.keys(this.weapons).filter(port => this.weapons[port]).map(port => `${port}:${this.weapons[port].type}`));

        // Controls (for human players)
        this.controls = options.controls;

        // AI properties
        this.aiLevel = options.aiLevel || 1;
        this.lastFireTime = 0;
        this.fireDelay = 1.0; // seconds between shots

        // Create Matter.js physics body
        if (this.physics && typeof Matter !== 'undefined') {
            this.createPhysicsBody();
        }

        console.log(`🚗 Tank created: ${this.id} (${this.type}) with upgrades:`, this.upgrades);
    }

    // ========================================
    // Matter.js v2: Physics Body Creation
    // ========================================
    createPhysicsBody() {
        const size = this.stats.size * 0.8;

        // 원형 바디로 간단하게 시작 (삼각형은 나중에)
        this.body = Matter.Bodies.circle(
            this.x,
            this.y,
            size,
            {
                // === 무한궤도 시뮬레이션 ===
                friction: window.tuningParams?.friction || 0.8,
                frictionStatic: 1.0,
                frictionAir: window.tuningParams?.frictionAir || 0.12,

                // === 탱크 중량 ===
                density: window.tuningParams?.density || 0.08,

                // === 충돌 특성 ===
                restitution: 0.1,        // 낮은 반발
                inertia: Infinity,       // 충돌로 인한 회전 차단

                // === 식별 ===
                label: `tank_${this.id}`,
                plugin: {
                    tankId: this.id
                }
            }
        );

        // 초기 각도 설정
        Matter.Body.setAngle(this.body, this.angle);

        // 월드에 추가
        if (this.physics) {
            this.physics.addBody(this.body);
        }

        console.log(`🔧 Tank ${this.id} Matter.js body created: mass=${this.body.mass.toFixed(1)}`);
    }

    destroyPhysicsBody() {
        if (this.body && this.physics) {
            this.physics.removeBody(this.body);
            this.body = null;
            console.log(`🗑️ Tank ${this.id} Matter.js body destroyed`);
        }
    }
    
    applyUpgrades() {
        // Apply purchased upgrades to tank stats
        if (this.upgrades.speed > 0) {
            const speedUpgrade = TankData.getUpgradeLevel('SPEED', this.upgrades.speed);
            if (speedUpgrade) {
                this.stats.speed *= speedUpgrade.boost;
                console.log(`⚡ Speed upgrade ${this.upgrades.speed}: ${speedUpgrade.boost}x`);
            }
        }

        if (this.upgrades.rotation > 0) {
            const rotationUpgrade = TankData.getUpgradeLevel('ROTATION', this.upgrades.rotation);
            if (rotationUpgrade) {
                this.stats.rotationSpeed *= rotationUpgrade.boost;
                console.log(`🔄 Rotation upgrade ${this.upgrades.rotation}: ${rotationUpgrade.boost}x`);
            }
        }

        if (this.upgrades.armor > 0) {
            const armorUpgrade = TankData.getUpgradeLevel('ARMOR', this.upgrades.armor);
            if (armorUpgrade) {
                this.stats.maxShield *= armorUpgrade.boost;
                this.stats.armor *= armorUpgrade.boost;
                console.log(`🛡️ Armor upgrade ${this.upgrades.armor}: ${armorUpgrade.boost}x`);
            }
        }

        if (this.upgrades.energy > 0) {
            const energyUpgrade = TankData.getUpgradeLevel('ENERGY', this.upgrades.energy);
            if (energyUpgrade) {
                this.stats.maxWeaponEnergy *= energyUpgrade.boost;
                console.log(`⚡ Energy upgrade ${this.upgrades.energy}: ${energyUpgrade.boost}x`);
            }
        }
    }

    getTankStats(type) {
        const baseStats = {
            maxShield: 40, // GAME_CONFIG.TANK_DEFAULTS.MAX_SHIELD,
            maxWeaponEnergy: 100, // GAME_CONFIG.TANK_DEFAULTS.MAX_WEAPON_ENERGY,
            speed: 1.0,
            rotationSpeed: 1.0,
            armor: 1.0,
            size: 30 // GAME_CONFIG.TANK_DEFAULTS.SIZE
        };

        // Apply tank type modifiers
        switch (type) {
            case 'STANDARD':
                return baseStats;
                
            case 'ROTRA_I':
                return {
                    ...baseStats,
                    rotationSpeed: 1.3,
                    armor: 1.2,
                    speed: 0.9
                };
                
            case 'ROTRA_II':
                return {
                    ...baseStats,
                    rotationSpeed: 1.5,
                    speed: 1.3,
                    armor: 0.7,
                    size: 18
                };
                
            case 'OPEC_I':
                return {
                    ...baseStats,
                    speed: 1.4,
                    rotationSpeed: 1.3,
                    armor: 1.4
                };
                
            case 'OPEC_II':
                return {
                    ...baseStats,
                    speed: 1.5,
                    rotationSpeed: 1.4,
                    armor: 1.6
                };
                
            default:
                return baseStats;
        }
    }
    
    getDefaultWeapons() {
        // Use WeaponData system for Port 1 weapons
        const port1Weapon = WeaponData.getCurrentWeapon(1); // MISSILE by default
        const port2Weapon = WeaponData.getCurrentWeapon(2); // BLASTER by default
        
        return {
            port1: port1Weapon ? { type: port1Weapon.type, ammo: Infinity } : null,
            port2: port2Weapon ? { type: port2Weapon.type, ammo: Infinity } : null,
            port3: null, // For testing - previously BLASTER, now empty
            port4: null,
            port5: null,
            port6: null,
            port7: null
        };
    }
    
    update(deltaTime) {
        if (!this.isAlive) return;

        // Update physics
        if (this.body && this.physics) {
            // Matter.js 물리 업데이트
            this.updateWithMatterPhysics(deltaTime);
        } else {
            // 원본 물리 업데이트 (fallback)
            Physics.updateTankMovement(this, deltaTime);
        }

        // Regenerate weapon energy
        this.weaponEnergy = Math.min(
            this.maxWeaponEnergy,
            this.weaponEnergy + 10 * deltaTime // WEAPON_REGEN_RATE
        );

        // Reset control inputs
        this.thrustPower = 0;
        this.rotationPower = 0;
    }

    // ========================================
    // Matter.js v2: 브레이크 시스템 포함 물리 업데이트 ⭐
    // ========================================
    updateWithMatterPhysics(deltaTime) {
        if (!this.body) return;

        const body = this.body;
        const stats = this.stats;

        // ========================================
        // 1. 추진 또는 브레이크
        // ========================================

        if (this.thrustPower !== 0) {
            // === 추진 중 ===

            // 원본 물리 값 그대로 사용
            const thrustMagnitude = this.thrustPower * stats.speed * 200;

            // 추진 방향 (탱크가 향하는 방향)
            const thrustDir = Physics.fromAngle(body.angle, 1);

            // Matter.js 힘으로 변환
            const force = {
                x: thrustDir.x * thrustMagnitude * Tank.FORCE_SCALE,
                y: thrustDir.y * thrustMagnitude * Tank.FORCE_SCALE
            };

            Matter.Body.applyForce(body, body.position, force);

        } else {
            // === 브레이크 작동 🔴 ===

            // 현재 속도에 비례한 브레이크 힘
            const currentSpeed = Math.sqrt(
                body.velocity.x ** 2 + body.velocity.y ** 2
            );

            if (currentSpeed > 0.1) {  // 최소 속도 이상일 때만
                const brakeForce = {
                    x: -body.velocity.x * Tank.BRAKE_STRENGTH * Tank.FORCE_SCALE,
                    y: -body.velocity.y * Tank.BRAKE_STRENGTH * Tank.FORCE_SCALE
                };

                Matter.Body.applyForce(body, body.position, brakeForce);
            } else {
                // 완전 정지
                Matter.Body.setVelocity(body, { x: 0, y: 0 });
            }
        }

        // ========================================
        // 2. 회전 또는 회전 브레이크
        // ========================================

        if (this.rotationPower !== 0) {
            // === 회전 중 ===

            // 원본 물리 값 그대로 사용
            const rotationAccel = this.rotationPower * stats.rotationSpeed * 3 * deltaTime;

            // 각속도에 가속도 추가
            const newAngularVel = body.angularVelocity + rotationAccel;

            // 최대 회전 속도 제한
            const maxAngularSpeed = stats.rotationSpeed * 5;
            const clampedAngularVel = Math.max(
                -maxAngularSpeed,
                Math.min(maxAngularSpeed, newAngularVel)
            );

            Matter.Body.setAngularVelocity(body, clampedAngularVel);

        } else {
            // === 회전 브레이크 🔴 ===

            if (Math.abs(body.angularVelocity) > 0.01) {
                // 회전 속도에 비례한 브레이크
                const angularBrake = body.angularVelocity * Tank.ROTATION_BRAKE;
                Matter.Body.setAngularVelocity(
                    body,
                    body.angularVelocity - angularBrake
                );
            } else {
                // 완전 정지
                Matter.Body.setAngularVelocity(body, 0);
            }
        }

        // ========================================
        // 3. 속도 제한 (안전장치)
        // ========================================

        // 최대 이동 속도
        const maxSpeed = stats.speed * 100;
        const currentSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);

        if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            Matter.Body.setVelocity(body, {
                x: body.velocity.x * scale,
                y: body.velocity.y * scale
            });
        }

        // ========================================
        // 4. 동기화
        // ========================================

        this.x = body.position.x;
        this.y = body.position.y;
        this.angle = body.angle;
        this.velocity = { ...body.velocity };
        this.angularVelocity = body.angularVelocity;
    }
    
    thrust(power) {
        this.thrustPower = Math.max(-1, Math.min(1, power));
    }
    
    rotate(power) {
        this.rotationPower = Math.max(-1, Math.min(1, power));
    }
    
    takeDamage(damage) {
        if (!this.isAlive) return;
        
        // Apply armor reduction
        const actualDamage = damage / this.stats.armor;
        this.shield -= actualDamage;
        
        if (this.shield <= 0) {
            this.shield = 0;
            this.isAlive = false;
            console.log(`💀 Tank ${this.id} destroyed!`);
        }
        
        return actualDamage;
    }
    
    heal(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
    }
    
    getCurrentWeapon() {
        const portKey = `port${this.currentWeaponPort}`;
        return this.weapons[portKey];
    }
    
    switchPort(portNumber) {
        // Switch to different weapon port
        if (portNumber >= 1 && portNumber <= 7) {
            this.currentWeaponPort = portNumber;
            console.log(`🔧 ${this.id} switched to Port ${portNumber}`);
            
            // Initialize port if it doesn't exist
            const portKey = `port${portNumber}`;
            if (!this.weapons[portKey]) {
                if (portNumber === 1) {
                    const weapon1 = WeaponData.getWeapon(1, 0);
                    this.weapons.port1 = { type: weapon1.type, ammo: Infinity };
                } else if (portNumber === 2) {
                    const weapon2 = WeaponData.getWeapon(2, 0);
                    this.weapons.port2 = { type: weapon2.type, ammo: Infinity };
                }
            }
        }
    }
    
    nextWeapon() {
        // Cycle through OWNED weapons in current port
        if (this.currentWeaponPort === 1) {
            // Get owned weapons for Port 1
            const ownedIndices = this.ownedWeapons && this.ownedWeapons.port1 ? this.ownedWeapons.port1 : [0];
            const currentIndex = PLAYER_WEAPONS.PORT_1;

            if (ownedIndices.length > 1) {
                // Find current position in owned list
                const currentPos = ownedIndices.indexOf(currentIndex);
                const nextPos = (currentPos + 1) % ownedIndices.length;
                const nextIndex = ownedIndices[nextPos];

                PLAYER_WEAPONS.PORT_1 = nextIndex;

                // Update tank's weapon
                const newWeapon = WeaponData.getWeapon(1, nextIndex);
                this.weapons.port1 = { type: newWeapon.type, ammo: Infinity };

                console.log(`🔧 ${this.id} switched to ${newWeapon.name} in Port 1 (owned weapons only)`);
            } else {
                console.log(`ℹ️ ${this.id} only has one weapon in Port 1`);
            }
        } else if (this.currentWeaponPort === 2) {
            // Get owned weapons for Port 2
            const ownedIndices = this.ownedWeapons && this.ownedWeapons.port2 ? this.ownedWeapons.port2 : [];
            const currentIndex = PLAYER_WEAPONS.PORT_2;

            if (ownedIndices.length > 1) {
                // Find current position in owned list
                const currentPos = ownedIndices.indexOf(currentIndex);
                const nextPos = (currentPos + 1) % ownedIndices.length;
                const nextIndex = ownedIndices[nextPos];

                PLAYER_WEAPONS.PORT_2 = nextIndex;

                // Update tank's weapon
                const newWeapon = WeaponData.getWeapon(2, nextIndex);
                this.weapons.port2 = { type: newWeapon.type, ammo: Infinity };

                console.log(`🔧 ${this.id} switched to ${newWeapon.name} in Port 2 (owned weapons only)`);
            } else if (ownedIndices.length === 0) {
                console.log(`⚠️ ${this.id} has no weapons in Port 2`);
            } else {
                console.log(`ℹ️ ${this.id} only has one weapon in Port 2`);
            }
        } else {
            // Find next available weapon port (original logic for other ports)
            for (let i = 1; i <= 7; i++) {
                const nextPort = (this.currentWeaponPort % 7) + 1;
                const portKey = `port${nextPort}`;

                if (this.weapons[portKey]) {
                    this.currentWeaponPort = nextPort;
                    console.log(`🔧 ${this.id} switched to weapon port ${nextPort}`);
                    break;
                }

                this.currentWeaponPort = nextPort;
            }
        }
    }
    
    canFire() {
        const weapon = this.getCurrentWeapon();
        if (!weapon) {
            console.log(`❌ ${this.id} has no weapon`);
            return false;
        }
        
        const energyCost = this.getWeaponEnergyCost(weapon.type);
        const canFire = this.weaponEnergy >= energyCost && (weapon.ammo > 0 || weapon.ammo === Infinity);
        
        if (!canFire) {
            console.log(`❌ ${this.id} cannot fire: energy=${this.weaponEnergy}, ammo=${weapon.ammo}, cost=${energyCost}`);
        }
        
        return canFire;
    }
    
    getWeaponEnergyCost(weaponType) {
        return GAME_CONFIG.WEAPONS.ENERGY_COSTS[weaponType] || GAME_CONFIG.WEAPONS.ENERGY_COSTS.MISSILE;
    }
    
    consumeAmmo() {
        const weapon = this.getCurrentWeapon();
        if (weapon && weapon.ammo !== Infinity) {
            weapon.ammo--;
            if (weapon.ammo <= 0) {
                // Remove weapon when out of ammo
                this.weapons[`port${this.currentWeaponPort}`] = null;
                this.nextWeapon();
            }
        }
    }
    
    consumeEnergy(amount) {
        this.weaponEnergy = Math.max(0, this.weaponEnergy - amount);
    }
    
    addWeapon(port, weaponData) {
        const portKey = `port${port}`;
        this.weapons[portKey] = { ...weaponData };
        console.log(`🔫 ${this.id} equipped ${weaponData.type} to port ${port}`);
    }
    
    removeWeapon(port) {
        const portKey = `port${port}`;
        this.weapons[portKey] = null;
    }
    
    applyUpgrade(upgradeType, level) {
        this.upgrades[upgradeType] = Math.max(this.upgrades[upgradeType], level);
        
        // Apply upgrade effects
        switch (upgradeType) {
            case 'speed':
                this.stats.speed *= (1 + level * 0.2);
                break;
            case 'rotation':
                this.stats.rotationSpeed *= (1 + level * 0.2);
                break;
            case 'armor':
                this.stats.armor *= (1 + level * 0.2);
                break;
        }
        
        console.log(`⬆️ ${this.id} upgraded ${upgradeType} to level ${level}`);
    }
    
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    getCenter() {
        return { x: this.x, y: this.y };
    }
    
    getBounds() {
        const size = this.stats.size;
        return {
            x: this.x - size,
            y: this.y - size,
            width: size * 2,
            height: size * 2
        };
    }
    
    getTrianglePoints() {
        // Get the three points of the tank triangle
        const size = this.stats.size;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        // Front point
        const front = {
            x: this.x + cos * size * 0.75,
            y: this.y + sin * size * 0.75
        };
        
        // Back left point
        const backLeft = {
            x: this.x + cos * (-size * 0.5) - sin * size * 0.4,
            y: this.y + sin * (-size * 0.5) + cos * size * 0.4
        };
        
        // Back right point
        const backRight = {
            x: this.x + cos * (-size * 0.5) + sin * size * 0.4,
            y: this.y + sin * (-size * 0.5) - cos * size * 0.4
        };
        
        return [front, backLeft, backRight];
    }
    
    getFirePosition() {
        // Position where projectiles should spawn
        const size = this.stats.size;
        return {
            x: this.x + Math.cos(this.angle) * size,
            y: this.y + Math.sin(this.angle) * size
        };
    }
    
    getShieldPercentage() {
        return this.shield / this.maxShield;
    }
    
    getEnergyPercentage() {
        return this.weaponEnergy / this.maxWeaponEnergy;
    }
    
    // Status methods for UI
    getStatus() {
        return {
            id: this.id,
            isAlive: this.isAlive,
            shield: this.shield,
            maxShield: this.maxShield,
            weaponEnergy: this.weaponEnergy,
            maxWeaponEnergy: this.maxWeaponEnergy,
            currentWeapon: this.getCurrentWeapon()?.type || 'NONE',
            position: { x: this.x, y: this.y },
            angle: this.angle
        };
    }
}