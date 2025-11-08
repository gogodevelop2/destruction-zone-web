# Guided Missile System Design

**Date:** 2025-11-08
**Purpose:** 유도 미사일 시스템 설계 및 구현 문서

---

## 1. 시스템 개요

### 1.1 목적

Destruction Zone의 유도 미사일 시스템은 DOS 원본의 GUIDED 무기를 웹 기반으로 재구현한 것입니다. 타겟 탐지, 선택, 추적 기능을 제공하며 성능과 안정성을 고려한 최적화가 적용되어 있습니다.

### 1.2 핵심 기능

- **타겟 탐지**: 범위 내 적 탱크 감지
- **타겟 선택**: 3가지 알고리즘 (NEAREST, LOCKED, SMART)
- **속도 조정**: 턴레이트 기반 점진적 회전
- **Trail 효과**: 흰색 라인 기반 잔상 렌더링

---

## 2. 아키텍처

### 2.1 컴포넌트 구조

```
GuidedSystem (js/systems/guidedSystem.js)
├── updateProjectile()      - 매 프레임 유도 로직 실행
├── findTarget()            - 타겟 선택 (모드별 분기)
│   ├── findNearestEnemy()  - NEAREST: 가장 가까운 적
│   ├── findBestTarget()    - SMART: 거리 + 각도 최적화
│   └── LOCKED logic        - 현재 타겟 유지 또는 재획득
└── adjustVelocityTowardTarget() - 속도 벡터 조정

Projectile (js/entities/Projectile.js)
├── isGuided                - 유도 미사일 여부
├── guidedConfig            - 설정 (turnRate, targetType, etc.)
├── currentTarget           - 현재 추적 중인 타겟
├── targetUpdateCounter     - 타겟 업데이트 카운터
└── Trail System
    ├── hasTrail            - 트레일 활성화 여부
    ├── trailConfig         - 트레일 설정
    └── trail.positions[]   - 트레일 위치 데이터

ProjectileRenderer (js/core/ProjectileRenderer.js)
└── updateTrail()           - 트레일 PixiJS 렌더링
```

### 2.2 데이터 흐름

```
1. Game.js update()
   ↓
2. guidedSystem.updateProjectile(projectile, deltaTime)
   ↓
3. targetUpdateCounter 증가
   ↓
4. updateInterval 도달 시 findTarget() 호출
   ↓
5. currentTarget 설정
   ↓
6. adjustVelocityTowardTarget()
   ↓
7. Matter.Body.setVelocity() - 새 속도 적용
   ↓
8. Projectile.update() - 물리 body 위치 동기화
   ↓
9. Trail 업데이트 및 렌더링
```

---

## 3. 타겟 선택 알고리즘

### 3.1 NEAREST (가장 가까운 적)

가장 단순한 알고리즘. 현재 위치에서 가장 가까운 적을 선택합니다.

```javascript
findNearestEnemy(projectile, range) {
    let minDist = range;
    for (const tank of this.game.tanks) {
        if (!tank.alive || tank.id === ownerId) continue;

        const dist = Math.hypot(
            tankPos.x - myPos.x,
            tankPos.y - myPos.y
        );

        if (dist < minDist) {
            minDist = dist;
            nearest = tank;
        }
    }
    return nearest;
}
```

**장점**: 빠르고 예측 가능
**단점**: 진행 방향 고려하지 않음 (급격한 방향 전환 가능)

---

### 3.2 SMART (거리 + 각도 최적화)

현재 GUIDED 무기에 사용되는 알고리즘. 거리와 각도를 모두 고려합니다.

```javascript
findBestTarget(projectile, range) {
    const currentAngle = Math.atan2(myVel.y, myVel.x);
    let bestScore = Infinity;

    for (const tank of this.game.tanks) {
        if (!tank.alive || tank.id === ownerId) continue;
        if (dist > range) continue;

        // 타겟 방향 각도
        const targetAngle = Math.atan2(
            tankPos.y - myPos.y,
            tankPos.x - myPos.x
        );

        // 각도 차이 정규화 (-π ~ π)
        const angleDiff = normalizeAngle(targetAngle - currentAngle);

        // 점수 계산: 거리 + 각도 가중치
        const angleWeight = 100;
        const score = dist + Math.abs(angleDiff) * angleWeight;

        if (score < bestScore) {
            bestScore = score;
            bestTarget = tank;
        }
    }
    return bestTarget;
}
```

**점수 공식:**
```
score = distance + |angleDiff| × angleWeight
```

