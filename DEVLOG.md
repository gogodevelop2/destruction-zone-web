# Destruction Zone - 개발 로그

> **상세 기록**: 주제별로 정리된 상세 개발 로그는 [docs/devlogs/](./docs/devlogs/) 참고
>
> **전체 히스토리**: [docs/archive/devlog-original.md](./docs/archive/devlog-original.md)

---

## 📚 주제별 개발 로그

### 핵심 시스템
- **[아키텍처](./docs/devlogs/architecture.md)** - 설계 결정, Matter.js 중심 구조, 리팩토링 계획
- **[물리 엔진](./docs/devlogs/physics-engine.md)** - Matter.js 통합, 충돌 시스템, 안정성 개선
- **[렌더링](./docs/devlogs/rendering.md)** - Canvas/PixiJS 하이브리드, 발사체 마이그레이션
- **[AI 시스템](./docs/devlogs/ai-system.md)** - State Machine, Navmesh, LOS, 디버그 시스템

### 게임 요소
- **[비주얼 디자인](./docs/devlogs/visual-design.md)** - TRON 스타일, visualMargin, 네온 효과
- **[Procedural Walls](./docs/devlogs/procedural-walls.md)** - 그리드 기반 랜덤 벽 생성

### 개발 과정
- **[개발 여정](./docs/devlogs/development-journey.md)** - DOS 포팅 → 하이브리드 실패 → Matter.js 재시작

### 참고 문서
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 전체 시스템 아키텍처
- **[WEAPONS.md](./WEAPONS.md)** - 무기 시스템 명세 (34종)

### 아카이브
- **[PixiJS 마이그레이션 계획](./docs/archive/pixi-projectile-migration.md)** - 완료된 4단계 전환 계획
- **[전체 개발 히스토리](./docs/archive/devlog-original.md)** - 시간순 상세 기록

---

## 📅 최근 활동

### 2025년 11월

#### 11월 23일 - Trail System 리팩토링 및 BLASTER 무기 2종 완성 ✅
**Trail System 완전 리팩토링 (Option D)**
- TrailManager가 모든 trail 데이터 소유 (Single Map 구조)
- Projectile은 trailId만 보유 (데이터 제거, 메모리 최적화)
- Attached/Independent 플래그 시스템 (단순한 상태 전환)
- fadeRate 시스템 명확화: per-frame alpha 감소량

**fadeRate 차별화 시스템**
- GUIDED: fadeRate 0.03 (긴 트레일, 20프레임 ≈ 0.33초)
- GUIDE_BLASTER PRIMARY: fadeRate 0.03 (긴 트레일)
- BLAST_GUIDER SECONDARY: fadeRate 0.12 (짧은 트레일, 5프레임 ≈ 0.08초)
- 시각적 트레일 길이 = initialAlpha / fadeRate
- 무기 특성에 따른 최적화: lifetime 없음(긴 트레일), lifetime 있음(짧은 트레일)

**Projectile Lifecycle 최적화**
- 충돌 소멸 vs 시간 소멸 동작 통일
- 두 경우 모두 destroy() → detachTrail() → trail independent
- lifetime 도달 시 중복 detach 제거
- 불필요한 trailFadeDelay 제거

**GUIDE_BLASTER 무기 완성 (Port 2)**
- 유도 warhead + 일반 미사일 분산
- PRIMARY: 유도 탄두 (isGuided: true, SMART targeting)
- SECONDARY: 12발 360° 분산 (CIRCLE pattern)
- Trail 시스템: PRIMARY에만 적용 (fadeRate 0.03)
- 에너지: 28 (BLASTER보다 27% 증가)
- 가격: $1,200 (DOS 원본)

**BLAST_GUIDER 무기 완성 (Port 2)**
- 일반 warhead + 유도 미사일 분산
- PRIMARY: 일반 탄두 (가속 시스템)
- SECONDARY: 12발 유도 미사일 (isGuided: true)
- Trail 시스템: SECONDARY에만 적용 (fadeRate 0.12, 짧은 트레일)
- Lifetime: SECONDARY 2.0초 (자동 소멸)
- 에너지: 34 (GUIDE_BLASTER보다 21% 증가)
- 가격: $2,500 (DOS 원본)

**Weapon Display Name 시스템**
- 모든 무기에 displayName 필드 추가
- DOS 원본 요약 이름 사용 (MISIL, LASER, DOUBL, TRIPL, POWER, STRIK, BLAST, G.BST, B.GUI, GUIDE)
- HUD 시스템 업데이트: displayName 우선 표시

