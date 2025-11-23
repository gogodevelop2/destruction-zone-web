// ============================================
// Weapon Data Configuration
// ============================================

/**
 * Speed scale factor: DOS game units → Web canvas pixels
 * DOS original MISSILE speed: 5 (DOS units) → 2 px/frame (web)
 * Scale factor: 2 / 5 = 0.4
 */
export const SPEED_SCALE_FACTOR = 0.4;  // 5 * 0.4 = 2

/**
 * ============================================
 * LIFETIME POLICY (IMPORTANT - READ BEFORE MODIFYING WEAPONS)
 * ============================================
 *
 * lifetime is an OPTIONAL property for weapons.
 *
 * DEFAULT BEHAVIOR (DOS Original):
 * - DOS original had NO lifetime limit
 * - Projectiles fly indefinitely until they hit something or go off-screen
 * - This is the current behavior for all basic weapons
 *
 * WHEN TO ADD lifetime:
 * - Only add lifetime property when EXPLICITLY requested
 * - Used for special weapons that need timed expiration
 * - Example: weaponData.lifetime = 2.0 (expires after 2 seconds)
 *
 * CURRENT STATUS:
 * - MISSILE: NO lifetime (infinite)
 * - LASER: NO lifetime (infinite)
 * - DOUBLE_MISSILE: NO lifetime (infinite)
 * - TRIPLE_MISSILE: NO lifetime (infinite)
 *
 * IMPLEMENTATION:
 * - If lifetime property is missing → Projectile.js sets this.lifetime = null
 * - null lifetime = infinite flight (DOS original behavior)
 *
 * ⚠️  DO NOT add lifetime to weapons without explicit user request!
 * ============================================
 */

/**
 * ============================================
 * RENDER CONFIG SYSTEM (IMPORTANT - READ BEFORE MODIFYING)
 * ============================================
 *
 * DESIGN DECISION (Option B - Individual Control):
 * Each weapon explicitly specifies its own renderConfig.
 * Renderer default values are FALLBACK ONLY (safety net).
 *
 * STRUCTURE:
 *   MISSILE: {
 *       renderType: 'SHORT_BEAM',
 *       renderConfig: {
 *           length: 6,     // ← Each weapon specifies its own values
 *           width: 2,
 *           coreWidth: 1,
 *           hasCore: true
 *       }
 *   }
 *
 * HOW IT WORKS:
 * 1. Projectile reads renderConfig from weapon data
 * 2. ProjectileRenderer uses these values
 * 3. If a value is missing, renderer uses default (|| operator)
 *
 * TO CHANGE A SPECIFIC WEAPON:
 * - Modify that weapon's renderConfig in this file
 * - Example: Change GUIDED length to 8
 *
 * TO CHANGE ALL SHORT_BEAM WEAPONS:
 * - Update renderConfig for each SHORT_BEAM weapon individually
 * - Example: MISSILE, DOUBLE_MISSILE, TRIPLE_MISSILE, GUIDED
 *
 * RENDERER DEFAULTS (ProjectileRenderer.js):
 * - These are FALLBACK values only
 * - Used when renderConfig is missing or incomplete
 * - DO NOT control normal weapon appearance
 *
 * ALTERNATIVE (Not implemented):
 * - Remove all renderConfig from weapons
 * - Use renderer defaults as single source of truth
 * - One change affects all weapons of same type
 *
 * ⚠️  Current design allows per-weapon customization!
 * ============================================
 */

/**
 * ============================================
 * TRAIL SYSTEM CONFIG (IMPORTANT - READ BEFORE MODIFYING)
 * ============================================
 *
 * fadeRate: Per-frame alpha 감소량 (트레일 페이드 속도)
 * - 값이 클수록: 빠른 페이드 → 짧은 트레일
 * - 값이 작을수록: 느린 페이드 → 긴 트레일
 *
 * CURRENT SETTINGS:
 * - GUIDED: fadeRate 0.03 (긴 트레일, 20프레임 ≈ 0.33초)
 * - GUIDE_BLASTER PRIMARY: fadeRate 0.03 (긴 트레일)
 * - BLAST_GUIDER SECONDARY: fadeRate 0.12 (짧은 트레일, 5프레임 ≈ 0.08초)
 *
 * WHY DIFFERENT?
 * - GUIDED: lifetime 없음 (충돌 전까지 비행) → 긴 트레일 선호
 * - BLAST_GUIDER 자탄: lifetime 2.0s (강제 소멸) → 짧은 트레일 (빠른 정리)
 *
 * CALCULATION:
 * - 보이는 위치 개수 = initialAlpha / fadeRate
 * - fadeRate 0.03: 0.6 / 0.03 = 20개 위치 → 60px 트레일
 * - fadeRate 0.12: 0.6 / 0.12 = 5개 위치 → 15px 트레일
 *
 * TrailManager DEFAULT (fallback):
 * - fadeRate: 0.12 (weapons.js에서 설정 안 하면 사용)
 * ============================================
 */