- `distance`: 타겟까지 거리 (px)
- `angleDiff`: 현재 진행 방향과 타겟 방향의 각도 차이 (-π ~ π)
- `angleWeight`: 100 (각도 1 radian ≈ 거리 100px와 동등)

**예시:**
- 타겟 A: 거리 150px, 각도 차이 0° → 점수 = 150
- 타겟 B: 거리 100px, 각도 차이 90° (π/2) → 점수 = 100 + 1.57 × 100 ≈ 257
- **결과**: 타겟 A 선택 (정면의 먼 타겟 > 측면의 가까운 타겟)

**장점**: 자연스러운 추적, 급격한 방향 전환 방지
**단점**: NEAREST보다 약간 느림 (각도 계산)

---

### 3.3 LOCKED (지속 추적)

현재 타겟을 유지하며, 타겟이 사망 시 재획득합니다.

```javascript
case 'LOCKED':
    if (projectile.currentTarget && projectile.currentTarget.alive) {
        return projectile.currentTarget;
    }
    // Re-acquire new target if current target is dead
    return this.findNearestEnemy(projectile, config.detectionRange);
```

**동작:**
1. 현재 타겟이 살아있으면 계속 추적
2. 타겟이 죽으면 가장 가까운 적 재획득
3. 재획득 실패 시 null (추적 중단)

**참고:** "진정한 락온" (타겟 사망 시 추적 중단)이 필요하면:
```javascript
return projectile.currentTarget?.alive ? projectile.currentTarget : null;
```

---

## 4. 속도 조정 (Velocity Adjustment)

### 4.1 턴레이트 시스템

유도 미사일은 즉시 방향을 바꾸지 않고, `turnRate`에 따라 점진적으로 회전합니다.

```javascript
adjustVelocityTowardTarget(projectile, config) {
    // STEP 1: 각도 계산
    const targetAngle = Math.atan2(dy, dx);
    const currentAngle = Math.atan2(myVel.y, myVel.x);

    // STEP 2: 각도 차이 정규화
    const angleDiff = normalizeAngle(targetAngle - currentAngle);

    // STEP 3: 회전 속도 적용
    const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate);
    const newAngle = currentAngle + turn;

    // STEP 4: 속도 벡터 조정 (속력 유지)
    const speed = Math.sqrt(myVel.x * myVel.x + myVel.y * myVel.y);
    const newVel = {
        x: Math.cos(newAngle) * speed,
        y: Math.sin(newAngle) * speed
    };

    projectile.Matter.Body.setVelocity(projectile.body, newVel);
}
```

### 4.2 회전 방향 결정

각도 차이를 -π ~ π 범위로 정규화하여 최단 회전 방향을 결정합니다.

```javascript
// 예시: 현재 0°, 타겟 350°
angleDiff = 350° - 0° = 350° (6.11 rad)
// 정규화 후
angleDiff = 350° - 360° = -10° (-0.17 rad)
// 결과: 우회전 10° (시계 방향)
```

**회전 방향:**
- `angleDiff > 0`: 좌회전 (반시계)
- `angleDiff < 0`: 우회전 (시계)
- `angleDiff = 0`: 정면 (회전 불필요)

### 4.3 GUIDED 무기 설정

```javascript
GUIDED: {
    guidedConfig: {
        turnRate: 0.01,        // 0.01 rad/frame ≈ 0.57° (60fps 기준)
        targetType: 'SMART',   // SMART 타겟팅
        detectionRange: 100,   // 100px 탐지 범위
        updateInterval: 10     // 10 frames마다 타겟 업데이트
    }
}
```

**턴레이트 계산:**
- `0.01 rad/frame × 60 fps = 0.6 rad/sec ≈ 34°/sec`
- 180° 회전 시간: `π / 0.01 ≈ 314 frames ≈ 5.2초`

---

## 5. Trail System (잔상 효과)

### 5.1 Trail 구조

유도 미사일은 흰색 라인 기반 잔상을 남깁니다.

```javascript
// Projectile.js - Trail 데이터 구조
this.trail = {
    positions: [],           // Array of {x, y, angle, alpha}
    maxLength: 36,           // 최대 36개 점
    fadeRate: 0.03,          // 프레임당 alpha 감소 (0.03)
    spacing: 3               // 3px마다 기록
};
```

### 5.2 Spacing 최적화

매 프레임 기록하는 대신, 3px 이동마다 기록하여 연산량 33% 감소.