**문서화 강화**
- TrailManager.js: fadeRate 시스템, attached/independent 상세 주석
- Projectile.js: lifecycle 설명, 충돌/시간 소멸 비교 주석
- weapons.js: TRAIL CONFIG 헤더, trailConfig 인라인 주석
- CHANGELOG.md: 2025-11-23 항목 추가

**기술적 세부사항:**
```javascript
// TrailManager.js - Option D Architecture
const TrailManager = {
    trails: new Map(),  // Single Map for all trails

    createTrail(graphics, config) {
        const trail = {
            id: this.nextId++,
            graphics: graphics,
            positions: [],
            config: config,
            attached: true,  // Simple flag!
            lastPosition: null,
            distanceCounter: 0
        };
        this.trails.set(trail.id, trail);
        return trail.id;
    },

    detachTrail(trailId) {
        const trail = this.trails.get(trailId);
        if (!trail) return;
        trail.attached = false;  // Simple state change
    },

    updateTrails(deltaTime) {
        for (const [id, trail] of this.trails) {
            if (trail.attached) {
                // Skip first position (head, always new)
                for (let i = 1; i < trail.positions.length; i++) {
                    trail.positions[i].alpha -= trail.config.fadeRate;
                }
            } else {
                // Fade all positions (independent trail)
                for (const pos of trail.positions) {
                    pos.alpha -= trail.config.fadeRate;
                }
            }
            // Remove faded positions from tail
            while (trail.positions.length > 0 &&
                   trail.positions[trail.positions.length - 1].alpha <= 0.01) {
                trail.positions.pop();
            }
        }
    }
};

// weapons.js - GUIDE_BLASTER (유도 warhead)
GUIDE_BLASTER: {
    primaryProjectile: {
        isGuided: true,  // Guided warhead
        guidedConfig: {
            turnRate: 0.01,
            targetType: 'SMART',
            detectionRange: 100,
            updateInterval: 10
        },
        hasTrail: true,
        trailConfig: {
            fadeRate: 0.03  // Long trail
        }
    },
    secondaryProjectiles: {
        isGuided: false,  // Normal missiles
        pattern: 'CIRCLE'
    }
},

// weapons.js - BLAST_GUIDER (유도 missiles)
BLAST_GUIDER: {
    primaryProjectile: {
        isGuided: false,  // Normal warhead
        hasAcceleration: true
    },
    secondaryProjectiles: {
        isGuided: true,   // Guided missiles
        guidedConfig: { ... },
        hasTrail: true,
        trailConfig: {
            fadeRate: 0.12  // Short trail (lifetime 2.0s)
        },
        lifetime: 2.0
    }
}

// hud.js - Display Name System
const weaponData = WEAPON_DATA[tank.currentWeapon];
weaponInfo.textContent = weaponData?.displayName || weaponData?.name.substring(0, 6) || 'N/A';
```

**파일 변경:**
- 수정: `js/systems/TrailManager.js` - Option D 리팩토링, fadeRate 시스템 문서화
- 수정: `js/entities/Projectile.js` - trailId만 보유, lifecycle 주석 강화
- 수정: `js/config/weapons.js` - GUIDE_BLASTER/BLAST_GUIDER 완성, fadeRate 차별화, displayName 추가
- 수정: `js/ui/hud.js` - displayName 우선 표시
- 수정: `CHANGELOG.md` - 2025-11-23 항목 추가

#### 11월 11일 - Acceleration System 구현 및 TRI-STRIKER 완성 ✅
**가속도 시스템 구축**
- Ease-Out Quadratic 기반 가속 시스템 구현
- 초기 속도 → 최종 속도 점진적 증가 (물리적으로 현실적인 로켓 가속)
- 조기 종료 최적화: 최종 속도 도달 후 연산 스킵
- 성능: 가벼운 연산량 (~15회 기본 연산 + 삼각함수 3회)
- GUIDED/TRAIL 시스템보다 가벼움

**TRI-STRIKER 무기 완성**
- 3발 동시 발사 (firePattern: 'ALL')
- 각 6 데미지 (총 18 데미지, DOS 원본)
- 가속: 5 → 45 DOS units (2.0 → 18.0 px/frame, 1.0초)
- Ease-Out Quadratic: 빠른 초기 가속 → 점진적 최고속도 도달
- MEDIUM_BEAM 렌더링 (9px 길이, blur glow 효과)

**BLASTER 가속도 적용**
- PRIMARY warhead에 가속 시스템 추가
- 가속: 5 → 12 DOS units (2.0 → 4.8 px/frame, 0.7초)
- 동일한 Ease-Out Quadratic 곡선 사용
- 더 민첩한 warhead 동작

