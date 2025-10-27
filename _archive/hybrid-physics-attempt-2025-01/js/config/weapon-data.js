// Weapon Data - Destruction Zone v1.3 (1994)
// Port-based weapon system with 31 weapons across 7 ports
// Source: /dzone-v1.3/DZONE.DOC pages 8-10
// Format: damage/energy, price

const WEAPON_PORTS = {
    // PORT 1: Front Fire (6 weapons)
    PORT_1: {
        name: 'PORT 1 (Front Fire)',
        description: 'Forward-firing weapons',
        weapons: [
            {
                name: 'MISSILE',
                abbrev: 'MISIL',
                type: 'MISSILE',
                damage: 4,
                energyCost: 4,
                speed: 200,
                price: 2,
                color: '#ffff00',
                lifetime: 3.0,
                description: 'Basic weapon, often underestimated'
            },
            {
                name: 'DOUBLE MISSILE',
                abbrev: 'DOUBL',
                type: 'DOUBLE_MISSILE',
                damage: 6,
                energyCost: 4,
                speed: 200,
                price: 100,
                color: '#ffff00',
                lifetime: 3.0,
                projectileCount: 2,
                description: 'Improved power without extra energy'
            },
            {
                name: 'TRIPLE MISSILE',
                abbrev: 'TRIPL',
                type: 'TRIPLE_MISSILE',
                damage: 9,
                energyCost: 5,
                speed: 150,
                price: 600,
                color: '#ffff00',
                lifetime: 3.5,
                projectileCount: 3,
                description: 'Slow speed, high damage, close range'
            },
            {
                name: 'BEAM LASER',
                abbrev: 'LASER',
                type: 'LASER',
                damage: 6,
                energyCost: 6,
                speed: 400,
                price: 150,
                color: '#ff0000',
                lifetime: 2.0,
                description: 'Low priced, good to master'
            },
            {
                name: 'POWER LASER',
                abbrev: 'POWER',
                type: 'POWER_LASER',
                damage: 12,
                energyCost: 6,
                speed: 400,
                price: 1650,
                color: '#ff4444',
                lifetime: 2.0,
                description: 'Fires two beam lasers, uses energy of one'
            },
            {
                name: 'TRI-STRIKER',
                abbrev: 'STRIK',
                type: 'TRI_STRIKER',
                damage: 18,
                energyCost: 6,
                speed: 250,
                price: 3350,
                color: '#ff8800',
                lifetime: 3.5,
                projectileCount: 3,
                description: 'Extremely efficient, requires great aiming'
            }
        ]
    },

    // PORT 2: Blasters (5 weapons)
    PORT_2: {
        name: 'PORT 2 (Blasters)',
        description: 'Double fire system - second fire breaks warhead',
        weapons: [
            {
                name: 'BLASTER',
                abbrev: 'BLAST',
                type: 'BLASTER',
                damage: 90,
                energyCost: 23,
                speed: 150,
                price: 650,
                color: '#00ff00',
                lifetime: 4.0,
                explosionRadius: 30,
                description: 'Warhead breaks on second fire or wall hit'
            },
            {
                name: 'GUIDE BLASTER',
                abbrev: 'G.BST',
                type: 'GUIDE_BLASTER',
                damage: 90,
                energyCost: 28,
                speed: 120,
                price: 1200,
                color: '#00ff88',
                lifetime: 4.5,
                explosionRadius: 30,
                guided: true,
                description: 'Guided warhead for bad aimers'
            },
            {
                name: 'BLAST GUIDER',
                abbrev: 'B.GUI',
                type: 'BLAST_GUIDER',
                damage: 70,
                energyCost: 34,
                speed: 150,
                price: 2500,
                color: '#00ffaa',
                lifetime: 4.0,
                explosionRadius: 35,
                guidedMissiles: true,
                description: 'Normal warhead, guided missiles - max damage in open'
            },
            {
                name: 'NUKE BLASTER',
                abbrev: 'N.BST',
                type: 'NUKE_BLASTER',
                damage: 168,
                energyCost: 40,
                speed: 130,
                price: 3400,
                color: '#00ff00',
                lifetime: 5.0,
                explosionRadius: 50,
                description: '2-3 hits destroy tank, aim at side not head'
            },
            {
                name: 'SWIRL BLASTER',
                abbrev: 'S.BST',
                type: 'SWIRL_BLASTER',
                damage: 48,
                energyCost: 20,
                speed: 150,
                price: 3800,
                color: '#00ddff',
                lifetime: 4.0,
                explosionRadius: 40,
                swirlers: 6,
                swirlerDamage: 8,
                description: 'Warhead splits into six swirlers (8 damage each)'
            }
        ]
    },

    // PORT 3: Surprise Attack (5 weapons)
    PORT_3: {
        name: 'PORT 3 (Surprise Attack)',
        description: 'Rear and special attacks',
        weapons: [
            {
                name: 'REAR DOUBLE',
                abbrev: 'REAR2',
                type: 'REAR_DOUBLE',
                damage: 8,
                energyCost: 5,
                speed: 200,
                price: 130,
                color: '#ffff00',
                lifetime: 3.0,
                direction: 'rear',
                projectileCount: 2,
                description: 'Parallel rear missiles, good with turret'
            },
            {
                name: 'REAR GUIDED',
                abbrev: 'GREAR',
                type: 'REAR_GUIDED',
                damage: 8,
                energyCost: 5,
                speed: 180,
                price: 650,
                color: '#ffff88',
                lifetime: 3.5,
                direction: 'rear',
                guided: true,
                projectileCount: 2,
                description: 'Two guided missiles from rear, good when chased'
            },
            {
                name: 'REAR CHAOS',
                abbrev: 'CHAOS',
                type: 'REAR_CHAOS',
                damage: 14,
                energyCost: 5,
                speed: 150,
                price: 1000,
                color: '#ff88ff',
                lifetime: 1.5,
                direction: 'rear',
                guided: true,
                description: 'Miniature guiders, short range only (v1.3 new)'
            },
            {
                name: 'TELEPORT FOE',
                abbrev: 'TPFOE',
                type: 'TELEPORT_FOE',
                damage: 0,
                energyCost: 4,
                speed: 0,
                price: 1600,
                color: '#ff00ff',
                effect: 'teleport',
                description: 'Forces nearest tank to random location'
            },
            {
                name: 'REAR TRIPLE',
                abbrev: 'REAR3',
                type: 'REAR_TRIPLE',
                damage: 15,
                energyCost: 6,
                speed: 200,
                price: 2200,
                color: '#ffff00',
                lifetime: 3.0,
                direction: 'rear',
                projectileCount: 3,
                description: 'Improved REAR DOUBLE, good TRI STRIKER alternative with turret'
            }
        ]
    },

    // PORT 4: Special Front Fire (6 weapons)
    PORT_4: {
        name: 'PORT 4 (Special Front Fire)',
        description: 'Breakers and guided missiles',
        weapons: [
            {
                name: 'TRI BREAKER',
                abbrev: 'T.BRK',
                type: 'TRI_BREAKER',
                damage: 21,
                energyCost: 12,
                speed: 180,
                price: 250,
                color: '#ffaa00',
                lifetime: 3.0,
                breaksInto: 3,
                breakDamage: 7,
                description: 'Great starter, breaks into 3 on second fire'
            },
            {
                name: 'GUIDED',
                abbrev: 'GUIDE',
                type: 'GUIDED',
                damage: 6,
                energyCost: 6,
                speed: 150,
                price: 400,
                color: '#ffff88',
                lifetime: 4.0,
                guided: true,
                description: 'Basic guided missile, only for unskilled'
            },
            {
                name: 'QUINT BREAKER',
                abbrev: 'Q.BRK',
                type: 'QUINT_BREAKER',
                damage: 30,
                energyCost: 12,
                speed: 180,
                price: 1350,
                color: '#ffaa00',
                lifetime: 3.0,
                breaksInto: 5,
                breakDamage: 6,
                description: 'Breaks into 5 missiles, good value'
            },
            {
                name: 'QUINT GUIDER',
                abbrev: 'Q.GUI',
                type: 'QUINT_GUIDER',
                damage: 30,
                energyCost: 20,
                speed: 150,
                price: 2250,
                color: '#ffaaff',
                lifetime: 3.5,
                breaksInto: 5,
                guided: true,
                description: 'Like QUINT BREAKER but guided missiles'
            },
            {
                name: 'OCTO BREAKER',
                abbrev: 'O.BRK',
                type: 'OCTO_BREAKER',
                damage: 48,
                energyCost: 16,
                speed: 180,
                price: 4000,
                color: '#ffaa00',
                lifetime: 3.0,
                breaksInto: 8,
                description: '2-3 hits destroy tank, careful not to miss (v1.3 new)'
            },
            {
                name: 'SPARK FIENDS',
                abbrev: 'SPARK',
                type: 'SPARK_FIENDS',
                damage: 16,
                energyCost: 9,
                speed: 200,
                price: 5400,
                color: '#ffff00',
                lifetime: 5.0,
                guided: true,
                neverMiss: true,
                description: 'Never miss target, for killing rivals quickly (v1.3 new)'
            }
        ]
    },

    // PORT 5: Aggressive Defence (4 weapons)
    PORT_5: {
        name: 'PORT 5 (Aggressive Defence)',
        description: 'Defensive weapons and bombs',
        weapons: [
            {
                name: 'SWIRLER',
                abbrev: 'SWIRL',
                type: 'SWIRLER',
                damage: 8,
                energyCost: 3,
                speed: 100,
                price: 225,
                color: '#00ffff',
                lifetime: 2.0,
                pattern: 'swirl',
                description: 'Swirls around tank, high damage/price ratio'
            },
            {
                name: 'ELECTRO BUDS',
                abbrev: 'ELECT',
                type: 'ELECTRO_BUDS',
                damage: 15,
                energyCost: 4,
                speed: 80,
                price: 800,
                color: '#00ff88',
                lifetime: 3.0,
                guided: true,
                projectileCount: 3,
                description: 'Three slow guided missiles, deadly mist in numbers'
            },
            {
                name: 'NORMAL BOMB',
                abbrev: 'NBOMB',
                type: 'NORMAL_BOMB',
                damage: 100,
                energyCost: 25,
                speed: 0,
                price: 500,
                color: '#ff0000',
                lifetime: 10.0,
                type: 'bomb',
                description: 'Good against robots, drop where enemy moves'
            },
            {
                name: 'DEATH BOMB',
                abbrev: 'DBOMB',
                type: 'DEATH_BOMB',
                damage: 350,
                energyCost: 40,
                speed: 0,
                price: 3250,
                color: '#ff0000',
                lifetime: 10.0,
                type: 'bomb',
                description: 'Destroy anything during detonation, cheapest per damage'
            }
        ]
    },

    // PORT 6: Special Defence (4 weapons)
    PORT_6: {
        name: 'PORT 6 (Special Defence)',
        description: 'Special defensive systems',
        weapons: [
            {
                name: 'DEATH TOUCH',
                abbrev: 'TOUCH',
                type: 'DEATH_TOUCH',
                damage: 15,
                energyCost: 7,
                speed: 0,
                price: 350,
                color: '#ff88ff',
                duration: 2.0,
                effect: 'shock',
                description: 'Tank becomes highly charged, touching = damage'
            },
            {
                name: 'DEFLECTOR',
                abbrev: 'DEFLE',
                type: 'DEFLECTOR',
                damage: 0,
                energyCost: 0,
                speed: 0,
                price: 2200,
                color: '#8888ff',
                duration: 1.0,
                effect: 'reverse',
                description: 'All incoming missiles reverse direction (v1.3 new, replaces ECM HACKER)'
            },
            {
                name: 'ECM WIPER',
                abbrev: 'WIPE',
                type: 'ECM_WIPER',
                damage: 0,
                energyCost: 4,
                speed: 0,
                price: 800,
                color: '#aaaaff',
                effect: 'destroy_all',
                description: 'Destroys every missile in zone, aid friends'
            },
            {
                name: 'CONFUSOR',
                abbrev: 'ECM',
                type: 'CONFUSOR',
                damage: 0,
                energyCost: 0,
                speed: 0,
                price: 480,
                color: '#88aaff',
                duration: 3.0,
                effect: 'ignore_guided',
                description: 'Guided missiles ignore tank, good for fast switchers'
            }
        ]
    },

    // PORT 7: Harmless Defense (4 weapons)
    PORT_7: {
        name: 'PORT 7 (Harmless Defense)',
        description: 'Support and healing',
        weapons: [
            {
                name: 'HEALER',
                abbrev: 'HEAL',
                type: 'HEALER',
                damage: -10, // Negative = healing
                energyCost: 10,
                speed: 0,
                price: 350,
                color: '#00ff00',
                effect: 'heal',
                description: 'Convert weapon energy to shield when critical'
            },
            {
                name: 'GLOW SHIELD',
                abbrev: 'GLOW',
                type: 'GLOW_SHIELD',
                damage: 0,
                energyCost: 15,
                speed: 0,
                price: 800,
                color: '#ffffff',
                duration: 3.0,
                effect: 'invincible',
                description: 'Complete protection for few seconds, attack close range'
            },
            {
                name: 'FADE SHIELD',
                abbrev: 'FADE',
                type: 'FADE_SHIELD',
                damage: 0,
                energyCost: 20,
                speed: 0,
                price: 1200,
                color: '#888888',
                duration: 6.0,
                effect: 'cloak',
                description: 'Cloaking device, lasts twice as long as GLOW'
            },
            {
                name: 'TELEPORT SELF',
                abbrev: 'TELEP',
                type: 'TELEPORT_SELF',
                damage: 0,
                energyCost: 4,
                speed: 0,
                price: 2000,
                color: '#ff00ff',
                effect: 'teleport_self',
                description: 'Escape desperate situations or when stuck'
            }
        ]
    }
};