```javascript
updateTrail() {
    if (spacing > 0) {
        const lastPos = this.trail.positions[0];
        if (lastPos) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.trailDistanceCounter += dist;
        } else {
            // 첫 프레임: 무조건 기록
            this.trailDistanceCounter = spacing;
        }

        if (this.trailDistanceCounter < spacing) {
            return;  // 거리 미달, 기록 안 함
        }
        this.trailDistanceCounter = 0;
    }

    // 현재 위치 + 각도 기록
    this.trail.positions.unshift({ x, y, angle, alpha: 0.6 });

    // 길이 제한
    if (this.trail.positions.length > maxLength) {
        this.trail.positions.pop();
    }

    // 페이드 아웃
    for (let i = 1; i < this.trail.positions.length; i++) {
        this.trail.positions[i].alpha -= fadeRate;
    }
}
```

### 5.3 라인 세그먼트 렌더링

원형 점 대신 짧은 라인 세그먼트를 사용하여 spacing 간격을 자연스럽게 채웁니다.

```javascript
// ProjectileRenderer.js
updateTrail(sprite, trailPositions) {
    const lineWidth = 1;    // 1px 두께
    const lineLength = 3;   // 3px 길이

    for (const pos of trailPositions) {
        if (pos.alpha <= 0.01) continue;

        // 라인 양 끝점 계산 (미사일 방향과 일치)
        const halfLength = lineLength / 2;
        const x1 = pos.x - Math.cos(pos.angle) * halfLength;
        const y1 = pos.y - Math.sin(pos.angle) * halfLength;
        const x2 = pos.x + Math.cos(pos.angle) * halfLength;
        const y2 = pos.y + Math.sin(pos.angle) * halfLength;

        // 라인 세그먼트 그리기 (페이드 아웃 적용)
        trailGraphics.lineStyle(lineWidth, 0xffffff, pos.alpha);
        trailGraphics.moveTo(x1, y1);
        trailGraphics.lineTo(x2, y2);
    }
}
```

**원형 vs 라인 비교:**
- **원형 (구 방식)**: 2px 직경, spacing 3px → 1px 간격 발생
- **라인 (현재)**: 3px 길이, spacing 3px → 완전히 연결됨

### 5.4 성능 분석

**Spacing 없이 (매 프레임 기록):**
- 60 fps × 5 guided missiles = 300 기록/초
- maxLength 36 × 5 missiles = 180 trail points
- GPU: 180 drawLine calls/frame

**Spacing 3px (3px마다 기록):**
- ~100 기록/초 (33% 감소, 미사일 속도 2.8 px/frame 기준)
- maxLength 36 × 5 missiles = 180 trail points (동일)
- GPU: 동일 (기록 빈도는 감소, 렌더링 개수는 maxLength로 제한)

**Trade-off:**
- CPU: -33% (기록 빈도 감소)
- GPU: 동일 (maxLength 제한)
- 시각적 품질: 라인 세그먼트로 간격 보완 (차이 없음)

---

## 6. 안전성 및 버그 수정

### 6.1 Target Body Validation

타겟 탱크가 파괴되면 Matter.js body가 world에서 제거되지만, 레퍼런스는 남아있어 `body.position` 접근 시 에러 발생 가능.

**해결책: 이중 검증 (Defense in Depth)**

```javascript
// guidedSystem.js - updateProjectile()
if (projectile.currentTarget &&
    projectile.currentTarget.alive &&
    projectile.currentTarget.body &&          // Body 존재 확인
    projectile.currentTarget.body.position) { // Position 존재 확인
    this.adjustVelocityTowardTarget(projectile, config);
}

// adjustVelocityTowardTarget() - 추가 안전 검사
adjustVelocityTowardTarget(projectile, config) {
    const target = projectile.currentTarget;
    if (!target || !target.alive || !target.body || !target.body.position) {
        return;  // 조기 반환
    }
    // ... 속도 조정 로직
}
```

### 6.2 Trail Spacing 버그 수정

**문제:**
- spacing > 0일 때, 첫 프레임에서 `this.trail.positions[0]`가 undefined
- `if (lastPos)` 없이 `dx = pos.x - lastPos.x` 접근 → NaN 발생
- trailDistanceCounter가 0으로 유지 → spacing 조건 통과 못 함 → 트레일 안 보임

**수정:**
```javascript
if (lastPos) {
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.trailDistanceCounter += dist;
} else {
    // 첫 프레임: 무조건 spacing만큼 설정하여 기록 보장
    this.trailDistanceCounter = spacing;
}
```