**MEDIUM_BEAM 렌더링 시스템**
- 2-layer 구조: Blur background + Sharp foreground
- BlurFilter: 별도 Graphics 객체에만 적용 (성능 고려)
- 설정: length 9px, width 2px, coreWidth 1px, blurStrength 3
- 흰색 코어 추가 (hasCore: true)

**Weapon Port Cycling 시스템**
- 각 포트에 여러 무기 배열 저장
- Tab 키로 같은 포트 내 무기 순환
- 포트별 선택 상태 기억 (currentWeaponIndex)
- Port 1 기본: [MISSILE, TRI_STRIKER]

**기술적 세부사항:**
```javascript
// Projectile.js - 가속도 시스템
updateAcceleration(deltaTime) {
    // 조기 종료
    if (accel.elapsedTime >= accel.duration) return;

    accel.elapsedTime += deltaTime;
    const progress = Math.min(accel.elapsedTime / accel.duration, 1.0);

    // Ease-Out Quadratic
    const eased = 1 - (1 - progress) * (1 - progress);

    // 속도 계산 및 적용
    accel.currentSpeed = accel.initialSpeed + (accel.finalSpeed - accel.initialSpeed) * eased;
    const newVelocity = {
        x: Math.cos(currentAngle) * accel.currentSpeed,
        y: Math.sin(currentAngle) * accel.currentSpeed
    };
    Matter.Body.setVelocity(this.body, newVelocity);
}

// ProjectileRenderer.js - MEDIUM_BEAM (2-layer blur)
'MEDIUM_BEAM': (graphics, color, config) => {
    // Layer 1: Blur glow (background, separate Graphics)
    if (config.useBlurFilter) {
        const blurGraphics = new PIXI.Graphics();
        blurGraphics.lineStyle(width, colorHex, 1);
        blurGraphics.moveTo(-length/2, 0);
        blurGraphics.lineTo(length/2, 0);

        const blurFilter = new PIXI.filters.BlurFilter();
        blurFilter.blur = blurStrength ?? 2;
        blurFilter.quality = 2;
        blurGraphics.filters = [blurFilter];
        graphics.addChild(blurGraphics);  // Renders behind
    }

    // Layer 2: Sharp beam (foreground, no filter)
    graphics.lineStyle(width, colorHex, 1);
    graphics.moveTo(-length/2, 0);
    graphics.lineTo(length/2, 0);

    if (config.hasCore) {
        graphics.lineStyle(coreWidth, 0xffffff, 1);
        graphics.moveTo(-length/2, 0);
        graphics.lineTo(length/2, 0);
    }
}

// Tank.js - Weapon cycling system
cycleWeapon(WEAPON_DATA) {
    const weaponArray = this.weaponPorts[this.currentPort];
    if (!weaponArray || weaponArray.length <= 1) return;

    // Increment with wrap-around
    this.currentWeaponIndex[this.currentPort] =
        (this.currentWeaponIndex[this.currentPort] + 1) % weaponArray.length;

    const newWeaponType = weaponArray[this.currentWeaponIndex[this.currentPort]];
    this.switchWeapon(newWeaponType, WEAPON_DATA);
}
```

**파일 변경:**
- 수정: `js/entities/Projectile.js` - 가속도 시스템 추가 (hasAcceleration, updateAcceleration)
- 수정: `js/config/weapons.js` - TRI_STRIKER 완성 (가속, MEDIUM_BEAM), BLASTER 가속 추가
- 수정: `js/core/ProjectileRenderer.js` - MEDIUM_BEAM 렌더 타입 추가 (2-layer blur)
- 수정: `js/entities/Tank.js` - weaponPorts 배열화, cycleWeapon() 메서드 추가
- 수정: `js/systems/input.js` - Tab 키 무기 순환, preventDefault 추가

#### 11월 8일 - Guided Missile System 구현 및 최적화 ✅
**유도 미사일 시스템 완성 (GUIDED 무기)**
- 타겟 탐지 및 추적 시스템 구현
- 3가지 타겟팅 모드: NEAREST, LOCKED, SMART
- SMART 알고리즘: 거리 + 각도 가중치 기반 최적 타겟 선택
- 턴레이트 기반 점진적 회전 (0.01 rad/frame ≈ 0.57°)
- 타겟 업데이트 주기: 10 frames (성능 최적화)

**Trail System (잔상 효과)**
- 흰색 라인 기반 트레일 렌더링
- 설정: maxLength 36, fadeRate 0.03, initialAlpha 0.6
- Spacing 최적화: 3px 간격 기록 → 33% 연산 감소
- 라인 세그먼트 렌더링: 1px 두께 × 3px 길이 (spacing 간격 보완)
- 각도 저장: 미사일 방향과 일치하는 트레일 방향

