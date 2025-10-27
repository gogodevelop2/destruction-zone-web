// Game Configuration
// All game constants and settings

const GAME_CONFIG = {
    // Game settings
    DEBUG_MODE: false,
    VERSION: '1.0.0',
    
    // Canvas settings
    CANVAS: {
        WIDTH: 960,
        HEIGHT: 720,
        BACKGROUND_COLOR: '#000011'
    },
    
    // Physics settings
    PHYSICS: {
        FRICTION: 0.95,
        RESTITUTION: 0.8,
        MAX_VELOCITY: 300, // pixels per second
        MAX_ANGULAR_VELOCITY: 5 // radians per second
    },
    
    // Game timing
    TIMING: {
        ROUND_TIME: 30, // 30 seconds per round for testing (was 300)
        SHOP_TIME: 120,  // 2 minutes in shop
        COUNTDOWN_TIME: 3 // 3 second countdown
    },
    
    // Controls configuration
    CONTROLS: {
        PLAYER1: {
            FORWARD: 'ArrowUp',
            BACKWARD: 'ArrowDown',
            TURN_LEFT: 'ArrowLeft',
            TURN_RIGHT: 'ArrowRight',
            CHANGE_WEAPON: 'KeyA',
            FIRE: 'KeyD'
        },
        PLAYER2: {
            FORWARD: 'KeyW',
            BACKWARD: 'KeyX',
            TURN_LEFT: 'KeyQ',
            TURN_RIGHT: 'KeyE',
            CHANGE_WEAPON: 'KeyS',
            FIRE: 'KeyZ'
        },
        PLAYER3: {
            FORWARD: 'KeyP',
            BACKWARD: 'Semicolon', // Different on different keyboards
            TURN_LEFT: 'KeyL',
            TURN_RIGHT: 'Quote',
            CHANGE_WEAPON: 'BracketLeft',
            FIRE: 'KeyO'
        }
    },
    
    // Tank default stats
    TANK_DEFAULTS: {
        SIZE: 30, // Increased from 20 to 30
        MAX_SHIELD: 40,
        MAX_WEAPON_ENERGY: 100,
        WEAPON_REGEN_RATE: 10, // energy per second
        THRUST_POWER: 200,
        ROTATION_POWER: 3
    },
    
    // Colors
    COLORS: {
        PLAYER: '#00ffff',
        AI: '#ff4444',
        NEUTRAL: '#ffffff',
        EXPLOSION: '#ff6400',
        LASER: '#ff0000',
        MISSILE: '#ffff00',
        BLASTER: '#00ff00',
        GRID: 'rgba(0, 100, 150, 0.2)',
        STAR: 'rgba(255, 255, 255, 0.8)'
    },
    
    // Weapon defaults
    WEAPONS: {
        ENERGY_COSTS: {
            MISSILE: 4,
            LASER: 6,
            BLASTER: 15,
            GUIDE_BLASTER: 18,
            BLAST_GUIDER: 20,
            NUKE_BLASTER: 25,
            GUIDED: 5,
            DOUBLE_MISSILE: 8,
            TRIPLE_MISSILE: 12,
            POWER_LASER: 10,
            TRI_STRIKER: 15
        },
        DAMAGE_VALUES: {
            MISSILE: 3,
            LASER: 6,
            BLASTER: 48,
            GUIDE_BLASTER: 40,
            BLAST_GUIDER: 35,
            NUKE_BLASTER: 60,
            GUIDED: 4,
            DOUBLE_MISSILE: 3,
            TRIPLE_MISSILE: 3,
            POWER_LASER: 12,
            TRI_STRIKER: 4
        },
        SPEEDS: {
            MISSILE: 200,
            LASER: 400,
            BLASTER: 150,
            GUIDE_BLASTER: 120,
            BLAST_GUIDER: 100,
            NUKE_BLASTER: 80,
            GUIDED: 180,
            DOUBLE_MISSILE: 200,
            TRIPLE_MISSILE: 200,
            POWER_LASER: 400,
            TRI_STRIKER: 250
        }
    },
    
    // Scoring system
    SCORING: {
        KILL_POINTS: 3,
        DAMAGE_POINTS: 1, // per damage unit
        MONEY_PER_DAMAGE: 10,
        MAX_DAMAGE_POINTS: 40
    },
    
    // Shop settings
    SHOP: {
        ROUNDS_BETWEEN_VISITS: 3,
        DISCOUNT_CARD_PERCENTAGE: 0.75, // 25% discount
        PRICE_SCALING: 1.1 // Prices increase by 10% per round
    },
    
    // AI settings
    AI: {
        DIFFICULTY_LEVELS: {
            R1_PROTOTYPE: 0.3,
            R2_SHOOTER: 0.5,
            R3_SEEKER: 0.7,
            R4_HUNTER: 0.9
        },
        REACTION_TIME: 0.1, // seconds
        AIM_ACCURACY: 0.8 // 0-1
    },
    
    // Effects and visuals
    EFFECTS: {
        EXPLOSION_DURATION: 1.0, // seconds
        EXPLOSION_MAX_RADIUS: 30,
        GLOW_INTENSITY: 20,
        TRAIL_LENGTH: 8
    },
    
    // Game modes
    GAME_MODES: {
        HOSTILE: 'hostile',
        TEAMS: 'teams'
    },
    
    // Audio settings
    AUDIO: {
        MASTER_VOLUME: 0.7,
        SFX_VOLUME: 0.8,
        MUSIC_VOLUME: 0.5
    }
};

// Freeze configuration to prevent accidental changes
Object.freeze(GAME_CONFIG);
Object.freeze(GAME_CONFIG.CANVAS);
Object.freeze(GAME_CONFIG.PHYSICS);
Object.freeze(GAME_CONFIG.TIMING);
Object.freeze(GAME_CONFIG.CONTROLS);
Object.freeze(GAME_CONFIG.TANK_DEFAULTS);
Object.freeze(GAME_CONFIG.COLORS);
Object.freeze(GAME_CONFIG.WEAPONS);
Object.freeze(GAME_CONFIG.SCORING);
Object.freeze(GAME_CONFIG.SHOP);
Object.freeze(GAME_CONFIG.AI);
Object.freeze(GAME_CONFIG.EFFECTS);

console.log('⚙️ Game configuration loaded');