### 6.3 LOCKED Mode 동작 명확화

LOCKED 모드는 "진정한 락온"이 아니라 "지속 추적 + 재획득" 방식입니다.

```javascript
case 'LOCKED':
    // LOCKED mode: Maintains current target, re-acquires if target dies
    // Behavior clarified 2025-11-08:
    // - Keeps tracking same target while alive (persistent tracking)
    // - Finds new target if current target is destroyed (re-acquisition)
    // - This is NOT a "true lock" that stops guidance on target death
    //
    // For true lock behavior (stop guidance when target dies), use:
    //   return projectile.currentTarget?.alive ? projectile.currentTarget : null;
    if (projectile.currentTarget && projectile.currentTarget.alive) {
        return projectile.currentTarget;
    }
    // Re-acquire new target if current target is dead or missing
    return this.findNearestEnemy(projectile, config.detectionRange);
```

---

## 7. 코드 품질 개선

### 7.1 Unused Variable 제거

**제거된 변수: `timeAlive`**

```javascript
// 이전 (Projectile.js)
this.timeAlive = 0;

if (this.isGuided && this.active) {
    this.timeAlive += deltaTime;
    // TODO: Phase 1-2에서 guidedSystem 연동 예정
}

// 현재 (제거됨)
// === GUIDED BEHAVIOR ===
// Guided logic is handled by guidedSystem.js (integrated in Game.js)
// No projectile-level logic needed here
```

**이유:**
- `timeAlive`는 업데이트만 되고 사용처 없음 (dead code)
- guidedSystem.js에서 이미 완전히 처리됨
- 불필요한 연산 제거 (5 missiles × 60 fps = 300 ops/sec)

### 7.2 Math Utility 추출

**중복 코드 제거:**

```javascript
// 이전: guidedSystem.js 2곳에서 중복
let angleDiff = targetAngle - currentAngle;
while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

// 현재: utils/math.js 유틸리티 함수
export function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

// 사용
const angleDiff = normalizeAngle(targetAngle - currentAngle);
```

**장점:**
- 코드 중복 제거 (DRY 원칙)
- 재사용 가능 (다른 시스템에서도 사용 가능)
- 유지보수성 향상 (1곳만 수정)

---

## 8. Weapon Port System 개선

유도 미사일 개발과 함께 무기 포트 시스템도 개선되었습니다.

### 8.1 equipWeapon() Validation

```javascript
// Tank.js
equipWeapon(portNumber, weaponType, WEAPON_DATA) {
    // Port validation
    if (portNumber < 1 || portNumber > 7) {
        console.error(`Invalid port number: ${portNumber}`);
        return false;
    }

    // Weapon type validation (신규 추가)
    if (!WEAPON_DATA[weaponType]) {
        console.error(`Cannot equip unknown weapon: ${weaponType}`);
        return false;
    }

    this.weaponPorts[portNumber] = weaponType;
    this.selectPort(portNumber, WEAPON_DATA);
    return true;
}
```

### 8.2 Energy Management Consolidation

**이전: 에너지 체크 중복**
```javascript
// Tank.js - 체크 로직 없음
// input.js - 직접 에너지 체크
if (tank.weaponEnergy >= weaponData.energyCost) {
    tank.weaponEnergy -= weaponData.energyCost;
    // ...
}
```

**현재: Tank 메서드로 통합**
```javascript
// Tank.js - 중앙화된 에너지 관리
canFire(weaponData) {
    return this.weaponEnergy >= weaponData.energyCost;
}

consumeEnergy(weaponData) {
    if (!this.canFire(weaponData)) {
        console.log(`Not enough energy!`);
        return false;
    }
    this.weaponEnergy -= weaponData.energyCost;
    return true;
}

// input.js - 간결한 호출
if (!tank.consumeEnergy(weaponData)) {
    return;  // Not enough energy
}
```

### 8.3 getFirePoints() Optimization

**이전: 모든 변수 미리 계산**
```javascript
function getFirePoints(tank, firePattern) {
    const centerDistance = size * 0.75 + 5;
    const perpAngle = tankAngle + Math.PI / 2;
    const sideDistance = size * 0.75;
    const sideSpacing = 6;

    if (firePattern === 'CENTER') {
        // centerDistance만 사용
    }
    // ...
}
```