**안전성 개선**
- Target body validation: body && body.position 이중 검증
- LOCKED mode 동작 명확화: 타겟 사망 시 재획득
- Defense in depth: updateProjectile + adjustVelocityTowardTarget

**성능 최적화**
- Trail spacing bug 수정: 첫 프레임 기록 처리
- Unused timeAlive 변수 제거 (300 ops/sec 절감)
- Math utility 추출: normalizeAngle() 함수 (코드 중복 제거)

**Weapon Port System 개선**
- equipWeapon() validation: 잘못된 무기 타입 방지
- Energy management consolidation: Tank.canFire(), Tank.consumeEnergy()
- Input.js 에너지 중복 체크 제거
- getFirePoints() 최적화: 조건부 변수 계산 (불필요한 연산 제거)

**BLASTER 무기 밸런스 조정**
- Secondary 미사일 수명 추가: lifetime 2.0초
- 이동 거리: ~240px (화면 지저분함 방지)
- DOS 원본 LIFETIME POLICY 준수

**기술적 세부사항:**
```javascript
// guidedSystem.js - SMART 타겟팅
findBestTarget(projectile, range) {
    const angleDiff = normalizeAngle(targetAngle - currentAngle);
    const score = dist + Math.abs(angleDiff) * 100;  // 거리 + 각도 가중치
    return bestTarget;
}

// Projectile.js - Trail spacing 최적화
updateTrail() {
    if (spacing > 0) {
        if (lastPos) {
            this.trailDistanceCounter += dist;
        } else {
            this.trailDistanceCounter = spacing;  // 첫 프레임 처리 (버그 수정)
        }
    }
    this.trail.positions.unshift({ x, y, angle, alpha });  // 각도 저장
}

// ProjectileRenderer.js - 라인 기반 트레일
updateTrail(sprite, trailPositions) {
    const x1 = pos.x - Math.cos(pos.angle) * halfLength;
    const y1 = pos.y - Math.sin(pos.angle) * halfLength;
    trailGraphics.lineStyle(lineWidth, colorHex, pos.alpha);
    trailGraphics.lineTo(x2, y2);  // 원 대신 라인 세그먼트
}

// utils/math.js - 각도 정규화 유틸리티
export function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}
```

**파일 변경:**
- 신규: `js/utils/math.js` (25 lines) - 각도 정규화 유틸리티
- 신규: `docs/GUIDED_SYSTEM.md` - 유도 시스템 설계 문서
- 수정: `js/systems/guidedSystem.js` - 안전성, normalizeAngle 적용
- 수정: `js/entities/Projectile.js` - Trail 시스템, spacing bug 수정, timeAlive 제거
- 수정: `js/core/ProjectileRenderer.js` - 라인 기반 트레일 렌더링
- 수정: `js/config/weapons.js` - GUIDED 설정, BLASTER lifetime
- 수정: `js/entities/Tank.js` - canFire(), consumeEnergy() 메서드 추가
- 수정: `js/systems/input.js` - 에너지 로직 통합, getFirePoints() 최적화
- 수정: `docs/WEAPON_PORT_SYSTEM.md` - 포트 시스템 개선사항 추가

**상세:** 유도 시스템 아키텍처 및 Trail 시스템 구현은 [docs/GUIDED_SYSTEM.md](./docs/GUIDED_SYSTEM.md) 참고

#### 11월 7일 - Two-Stage Weapon System 완성 ✅
**BLASTER 무기 구현 (PRIMARY/SECONDARY 시스템)**
- Two-stage lifecycle: PRIMARY (warhead) → TRIGGER (manual/auto) → SECONDARY (split missiles)
- BLASTER 무기: 360° CIRCLE 패턴, 12발 분열 미사일
- Pattern system: RADIAL (arc), CIRCLE (360°), SWIRL (rotating)
- Trigger types: MANUAL (fire key), AUTO (collision), BOTH

**렌더링 확장**
- CIRCLE render type: 원형 탄두 (3px diameter)
- SMALL_CIRCLE render type: 작은 원형 미사일 (2px diameter)
- 모든 무기 색상: 탱크 색상 자동 상속

**Tank 상태 관리**
- activePrimary: 현재 활성 PRIMARY 추적
- canFirePrimary: PRIMARY 발사 가능 여부
- 무기 전환시 상태 초기화

**충돌 시스템 확장**
- handleTwoStageCollision() 함수로 로직 통합
- Tank/Wall 충돌 모두 지원
- AUTO trigger: 충돌시 자동 분열
- Optional chaining (?.) 으로 null safety