/**
 * Weapon Data (from original game, speeds in DOS units)
 * Each weapon has damage, energy cost, speed, price, visual properties
 *
 * === WEAPON TYPES ===
 * projectileType: 'SIMPLE' | 'TWO_STAGE' (optional, defaults to 'SIMPLE')
 * - SIMPLE: Single-stage projectile (MISSILE, LASER, etc.)
 * - TWO_STAGE: Primary → Trigger → Secondary (BLASTER, BREAKER, BOMB)
 *
 * For TWO_STAGE weapons:
 * - triggerType: 'MANUAL' | 'AUTO' | 'BOTH' (required)
 *   - MANUAL: Fire key triggers split
 *   - AUTO: Collision triggers split
 *   - BOTH: Either method triggers split
 * - primaryProjectile: Config for initial projectile (warhead, bomb)
 * - secondaryProjectiles: Config for split projectiles (missiles, explosion)
 *
 * See: docs/TWO_STAGE_WEAPON_SYSTEM.md for full documentation
 *
 * === PHYSICS PROPERTIES ===
 * isSensor property:
 * - false: Physical projectile (applies collision forces, can push tanks)
 * - true: Energy weapon (collision detection only, no physical forces)
 *
 * Note: High-speed projectiles (e.g., LASER at 18 px/frame) with isSensor=false
 * can cause excessive tank push due to deep penetration (>4px) between physics steps.
 * Setting isSensor=true prevents this while maintaining accurate collision detection.
 *
 * === RENDERING SYSTEM ===
 * renderType: Visual representation type (e.g., 'SHORT_BEAM', 'LONG_BEAM', 'CIRCLE')
 * renderConfig: Type-specific rendering parameters (length, width, etc.)
 *
 * Available render types:
 * - 'SHORT_BEAM': Short beam projectile (8-10px length)
 * - 'LONG_BEAM': Long beam projectile (20px length, for lasers)
 * - 'CIRCLE': Circular projectile (warheads, bombs, traditional missiles)
 * - More types can be added: 'STAR', 'HEXAGON', 'TRIANGLE', etc.
 *
 * === FIRING PATTERN SYSTEM ===
 * firePattern: Defines which firing points to use
 * - 'CENTER': Fire from center point only (single projectile)
 * - 'SIDES': Fire from left and right points (2 projectiles)
 * - 'ALL': Fire from all 3 points - center, left, right (3 projectiles)
 *
 * Fire point layout (top view):
 *        [Front]
 *          /\
 *         /  \
 *        / C  \      C = Center (앞끝)
 *       /      \     L/R = Left/Right (좌우, 중앙보다 5px 뒤, ±6px 간격)
 *      /  L  R  \
 *     /          \
 *    /____________\
 */