// Global weapon index for easy access
let PLAYER_WEAPONS = {
    PORT_1: 0, // Current weapon index for each port
    PORT_2: 0,
    PORT_3: 0,
    PORT_4: 0,
    PORT_5: 0,
    PORT_6: 0,
    PORT_7: 0
};

// Helper functions
const WeaponData = {
    getWeapon: function(port, index) {
        const portKey = `PORT_${port}`;
        const portData = WEAPON_PORTS[portKey];
        if (!portData || !portData.weapons[index]) {
            return null;
        }
        return portData.weapons[index];
    },

    getCurrentWeapon: function(port) {
        const portKey = `PORT_${port}`;
        const index = PLAYER_WEAPONS[portKey] || 0;
        return this.getWeapon(port, index);
    },

    getPortWeapons: function(port) {
        const portKey = `PORT_${port}`;
        return WEAPON_PORTS[portKey]?.weapons || [];
    },

    getAllWeapons: function() {
        return Object.values(WEAPON_PORTS).flatMap(port => port.weapons);
    },

    getTotalWeaponCount: function() {
        return this.getAllWeapons().length;
    },

    setCurrentWeapon: function(port, index) {
        const portKey = `PORT_${port}`;
        if (WEAPON_PORTS[portKey] && WEAPON_PORTS[portKey].weapons[index]) {
            PLAYER_WEAPONS[portKey] = index;
            return true;
        }
        return false;
    }
};

console.log(`🔫 Weapon data loaded (v1.3) - ${WeaponData.getTotalWeaponCount()} weapons across 7 ports`);
