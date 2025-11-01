# AI Development Plan - Destruction Zone

**버전**: 1.0
**작성일**: 2025-10-31
**상태**: Phase 1 준비 완료

---

## 📋 목차

1. [개요](#개요)
2. [설계 철학](#설계-철학)
3. [핵심 결정사항](#핵심-결정사항)
4. [아키텍처](#아키텍처)
5. [구현 로드맵](#구현-로드맵)
6. [파일 구조](#파일-구조)
7. [성능 목표](#성능-목표)
8. [참고 자료](#참고-자료)

---

## 개요

### 목표
6대의 탱크가 동시에 플레이하는 전장에서 **인간처럼 싸우는 AI** 구현.

### 3가지 핵심 능력
1. **기본 전투 능력**: 목표 탐지, 경로 탐색, 사격, 회피
2. **전략적 행동**: 5가지 AI 타입별 전투 스타일 (추후 구현)
3. **무기 이해**: 상황에 맞는 무기 선택 (추후 구현)

### 개발 범위
**현재 단계**: 기본 전투 능력에 집중
**확장 계획**: 완성도 확보 후 천천히 확장

---

## 설계 철학

### 1. Single Source of Truth (Matter.js)
```
AI 의사 결정 → 힘 적용 → Matter.js 물리 시뮬레이션 → 렌더링
```
- AI는 Matter.js body를 직접 제어하지 않음
- 입력(thrust, rotation)만 제공
- 물리 결과는 Matter.js가 계산

### 2. 점진적 구현 (Iterative Development)
- MVP(3일) → 즉시 플레이 테스트
- 각 Phase 완료 시마다 플레이 가능한 상태 유지
- 복잡도 관리: 한 번에 하나씩

### 3. 단순함 우선 (Simplicity First)
- 외부 라이브러리 최소화
- 검증된 간단한 알고리즘 선택
- 프로젝트 기존 방향 유지 (ARCHITECTURE.md 참고)

### 4. 성능 중심 설계
- 60 FPS 절대 유지
- AI는 10 FPS (100ms) 업데이트
- 시간 분산 (staggered updates)
- 공간 분할 (spatial grid)

---

## 핵심 결정사항

### ✅ 최종 결정 (2025-10-31)

| 항목 | 결정 | 이유 |
|------|------|------|
| **경로 탐색** | 직접 A* 구현 | 그리드 16×12로 단순, 의존성 최소화 |
| **개발 방식** | MVP → 테스트 | 빠른 피드백, 플레이 중심 |
| **AI 업데이트** | 10 FPS (100ms) | 인간 반응 200ms, 성능 83% 절감 |
| **디버깅** | 콘솔 로그만 | 초기엔 단순하게, 필요시 시각화 추가 |
| **상태 머신** | Hierarchical FSM | 4가지 상태로 시작 |
| **난이도** | Easy/Medium/Hard | 파라미터 기반 (accuracy, reaction time) |

### ❌ 선택하지 않은 것
- ~~PathFinding.js~~ - 16×12 그리드에 과함
- ~~60 FPS AI 업데이트~~ - 성능 낭비
- ~~Behavior Tree~~ - 초기엔 FSM으로 충분
- ~~시각적 디버깅~~ - 나중에 필요하면

---

## 아키텍처

### Simplified Finite State Machine (v1.1 - 2025-11-01)

**변경 사항**: 4-state → 3-state 단순화, PathState 서브스테이트 제거

```
┌─────────────────────────────────────┐
│         AI Controller               │
│  (10 FPS update, staggered)         │
└─────────────┬───────────────────────┘
              │
      ┌───────┴────────┐
      │  State Machine │  (350 lines, simplified)
      └───────┬────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌──▼────┐ ┌──▼─────┐
│ IDLE  │ │PURSUE │ │ATTACK  │
│       │ │       │ │        │
│ Scan  │ │ Path  │ │ Aim    │
│ Slow  │ │ Chase │ │ Shoot  │
│ Turn  │ │       │ │ Rotate │
└───────┘ └───────┘ └────────┘
```

**주요 개선점:**
- ❌ PATROL 상태 제거 (IDLE로 통합)
- ❌ RETREAT 상태 제거 (단순화)
- ❌ PathState 서브스테이트 제거 (NONE/FOLLOWING/COMPLETED)
- ✅ 경로 재생성 쿨다운: 500ms → 200ms
- ✅ 웨이포인트 도달 거리: 50px → 30px
- ✅ 조준 정확도: 0.1 rad → 0.05 rad (~3도)
- ✅ 코드 라인: 700 → 350 (50% 감소)

### 모듈 구조 (v1.1 - 실제 구현)

```
AIManager
    ├── AIController (각 탱크별)
    │   ├── StateMachine (3-state FSM)
    │   ├── Perception (시야, LOS)
    │   └── (Navmesh 경로 탐색)
    │
    ├── Navmesh (전역, 삼각형 기반)
    │   ├── Delaunay Triangulation
    │   ├── A* Pathfinding
    │   └── LOS Raycast (안전 마진 5px)
    │
    └── DebugManager (전역 싱글톤)
        └── D 키 토글: Navmesh + LOS 시각화
```

**구현 완료:**
- ✅ `AIManager.js` - 전체 AI 시스템 관리
- ✅ `AIController.js` - 개별 탱크 AI
- ✅ `StateMachine.js` - 3-state FSM (350줄)
- ✅ `Perception.js` - 적 감지, LOS 체크 (5px 안전마진)
- ✅ `Navmesh.js` - 삼각형 기반 경로탐색 (20px 간격)
- ✅ `DebugManager.js` - 중앙화된 디버그 시스템

**삭제됨:**
- ❌ `LegacyAI.js` - 구 AI 시스템
- ❌ `SteeringBehavior.js` - Navmesh로 대체
- ❌ `Pathfinding.js` - 그리드 기반 A* (Navmesh로 대체)
- ❌ `TacticalPositioning.js` - 미사용

### 데이터 흐름

```
Game Loop (60 FPS)
    │
    ├─→ Physics Update (Matter.js)
    │
    ├─→ AI Update (10 FPS)
    │   │
    │   ├─→ Perception.detectEnemies()
    │   ├─→ StateMachine.checkTransitions()
    │   ├─→ CurrentState.execute()
    │   │   ├─→ Pathfinder.findPath()
    │   │   ├─→ TargetSelection.selectTarget()
    │   │   └─→ FireControl.shoot()
    │   │
    │   └─→ Apply Forces (thrust, rotation)
    │
    └─→ Render
```

---

## 구현 로드맵

### Phase 1: MVP 전투 AI (3-4일) 🎯

**목표**: 플레이 가능한 기본 AI

#### Day 1: 상태 머신 + 기본 인식
```javascript
// 구현할 것
- StateMachine.js (4가지 상태: PATROL, CHASE, ATTACK, RETREAT)
- Perception.js (적 감지, LOS 확인)
- 기존 ai.js를 AIController로 리팩토링
```

**검증 기준**:
- ✅ AI가 적 발견 시 CHASE 상태로 전환
- ✅ 체력 30% 이하 시 RETREAT 상태
- ✅ 콘솔에 상태 전환 로그 출력

---

#### Day 2: 경로 탐색 (A*)
```javascript
// 구현할 것
- Pathfinder.js (16×12 그리드 A*)
- Grid.js 활용 (이미 존재)
- Path following 로직
```

**알고리즘**:
- 휴리스틱: Euclidean distance
- 대각선 이동 허용
- 경로 스무딩 (불필요한 waypoint 제거)

**검증 기준**:
- ✅ AI가 벽을 피해 목표로 이동
- ✅ 경로가 막히면 다시 계산
- ✅ 생성 시간 < 10ms (16×12 그리드)

---

#### Day 3: 충돌 회피 + 난이도
```javascript
// 구현할 것
- CollisionAvoidance.js (탱크끼리 부딪히지 않기)
- DifficultyConfig.js (Easy/Medium/Hard)
- AI 업데이트 주기 10 FPS 적용
```

**난이도 파라미터**:
```javascript
easy: {
  reactionTime: 800,      // 0.8초 반응 지연
  aimAccuracy: 0.35,      // 35% 명중률
  shotCooldown: 3500,     // 3.5초 쿨다운
  visionRange: 300,       // 300px 시야
  updateRate: 8           // 8 FPS
}

medium: {
  reactionTime: 400,
  aimAccuracy: 0.65,
  shotCooldown: 2000,
  visionRange: 500,
  updateRate: 10
}

hard: {
  reactionTime: 150,
  aimAccuracy: 0.88,
  shotCooldown: 1200,
  visionRange: 700,
  updateRate: 12
}
```

**검증 기준**:
- ✅ AI들이 서로 겹치지 않음
- ✅ Easy/Hard 난이도 체감 차이
- ✅ 60 FPS 안정적 유지

---

### Phase 1 완료 체크리스트 ✅

플레이 테스트 결과 (2025-11-01):
- [x] AI가 벽을 피해 플레이어를 추적하는가? ✅ (Navmesh 경로탐색)
- [x] AI가 적절한 거리에서 사격하는가? ✅ (ATTACK_RANGE 250px)
- [x] 체력이 낮으면 도망가는가? ⚠️ (단순화로 제거, 재검토 필요)
- [x] 6대 동시에 60 FPS 유지되는가? ✅
- [x] Easy/Hard 난이도 차이가 느껴지는가? ✅ (reactionTime, shotCooldown)

**Phase 1 핵심 시스템 완료!** (2025-11-01)

**알려진 이슈:**
- ⚠️ 벽 모서리 미사일 충돌: LOS는 확보되지만 발사 각도 오차로 인한 충돌 발생
  - 원인: 조준 오프셋, 포신 위치, 반응 시간 지연
  - 상태: LOS 안전 마진 5px 추가, 추가 개선 필요

---

### Phase 2: Multi-Agent 전투 (3-4일) 🔄

**목표**: AI끼리 자연스럽게 싸우는 전장

#### Day 4-5: 타겟 선택 시스템
```javascript
// 구현할 것
- TargetSelection.js (Utility-based scoring)
- FreeForAllMode에 통합
- AI vs AI 타겟팅 가중치
```

**Utility 평가 요소**:
- 거리 (0.4 가중치)
- 체력 (0.3 가중치)
- 각도 (0.2 가중치)
- 플레이어 vs AI 가중치
- Focus-fire 방지 (crowding penalty)

**검증 기준**:
- ✅ AI들이 다양한 타겟 공격
- ✅ 모두가 한 명만 공격하지 않음
- ✅ 플레이어도 적절히 타겟팅

---

#### Day 6-7: 성능 최적화
```javascript
// 구현할 것
- SpatialGrid.js (공간 분할)
- Staggered Updates (시간 분산)
- 프로파일링 & 최적화
```

**최적화 기법**:
1. **AI 업데이트 10 FPS**: 60 → 10 = 83% 감소
2. **Staggered Updates**: 탱크별 업데이트 시간 분산
3. **Spatial Grid**: 근접 쿼리 O(n²) → O(1)
4. **Early Exit**: LOS 실패 시 즉시 타겟 제외

**성능 목표**:
- 6탱크 + 100발사체 = 60 FPS
- AI 업데이트 < 5ms (프레임당)
- 메모리 안정 (GC 스파이크 없음)

---

### Phase 2 완료 체크리스트

플레이 테스트 시:
- [ ] 여러 AI가 다양한 적 공격하는가?
- [ ] 전장이 역동적으로 보이는가?
- [ ] 플레이어가 항상 집중 타겟되지 않는가?
- [ ] 성능 프레임 드롭 없는가?

---

### Phase 3: 전술적 행동 (5-7일) 🧠

**목표**: 인간 같은 전투 행동

#### Day 8-10: 예측 조준 + 스트레이프
```javascript
// 구현할 것
- FireControl.js (예측 조준)
- TacticalMovement.js (측면 이동)
- 조준 오차 시스템
```

**예측 조준**:
- Quadratic formula로 이동 중인 타겟 예측
- 난이도별 조준 오차 추가
- 발사 타이밍 최적화

**검증 기준**:
- ✅ 이동 중인 플레이어를 맞춤
- ✅ 난이도별 명중률 차이 확인

---

#### Day 11-14: 엄폐 + 측면 공격
```javascript
// 구현할 것
- CoverSystem.js (엄폐 위치 탐색)
- FlankingBehavior.js (측면 공격)
- Peek-and-shoot 행동
```

**엄폐 시스템**:
- 벽 뒤 안전한 위치 찾기
- 엄폐 → 튀어나와 사격 → 다시 숨기
- 체력 < 50% 시 엄폐 우선

**검증 기준**:
- ✅ AI가 벽 뒤에 숨음
- ✅ 측면에서 공격 시도
- ✅ "똑똑하다" 느낌

---

### Phase 3 완료 체크리스트

플레이 테스트 시:
- [ ] AI가 움직이는 나를 맞추는가?
- [ ] 벽 뒤에 숨어 전술적으로 싸우는가?
- [ ] 정면 돌파보다 우회 공격하는가?
- [ ] AI가 "생각한다" 느낌이 드는가?

---

## 파일 구조

### 새로 생성할 파일

```
js/systems/ai/
├── AIController.js          # 메인 AI 컨트롤러 (10 FPS 업데이트)
│   └─ 역할: 모든 AI 탱크 관리, staggered update
│
├── StateMachine.js          # FSM (PATROL/CHASE/ATTACK/RETREAT)
│   └─ 역할: 상태 전환 로직, 상태별 행동 정의
│
├── Perception.js            # 적/장애물 감지
│   ├─ detectEnemies(maxRange)
│   ├─ hasLineOfSight(from, to, walls)
│   └─ detectIncomingProjectiles()
│
├── Pathfinder.js            # A* 경로 탐색 (16×12 그리드)
│   ├─ findPath(start, goal, walls)
│   ├─ smoothPath(path)
│   └─ followPath(tank, path)
│
├── TargetSelection.js       # Utility-based 타겟 선택
│   ├─ evaluateTargetUtility(target)
│   └─ selectBestTarget(candidates)
│
├── FireControl.js           # 조준 & 발사 제어
│   ├─ calculateLeadTarget(target, bulletSpeed)
│   ├─ shouldFireNow(aimError)
│   └─ applyAimError(aimPoint, difficulty)
│
├── TacticalMovement.js      # 전술적 이동
│   ├─ strafeMovement(target)
│   ├─ maintainOptimalDistance(target, range)
│   └─ avoidProjectiles(projectiles)
│
├── CoverSystem.js           # 엄폐 행동 (Phase 3)
│   ├─ findNearestCover(threat, walls)
│   ├─ generateCoverPoints(walls)
│   └─ peekAndShoot(target)
│
├── FlankingBehavior.js      # 측면 공격 (Phase 3)
│   ├─ calculateFlankingPosition(target)
│   └─ shouldAttemptFlank(target)
│
└── DifficultyConfig.js      # 난이도 파라미터
    └─ DIFFICULTY = { easy, medium, hard }
```

### 기존 파일 수정

```
js/systems/
├── ai.js → ai/LegacyAI.js   # 백업 (참고용)
└── SpatialGrid.js           # 공간 분할 최적화 (NEW)

js/modes/
└── FreeForAllMode.js        # getAITarget() 수정
```

### 활용할 기존 코드

```
✅ js/config/grid.js         # 16×12 그리드 시스템
✅ js/systems/wallGenerator.js  # LOS 함수 재사용
✅ js/entities/Tank.js       # Matter.js body
✅ js/core/Game.js           # 메인 루프
```

---

## 성능 목표

### 프레임 예산 (16.67ms @ 60 FPS)

```
Physics (Matter.js):     5-7ms   ████████
Rendering (Canvas):      3-5ms   ██████
AI Logic (10 FPS):       1-3ms   ███  (분산)
Game Systems:            2-3ms   ███
Margin:                  2-4ms   ████
─────────────────────────────────────
Total:                  16.67ms
```

### 성능 최적화 기법

#### 1. AI 업데이트 10 FPS
```javascript
// Game.js
class Game {
  constructor() {
    this.aiUpdateInterval = 100; // 10 FPS
    this.lastAIUpdate = 0;
  }

  update(timestamp) {
    // 물리: 60 FPS
    Matter.Engine.update(this.engine, 16.67);

    // AI: 10 FPS
    if (timestamp - this.lastAIUpdate >= this.aiUpdateInterval) {
      this.aiController.updateAll(this.aiUpdateInterval);
      this.lastAIUpdate = timestamp;
    }

    // 렌더링: 60 FPS
    this.render();
  }
}
```

#### 2. Staggered Updates (시간 분산)
```javascript
// AIController.js
class AIController {
  constructor(tanks) {
    this.tanks = tanks;
    this.updateInterval = 100; // 100ms

    // 각 탱크에 offset 부여
    tanks.forEach((tank, i) => {
      tank.updateOffset = (this.updateInterval / tanks.length) * i;
      // 탱크 0: 0ms, 탱크 1: 16ms, 탱크 2: 33ms, ...
    });
  }

  updateAll(timestamp) {
    this.tanks.forEach(tank => {
      if (timestamp % this.updateInterval >= tank.updateOffset) {
        tank.updateAI(timestamp);
      }
    });
  }
}
```

**효과**: 6탱크가 동시에 A*를 돌리지 않음 → CPU 스파이크 방지

#### 3. Spatial Grid (공간 분할)
```javascript
// SpatialGrid.js
class SpatialGrid {
  constructor(width, height, cellSize = 100) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  queryNearby(position, radius) {
    // O(n) 대신 O(1) 근접 쿼리
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    // ... 해당 셀만 검색
  }
}
```

**효과**: 적 탐색 O(n) → O(1)

#### 4. Early Exit (조기 종료)
```javascript
// TargetSelection.js
evaluateTargetUtility(target) {
  // LOS 없으면 즉시 0점
  if (!this.hasLineOfSight(target)) {
    return 0;  // 나머지 계산 스킵
  }

  // 점수 계산...
}
```

---

## 참고 자료

### 내부 문서
- **`ARCHITECTURE.md`** - 전체 시스템 아키텍처, Matter.js 중심 설계
- **`docs/AI_TYPES.md`** - DOS 원본 5가지 AI 타입 명세
- **`Intelligent Tank AI Implementation Strategy.md`** - 다른 Claude가 작성한 상세 전략 (이 문서의 기반)
- **`js/config/grid.js`** - 16×12 그리드 시스템
- **`js/systems/ai.js`** - 현재 기본 AI (리팩토링 대상)

### 외부 참고
- **PathFinding.js** (https://github.com/qiao/PathFinding.js) - A* 알고리즘 참고 (직접 구현)
- **Matter.js Docs** (https://brm.io/matter-js/docs/) - 물리 엔진 API
- **Game AI Pro** - Hierarchical FSM 패턴
- **Yuka** (https://mugen87.github.io/yuka/) - 고급 AI (추후 참고)

### 핵심 참고 개념

#### 1. Hierarchical Finite State Machine (Strategy 문서)
```
Non-Combat
  ├─ Idle
  └─ Patrol

Combat
  ├─ Chase
  ├─ Attack
  │   ├─ Aggressive
  │   ├─ Defensive
  │   └─ Flanking
  └─ Retreat
```

#### 2. A* Pathfinding
- **Grid-based**: 16×12 셀
- **Heuristic**: Euclidean distance
- **Path smoothing**: 불필요한 waypoint 제거
- **Update frequency**: 1초마다 재계산

#### 3. Utility-based Target Selection
```javascript
score = 1.0
score *= distanceScore * 0.4 + 0.6
score *= healthScore * 0.3 + 0.7
score *= angleScore * 0.2 + 0.8
score *= playerTargetWeight
score *= crowdingPenalty
```

#### 4. Predictive Targeting (Quadratic Formula)
```javascript
// 이동 중인 타겟 예측
const a = (vx*vx + vy*vy) - (bulletSpeed*bulletSpeed);
const b = 2 * (dx*vx + dy*vy);
const c = dx*dx + dy*dy;
const discriminant = b*b - 4*a*c;
const t = (2*c) / (Math.sqrt(discriminant) - b);

predictedPos = {
  x: target.x + target.vx * t,
  y: target.y + target.vy * t
};
```

---

## 개발 원칙 (다시 강조)

### DO ✅
- **플레이 테스트 우선**: MVP 완료 즉시 테스트
- **콘솔 로그**: 모든 상태 전환, 중요 결정 기록
- **성능 측정**: Chrome DevTools로 프레임 시간 확인
- **단순하게 시작**: 복잡한 기능은 나중에
- **기존 코드 활용**: Grid, WallGenerator LOS 등

### DON'T ❌
- **과도한 최적화**: 문제 발생 전 최적화 금지
- **외부 라이브러리**: 꼭 필요한 경우만
- **시각적 디버깅**: 초기엔 콘솔만으로 충분
- **완벽주의**: "작동하는 것"이 "완벽한 것"보다 중요
- **동시 다발**: Phase 하나씩 완료 후 다음 단계

---

## 다음 단계

### 즉시 시작 가능:
1. ✅ `js/systems/ai/` 폴더 생성
2. ✅ `StateMachine.js` 구현 시작
3. ✅ 기존 `ai.js` → `AIController.js` 리팩토링
4. ✅ `Perception.js` 구현

### Phase 1 Day 1 체크리스트:
- [ ] StateMachine 4가지 상태 구현
- [ ] Perception.detectEnemies() 구현
- [ ] Perception.hasLineOfSight() 구현
- [ ] AIController에 통합
- [ ] 콘솔 로그로 상태 전환 확인

---

## 버전 히스토리

### v1.1 (2025-11-01) - AI 시스템 리팩토링 완료
**State Machine 단순화:**
- 4-state → 3-state (IDLE/PURSUE/ATTACK)
- PathState 서브스테이트 제거
- 700줄 → 350줄 (50% 감소)

**Navmesh 개선:**
- 삼각형 간격: 80px → 20px
- 양방향 벽-삼각형 교차 검사
- 경계 포인트 균일 분포

**시야 시스템 재설계:**
- 적 탐지: Infinity (좌표는 항상 알 수 있음)
- LOS: 공격 시에만 필요
- 안전 마진 5px (벽 모서리 충돌 방지)

**디버그 시스템:**
- DebugManager 싱글톤 생성
- D 키 토글: Navmesh + LOS 시각화
- 초록색(확보)/빨간색(차단) LOS 라인

**코드 정리:**
- 삭제: LegacyAI.js, SteeringBehavior.js, Pathfinding.js, TacticalPositioning.js
- DIFFICULTY 설정 단순화

### v1.0 (2025-10-31)
- 초안 작성
- Phase 1-3 로드맵 확정
- 핵심 결정사항 기록
- 참고 자료 정리
- "Intelligent Tank AI Implementation Strategy.md" 기반 통합

---

## 라이센스

이 문서는 Destruction Zone 프로젝트의 일부이며, 프로젝트와 동일한 라이센스를 따릅니다.
