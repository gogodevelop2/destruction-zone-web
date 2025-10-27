// Tank Data - Based on Destruction Zone v1.3 (1994)
// 5 tank types: STANDARD, ROTRA I, ROTRA II, OPEC I, OPEC II
// Source: /dzone-v1.3/DZONE.DOC page 7

const TANK_TYPES = {
    STANDARD: {
        name: 'STANDARD',
        description: 'Basic balanced tank - largest size, slow rotation',
        price: 1000, // v1.3: 1000 CR
        // v1.3 stats: SH 3(4) / ROT 4(6) / SP 2(3)
        stats: {
            shield: 3,          // Base shield
            shieldUpgraded: 4,  // After armor upgrade
            rotation: 4,        // Base rotation
            rotationUpgraded: 6, // After rotation upgrade
            speed: 2,           // Base speed
            speedUpgraded: 3,   // After speed upgrade
            // Game engine values (for compatibility)
            maxShield: 100,
            maxWeaponEnergy: 100,
            maxSpeed: 120,
            rotationSpeed: 2.0,
            acceleration: 180,
            friction: 0.95
        },
        size: 20 // Largest tank
    },
    ROTRA_I: {
        name: 'ROTRA I',
        description: 'Rotation Tank - better rotation and armor',
        price: 1850, // v1.3: 1850 CR (was 2000 in v1.0)
        // v1.3 stats: SH 4(6) / ROT 6(9) / SP 2(3)
        stats: {
            shield: 4,
            shieldUpgraded: 6,
            rotation: 6,
            rotationUpgraded: 9,
            speed: 2,
            speedUpgraded: 3,
            // Game engine values
            maxShield: 120,
            maxWeaponEnergy: 100,
            maxSpeed: 120,
            rotationSpeed: 3.0,
            acceleration: 180,
            friction: 0.94
        },
        size: 18
    },
    ROTRA_II: {
        name: 'ROTRA II',
        description: 'Compact ROTRA - very maneuverable, poor armor',
        price: 2450, // v1.3: 2450 CR (was 2000 in v1.0)
        // v1.3 stats: SH 2(3) / ROT 8(12) / SP 3(4)
        stats: {
            shield: 2,
            shieldUpgraded: 3,
            rotation: 8,
            rotationUpgraded: 12,
            speed: 3,
            speedUpgraded: 4,
            // Game engine values
            maxShield: 60,
            maxWeaponEnergy: 100,
            maxSpeed: 180,
            rotationSpeed: 4.0,
            acceleration: 250,
            friction: 0.92
        },
        size: 12 // Smaller tank
    },
    OPEC_I: {
        name: 'OPEC I',
        description: 'Expensive OPEC - faster velocity, good rotation and armor',
        price: 3400, // v1.3: 3400 CR (was 3200 in v1.0)
        // v1.3 stats: SH 4(6) / ROT 6(9) / SP 3(4)
        stats: {
            shield: 4,
            shieldUpgraded: 6,
            rotation: 6,
            rotationUpgraded: 9,
            speed: 3,
            speedUpgraded: 4,
            // Game engine values
            maxShield: 120,
            maxWeaponEnergy: 100,
            maxSpeed: 180,
            rotationSpeed: 3.0,
            acceleration: 250,
            friction: 0.93
        },
        size: 16
    },
    OPEC_II: {
        name: 'OPEC II',
        description: 'OPEC II - slightly smaller, better armor and rotation',
        price: 4750, // v1.3: 4750 CR (was 4500 in v1.0)
        // v1.3 stats: SH 5(7) / ROT 7(10) / SP 3(4)
        stats: {
            shield: 5,
            shieldUpgraded: 7,
            rotation: 7,
            rotationUpgraded: 10,
            speed: 3,
            speedUpgraded: 4,
            // Game engine values
            maxShield: 140,
            maxWeaponEnergy: 100,
            maxSpeed: 180,
            rotationSpeed: 3.5,
            acceleration: 250,
            friction: 0.93
        },
        size: 15
    }
};

// Upgrade system for tanks (v1.3)
// Each upgrade costs the same as the tank price
// Upgrades are lost when buying a new tank
// Source: /dzone-v1.3/DZONE.DOC page 11
const TANK_UPGRADES = {
    SPEED: {
        name: 'Speed Upgrade',
        description: 'Increase forwards and backwards speed',
        maxLevel: 1, // v1.3: only one upgrade per type
        getPriceForTank: function(tankType) {
            return TANK_TYPES[tankType]?.price || 1000;
        },
        // Boost is from original stats (e.g., SP 2→3, SP 3→4)
        boost: 1.5 // +50% speed
    },
    ROTATION: {
        name: 'Rotation Upgrade',
        description: 'Increase rotational speed',
        maxLevel: 1,
        getPriceForTank: function(tankType) {
            return TANK_TYPES[tankType]?.price || 1000;
        },
        // Boost is from original stats (e.g., ROT 4→6, ROT 6→9)
        boost: 1.5 // +50% rotation
    },
    ARMOR: {
        name: 'Armor Upgrade',
        description: 'Increase shield capacity',
        maxLevel: 1,
        getPriceForTank: function(tankType) {
            return TANK_TYPES[tankType]?.price || 1000;
        },
        // Boost varies by tank (e.g., SH 3→4, SH 4→6, SH 5→7)
        boost: 1.33 // ~+33% armor (average)
    }
};

// Helper functions
const TankData = {
    getTankType: function(typeName) {
        return TANK_TYPES[typeName] || TANK_TYPES.STANDARD;
    },

    getAllTankTypes: function() {
        return Object.values(TANK_TYPES);
    },

    getUpgrade: function(upgradeType) {
        return TANK_UPGRADES[upgradeType];
    },

    // v1.3: Get upgrade price for current tank type
    getUpgradePrice: function(upgradeType, tankType) {
        const upgrade = TANK_UPGRADES[upgradeType];
        if (!upgrade) return 0;
        return upgrade.getPriceForTank(tankType);
    },

    // v1.3: Simple upgrade system (binary: owned or not)
    getUpgradeLevel: function(upgradeType, level) {
        const upgrade = TANK_UPGRADES[upgradeType];
        if (!upgrade || level < 1) {
            return null;
        }
        return {
            level: 1,
            boost: upgrade.boost
        };
    },

    applyUpgrades: function(baseTank, upgrades) {
        const stats = { ...baseTank.stats };

        // v1.3: Binary upgrades (0 or 1)
        if (upgrades.speed > 0) {
            const upgrade = TANK_UPGRADES.SPEED;
            if (upgrade) {
                stats.maxSpeed *= upgrade.boost;
                stats.acceleration *= upgrade.boost;
            }
        }

        if (upgrades.rotation > 0) {
            const upgrade = TANK_UPGRADES.ROTATION;
            if (upgrade) {
                stats.rotationSpeed *= upgrade.boost;
            }
        }

        if (upgrades.armor > 0) {
            const upgrade = TANK_UPGRADES.ARMOR;
            if (upgrade) {
                stats.maxShield *= upgrade.boost;
            }
        }

        return stats;
    }
};

console.log('🚗 Tank data loaded (v1.3) - 5 tank types, 3 upgrade types');