**코드 품질 개선**
- 중복 코드 제거: 40줄 → 8줄 함수 호출
- 디버그 로그 정리 (production-ready)
- 상세 주석 추가 (collision logic paths)

**기술적 세부사항:**
```javascript
// projectileEffects.js - 패턴 시스템
export function triggerSecondary(primaryProjectile, weaponData, ...) {
    const pattern = secondaryConfig.pattern; // RADIAL/CIRCLE/SWIRL
    const spawnData = createPattern(pattern, pos, vel, count);
    // Create SECONDARY projectiles
}

// collision.js - Two-stage 로직
const shouldAutoTrigger =
    projectile.stage === 'PRIMARY' &&
    weaponData?.projectileType === 'TWO_STAGE' &&
    (weaponData?.triggerType === 'AUTO' || weaponData?.triggerType === 'BOTH');

// input.js - Fire state machine
if (tank.activePrimary) {
    triggerSecondary(tank.activePrimary, ...);  // MODE 2: Trigger
} else if (tank.canFirePrimary) {
    tank.activePrimary = firePrimaryProjectile(...);  // MODE 1: Fire
}
```

**파일 변경:**
- 신규: `js/systems/projectileEffects.js` (169 lines) - 패턴 시스템
- 신규: `docs/TWO_STAGE_WEAPON_SYSTEM.md` (1,400+ lines) - 완전한 설계 문서
- 수정: `js/systems/collision.js` - Two-stage 로직, 리팩토링
- 수정: `js/systems/input.js` - Fire state machine
- 수정: `js/entities/Tank.js` - Two-stage 상태 추가
- 수정: `js/entities/Projectile.js` - Stage 파라미터
- 수정: `js/core/ProjectileRenderer.js` - CIRCLE/SMALL_CIRCLE
- 수정: `js/config/weapons.js` - BLASTER 데이터

**상세:** TWO_STAGE_WEAPON_SYSTEM 설계 및 구현 차이점은 [docs/TWO_STAGE_WEAPON_SYSTEM.md](./docs/TWO_STAGE_WEAPON_SYSTEM.md) 참고

#### 11월 6일 - 무기 시스템 대규모 확장 ✅
**새 무기 구현**
- TRIPLE_MISSILE: 3발 동시 발사 (firePattern: 'ALL')
  - 중앙 + 좌우 3점 발사
  - 각 3 데미지 (총 9 데미지)
  - 속도: 2.8 px/frame (MISSILE 대비 1.4배)
- POWER_LASER: 듀얼 레이저 (firePattern: 'SIDES')
  - 좌우 2발 동시 발사
  - 각 6 데미지 (총 12 데미지)
  - 에너지 비용: 6 (단일 LASER와 동일, DOS 원본)

**Firing Pattern System**
- Fire point layout: CENTER (앞끝), LEFT/RIGHT (좌우 5px 뒤, ±6px 간격)
- Pattern types:
  - 'CENTER': 단발 (MISSILE, LASER, BLASTER)
  - 'SIDES': 좌우 2발 (DOUBLE_MISSILE, POWER_LASER)
  - 'ALL': 3발 (TRIPLE_MISSILE)
- getFirePoints() 함수로 발사 위치 계산

**Render Type System**
- 전략 패턴 적용: renderHandlers map
- SHORT_BEAM: 짧은 빔 (8px, missiles)
- LONG_BEAM: 긴 빔 (20px, lasers)
- 확장 용이: 새 타입 추가 = 핸들러 함수 1개

**무기별 물리 속성**
- isSensor 속성:
  - false: 물리 발사체 (약간 밀림, MISSILE)
  - true: 에너지 무기 (관통, LASER)
- density 설정:
  - 0.4: 일반 미사일 (적당한 충돌)
  - 0.00001: 레이저 (거의 무게 없음)
- 고속 발사체 + isSensor=false 문제 해결
  - LASER 18 px/frame: 깊은 관통 → 과도한 밀림
  - isSensor=true로 해결

**물리 안정성 개선**
- 회전 및 벽 충돌 동작 조정
- Sub-stepping 제거 (불필요)
- Matter.js 기본 설정으로 안정적 동작 확인

**파일 변경:**
- 수정: `js/config/weapons.js` - TRIPLE_MISSILE, POWER_LASER 추가
- 수정: `js/systems/input.js` - getFirePoints(), firing pattern 로직
- 수정: `js/core/Game.js` - fireProjectileFromTank() 다중 발사 지원
- 수정: `js/core/ProjectileRenderer.js` - 전략 패턴, SHORT/LONG_BEAM