export const WEAPON_DATA = {
    MISSILE: {
        name: 'MISSILE',
        displayName: 'MISIL',  // 화면 표시용 요약 이름
        type: 'MISSILE',
        damage: 4,
        energyCost: 4,
        speed: 5,          // DOS original (5 * 0.4 = 2.0 px/frame)
        price: 2,
        // color: Uses tank color (no override)
        size: 2,
        density: 0.4,      // Matter.js density (affects mass and collision impact)
        isSensor: false,   // Physical projectile (can push tanks slightly)

        // === FIRING PATTERN ===
        firePattern: 'CENTER',  // Single projectile from center point

        // === RENDERING ===
        renderType: 'SHORT_BEAM',
        renderConfig: {
            length: 6,       // Beam length in pixels (shortened)
            width: 2,        // Outer beam thickness
            coreWidth: 1,    // Inner white core thickness
            hasCore: true    // Display white core for emphasis
        }
    },
    LASER: {
        name: 'BEAM LASER',
        displayName: 'LASER',  // 화면 표시용 요약 이름
        type: 'LASER',
        damage: 6,
        energyCost: 6,
        speed: 45,         // DOS original (45 * 0.4 = 18.0 px/frame, 9x faster than MISSILE)
        price: 150,
        // color: Uses tank color (no override)
        size: 1.5,
        density: 0.00001,  // Extremely light (light beam, almost massless)
        isSensor: true,    // Energy weapon (no physical impact, prevents excessive push from high-speed penetration)

        // === FIRING PATTERN ===
        firePattern: 'CENTER',  // Single laser from center point

        // === RENDERING ===
        renderType: 'LONG_BEAM',
        renderConfig: {
            length: 20,      // Long beam for laser
            width: 2,
            coreWidth: 1,
            hasCore: true
        }
    },
    DOUBLE_MISSILE: {
        name: 'DOUBLE MISSILE',
        displayName: 'DOUBL',  // 화면 표시용 요약 이름
        type: 'DOUBLE_MISSILE',
        damage: 3,         // Per projectile (2 projectiles × 3 damage = 6 total, DOS original)
        energyCost: 4,
        speed: 6,          // DOS original (6 * 0.4 = 2.4 px/frame, 1.2x faster than MISSILE)
        price: 100,
        // color: Uses tank color (no override)
        size: 2,
        density: 0.4,      // Same as MISSILE
        isSensor: false,   // Physical projectile (can push tanks slightly)

        // === FIRING PATTERN ===
        firePattern: 'SIDES',  // 2 projectiles from left and right points

        // === RENDERING ===
        renderType: 'SHORT_BEAM',
        renderConfig: {
            length: 6,       // Beam length in pixels (shortened)
            width: 2,
            coreWidth: 1,
            hasCore: true
        }
    },
    TRIPLE_MISSILE: {
        name: 'TRIPLE MISSILE',
        displayName: 'TRIPL',  // 화면 표시용 요약 이름
        type: 'TRIPLE_MISSILE',
        damage: 3,         // Per projectile (3 projectiles × 3 damage = 9 total, DOS original)
        energyCost: 6,
        speed: 7,          // DOS original (7 * 0.4 = 2.8 px/frame, 1.4x faster than MISSILE)
        price: 600,
        // color: Uses tank color (no override)
        size: 2,           // Same as MISSILE
        density: 0.4,
        isSensor: false,   // Physical projectile (can push tanks slightly)

        // === FIRING PATTERN ===
        firePattern: 'ALL',  // 3 projectiles: center + left + right

        // === RENDERING ===
        renderType: 'SHORT_BEAM',
        renderConfig: {
            length: 6,       // Same visual size as MISSILE (shortened)
            width: 2,
            coreWidth: 1,
            hasCore: true
        }
    },
    POWER_LASER: {
        name: 'POWER LASER',
        displayName: 'POWER',  // 화면 표시용 요약 이름
        type: 'POWER_LASER',
        damage: 6,         // Per projectile (2 projectiles × 6 damage = 12 total, DOS original)
        energyCost: 6,     // Same as single LASER (DOS: "using energy of only one")
        speed: 45,         // DOS original (45 * 0.4 = 18.0 px/frame, 9x faster than MISSILE)
        price: 1650,       // DOS original
        // color: Uses tank color (no override)
        size: 1.5,
        density: 0.00001,  // Extremely light (light beam, almost massless)
        isSensor: true,    // Energy weapon (no physical impact, prevents excessive push from high-speed penetration)

        // === FIRING PATTERN ===
        firePattern: 'SIDES',  // 2 projectiles from left and right points

        // === RENDERING ===
        renderType: 'LONG_BEAM',
        renderConfig: {
            length: 20,      // Long beam for laser
            width: 2,
            coreWidth: 1,
            hasCore: true
        }
    },

    // === TWO-STAGE WEAPONS ===
    // These weapons fire a PRIMARY projectile (warhead) that splits into SECONDARY projectiles

    BLASTER: {
        name: 'BLASTER',
        displayName: 'BLAST',  // 화면 표시용 요약 이름
        type: 'BLASTER',
        energyCost: 22,        // DOS original
        price: 650,            // DOS original

        // === TWO-STAGE CONFIG ===
        projectileType: 'TWO_STAGE',
        triggerType: 'BOTH',   // Can trigger via fire key (MANUAL) or collision (AUTO)

        // === PRIMARY PROJECTILE (Warhead) ===
        primaryProjectile: {
            damage: 0,         // Warhead itself does no damage (only SECONDARY missiles do damage)
            speed: 5,          // Initial speed (used for acceleration system)
            size: 1.5,         // 1.5px radius = 3px diameter
            // color: Uses tank color (no override)
            density: 0.4,
            isSensor: false,   // Physical projectile
            firePattern: 'CENTER',  // Single warhead from center

            // === ACCELERATION SYSTEM ===
            hasAcceleration: true,
            accelerationConfig: {
                initialSpeed: 5,      // DOS units (5 * 0.4 = 2.0 px/frame, MISSILE speed)
                finalSpeed: 12,       // DOS units (12 * 0.4 = 4.8 px/frame, original BLASTER speed)
                duration: 0.7,        // 0.7 seconds (42 frames at 60 fps)
                easingType: 'EASE_OUT_QUAD'  // Ease-Out Quadratic (fast initial burst, gradual slowdown)
            },

            // Rendering: Circular warhead
            renderType: 'CIRCLE',
            renderConfig: {
                radius: 1.5,       // 1.5px radius = 3px diameter
                fillAlpha: 1,
                hasOutline: false
            }
        },

        // === SECONDARY PROJECTILES (Split missiles) ===
        secondaryProjectiles: {
            damage: 7.5,       // 90 total / 12 missiles = 7.5 damage each
            speed: 5,          // DOS original (5 * 0.4 = 2.0 px/frame, same as basic MISSILE)
            size: 2,           // Same as MISSILE
            // color: Uses tank color (no override)
            density: 0.4,
            isSensor: false,
            lifetime: 2.0,     // 2 seconds (2.0 px/frame × 60 fps × 2s = 240px range)

            // Split pattern
            pattern: 'CIRCLE',      // 360° spread (all directions)
            count: 12,              // 12 missiles in circle

            // Rendering: Small circular projectile
            renderType: 'SMALL_CIRCLE',
            renderConfig: {
                radius: 1           // 1px radius = 2px diameter
            }
        }
    },

    // === GUIDED WEAPONS ===

    GUIDED: {
        name: 'GUIDED',
        displayName: 'GUIDE',  // 화면 표시용 요약 이름
        type: 'GUIDED',
        damage: 6,
        energyCost: 6,
        speed: 7,          // DOS original (7 * 0.4 = 2.8 px/frame)
        price: 400,
        // color: Uses tank color (no override)
        size: 2,
        density: 0.4,
        isSensor: false,

        // === GUIDED CONFIG ===
        isGuided: true,
        guidedConfig: {
            turnRate: 0.01,        // 회전 속도 (rad/frame) ≈ 0.57도
            targetType: 'SMART',   // 스마트 타겟팅 (거리 + 각도 가중치)
            detectionRange: 100,   // 타겟 탐지 거리 (px)
            updateInterval: 10     // 타겟 업데이트 주기 (frames)
        },

        // === TRAIL CONFIG ===
        hasTrail: true,
        trailConfig: {
            maxLength: 36,     // 트레일 점 개수 (최대 36개 위치 저장)
            fadeRate: 0.03,    // 페이드 속도 (per-frame, 긴 트레일 - 20프레임 지속)
            width: 1,          // 트레일 선 두께 (line thickness)
            length: 3,         // 트레일 선 길이 (line length)
            spacing: 3,        // 트레일 간격 (3px 이동마다 1개 위치 추가)
            initialAlpha: 0.6, // 시작 투명도 (새 위치의 초기 alpha 값)
            color: '#ffffff'   // 트레일 색상 (흰색)
        },

        // === FIRING PATTERN ===
        firePattern: 'CENTER',  // Single projectile from center point

        // === RENDERING ===
        renderType: 'SHORT_BEAM',
        renderConfig: {
            length: 6,       // Beam length in pixels (shortened)
            width: 2,
            coreWidth: 1,
            hasCore: true
        }
    },

    TRI_STRIKER: {
        name: 'TRI-STRIKER',
        displayName: 'STRIK',  // 화면 표시용 요약 이름
        type: 'TRI_STRIKER',
        damage: 6,         // Per projectile (3 × 6 = 18 total, DOS original)
        energyCost: 6,
        speed: 5,          // Initial speed (used for acceleration system)
        price: 3350,       // DOS original
        // color: Uses tank color (no override)
        size: 1.5,
        density: 0.4,      // Missile-grade density (will accelerate to laser speed)
        isSensor: false,   // Physical projectile (may consider isSensor after high-speed testing)

        // === FIRING PATTERN ===
        firePattern: 'ALL',  // 3 projectiles: center + left + right

        // === ACCELERATION SYSTEM ===
        hasAcceleration: true,
        accelerationConfig: {
            initialSpeed: 5,      // DOS units (5 * 0.4 = 2.0 px/frame, MISSILE speed)
            finalSpeed: 45,       // DOS units (45 * 0.4 = 18.0 px/frame, LASER speed)
            duration: 1.0,        // 1.0 seconds (60 frames at 60 fps)
            easingType: 'EASE_OUT_QUAD'  // Ease-Out Quadratic (fast initial burst, gradual slowdown)
        },

        // === RENDERING - MEDIUM_BEAM ===
        renderType: 'MEDIUM_BEAM',
        renderConfig: {
            length: 9,            // Medium size (between SHORT_BEAM and LONG_BEAM)
            width: 2,             // Same thickness as MISSILE
            coreWidth: 1,         // Same core thickness as MISSILE
            hasCore: true,        // White core enabled
            useBlurFilter: true,  // BlurFilter enabled (performance consideration!)
            blurStrength: 3       // Blur strength (1~10)
        }
    },

    // === PORT 2: BLASTERS ===

    GUIDE_BLASTER: {
        name: 'GUIDE BLASTER',
        displayName: 'G.BST',  // 화면 표시용 요약 이름
        type: 'GUIDE_BLASTER',
        energyCost: 28,        // DOS original (BLASTER보다 6 높음, 28% 증가)
        price: 1200,           // DOS original

        // === TWO-STAGE CONFIG ===
        projectileType: 'TWO_STAGE',
        triggerType: 'BOTH',   // Can trigger via fire key (MANUAL) or collision (AUTO)

        // === PRIMARY PROJECTILE (Guided Warhead) ===
        primaryProjectile: {
            damage: 0,         // Warhead itself does no damage (only SECONDARY missiles do damage)
            speed: 7,          // DOS original (7 * 0.4 = 2.8 px/frame, slower than BLASTER's 12)
            size: 1.5,         // 1.5px radius = 3px diameter (same as BLASTER)
            // color: Uses tank color (no override)
            density: 0.4,
            isSensor: false,   // Physical projectile
            firePattern: 'CENTER',  // Single warhead from center

            // === GUIDED SYSTEM (핵심 차별점!) ===
            isGuided: true,
            guidedConfig: {
                turnRate: 0.01,        // 회전 속도 (rad/frame) ≈ 0.57도 (GUIDED와 동일)
                targetType: 'SMART',   // 스마트 타겟팅 (거리 + 각도 가중치)
                detectionRange: 100,   // 타겟 탐지 거리 (px)
                updateInterval: 10     // 타겟 업데이트 주기 (frames)
            },

            // === TRAIL SYSTEM (유도 미사일 시각화) ===
            hasTrail: true,
            trailConfig: {
                maxLength: 36,     // 트레일 점 개수 (최대 36개 위치 저장)
                fadeRate: 0.03,    // 페이드 속도 (per-frame, 긴 트레일 - 20프레임 지속)
                width: 1,          // 트레일 선 두께 (line thickness)
                length: 3,         // 트레일 선 길이 (line length)
                spacing: 3,        // 트레일 간격 (3px 이동마다 1개 위치 추가)
                initialAlpha: 0.6, // 시작 투명도 (새 위치의 초기 alpha 값)
                color: '#ffffff'   // 트레일 색상 (흰색)
            },

            // Rendering: Circular warhead
            renderType: 'CIRCLE',
            renderConfig: {
                radius: 1.5,       // 1.5px radius = 3px diameter
                fillAlpha: 1,
                hasOutline: false  // No outline (BLASTER와 동일)
            }
        },

        // === SECONDARY PROJECTILES (일반 자탄, 유도 없음) ===
        secondaryProjectiles: {
            damage: 7.5,       // 90 total / 12 missiles = 7.5 damage each (BLASTER와 동일)
            speed: 5,          // DOS original (5 * 0.4 = 2.0 px/frame, same as basic MISSILE)
            size: 2,           // Same as MISSILE
            // color: Uses tank color (no override)
            density: 0.4,
            isSensor: false,
            lifetime: 2.0,     // 2 seconds (2.0 px/frame × 60 fps × 2s = 240px range)

            // Split pattern
            pattern: 'CIRCLE',      // 360° spread (all directions)
            count: 12,              // 12 missiles in circle

            // Rendering: Small circular projectile
            renderType: 'SMALL_CIRCLE',
            renderConfig: {
                radius: 1           // 1px radius = 2px diameter
            }
        }
    },

    BLAST_GUIDER: {
        name: 'BLAST GUIDER',
        displayName: 'B.GUI',  // 화면 표시용 요약 이름
        type: 'BLAST_GUIDER',
        energyCost: 34,        // DOS original (GUIDE_BLASTER보다 6 높음, 21% 증가)
        price: 2500,           // DOS original (GUIDE_BLASTER의 2배 이상)

        // === TWO-STAGE CONFIG ===
        projectileType: 'TWO_STAGE',
        triggerType: 'BOTH',   // Can trigger via fire key (MANUAL) or collision (AUTO)

        // === PRIMARY PROJECTILE (일반 모탄, 유도 없음) ===
        primaryProjectile: {
            damage: 0,         // Warhead itself does no damage (only SECONDARY missiles do damage)
            speed: 7,          // DOS original (7 * 0.4 = 2.8 px/frame, same as GUIDE_BLASTER)
            size: 1.5,         // 1.5px radius = 3px diameter (same as BLASTER)
            // color: Uses tank color (no override)
            density: 0.4,
            isSensor: false,   // Physical projectile
            firePattern: 'CENTER',  // Single warhead from center

            // === NO GUIDED (일반 모탄!) ===
            // isGuided: false (기본값, 생략)
            // hasTrail: false (기본값, 생략)

            // Rendering: Circular warhead
            renderType: 'CIRCLE',
            renderConfig: {
                radius: 1.5,       // 1.5px radius = 3px diameter
                fillAlpha: 1,
                hasOutline: false  // No outline
            }
        },

        // === SECONDARY PROJECTILES (유도 자탄!) ===
        secondaryProjectiles: {
            damage: 5.83,      // 70 total / 12 missiles = 5.83 damage each (DOS original)
            speed: 5,          // DOS original (5 * 0.4 = 2.0 px/frame, same as basic MISSILE)
            size: 2,           // Same as MISSILE
            // color: Uses tank color (no override)
            density: 0.4,
            isSensor: false,
            lifetime: 2.0,     // 2 seconds (2.0 px/frame × 60 fps × 2s = 240px range)

            // === GUIDED SYSTEM (핵심 차별점!) ===
            isGuided: true,
            guidedConfig: {
                turnRate: 0.01,        // 회전 속도 (rad/frame) ≈ 0.57도
                targetType: 'SMART',   // 스마트 타겟팅 (거리 + 각도 가중치)
                detectionRange: 100,   // 타겟 탐지 거리 (px)
                updateInterval: 10     // 타겟 업데이트 주기 (frames)
            },

            // === TRAIL SYSTEM (유도 미사일 시각화) ===
            hasTrail: true,
            trailConfig: {
                maxLength: 36,     // 트레일 점 개수 (최대 36개 위치 저장)
                fadeRate: 0.12,    // 페이드 속도 (per-frame, 짧은 트레일 - 5프레임 지속, lifetime 2.0s용)
                width: 1,          // 트레일 선 두께 (line thickness)
                length: 3,         // 트레일 선 길이 (line length)
                spacing: 3,        // 트레일 간격 (3px 이동마다 1개 위치 추가)
                initialAlpha: 0.6, // 시작 투명도 (새 위치의 초기 alpha 값)
                color: '#ffffff'   // 트레일 색상 (흰색)
            },

            // Split pattern
            pattern: 'CIRCLE',      // 360° spread (all directions)
            count: 12,              // 12 missiles in circle

            // Rendering: Small circular projectile
            renderType: 'SMALL_CIRCLE',
            renderConfig: {
                radius: 1           // 1px radius = 2px diameter
            }
        }
    }

    // === FUTURE WEAPONS (Not implemented yet) ===
    // Add new weapons here following the same pattern
};
