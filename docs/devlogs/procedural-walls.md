# Procedural Wall Generation - 개발 로그

## 📅 2025년 10월 30일

---

## 목차
1. [그리드 시스템 구축](#1-그리드-시스템-구축)
2. [안전지역 시스템](#2-안전지역-시스템)
3. [랜덤 벽 생성 알고리즘](#3-랜덤-벽-생성-알고리즘)
4. [검증 시스템](#4-검증-시스템)
5. [파라미터 튜닝](#5-파라미터-튜닝)
6. [L자 벽 시도와 포기](#6-l자-벽-시도와-포기)

---

## 1. 그리드 시스템 구축

### 배경
- 탱크 배치와 벽 배치에 일관된 좌표 시스템 필요
- 배경 그리드(60px)와 동일한 간격 사용 결정

### 구현
**파일**: `js/config/grid.js`

```javascript
export const GRID_SIZE = 60;
export const GRID_COLS = 16;  // 960 / 60
export const GRID_ROWS = 12;  // 720 / 60

export const Grid = {
    toWorldX(col),
    toWorldY(row),
    toGridCol(worldX),
    toGridRow(worldY),
    isValid(col, row),
    getSafeZoneCells(spawnX, spawnY),
    isInSafeZone(col, row, spawnPoints)
};
```

**핵심 기능:**
- 그리드 ↔ 월드 좌표 변환
- 경계 검사
- 안전지역 계산

---

## 2. 안전지역 시스템

### 문제: 스폰 근처 벽 생성 방지
각 스폰 포인트 주변에 벽이 생기면 안 됨.

### 해결: 거리 기반 셀 선택

**초기 시도 (실패):**
```javascript
// 단순히 중심 셀 기준 2x2 영역
const centerCol = toGridCol(spawnX);
const centerRow = toGridRow(spawnY);
// → 스폰이 셀 경계에 있을 때 문제 발생
```

**최종 해결:**
```javascript
getSafeZoneCells(spawnX, spawnY) {
    // 1. 주변 3x3 영역의 모든 셀 확인
    const candidates = [];
    for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
            const col = centerCol + dc;
            const row = centerRow + dr;

            // 2. 스폰에서 셀 중심까지 거리 계산
            const distance = Math.sqrt(
                (spawnX - cellCenterX)² +
                (spawnY - cellCenterY)²
            );
            candidates.push({ col, row, distance });
        }
    }

    // 3. 가장 가까운 4개 셀 선택
    return candidates.sort((a, b) => a.distance - b.distance).slice(0, 4);
}
```

**결과:**
- ✅ 모든 스폰 위치에서 정확히 4개 셀 보호
- ✅ 스폰이 셀 경계에 있어도 작동
- ✅ FFA 6개 스폰 = 24개 셀 보호

---

## 3. 랜덤 벽 생성 알고리즘

### 기존 방식 (Prototype)
```javascript
// 5x4 그리드, 각 셀 40% 확률
// 문제: 60px 그리드와 맞지 않음
```

### 새로운 방식: Rectangular Obstacle Placement

**참고 문서**: `Procedural Wall Generation.md` (다른 Claude 작성)

#### 핵심 개념

**1. Spatial Hash Grid (O(n) 충돌 감지)**
```javascript
class SpatialHashGrid {
    // 화면을 60px 셀로 나눔
    // 새 벽이 특정 셀과 겹치면
    // 그 셀 주변 셀만 체크 → 빠름!
}
```

**2. 랜덤 크기 직사각형**
```javascript
// 초기 (실패): 모두 세로 벽
minSize: { width: 15, height: 30 }
maxSize: { width: 25, height: 80 }
// → width < height 항상 참

// 수정 (성공): 가로/세로 50% 확률
if (rng() < 0.5) {
    // 세로 벽: 15-25 × 30-80
} else {
    // 가로 벽: 30-80 × 15-25 (swap)
}
```

**3. 제약 조건**
- 안전지역 회피 (240×240)
- 최소 간격 (25px → 50px로 조정)
- 경계 여백 (80px → 40px로 조정)

---

## 4. 검증 시스템

### 검증 항목

#### A. 최소 장애물 개수
```javascript
if (obstacles.length < obstacleCount * 0.6) {
    return false;  // 60% 미만이면 재생성
}
```
**조정 이력**: 70% → 60%

#### B. 연결성 체크 (Flood Fill)
```javascript
// 20px 그리드로 단순화
const grid = Array(36).fill(null).map(() => Array(48).fill(true));

// 벽 셀 표시
obstacles.forEach(wall => {
    // 해당 그리드 셀을 false로
});

// BFS로 모든 스폰이 연결되었는지 확인
```

**왜 20px?**
- 960×720을 픽셀 단위로 체크하면 691,200 셀
- 20px 단순화하면 1,728 셀 (400배 빠름)

#### C. 스폰 균형 체크
```javascript
// 중심까지 거리가 비슷한지 확인
const maxDiff = Math.max(...distances) - Math.min(...distances);
return maxDiff < width * 0.15;  // 15% 이내
```

#### D. LOS 체크 (비활성화)
```javascript
// 초기: 모든 스폰 간 시야 체크 (15개 조합)
// → 너무 까다로워서 실패 많음

// 시도: 인접 스폰만 체크 (6개 조합)
const adjacentPairs = [
    [0, 1], [1, 2], [2, 3],
    [3, 4], [4, 5], [5, 0]
];
// → 여전히 실패 많음 (벽이 작고 가늘어서)

// 최종: LOS 체크 비활성화
// 이유: FFA에서 spawn camping보다 빠른 전투가 중요
```

---

## 5. 파라미터 튜닝

### Medium 난이도 (FFA 기준)

#### 벽 크기
```javascript
// 초기: 너무 큼 (그리드보다 큼)
minSize: { width: 50, height: 60 }
maxSize: { width: 120, height: 140 }

// 문제: "벽의 평균 크기가 얼마라고 생각하는거야?
//       지금 너무 큰데? 그리드와 같은 폭이잖아."

// 최종: 작고 가늘게
minSize: { width: 15, height: 30 }
maxSize: { width: 25, height: 80 }
// → 평균 20px × 55px (그리드 60px보다 작음)
```

#### 벽 간격
```javascript
// 초기
minSpacing: 25px  // 탱크(30px)가 거의 못 지나감

// 문제: "최소 50으로 해서 다시 보자"

// 최종
minSpacing: 50px  // 탱크 + 여유공간 충분
```

#### 경계 여백
```javascript
// 초기
edgePadding: 80px  // 벽과 경계 사이 간격

// 문제: "현재 벽이 생성되는 영역이 외곽 벽하고는 거리가 있는 것 같은데"

// 최종
edgePadding: 40px  // 경계 가까이 생성
```

#### 벽 개수
```javascript
obstacleCount: 15개  // Medium 난이도
// Easy: 8개
// Hard: 25개
```

### 최종 파라미터
```javascript
medium: {
    obstacleCount: 15,
    minSize: { width: 15, height: 30 },
    maxSize: { width: 25, height: 80 },
    edgePadding: 40,
    minSpacing: 50,
    coverageTarget: 0.25,
    cellSize: 60
}
```

---

## 6. L자 벽 시도와 포기

### 시도 1: Bodies.fromVertices()
```javascript
const vertices = [
    { x: 0, y: 0 },
    { x: armLength, y: 0 },
    { x: armLength, y: thickness },
    { x: thickness, y: thickness },
    { x: thickness, y: armLength },
    { x: 0, y: armLength }
];

const body = Bodies.fromVertices(centerX, centerY, [vertices]);
```

**문제**: 5각형으로 렌더링됨
- Matter.js가 vertices를 자동으로 중심점 기준 재계산
- Renderer.js의 `drawWalls()`가 vertices를 직선으로 연결

### 시도 2: 두 개의 직사각형
```javascript
// L자 = 가로 막대 + 세로 막대
const horizontal = Bodies.rectangle(...);
const vertical = Bodies.rectangle(...);

bodies.push(horizontal, vertical);
```

**문제**: "직사각형 2개가 붙은 모습은 깔끔하지가 않다"
- 코너 부분이 겹쳐서 렌더링 이상
- TRON 스타일 glow 효과가 겹쳐서 부자연스러움

### 결론: L자 포기
**이유:**
1. `fromVertices()`는 5각형으로 변형됨
2. 두 직사각형은 시각적으로 깔끔하지 않음
3. 가로/세로 벽만으로도 충분한 전략성 제공

**최종 결정**: 50% 가로 / 50% 세로 직사각형만 사용

---

## 7. 난이도 프리셋 테스트 및 튜닝

### 3가지 난이도 구현

#### Easy (8개 벽)
```javascript
easy: {
    obstacleCount: 8,
    minSize: { width: 15, height: 40 },
    maxSize: { width: 25, height: 100 },
    edgePadding: 60,
    minSpacing: 110,
    coverageTarget: 0.15,
    cellSize: 80
}
```
**특징**: 오픈 아레나, 빠른 전투

#### Medium (15개 벽)
```javascript
medium: {
    obstacleCount: 15,
    minSize: { width: 15, height: 30 },
    maxSize: { width: 25, height: 80 },
    edgePadding: 40,
    minSpacing: 50,
    coverageTarget: 0.25,
    cellSize: 60
}
```
**특징**: 균형잡힌 전술 플레이

#### Hard (25개 벽)
```javascript
hard: {
    obstacleCount: 25,
    minSize: { width: 12, height: 25 },
    maxSize: { width: 20, height: 60 },
    edgePadding: 40,
    minSpacing: 40,
    coverageTarget: 0.35,
    cellSize: 50
}
```
**특징**: 미로 같은 복잡한 맵

### 핵심 컨셉: 랜덤 난이도

**구현:**
```javascript
// Game.js - createObstacleWalls()
const difficulties = ['easy', 'medium', 'hard'];
const randomDifficulty = difficulties[Math.floor(Math.random() * 3)];

console.log(`🎲 Random Difficulty: ${randomDifficulty.toUpperCase()}`);

const wallGenerator = new WallGenerator(this.Matter, {
    difficulty: randomDifficulty,  // 매 게임마다 랜덤
    seed: Date.now()
});
```

**게임 컨셉:**
- 매 라운드마다 난이도가 랜덤으로 변경
- Easy / Medium / Hard 중 하나 선택
- 예측 불가능한 맵 = 더 높은 리플레이 가치
- 플레이어는 적응력 필요

---

## 📊 성과

### 생성 성능
```
✅ Wall generation complete: 15 walls in 3.00ms (attempt 1)
```
- 목표: <100ms
- 실제: ~3ms (목표의 3%)
- 첫 시도에 검증 통과

### 검증 통과율
- 초기 (모든 LOS 체크): ~5%
- 인접 LOS만 체크: ~30%
- LOS 비활성화: ~95%

### 게임플레이
- ✅ 안전지역 보호 (스폰 근처 벽 없음)
- ✅ 가로/세로 다양성
- ✅ 3가지 난이도 (Easy/Medium/Hard)
- ✅ **랜덤 난이도 선택 (핵심 컨셉)**
- ✅ 전략적 엄폐 가능
- ✅ 빠른 기동 가능

---

## 💡 핵심 교훈

### 1. 사용자 피드백의 중요성
```
"벽의 평균 크기가 얼마라고 생각하는거야? 너무 큰데?"
→ 즉시 크기 60% 축소

"최소 50으로 해서 다시 보자"
→ 간격 2배 확대

"직사각형 2개가 붙은 모습은 깔끔하지가 않다"
→ L자 포기 결정
```

### 2. 검증 조건은 게임 특성에 맞춰야
- LOS 체크는 경쟁 모드엔 필요할 수 있지만
- FFA 빠른 전투에선 불필요
- 과도한 검증 = 낮은 생성 성공률

### 3. Spatial Hashing의 위력
- O(n²) → O(n) 충돌 체크
- 10-100배 성능 향상
- 필수 최적화 기법

### 4. 거리 기반 셀 선택
- 단순한 2x2 영역 선택은 경계 케이스 실패
- 거리 계산 후 정렬이 더 안정적
- 약간의 계산 비용으로 큰 안정성 확보

### 5. 알고리즘 문서의 가치
- `Procedural Wall Generation.md`가 큰 도움
- 검증된 알고리즘 사용 = 시행착오 감소
- 하지만 파라미터는 직접 튜닝 필요

---

## 🔧 구현 상세

### 파일 구조
```
js/
├── config/
│   └── grid.js              (NEW) 그리드 시스템
└── systems/
    └── wallGenerator.js     (NEW) 벽 생성 알고리즘

js/core/
├── Game.js                  (MODIFIED) WallGenerator 통합
└── Renderer.js              (MODIFIED) 안전지역 디버그 시각화
```

### 주요 클래스

#### WallGenerator
```javascript
class WallGenerator {
    constructor(Matter, config)

    // 핵심 메서드
    generateWalls(spawnPoints)           // 메인 생성
    generateObstacles(spawnPoints)       // 장애물 배치
    validateArena(obstacles, spawns)     // 검증

    // 검증 메서드
    areSpawnsConnected()                 // Flood Fill
    checkSpawnBalance()                  // 거리 균형
    hasDirectLineOfSight()               // LOS 체크 (비활성)

    // 유틸리티
    isInSafeZone()                       // 안전지역 체크
    hasOverlap()                         // Spatial Hash 충돌
    createMatterBodies()                 // Matter.js 변환
    createFallbackWalls()                // 실패 시 대체
}
```

#### SpatialHashGrid
```javascript
class SpatialHashGrid {
    insert(obj, x, y, width, height)     // 객체 등록
    query(x, y, width, height)           // 주변 검색
    _getCells(x, y, width, height)       // 셀 계산
}
```

---

## 🎯 향후 개선 방향

### 1. 난이도 프리셋 활용
```javascript
// Game.js에서 난이도 선택 가능하게
const wallGenerator = new WallGenerator(this.Matter, {
    difficulty: 'easy'  // or 'medium', 'hard'
});
```

### 2. Seed 시스템
```javascript
// 같은 seed = 같은 맵
const wallGenerator = new WallGenerator(this.Matter, {
    seed: 12345  // 저장/공유 가능
});
```

### 3. Team Battle 전용 검증
```javascript
// 팀 모드에서는 팀 간 LOS 체크
if (gameMode === TEAM_BATTLE) {
    // RED vs BLUE 스폰 간 시야 차단 필요
}
```

### 4. 벽 파괴 시스템
```javascript
// 발사체가 벽을 부술 수 있게
wall.health = 100;
onProjectileHit(wall) {
    wall.health -= damage;
    if (wall.health <= 0) {
        World.remove(world, wall);
    }
}
```

---

## 📚 참고 자료

### 내부 문서
- `Procedural Wall Generation.md` - 알고리즘 상세 (다른 Claude 작성)
- `ARCHITECTURE.md` - 전체 시스템 구조
- `js/config/grid.js` - 그리드 시스템 구현
- `js/systems/wallGenerator.js` - 벽 생성 구현

### 외부 참고
- [Matter.js Collision Filtering](https://brm.io/matter-js/docs/classes/Body.html#property_collisionFilter)
- [Spatial Hashing](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/spatial-hashing-r2697/)
- [Flood Fill Algorithm](https://en.wikipedia.org/wiki/Flood_fill)

---

## 📈 통계

**코드량:**
- `grid.js`: 125 lines
- `wallGenerator.js`: 680 lines
- Total: 805 lines

**개발 시간:**
- 그리드 시스템: 1시간
- 안전지역 디버깅: 2시간
- 알고리즘 구현: 3시간
- 파라미터 튜닝: 2시간
- L자 시도/포기: 2시간
- **Total: ~10시간**

**커밋:**
- Phase 3 초기 커밋 예정