#### 11월 1일 - 회피 시스템 리팩토링 및 코드 품질 개선 ✅
**회피 시스템 전면 재설계**
- 회피 로직 분리: StateMachine → EvasionController 전용 모듈 생성
- 회피 상태: NONE, RETREATING, COUNTERATTACKING
- 회피 시작 조건: 2명 이상 공격 OR 후방 공격(105°~180°)
- 회피 동작: 3초 후진 → 50px 이하 이동 시 반격(1회 시도)
- 회피 종료: 3초 경과 OR 공격자 없음 OR 반격 실패
- 중앙화된 종료 로직으로 무한 루프 버그 해결

**AI 발사 시스템 버그 수정**
- 문제: AI가 4-5발 연속 발사 (단발이어야 함)
- 원인: `lastFireTime` 설정이 setTimeout 내부에 있어 쿨다운 전 다중 발사
- 수정: `lastFireTime` 즉시 설정 → setTimeout은 지연만 담당
- 결과: 정확한 1초 간격 단발 사격 (medium 난이도)

**게임 밸런스 조정**
- 발사 속도: 2초 → 1초 (medium 난이도)
- LOS 안전 마진: 5px → 3px (근접 시 LOS 꺼짐 현상 해결)
- 후방 공격 범위: 150° 중심 → 105°~180° (양쪽 15° 제외한 150°)

**코드 품질 개선**
- console.log 정리: 24개 제거 (디버그 로그 → debugLog() 메서드만 유지)
- ACTIVE_WINDOW 중복 정의 문서화 (EvasionController, StateMachine)
- 향후 난이도별 차별화 계획 주석 추가

**기술적 세부사항:**
```javascript
// EvasionController.js (새 파일, 314 lines)
export class EvasionController {
    canStart(attackerCount, hasRearAttacker) {
        return attackerCount >= 2 || hasRearAttacker;
    }

    update() {
        // RETREATING: 3초 후진
        // COUNTERATTACKING: 벽 막힘 시 반격 (1회)
        // 종료: attackers 초기화
    }
}

// AIController.js - 발사 버그 수정
if (fire && this.canFire(currentTime)) {
    this.lastFireTime = currentTime;  // ✅ 즉시 설정
    setTimeout(() => {
        fireProjectile(this.tank);
    }, this.difficulty.reactionTime);
}
```

**파일 변경:**
- 신규: `js/systems/ai/EvasionController.js` (314 lines)
- 수정: `js/systems/ai/StateMachine.js` (457 lines)
- 수정: `js/systems/ai/AIController.js` (315 lines)
- 수정: `js/systems/ai/Perception.js` (LOS 마진 3px)

#### 11월 1일 - AI 시스템 대규모 리팩토링 ✅
**State Machine 단순화 (700줄 → 350줄)**
- 4-state (PATROL/CHASE/ATTACK/RETREAT) → 3-state (IDLE/PURSUE/ATTACK) 단순화
- PathState 서브스테이트 (NONE/FOLLOWING/COMPLETED) 완전 제거
- 경로 재생성 쿨다운: 500ms → 200ms (더 반응적)
- 웨이포인트 도달 거리: 50px → 30px (더 정밀)
- 조준 정확도: 0.1 rad (6°) → 0.05 rad (3°) 개선

**시야 시스템 재설계**
- 적 탐지 범위: 600px → Infinity (좌표는 항상 알 수 있음)
- LOS(Line of Sight) 분리: 추적은 좌표 기반, 공격은 LOS 필요
- LOS 안전 마진 추가: 5px (벽 모서리 충돌 방지)
- 벽 모서리 raycast 정밀 검사 (점-직선 거리 계산)

**Navmesh 개선**
- 삼각형 간격: 80px → 20px (더 정밀한 경로)
- 마진: 20px → 10px
- 양방향 벽-삼각형 교차 검사 (벽 꼭짓점 ↔ 삼각형 내부)
- 경계 포인트 균일 분포 (왜곡된 삼각형 제거)
- 과도한 안전거리 체크 제거 (45px 버퍼 삭제)

**디버그 시스템 구축**
- 중앙화된 DebugManager 싱글톤 생성 (`js/systems/DebugManager.js`)
- D 키 토글: Navmesh + LOS + Tank 중심점 시각화
- LOS 라인 시각화: 초록색 실선 (확보) / 빨간색 점선 (차단)
- 키보드 이벤트 충돌 해결 (input.js와 분리)

**코드 정리**
- 삭제된 파일 (4개):
  - `LegacyAI.js` - 구 AI 시스템
  - `SteeringBehavior.js` - Navmesh로 대체
  - `Pathfinding.js` - 그리드 기반 A* (Navmesh로 대체)
  - `TacticalPositioning.js` - 미사용 Phase 3 기능