**현재: 조건부 변수 계산**
```javascript
function getFirePoints(tank, firePattern) {
    const points = [];

    if (firePattern === 'CENTER' || firePattern === 'ALL') {
        const centerDistance = size * 0.75 + 5;  // CENTER일 때만 계산
        points.push({ x, y });
    }

    if (firePattern === 'SIDES' || firePattern === 'ALL') {
        const perpAngle = tankAngle + Math.PI / 2;  // SIDES일 때만 계산
        const sideDistance = size * 0.75;
        const sideSpacing = 6;
        points.push({ x: leftX, y: leftY });
        points.push({ x: rightX, y: rightY });
    }

    return points;
}
```

**성능 개선:**
- CENTER pattern: 5개 연산 → 1개 (80% 감소)
- SIDES pattern: 5개 → 4개 (20% 감소)
- ALL pattern: 5개 → 5개 (동일)

---

## 9. 설정 튜닝 히스토리

### 9.1 GUIDED 설정 변경 과정

| 단계 | turnRate | targetType | detectionRange | updateInterval |
|------|----------|------------|----------------|----------------|
| **초기** | 0.05 | NEAREST | 300 | 3 |
| **1차 조정** | 0.02 | NEAREST | 300 | 5 |
| **2차 조정** | 0.01 | NEAREST | 300 | 10 |
| **최종** | 0.01 | SMART | 100 | 10 |

**변경 이유:**
- **turnRate**: 0.05 → 0.01 (과도한 기동성 감소)
- **targetType**: NEAREST → SMART (각도 고려, 자연스러운 추적)
- **detectionRange**: 300 → 100 (탐지 범위 감소, 밸런스)
- **updateInterval**: 3 → 10 (타겟 변경 빈도 감소, 성능)

### 9.2 Trail 설정 변경 과정

| 단계 | maxLength | fadeRate | spacing | 설명 |
|------|-----------|----------|---------|------|
| **1단계** | 8 | 0.12 | 0 | 기본 짧은 트레일 |
| **2단계** | 16 | 0.06 | 0 | 2배 길게 |
| **3단계** | 48 | 0.02 | 0 | 3배 더 길게 |
| **4단계** | 72 | 0.015 | 3 | Spacing 추가 (성능) |
| **최종** | 36 | 0.03 | 3 | 길이 절반 (밸런스) |

**Spacing 도입 이유:**
- 매 프레임 기록 → CPU 부하 (300 ops/sec)
- 3px 간격 기록 → 33% 연산 감소
- 라인 세그먼트 렌더링으로 시각적 품질 유지

---

## 10. 향후 확장 계획

### 10.1 추가 유도 무기

**PORT 2: Blasters**
- GUIDE BLASTER: 유도 PRIMARY (warhead guides to target)
- BLAST GUIDER: 유도 SECONDARY (split missiles guide to targets)

**PORT 4: Special Front Fire**
- QUINT GUIDER: 5발 유도 분열 미사일
- SPARK FIENDS: 절대 빗나가지 않는 유도 (turnRate 높음)

### 10.2 성능 최적화

- **Spatial partitioning**: 타겟 탐지를 그리드 기반으로 (O(n) → O(1))
- **Trail pooling**: Trail graphics 재사용 (GC 압력 감소)
- **LOD system**: 화면 밖 트레일 렌더링 스킵

### 10.3 AI 통합

- AI가 유도 미사일 회피 (궤적 예측)
- AI의 유도 미사일 사용 전략
- 유도 미사일 간섭 시스템 (PORT 6: CONFUSOR)

---

## 11. 참고 자료

### 11.1 관련 문서
- [WEAPON_PORT_SYSTEM.md](./WEAPON_PORT_SYSTEM.md) - 포트 시스템 설계
- [TWO_STAGE_WEAPON_SYSTEM.md](./TWO_STAGE_WEAPON_SYSTEM.md) - 2단계 무기 시스템
- [RENDER_SYSTEM.md](./RENDER_SYSTEM.md) - 렌더링 시스템

### 11.2 핵심 파일
- `js/systems/guidedSystem.js` - 유도 로직 (250 lines)
- `js/entities/Projectile.js` - Trail 시스템 (262 lines)
- `js/core/ProjectileRenderer.js` - Trail 렌더링 (320 lines)
- `js/config/weapons.js` - GUIDED 설정 (370 lines)
- `js/utils/math.js` - 각도 정규화 유틸리티 (25 lines)

### 11.3 개발 로그
- [DEVLOG.md](../DEVLOG.md) - 2025-11-08 개발 내역
- [CHANGELOG.md](../CHANGELOG.md) - 2025-11-08 변경 이력

---

**Last Updated:** 2025-11-08
**Version:** 1.0
