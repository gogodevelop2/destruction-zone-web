# AI 시스템 개발 로그

> Destruction Zone AI 시스템 설계 및 구현 상세 기록

---

## 📋 목차

1. [개요](#개요)
2. [2025-11-01: AI 시스템 대규모 리팩토링](#2025-11-01-ai-시스템-대규모-리팩토링)
3. [2025-11-01: 타겟 선택 시스템 개선](#2025-11-01-타겟-선택-시스템-개선)
4. [기술적 세부사항](#기술적-세부사항)
5. [알려진 이슈](#알려진-이슈)
6. [다음 단계](#다음-단계)

---

## 개요

Destruction Zone의 AI 시스템은 **인간처럼 싸우는 탱크 AI**를 목표로 개발되었습니다.

### 핵심 설계 원칙
- **단순함 우선**: 복잡한 시스템보다 이해하기 쉬운 코드
- **물리 엔진 신뢰**: Matter.js를 Single Source of Truth로 사용
- **성능 중심**: 60 FPS 절대 유지, AI는 10 FPS 업데이트
- **점진적 개선**: MVP → 플레이 테스트 → 개선 반복

---

## 2025-11-01: AI 시스템 대규모 리팩토링

### 배경
기존 AI 시스템의 복잡도 문제와 Navmesh 경로탐색 오류(탱크가 벽에 충돌)로 인해 전체 시스템을 재검토하고 단순화하기로 결정.

### 주요 변경사항

#### 1. State Machine 단순화 (700줄 → 350줄)

**Before: 4-state + PathState 서브스테이트**
```javascript
// 기존 시스템 (복잡)
AIState = {
    PATROL: 'PATROL',   // 순찰 중
    CHASE: 'CHASE',     // 추적 중
    ATTACK: 'ATTACK',   // 공격 중
    RETREAT: 'RETREAT'  // 후퇴 중
}

PathState = {
    NONE: 'NONE',
    FOLLOWING: 'FOLLOWING',
    COMPLETED: 'COMPLETED'
}
```

**After: 3-state 단순화**
```javascript
// 새로운 시스템 (단순)
AIState = {
    IDLE: 'IDLE',       // 목표 없음 (적 탐색 중)
    PURSUE: 'PURSUE',   // 적 추적 중 (경로 따라가기)
    ATTACK: 'ATTACK'    // 공격 중 (사거리 내)
}
// PathState 완전 제거
```

**개선 효과:**
- ✅ 코드 라인 50% 감소 (700 → 350)
- ✅ 상태 전환 로직 명확화
- ✅ 디버깅 용이성 향상
- ✅ 유지보수 부담 감소

**파라미터 조정:**
```javascript
// 경로 재생성 쿨다운: 500ms → 200ms (더 반응적)
PATH_REGEN_COOLDOWN = 200;

// 웨이포인트 도달 거리: 50px → 30px (더 정밀)
WAYPOINT_REACH_DISTANCE = 30;

// 조준 정확도: 0.1 rad (6°) → 0.05 rad (3°)
const aimThreshold = 0.05;
```

---

#### 2. 시야 시스템 재설계

**핵심 개념 분리: 좌표 지식 vs LOS(Line of Sight)**

```javascript
// Before: 시야 범위 제한
detectEnemies(tank, allTanks, walls, maxRange = 600) {
    // 600px 이내 적만 감지
}

// After: 무제한 좌표 지식 + LOS 분리
detectEnemies(tank, allTanks, walls, maxRange = Infinity) {
    // 좌표는 항상 알 수 있음 (레이더 개념)
}

canSeeTarget(aiTank, target, walls) {
    // 공격 가능 여부는 LOS로 판단
    return this.hasLineOfSight(
        aiTank.body.position,
        target.body.position,
        walls
    );
}
```

**설계 철학:**
- 📍 **좌표**: 항상 알 수 있음 (경로 탐색 가능)
- 👁️ **LOS**: 공격 시에만 필요 (벽 뒤 적 공격 불가)
- 🧭 **전술**: 벽 뒤로 우회 공격 가능

**상태 전환 로직:**
```javascript
// IDLE → PURSUE: 적 발견 (LOS 불필요, 좌표만 있으면 됨)
if (closestEnemy && !this.hasTarget()) {
    return AIState.PURSUE;
}

// PURSUE → ATTACK: 사거리 내 + LOS 확보
if (distToTarget <= ATTACK_RANGE && perception.hasLOS) {
    return AIState.ATTACK;
}

// ATTACK → PURSUE: LOS 차단 (벽 뒤로 숨음)
if (!perception.hasLOS) {
    return AIState.PURSUE;  // 다시 추적
}
```

---

#### 3. LOS 안전 마진 시스템 (벽 모서리 충돌 방지)

**문제 인식:**
- 기존 LOS raycast는 직선이 벽 내부를 통과하는지만 체크
- 벽 모서리를 스치듯 지나가는 경우 감지 못함
- 결과: LOS 확보(초록선) 상태에서도 미사일이 모서리에 충돌

**해결 방법: 점-직선 최단거리 계산**

```javascript
hasLineOfSight(from, to, walls) {
    const SAFE_MARGIN = 5; // 안전 마진 (픽셀)

    // 1. 기본 raycast (직접 충돌 체크)
    const collisions = this.Matter.Query.ray(walls, from, to);
    if (collisions.length > 0) return false;

    // 2. 벽 꼭짓점 근접 체크 (새로 추가!)
    for (const wall of walls) {
        for (const vertex of wall.vertices) {
            // 벽 꼭짓점(P)에서 raycast 직선(AB)까지의 최단 거리
            const vx = vertex.x - from.x;
            const vy = vertex.y - from.y;

            // 정규화된 방향 벡터 n̂
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const lineLength = Math.sqrt(dx * dx + dy * dy);
            const ndx = dx / lineLength;
            const ndy = dy / lineLength;

            // 투영: projection = (P-A) · n̂
            const projection = vx * ndx + vy * ndy;

            // 투영점이 선분 밖이면 스킵
            if (projection < 0 || projection > lineLength) continue;

            // 투영점 좌표
            const projX = from.x + ndx * projection;
            const projY = from.y + ndy * projection;

            // 점-직선 최단거리 = ||P - 투영점||
            const distX = vertex.x - projX;
            const distY = vertex.y - projY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            // 안전 마진보다 가까우면 차단
            if (distance < SAFE_MARGIN) return false;
        }
    }

    return true;
}
```

**수학적 배경:**
```
점 P에서 직선 AB까지의 최단거리:
d = ||(P-A) - ((P-A)·n̂)n̂||

여기서:
- P: 벽 꼭짓점
- A: raycast 시작점 (from)
- B: raycast 끝점 (to)
- n̂: AB 방향의 정규화된 벡터
- (P-A)·n̂: 스칼라 투영 (projection)
```

**효과:**
- ✅ 벽 모서리 근처 통과 감지
- ✅ 5px 안전 마진으로 충돌 방지
- ⚠️ 완벽하지 않음 (조준 오차, 반응 지연 등 여전히 존재)

---

#### 4. Navmesh 개선

**삼각형 밀도 증가:**
```javascript
// Before: 80px 간격, 20px 마진
const spacing = 80;
const margin = 20;

// After: 20px 간격, 10px 마진
const spacing = 20;  // 4배 더 조밀
const margin = 10;
```

**효과:**
- 더 정밀한 경로
- 좁은 통로도 통과 가능
- 벽 회피 정확도 향상

**경계 포인트 균일 분포 (왜곡된 삼각형 제거):**

**Before: 4개 코너만**
```javascript
// 기존 (문제)
points.push([margin, margin]);                    // 좌상
points.push([this.mapWidth - margin, margin]);    // 우상
points.push([margin, this.mapHeight - margin]);   // 좌하
points.push([this.mapWidth - margin, this.mapHeight - margin]); // 우하
// → 경계에 큰 삼각형 생성, 왜곡 심함
```

**After: 경계를 따라 균일하게**
```javascript
// 개선 (균일)
// 위/아래 경계
for (let x = margin; x <= this.mapWidth - margin; x += spacing) {
    points.push([x, margin]);  // 위쪽
    points.push([x, this.mapHeight - margin]);  // 아래쪽
}

// 좌/우 경계 (중복 방지)
for (let y = margin + spacing; y < this.mapHeight - margin; y += spacing) {
    points.push([margin, y]);  // 왼쪽
    points.push([this.mapWidth - margin, y]);  // 오른쪽
}
// → 경계에도 균일한 작은 삼각형 생성
```

**양방향 벽-삼각형 교차 검사:**

```javascript
removeBlockedTriangles(triangles) {
    return triangles.filter(triangle => {
        // 1. 삼각형 중심이 벽 안에 있는지
        if (this.isPointInWall(triangle.center)) return false;

        // 2. 삼각형 꼭짓점이 벽 안에 있는지
        for (const vertex of triangle.vertices) {
            if (this.isPointInWall(vertex)) return false;
        }

        // 3. 벽 꼭짓점이 삼각형 안에 있는지 (양방향 체크!)
        for (const wall of this.walls) {
            for (const wallVertex of wall.vertices) {
                if (this.pointInTriangle(wallVertex, triangle.vertices)) {
                    return false;  // 벽이 삼각형을 관통
                }
            }
        }

        return true;  // 안전한 삼각형
    });
}
```

**제거된 과도한 체크:**
```javascript
// Before: 45px 안전거리 버퍼 (너무 많은 삼각형 제거)
const nearbyWalls = Matter.Query.region(
    this.walls,
    Matter.Bounds.create([
        { x: center.x - 45, y: center.y - 45 },
        { x: center.x + 45, y: center.y + 45 }
    ])
);
if (nearbyWalls.length > 0) return false;

// After: 제거 (정확한 교차 검사만 사용)
// → 벽과 닿지 않는 유효한 삼각형 보존
```

---

#### 5. 디버그 시스템 구축

**중앙화된 DebugManager 싱글톤 생성**

**문제:**
- 기존: input.js, Renderer.js에 각각 debug 토글 존재
- 키 이벤트 충돌 (D 키가 여러 곳에서 감지)
- 상태 동기화 실패

**해결:**
```javascript
// js/systems/DebugManager.js (NEW)
class DebugManager {
    constructor() {
        this.enabled = false;
        this.setupKeyboardShortcut();
    }

    setupKeyboardShortcut() {
        window.addEventListener('keydown', (e) => {
            // D 키만 감지 (한영키 등 modifier 제외)
            if ((e.key === 'd' || e.key === 'D') &&
                !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                this.toggle();
                e.preventDefault();
            }
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        console.log(`[Debug] Mode: ${this.enabled ? 'ON' : 'OFF'}`);

        if (this.enabled) {
            console.log('  ✅ Navmesh triangles');
            console.log('  ✅ LOS lines (green=clear, red=blocked)');
            console.log('  ✅ Tank centers');
        }
    }

    isEnabled() {
        return this.enabled;
    }
}

// 싱글톤 패턴
export const debugManager = new DebugManager();
```

**통합 지점:**

1. **main.js** - 초기화
```javascript
import { debugManager } from './systems/DebugManager.js';

async function main() {
    console.log('🔧 Debug Manager initialized (Press D to toggle)');
    // DebugManager는 import만으로 자동 초기화
}
```

2. **Renderer.js** - Navmesh + LOS 시각화
```javascript
import { debugManager } from '../systems/DebugManager.js';

render(game) {
    // Navmesh 삼각형 (빨간 와이어프레임)
    if (debugManager.isEnabled() && game.aiManager?.navmesh) {
        game.aiManager.navmesh.debugDraw(ctx);
    }

    // LOS 라인 (초록/빨강)
    if (debugManager.isEnabled()) {
        this.drawLOSLines(game);
    }
}

drawLOSLines(game) {
    controllers.forEach(controller => {
        const hasLOS = controller.perception.canSeeTarget(
            tank, target, walls
        );

        ctx.beginPath();
        ctx.moveTo(myPos.x, myPos.y);
        ctx.lineTo(targetPos.x, targetPos.y);

        if (hasLOS) {
            // LOS 확보 - 초록색 실선
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 2;
        } else {
            // LOS 차단 - 빨간색 점선
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    });
}
```

3. **Tank.js** - 탱크 중심점
```javascript
import { debugManager } from '../systems/DebugManager.js';

render(ctx) {
    // ... 탱크 렌더링 ...

    // 디버그: 물리 body 외곽선 + 중심점
    if (debugManager.isEnabled() && this.body.vertices) {
        // 초록색 외곽선
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        // ... vertices 그리기 ...

        // 빨간색 중심점
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
```

4. **input.js** - 중복 제거
```javascript
// Before: D 키 토글 존재 (충돌!)
if (keys['KeyD']) {
    // ... debug toggle ...
}

// After: 제거 (DebugManager로 통합)
// (삭제됨)
```

**효과:**
- ✅ 단일 진입점 (Single Source of Truth)
- ✅ 키 이벤트 충돌 해결
- ✅ 상태 동기화 완벽
- ✅ 한영키 문제 해결 (modifier 키 체크)

---

#### 6. 코드 정리

**삭제된 파일 (4개):**

1. **`js/systems/ai/LegacyAI.js`**
   - 구 AI 시스템 (StateMachine 이전)
   - 단순 추적 로직
   - 더 이상 사용 안 함

2. **`js/systems/ai/SteeringBehavior.js`**
   - Boid 기반 Steering Behavior
   - Navmesh 도입으로 불필요
   - 제거

3. **`js/systems/ai/Pathfinding.js`**
   - 그리드 기반 A* 경로탐색
   - Navmesh 삼각형 기반 A*로 대체
   - 제거

4. **`js/systems/ai/TacticalPositioning.js`**
   - Phase 3 전술적 포지셔닝 (엄폐, 측면 공격)
   - 아직 구현 안 됨, 미래 기능
   - 제거 (필요 시 재작성)

**DIFFICULTY 설정 단순화:**

```javascript
// Before: 복잡한 파라미터
export const DIFFICULTY = {
    easy: {
        reactionTime: 800,
        aimAccuracy: 0.35,      // 제거됨
        shotCooldown: 3500,
        visionRange: 300,       // 제거됨 (Infinity로)
        updateRate: 8
    }
}

// After: 핵심 파라미터만
export const DIFFICULTY = {
    easy: {
        reactionTime: 800,      // 반응 지연
        shotCooldown: 3500,     // 발사 쿨다운
        updateRate: 8           // AI 업데이트 주기 (FPS)
    },
    medium: {
        reactionTime: 400,
        shotCooldown: 2000,
        updateRate: 10
    },
    hard: {
        reactionTime: 150,
        shotCooldown: 1200,
        updateRate: 12
    }
}

// 제거된 이유:
// - aimAccuracy: 조준은 StateMachine의 aimThreshold로 통합
// - visionRange: 무제한 시야로 변경 (Infinity)
```

---

## 2025-11-01: 타겟 선택 시스템 개선

### 배경
초기 타겟 선택 로직은 단순히 거리만 고려하여, 6각형 배치에서 양 옆 적이 동일 거리일 때 배열 순서에 따라 결정되었고, 매 프레임 랜덤 변경으로 우왕좌왕하는 문제 발생.

### 문제점
1. **우왕좌왕 문제**: 거리가 같은 적들 사이에서 매 프레임 타겟 변경
2. **방향 무시**: 후면 적과 정면 적이 같은 우선순위
3. **조준 무시**: 포신 방향과 무관하게 타겟 선택

### 해결 방안

#### 1. 타겟 변경 쿨다운 (2초)

**문제:** 매 프레임 타겟 재평가로 인한 우왕좌왕

**해결:**
```javascript
// StateMachine.js
this.TARGET_CHANGE_COOLDOWN = 2000; // 2초
this.lastTargetChangeTime = 0;

// 타겟 변경 로직
const canChangeTarget = (now - this.lastTargetChangeTime) >= this.TARGET_CHANGE_COOLDOWN;

if (!this.stateData.target) {
    // 타겟 없으면 즉시 설정
    this.stateData.target = closestEnemy;
    this.lastTargetChangeTime = now;
}
else if (this.stateData.target !== closestEnemy && canChangeTarget) {
    // 2초 후에만 변경 가능
    this.stateData.target = closestEnemy;
    this.lastTargetChangeTime = now;
}

// 타겟이 죽으면 쿨다운 리셋
if (target.dead) {
    this.stateData.target = null;
    this.lastTargetChangeTime = 0;  // 즉시 새 타겟 선택 가능
}
```

**효과:**
- ✅ 최소 2초간 타겟 고정 (우왕좌왕 완전 차단)
- ✅ 타겟 사망 시 즉시 새 타겟 선택 가능
- ✅ 전술적 유연성 유지 (2초마다 재평가)

---

#### 2. 방향 가중치 시스템

**개념:** 탱크 정면의 적을 우선 선택

**구현:**
```javascript
// Perception.js - calculateDirectionWeight()
calculateDirectionWeight(aiTank, enemy) {
    const angleDiff = this.getAngleDifference(aiTank, enemy);

    // 정면(0°): 0.7배 (30% 가까워 보임)
    // 측면(90°): 1.0배 (그대로)
    // 후면(180°): 1.5배 (50% 멀어 보임)
    return 0.7 + (angleDiff / Math.PI) * 0.8;
}

// 가중치 적용 거리 계산
applyDirectionWeight(aiTank, enemies) {
    return enemies.map(e => {
        const weight = this.calculateDirectionWeight(aiTank, e.tank);
        return {
            tank: e.tank,
            distance: e.distance,
            weightedDistance: e.distance * weight  // 가중치 적용!
        };
    }).sort((a, b) => a.weightedDistance - b.weightedDistance);
}
```

**예시:**
```
실제 거리:
  - 정면 적: 300px → 가중치: 300 * 0.7 = 210px ✓ (우선 선택)
  - 측면 적: 300px → 가중치: 300 * 1.0 = 300px
  - 후면 적: 300px → 가중치: 300 * 1.5 = 450px
```

---

#### 3. 포신 정렬 시스템

**개념:** 이미 조준하고 있는 방향의 적 우선

**구현:**
```javascript
// Perception.js - calculateAimingScore()
calculateAimingScore(aiTank, enemy) {
    const angleDiff = this.getAngleDifference(aiTank, enemy);

    // 정면(0°) = 1.0 (완벽한 조준)
    // 후면(180°) = 0.0 (반대 방향)
    return 1.0 - (angleDiff / Math.PI);
}

// 포신 정렬 필터링
filterByAiming(aiTank, enemies) {
    const scored = enemies.map(e => ({
        tank: e.tank,
        score: this.calculateAimingScore(aiTank, e.tank)
    })).sort((a, b) => b.score - a.score);

    const bestScore = scored[0].score;
    // 최고 점수의 95% 이상만 선택 (5% 오차 허용)
    return scored.filter(e => e.score >= bestScore * 0.95);
}
```

---

#### 4. 통합 타겟 선택 로직

**우선순위:**
1. **방향 가중치 거리** (앞/뒤/옆 고려)
2. **LOS 여부** (같은 거리면 LOS 있는 적 우선)
3. **포신 정렬** (조준 용이성)
4. **랜덤** (모든 조건 동일 시)

**코드 구조:**
```javascript
// Perception.js - findClosestEnemy()
findClosestEnemy(aiTank, allTanks, walls, maxRange = Infinity) {
    const enemies = this.detectEnemies(aiTank, allTanks, maxRange);
    if (enemies.length === 0) return null;

    // 1순위: 방향 가중치 적용 거리
    const candidates = this.applyDirectionWeight(aiTank, enemies);
    const closest = this.filterByDistance(candidates);
    if (closest.length === 1) return closest[0].tank;

    // 2순위: LOS
    const withLOS = this.filterByLOS(aiTank, closest, walls);
    if (withLOS.length === 0) return closest[0].tank;
    if (withLOS.length === 1) return withLOS[0].tank;

    // 3순위: 포신 정렬
    const bestAimed = this.filterByAiming(aiTank, withLOS);
    if (bestAimed.length === 1) return bestAimed[0].tank;

    // 4순위: 랜덤
    const randomIndex = Math.floor(Math.random() * bestAimed.length);
    return bestAimed[randomIndex].tank;
}
```

**모듈화된 헬퍼 함수:**
- `applyDirectionWeight()` - 방향 가중치 적용
- `filterByDistance()` - 거리 필터링 (5px 오차)
- `filterByLOS()` - LOS 필터링
- `filterByAiming()` - 포신 정렬 필터링
- `calculateDirectionWeight()` - 가중치 계산
- `calculateAimingScore()` - 조준 점수 계산
- `getAngleDifference()` - 각도 차이 계산

---

### 시나리오 예시

**케이스 1: 방향 차이**
```
탱크1:
  - 적A: 300px, 정면(0°), LOS ✓
    → 가중거리: 210px
  - 적B: 250px, 후면(180°), LOS ✗
    → 가중거리: 375px

→ 결과: 적A 선택 (가중 거리 가장 가까움)
```

**케이스 2: LOS 차이**
```
탱크1:
  - 적A: 300px, 정면(0°), LOS ✓
  - 적C: 300px, 정면(5°), LOS ✗

→ 가중거리: 둘 다 ~210px (같음)
→ LOS: 적A만 있음
→ 결과: 적A 선택
```

**케이스 3: 포신 정렬 차이**
```
탱크1 (포신 0°):
  - 적A: 300px, 0°, LOS ✓
  - 적D: 300px, 10°, LOS ✓

→ 가중거리: 둘 다 210px
→ LOS: 둘 다 있음
→ 조준점수: 적A(1.0) > 적D(0.94)
→ 결과: 적A 선택
```

**케이스 4: 완전 동일**
```
탱크1:
  - 적A: 300px, 0°, LOS ✓
  - 적E: 300px, 0°, LOS ✓

→ 가중거리: 둘 다 210px
→ LOS: 둘 다 있음
→ 조준점수: 둘 다 1.0
→ 결과: 랜덤 선택 (50/50)
   → 2초간 고정 (우왕좌왕 방지)
```

---

### 튜닝 가이드

**방향 가중치 조정:**
```javascript
// 보수적 (방향 영향 적음)
return 0.8 + (angleDiff / Math.PI) * 0.4;
// 정면: 0.8배, 후면: 1.2배

// 균형 (현재 설정) ⭐
return 0.7 + (angleDiff / Math.PI) * 0.8;
// 정면: 0.7배, 후면: 1.5배

// 공격적 (방향 영향 큼)
return 0.5 + (angleDiff / Math.PI) * 1.0;
// 정면: 0.5배, 후면: 1.5배
```

**타겟 변경 쿨다운 조정:**
```javascript
// 짧음 (더 유연)
this.TARGET_CHANGE_COOLDOWN = 1000; // 1초

// 균형 (현재 설정) ⭐
this.TARGET_CHANGE_COOLDOWN = 2000; // 2초

// 길음 (더 고집)
this.TARGET_CHANGE_COOLDOWN = 3000; // 3초

// 완전 고정 (죽을 때까지)
this.TARGET_CHANGE_COOLDOWN = Infinity;
```

---

### 개선 효과

**Before:**
- ❌ 양 옆 적 사이에서 매 프레임 우왕좌왕
- ❌ 후면 적과 정면 적이 동일 우선순위
- ❌ 배열 순서에 따른 비결정적 선택

**After:**
- ✅ 2초 쿨다운으로 안정적 타겟 고정
- ✅ 정면 적 우선 (전투 효율 향상)
- ✅ 포신 방향 고려 (조준 시간 단축)
- ✅ 명확한 우선순위 (예측 가능한 AI)

---

## 기술적 세부사항

### State Machine Flow

```
┌────────────────────────────────────────┐
│ perceiveWorld() (10 FPS)               │
│ - detectEnemies(Infinity)              │
│ - findClosestEnemy()                   │
│ - canSeeTarget() → hasLOS              │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ checkTransitions()                     │
│ - 적 없음 → IDLE                        │
│ - 적 발견 → PURSUE                      │
│ - 사거리 내 + LOS → ATTACK              │
│ - LOS 차단 → PURSUE                     │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ execute()                              │
│                                        │
│ IDLE:                                  │
│   - rotation: 0.3 (천천히 회전)         │
│   - thrust: 0                          │
│   - fire: false                        │
│                                        │
│ PURSUE:                                │
│   - Navmesh.findPath(me, target)       │
│   - followPath(waypoints)              │
│   - rotation: toward waypoint          │
│   - thrust: 1                          │
│   - fire: false                        │
│                                        │
│ ATTACK:                                │
│   - angleDiff = angle(me → target)     │
│   - rotation: sign(angleDiff)          │
│   - thrust: 0 (정지 사격)                │
│   - fire: |angleDiff| < 0.05 rad       │
└────────────────────────────────────────┘
```

### LOS 체크 플로우

```
canSeeTarget(aiTank, target, walls)
    │
    ├─→ target alive? → NO → return false
    │
    └─→ hasLineOfSight(from, to, walls)
            │
            ├─→ 1. Query.ray(walls, from, to)
            │   └─→ collision? → YES → return false
            │
            ├─→ 2. 각 벽의 꼭짓점 순회
            │   │
            │   └─→ 점-직선 최단거리 계산
            │       │
            │       ├─→ projection ∉ [0, lineLength]
            │       │   └─→ continue (선분 밖)
            │       │
            │       └─→ distance < 5px?
            │           └─→ YES → return false
            │
            └─→ return true (LOS 확보)
```

### Navmesh 생성 플로우

```
generateNavmesh(walls)
    │
    ├─→ generateSamplePoints()
    │   │
    │   ├─→ 경계 포인트 (spacing: 20px)
    │   │   ├─→ 위/아래 경계
    │   │   └─→ 좌/우 경계
    │   │
    │   ├─→ 내부 그리드 (20px × 20px)
    │   │
    │   └─→ 랜덤 포인트 (20% 추가)
    │
    ├─→ Delaunator(points) → triangulation
    │
    ├─→ removeBlockedTriangles(triangles)
    │   │
    │   ├─→ 삼각형 중심 벽 내부? → 제거
    │   ├─→ 삼각형 꼭짓점 벽 내부? → 제거
    │   └─→ 벽 꼭짓점 삼각형 내부? → 제거
    │
    └─→ buildGraph(triangles)
        └─→ A* ready
```

---

## 알려진 이슈

### 1. 벽 모서리 미사일 충돌 ⚠️

**증상:**
- LOS가 확보된 상태(초록선)에서도 간헐적으로 미사일이 벽 모서리에 충돌

**원인 분석:**
1. **조준 오프셋**: LOS는 탱크 중심 기준, 실제 발사는 포신 끝에서
   ```javascript
   // LOS 체크: 탱크 중심
   hasLineOfSight(tank.body.position, target.body.position)

   // 실제 발사: 포신 끝 (+25px 앞)
   const barrelLength = size * 0.75 + 5;
   const spawnX = tank.position.x + Math.cos(angle) * barrelLength;
   ```

2. **반응 시간 지연**: LOS 체크와 실제 발사 사이 시간차
   ```javascript
   // 10 FPS AI 업데이트
   perceiveWorld() → hasLOS = true
   // ... 최대 100ms 경과 ...
   fire() → 실제 발사
   // → 이 사이에 탱크 이동, 각도 변화 가능
   ```

3. **조준 각도 허용 오차**: 3도 이내면 발사
   ```javascript
   const aimThreshold = 0.05; // ~3도
   if (Math.abs(angleDiff) < aimThreshold) {
       fire = true;
   }
   // → 3도 오차면 25px 거리에서 ~1.3px 오차
   ```

**완화 방법 (적용됨):**
- ✅ LOS 안전 마진 5px 추가
- ✅ 조준 정확도 향상 (6° → 3°)

**추가 개선안 (미적용):**
- 포신 끝 기준 LOS 체크
- 발사 직전 재확인
- 각도 허용 오차 축소 (3° → 1.5°)

**상태:** 식별됨, 부분 완화, 추가 개선 대기

---

### 2. RETREAT 상태 제거로 인한 전술성 감소 ⚠️

**증상:**
- AI가 체력이 낮아도 계속 공격
- 전술적 후퇴 없음

**원인:**
- State Machine 단순화 시 RETREAT 상태 제거

**개선안:**
- ATTACK 상태 내에서 체력 기반 행동 변경
  ```javascript
  executeAttack() {
      const lowHealth = this.tank.health < this.tank.maxHealth * 0.3;

      if (lowHealth) {
          // 소극적 공격: 거리 유지 + 엄폐 우선
          return {
              thrust: -0.5,  // 후진
              rotation: ...,
              fire: hasLOS && angleGood
          };
      }
  }
  ```

**상태:** 식별됨, 개선 대기

---

## 다음 단계

### 단기 (1-2주)
1. **벽 모서리 충돌 개선**
   - 포신 끝 기준 LOS 체크 구현
   - 발사 직전 재확인 로직 추가

2. **난이도 튜닝**
   - Easy/Medium/Hard 밸런스 조정
   - 플레이 테스트 기반 파라미터 최적화

3. **성능 최적화**
   - AI 업데이트 시간 분산 (staggered updates)
   - Spatial Grid 도입 (근접 쿼리 O(1))

### 중기 (1개월)
1. **Phase 2 완료: Multi-Agent 전투**
   - Utility-based 타겟 선택
   - Focus-fire 방지
   - AI vs AI 전투 개선

2. **디버그 도구 개선**
   - Navmesh 경로 시각화
   - State Machine 상태 표시
   - 성능 프로파일러 통합

### 장기 (2-3개월)
1. **Phase 3: 전술적 행동**
   - 예측 조준 (이동 중인 타겟)
   - 엄폐 시스템
   - 측면 공격 (Flanking)

2. **AI 타입 시스템 (DOS 원본 5종)**
   - Aggressive (돌격형)
   - Defensive (수비형)
   - Tactical (전술형)
   - Sniper (저격형)
   - Berserk (광전사형)

---

## 참고 문서

### 내부
- [AI_DEVELOPMENT_PLAN.md](../../AI_DEVELOPMENT_PLAN.md) - AI 개발 로드맵
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - 전체 시스템 아키텍처
- [docs/AI_TYPES.md](../AI_TYPES.md) - DOS 원본 AI 타입 명세

### 관련 파일
- `js/systems/ai/StateMachine.js` - 3-state FSM (350줄)
- `js/systems/ai/Perception.js` - 시야, LOS (5px 안전마진)
- `js/systems/ai/Navmesh.js` - 삼각형 기반 경로탐색
- `js/systems/DebugManager.js` - 중앙화된 디버그 시스템

---

**최종 업데이트**: 2025-11-01