- DIFFICULTY 설정 단순화 (visionRange, aimAccuracy 제거)

**기술적 세부사항:**
```javascript
// 단순화된 State Machine
AIState = { IDLE, PURSUE, ATTACK }

// LOS 안전 마진 (벽 모서리 감지)
const SAFE_MARGIN = 5; // 픽셀
// 점-직선 최단거리 = ||(P-A) - ((P-A)·n̂)n̂||

// 개선된 조준 시스템
aimThreshold = 0.05 rad; // ~3도
fire = (Math.abs(angleDiff) < aimThreshold);
```

**타겟 선택 시스템 개선:**
- 우선순위: 방향 가중치 거리 → LOS → 포신 정렬 → 랜덤
- 방향 가중치: 정면 0.7배, 측면 1.0배, 후면 1.5배
- 타겟 변경 쿨다운: 2초 (우왕좌왕 방지)
- 포신 정렬 점수: 0° = 1.0, 180° = 0.0
- 모듈화된 구조: 8개 헬퍼 함수로 분리

**상세**: AI 시스템 아키텍처 변경 및 Navmesh 개선 내역은 [AI_DEVELOPMENT_PLAN.md](./AI_DEVELOPMENT_PLAN.md), [docs/devlogs/ai-system.md](./docs/devlogs/ai-system.md) 참고

---

### 2025년 10월

#### 10월 30일 - Procedural Wall Generation 구현 ✅
**그리드 기반 랜덤 벽 생성 시스템**
- 60px 그리드 시스템 구축 (`js/config/grid.js`)
- Spatial Hash Grid로 O(n) 충돌 감지
- 가로/세로 직사각형 벽 (50% / 50%)
- 안전지역 시스템 (스폰 주변 4셀 보호)

**검증 시스템:**
- Flood Fill 연결성 체크
- 스폰 균형 검증
- 최소 장애물 개수 (60%)
- LOS 체크 비활성화 (FFA 특성 고려)

**3가지 난이도 프리셋:**
- Easy: 8개 벽, 110px 간격 (오픈 아레나)
- Medium: 15개 벽, 50px 간격 (균형)
- Hard: 25개 벽, 40px 간격 (미로)
- **핵심 컨셉**: 매 라운드마다 랜덤 난이도 선택

**파라미터 튜닝:**
- 벽 크기: 15-25px × 30-80px (가늘고 작게)
- 생성 시간: ~3ms (목표 100ms의 3%)

**L자 벽 시도 및 포기:**
- `Bodies.fromVertices()` → 5각형 변형
- 두 직사각형 → 시각적으로 깔끔하지 않음
- 결론: 가로/세로 직사각형만으로 충분

**상세**: [procedural-walls.md](./docs/devlogs/procedural-walls.md)

---

#### 10월 30일 - GitHub Pages 공개 배포 ✅
**프로토타입 공개**
- GitHub 저장소 생성: https://github.com/gogodevelop2/destruction-zone-web
- GitHub Pages 배포: https://gogodevelop2.github.io/destruction-zone-web/
- `gh-pages` 브랜치: 배포용 (index.html만)
- `matter-js-rewrite` 브랜치: 개발용 (전체 소스)

**배포 구조:**
- CDN 기반 (Matter.js, PixiJS)
- 단일 HTML 파일 배포
- 외부 테스트 가능

---

#### 10월 30일 - PixiJS 발사체 전환 완료 ✅
**4단계 마이그레이션 성공**
- Phase 1: PixiJS 추가 (A/B 테스트)
- Phase 2: BlurFilter 제거 결정 (성능 우선)
- Phase 3: Canvas 완전 제거
- Phase 4: ProjectileRenderer 객체로 렌더링/물리 분리

**성과:**
- ✅ 100-200개 발사체 동시 처리 준비
- ✅ Projectiles + Particles 렌더링 통합 (모두 PixiJS)
- ✅ 명확한 렌더링/물리 레이어 분리
- ✅ 리팩토링 준비 완료 (상세 주석 + 인터페이스)

**렌더링 레이어:**
```
Background (Canvas) → Walls (Canvas) → Projectiles (PixiJS) → Tanks (Canvas) → Particles (PixiJS)
```

**상세**: [rendering.md - PixiJS 발사체 마이그레이션](./docs/devlogs/rendering.md#pixijs-발사체-마이그레이션)

---

#### 10월 29일 - TRON 스타일 + visualMargin 구현 ✅
**네온 그래픽 시스템**
- Dark interior + Colored neon + White core (3-layer)
- lineJoin='round'로 miter spike 제거
- 탱크/벽 모두 TRON 스타일 적용

**visualMargin 시스템**
- 문제: stroke + shadowBlur가 Canvas 밖으로 나가 시각적으로 잘림
- 해결: 물리 경계를 3px 안쪽으로 (3, 3, 957, 717)
- 결과: 물리 정확도 유지 + 시각적 잘림 방지

**충돌 안정성 개선**
- positionIterations: 6 → 10
- velocityIterations: 4 → 8
- restitution: 0.0, chamfer: 2
- 결과: 탱크 진동(jitter) 감소

**상세**: [visual-design.md - TRON 스타일](./docs/devlogs/visual-design.md#tron-스타일-구현)

---

### 2025년 1월

#### 1월 27일 - Phase 1-2 프로토타입 완성 ✅
**Matter.js 중심 아키텍처 확립**
- 하이브리드 물리 방식 포기 (복잡도 문제)
- Matter.js를 Single Source of Truth로 사용
- 브랜치: `matter-js-rewrite`

**Phase 1 완성:**
- 단일 파일 프로토타입 (prototype.html)
- Tank 클래스 (Bodies.fromVertices)
- 회전/이동 제어
- 벽 충돌

**Phase 2 완성:**
- Projectile 클래스 (LASER/MISSILE)
- 충돌 필터링 (카테고리 시스템)
- 기본 AI (추적/회피)
- 6탱크 멀티플레이

**상세**: [architecture.md - Matter.js 중심 아키텍처](./docs/devlogs/architecture.md#matterjs-중심-아키텍처)

---

## 🎯 현재 상태

**완료:**
- ✅ Matter.js 물리 엔진 통합
- ✅ TRON 스타일 비주얼
- ✅ PixiJS 렌더링 마이그레이션
- ✅ 6탱크 멀티플레이 프로토타입
- ✅ 기본 AI 시스템

**진행 중:**
- 🔄 모듈 분리 리팩토링 준비
- 🔄 추가 무기 구현 계획

**다음 단계:**
- [ ] 모듈 구조로 리팩토링 (src/rendering/, src/entities/)
- [ ] 추가 무기 구현 (WEAPONS.md 기반, 34종 중 2종 구현됨)
- [ ] AI 개선 (전략적 행동)
- [ ] 사운드 시스템

---

## 💡 핵심 배운 점

### 아키텍처
- **물리 엔진 완전 신뢰**: 반쯤 신뢰하면 더 복잡해짐
- **단순함이 최고**: 하이브리드 < 순수 Matter.js
- **문서화 우선**: 복잡한 결정은 상세히 기록

### 렌더링
- **물리와 시각 분리**: 충돌 경계 ≠ 렌더링 경계
- **3px visualMargin**: 작은 마진이 큰 차이
- **BlurFilter는 무겁다**: 성능 우선 시 제거 고려

### 물리 엔진
- **단일 점 충돌 불안정**: Chamfer로 완화
- **Iterations 증가**: 정확도 vs 성능 trade-off
- **lineJoin='round'**: Miter spike 방지

### 개발 프로세스
- **Phase별 접근**: 한 번에 다 바꾸면 위험
- **A/B 테스트**: 안전한 마이그레이션
- **주석으로 보호**: 미래의 나를 위한 배려

---

## 📊 프로젝트 통계

**파일:**
- prototype.html: ~1900줄 (단일 파일 프로토타입)
- ARCHITECTURE.md: 상세 설계 문서
- WEAPONS.md: 34종 무기 명세

**구현 현황:**
- 무기: 2/34 (MISSILE, LASER)
- AI: 기본 추적/회피
- 탱크: 6대 동시 플레이
- 렌더링: 하이브리드 (Canvas + PixiJS)

**성능:**
- 6탱크 + 100-200 발사체 처리 가능
- 60 FPS 목표 (PixiJS 전환으로 달성)

---

## 📝 관련 문서

### 개발 문서
- [전체 히스토리](./docs/archive/devlog-original.md) - 시간순 상세 기록
- [변경 이력](./CHANGELOG.md) - 커밋 단위 요약

### 기술 문서
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 설계
- [WEAPONS.md](./WEAPONS.md) - 무기 시스템
- [PIXI_PROJECTILE_MIGRATION.md](./PIXI_PROJECTILE_MIGRATION.md) - PixiJS 마이그레이션

### 외부 참고
- [Matter.js Docs](https://brm.io/matter-js/docs/)
- [PixiJS Graphics API](https://pixijs.download/release/docs/PIXI.Graphics.html)
- [Canvas lineJoin](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin)
- [TRON Legacy VFX](https://www.artofvfx.com/tron-legacy/)
