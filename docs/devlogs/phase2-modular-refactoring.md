# Phase 2: 모듈화 리팩토링 개발 로그

**기간**: 2025-10-30
**목표**: prototype.html (1803 lines) → 모듈화된 ES6 구조 (~15 files)
**상태**: ✅ 완료 (랜덤 벽 생성 제외)

---

## 목차
- [개요](#개요)
- [리팩토링 과정](#리팩토링-과정)
- [발견된 버그 및 수정사항](#발견된-버그-및-수정사항)
- [실수 및 교훈](#실수-및-교훈)
- [최종 구조](#최종-구조)

---

## 개요

### 시작 상태
- **파일**: `prototype.html` (단일 파일, 1803 lines)
- **구조**: 모든 코드가 하나의 HTML 파일에 인라인
- **장점**: 파일 더블클릭으로 즉시 실행 가능
- **단점**: 유지보수 어려움, 코드 재사용 불가, 가독성 낮음

### 목표 상태
- **구조**: ES6 모듈 기반 (~15 files)
- **장점**: 관심사 분리, 코드 재사용, 확장성, 가독성
- **단점**: HTTP 서버 필요 (ES6 모듈 제약)

### 리팩토링 원칙
1. **기능 보존**: 프로토타입의 모든 기능 유지
2. **점진적 진행**: 8단계로 나누어 단계별 검증
3. **명확한 책임 분리**: 각 모듈의 역할 명확화
4. **테스트 가능성**: 각 단계마다 동작 확인

---

## 리팩토링 과정

### Step 1: Configuration & Constants (30분)

**목표**: 모든 상수를 중앙화

**생성된 파일**:
```javascript
js/config/constants.js    // 물리 상수, 충돌 카테고리, 스폰 위치
js/config/colors.js        // TRON 색상 팔레트
```

**주요 내용**:
```javascript
// constants.js
export const COLLISION_CATEGORY = {
    TANK: 0x0001,
    PROJECTILE: 0x0002,
    WALL: 0x0004
};

export const SAFE_ZONE_SPAWNS = [
    { x: 67, y: 67 },      // Tank 1: 좌상단
    { x: 893, y: 653 },    // Tank 2: 우하단
    // ... 6개 스폰 위치
];

export const PHYSICS = {
    GRAVITY_Y: 0,
    POSITION_ITERATIONS: 10,
    VELOCITY_ITERATIONS: 8,
    FIXED_TIMESTEP: 1/60
};
```

**검증**: `test-modules.html` 생성하여 모듈 로딩 확인

---

### Step 2: Particle System (30분)

**목표**: PixiJS 파티클 시스템 분리

**생성된 파일**:
```javascript
js/core/particles.js       // PixiJS 파티클 관리
```

**주요 클래스**:
```javascript
class Particle extends PIXI.Graphics {
    // 개별 파티클 (속도, 생명, 색상 변화)
}

class ExplosionRing extends PIXI.Graphics {
    // 탱크 폭발용 대형 링 (3개 시차 생성)
}

class HitEffectRing extends PIXI.Graphics {
    // 발사체 충돌용 소형 링
}
```

**Export 함수**:
- `initPixiJS()` - PixiJS 앱 초기화, DOM 추가
- `createExplosion()` - 탱크 폭발 링 (3개)
- `createTankExplosionParticles()` - 탱크 폭발 파티클 (80개)
- `createHitEffect()` - 발사체 충돌 링
- `createProjectileHitParticles()` - 발사체 충돌 파티클 (5개)
- `updateParticles()` - 모든 파티클 업데이트
- `getProjectileContainer()` - 발사체 컨테이너 반환

**검증**: `test-particles.html` - 클릭 시 파티클 생성 확인

---

### Step 3: Entity Classes (45분)

**목표**: Tank, Projectile 엔티티 분리

**생성된 파일**:
```javascript
js/entities/Tank.js        // 탱크 엔티티 (305 lines)
js/entities/Projectile.js  // 발사체 엔티티 (145 lines)
```

**Tank.js 구조**:
```javascript
export default class Tank {
    constructor(x, y, config, Matter, world, onDestroy) {
        // Matter.js 바디 생성 (삼각형 vertices)
        // 무기 시스템 초기화
        // 체력 관리
    }

    update() {
        // 추진력 적용 (Body.applyForce)
        // 회전 적용 (Body.setAngularVelocity)
        // 무기 에너지 재충전
    }

    render(ctx) {
        // TRON 스타일 3레이어 렌더링
        // 1. 어두운 내부
        // 2. 네온 글로우 (탱크 색상)
        // 3. 흰색 코어
    }

    takeDamage(damage) {
        // 체력 감소
        // 파괴 시 onDestroy 콜백 호출
    }
}
```

**Projectile.js 구조**:
```javascript
export default class Projectile {
    constructor(x, y, angle, weaponData, ownerColor, Matter, world, ProjectileRenderer) {
        // Matter.js 바디 생성 (원형)
        // PixiJS 스프라이트 생성 (ProjectileRenderer 사용)
        // 초기 속도 설정
    }

    update(deltaTime) {
        // PixiJS 스프라이트를 Matter.js 바디 위치에 동기화
        // 생명 감소
        // 범위 밖 체크
    }

    destroy() {
        // Matter.js 바디 제거
        // PixiJS 스프라이트 제거
    }
}
```

**설계 원칙**:
- Matter.js 바디가 **단일 진실 공급원** (Single Source of Truth)
- PixiJS는 시각적 표현만 담당 (물리와 분리)

---

### Step 4: Systems (60분)

**목표**: 충돌, 입력, AI, UI 시스템 분리

**생성된 파일**:
```javascript
js/systems/collision.js    // 충돌 이벤트 처리
js/systems/input.js        // 키보드 입력 처리
js/systems/ai.js           // AI 행동 로직
js/ui/hud.js              // UI 업데이트
```

**collision.js**:
```javascript
export function setupCollisionHandlers(engine, game, createHitEffect, createProjectileHitParticles) {
    Matter.Events.on(engine, 'collisionStart', (event) => {
        // projectile → tank
        // projectile → wall
    });
}

function handleProjectileHit(projectileBody, tankBody, game, createHitEffect, createProjectileHitParticles) {
    // 데미지 적용
    // 시각 효과 생성 (링 + 파티클)
    // 발사체 제거
}
```

**input.js**:
```javascript
export function setupKeyboardControls() {
    // 키 누름/떼기 이벤트 등록
    // Arrow keys: preventDefault (스크롤 방지)
}

export function handleInput(playerTank, fireProjectile, WEAPON_DATA) {
    // ArrowUp: 전진
    // ArrowDown: 후진
    // ArrowLeft/Right: 회전
    // Space: 발사
    // 1,2,3: 무기 전환
}

export function fireProjectile(tank, WEAPON_DATA, projectiles, Projectile, Matter, world, ProjectileRenderer) {
    // 에너지 체크
    // 탱크 각도 계산
    // 발사체 생성 (단일/다중)
}
```

**ai.js**:
```javascript
export function initAI(tank) {
    // AI 상태 초기화 (발사 쿨다운)
}

export function updateAI(aiTank, targetTank, deltaTime, fireProjectile) {
    // 목표 추적
    // 회전 (적 방향)
    // 이동 (거리 유지: 150-200px)
    // 발사 (조준 완료 시, 1.5초 쿨다운)
}
```

**hud.js**:
```javascript
export function updateUI(tanks, WEAPON_DATA) {
    tanks.forEach((tank, index) => {
        // HP 게이지 업데이트
        // 무기 에너지 게이지 업데이트
        // 무기 이름 표시
        // 점수 표시
    });
}
```

---

### Step 5: Renderer (30분)

**목표**: Canvas 2D 렌더링 분리

**생성된 파일**:
```javascript
js/core/Renderer.js        // Canvas 2D 렌더러 (210 lines)
```

**책임**:
- 배경 (검은색)
- 그리드 (사이안 선)
- 벽 (TRON 스타일 네온)
- 탱크 (TRON 스타일 3레이어)

**TRON 렌더링 패턴**:
```javascript
// 1. 어두운 내부
ctx.fillStyle = '#0a0a0a';
ctx.fill();

// 2. 네온 글로우 (색상)
ctx.strokeStyle = color;
ctx.lineWidth = 3;
ctx.shadowColor = color;
ctx.shadowBlur = 20;
ctx.stroke();

// 3. 흰색 코어
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 1;
ctx.shadowBlur = 5;
ctx.stroke();
```

**Matter.js 통합**:
```javascript
setMatter(Matter) {
    this.Matter = Matter;
}

drawWalls(walls) {
    const { Vector } = this.Matter;
    // Vector 사용하여 벽 꼭짓점 축소 (TRON 스타일)
}
```

---

### Step 6: Core Game Classes (45분)

**목표**: 메인 게임 컨트롤러 및 발사체 렌더러 생성

**생성된 파일**:
```javascript
js/config/weapons.js              // 무기 데이터
js/core/ProjectileRenderer.js     // PixiJS 발사체 렌더러
js/core/Game.js                   // 메인 게임 클래스 (270 lines)
```

**weapons.js**:
```javascript
export const WEAPON_DATA = {
    MISSILE: {
        name: 'MISSILE',
        damage: 4,
        energyCost: 4,
        speed: 200,        // DOS units
        lifetime: 3.0,
        size: 2
    },
    LASER: {
        name: 'BEAM LASER',
        damage: 6,
        energyCost: 6,
        speed: 400,
        lifetime: 2.0,
        size: 1.5
    },
    DOUBLE_MISSILE: {
        name: 'DOUBLE MISSILE',
        damage: 6,
        energyCost: 4,
        speed: 200,
        lifetime: 3.0,
        size: 2,
        projectileCount: 2  // 다중 발사
    }
};
```

**ProjectileRenderer.js**:
```javascript
const ProjectileRenderer = {
    container: null,

    init(pixiContainer) {
        this.container = pixiContainer;
    },

    createGraphics(type, color, weaponData) {
        const graphics = new PIXI.Graphics();

        if (type === 'LASER') {
            // 긴 빔 (20px)
            graphics.lineStyle(2, colorHex, 1);
            graphics.moveTo(-10, 0);
            graphics.lineTo(10, 0);
        } else {
            // 원형
            graphics.beginFill(colorHex, 1);
            graphics.drawCircle(0, 0, weaponData.size);
        }

        return graphics;
    },

    add(sprite) { this.container.addChild(sprite); },
    remove(sprite) { this.container.removeChild(sprite); sprite.destroy(); }
};
```

**Game.js 구조**:
```javascript
export default class Game {
    constructor() {
        this.Matter = window.Matter;
        this.engine = null;
        this.world = null;
        this.tanks = [];
        this.projectiles = [];
        this.renderer = null;
        this.pixiApp = null;
    }

    async init(canvas) {
        // PixiJS 초기화
        this.pixiApp = initPixiJS(CANVAS_WIDTH, CANVAS_HEIGHT);
        ProjectileRenderer.init(getProjectileContainer());

        // Renderer 초기화
        this.renderer = new Renderer(canvas);

        // 물리 세계 생성
        this.createPhysicsWorld();

        // 벽 생성
        this.createWalls();
        this.createObstacleWalls();  // ⚠️ 랜덤 생성 미구현

        // 탱크 생성
        this.createTanks();

        // 시스템 설정
        setupKeyboardControls();
        setupCollisionHandlers(this.engine, this, createHitEffect, createProjectileHitParticles);

        // AI 초기화
        this.aiTanks.forEach(tank => initAI(tank));
    }

    update(deltaTime) {
        // 플레이어 입력 처리
        handleInput(this.playerTank, ...);

        // AI 업데이트
        updateAllAI(this.aiTanks, ...);

        // 탱크 업데이트
        this.tanks.forEach(tank => tank.update());

        // 물리 업데이트
        this.Matter.Engine.update(this.engine, deltaTime * 1000);

        // 발사체 업데이트
        this.projectiles.forEach(p => p.update(deltaTime));

        // 파티클 업데이트
        updateParticles(deltaTime);
    }

    render() {
        this.renderer.render(this);
        updateUI(this.tanks, WEAPON_DATA);
    }
}
```

---

### Step 7: Main Entry Point (45분)

**목표**: 진입점 및 게임 루프 생성

**생성된 파일**:
```javascript
js/main.js                 // 게임 초기화 및 루프
css/main.css              // 모든 스타일
index.html                // 메인 HTML (ES6 모듈 로드)
```

**main.js - 게임 루프**:
```javascript
import Game from './core/Game.js';
import { PHYSICS } from './config/constants.js';

async function main() {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game();
    await game.init(canvas);

    let lastTime = performance.now();

    function gameLoop(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        game.update(PHYSICS.FIXED_TIMESTEP);
        game.render();

        requestAnimationFrame(gameLoop);
    }

    gameLoop(performance.now());
}
```

**index.html**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <h1>🎮 DESTRUCTION ZONE</h1>
    <div id="gameContainer">
        <div id="leftStats"><!-- Tank 1-3 --></div>
        <div id="canvasWrapper">
            <canvas id="gameCanvas" width="960" height="720"></canvas>
            <div id="pixiContainer"></div>
        </div>
        <div id="rightStats"><!-- Tank 4-6 --></div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.3.2/dist/pixi.min.js"></script>
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

**CSS - 레이아웃**:
```css
#gameContainer {
    display: flex;
    flex-direction: row;
}

#leftStats, #rightStats {
    width: 60px;
    display: flex;
    flex-direction: column;
}

#canvasWrapper {
    position: relative;
}

#pixiContainer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;  /* 클릭 무시 */
}
```

---

### Step 8: Testing & Debugging (진행중)

**테스트 파일 생성**:
```
test-modules.html        - 모듈 로딩 검증
test-particles.html      - 파티클 시스템 검증
test-minimal.html        - 최소 렌더링 검증
test-import-chain.html   - Import 체인 검증
index-debug.html         - 실시간 에러 로그
```

**발견된 버그**: 다음 섹션 참조

---

## 발견된 버그 및 수정사항

### 1. 탱크 이동/회전 속도 오류

**증상**:
- 회전이 너무 빠름
- 이동이 너무 느림

**원인**:
```javascript
// Game.js - 잘못된 값
const tank = new Tank(spawn.x, spawn.y, {
    thrustPower: 0.0003,    // ❌ 기본값 사용
    rotationSpeed: 3.0,     // ❌ 기본값 사용
});

// prototype.html - 실제 사용된 값
const tank = new Tank(spawn.x, spawn.y, {
    thrustPower: 0.01,      // ✅ 33배 더 큼
    rotationSpeed: 0.01,    // ✅ 300배 작음
});
```

**수정**:
```javascript
// js/core/Game.js:183-184
thrustPower: 0.01,
rotationSpeed: 0.01,
```

**교훈**:
- Tank 클래스의 기본값과 실제 사용값이 달랐음
- 프로토타입에서 실제로 **전달하는 값**을 확인해야 함

---

### 2. Fixed Timestep 미적용 (프레임레이트 의존성)

**증상**:
- 주사율(60fps vs 120fps)에 따라 게임 속도가 달라짐

**원인**:
```javascript
// js/main.js - 문제 코드
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;  // 계산은 하지만
    lastTime = currentTime;

    game.update(PHYSICS.FIXED_TIMESTEP);  // ❌ 항상 1/60 전달
}

// 60fps: 1번 업데이트, 120fps: 1번 업데이트 → 120fps에서 2배 빠름
```

**수정 - Fixed Timestep Accumulator**:
```javascript
let lastTime = performance.now();
let accumulator = 0;
const maxFrameTime = 0.25;  // Spiral of death 방지

function gameLoop(currentTime) {
    let deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Clamp
    if (deltaTime > maxFrameTime) {
        deltaTime = maxFrameTime;
    }

    // 누적
    accumulator += deltaTime;

    // 고정 timestep으로 여러 번 업데이트
    while (accumulator >= PHYSICS.FIXED_TIMESTEP) {
        game.update(PHYSICS.FIXED_TIMESTEP);
        accumulator -= PHYSICS.FIXED_TIMESTEP;
    }

    // 렌더링은 항상 1번
    game.render();

    requestAnimationFrame(gameLoop);
}
```

**효과**:
- 60fps: 보통 1번 업데이트
- 120fps: 2프레임마다 1번 업데이트 (누적)
- 30fps: 2번 업데이트 후 렌더링
- **모든 환경에서 동일한 게임 속도**

**참고**:
- 프로토타입도 이 문제가 있었음 (고정값 하드코딩)
- 게임 업계 표준 방식으로 개선

---

### 3. 파티클 색상 반전

**증상**:
- 충돌 효과 색상이 반대 (주황→흰색 대신 흰색→주황)

**원인**:
```javascript
// js/config/colors.js - 잘못된 색상
HIT_START: 0xff6600,    // ❌ 주황색
HIT_END: 0xffffff       // ❌ 흰색

// prototype.html - 올바른 색상
startColor: 0xffffff,   // ✅ 흰색
endColor: 0xff8800,     // ✅ 주황색
```

**수정**:
```javascript
// js/config/colors.js:39-40
HIT_START: 0xffffff,    // White
HIT_END: 0xff8800       // Orange
```

---

### 4. 충격파 이펙트 누락

**증상**:
- 발사체 충돌 시 스파크만 나오고 충격파 링 없음
- 탱크 폭발 시 파티클만 나오고 폭발 링 없음

**원인 1 - HitEffectRing 클래스 누락**:
```javascript
// particles.js에 HitEffectRing 클래스가 없었음
// 추가함:
class HitEffectRing extends PIXI.Graphics {
    constructor(x, y) {
        // 작고 빠른 플래시 (0.15초)
        // 3~12px로 확장
    }

    update(deltaTime) {
        // 노란색 링 + 중앙 플래시
    }
}
```

**원인 2 - createHitEffect() 함수 누락**:
```javascript
// particles.js에 함수 추가
export function createHitEffect(x, y) {
    const hitEffect = new HitEffectRing(x, y);
    particleContainer.addChild(hitEffect);
    activeParticles.push(hitEffect);
}
```

**원인 3 - 함수 호출 안 됨**:
```javascript
// collision.js에서 호출 안 됨
// Game.js에서 import 안 됨
// setupCollisionHandlers에 파라미터 전달 안 됨

// 수정:
// 1. Game.js에 import 추가
import { ..., createHitEffect, ... } from './particles.js';

// 2. setupCollisionHandlers에 전달
setupCollisionHandlers(this.engine, this, createHitEffect, createProjectileHitParticles);

// 3. collision.js에서 호출
function handleProjectileHit(..., createHitEffect, createProjectileHitParticles) {
    createHitEffect(x, y);
    createProjectileHitParticles(x, y);
}
```

**원인 4 - ExplosionRing 클래스 누락**:
```javascript
// 탱크 폭발용 대형 링 (3개 시차 생성)
class ExplosionRing extends PIXI.Graphics {
    constructor(x, y, ringIndex) {
        this.maxAge = 0.6 + ringIndex * 0.1;   // 시차 지속시간
        this.delay = ringIndex * 0.05;         // 시차 시작
        this.sizeMultiplier = 1 + ringIndex * 0.3;  // 크기 배율
    }

    update(deltaTime) {
        // 오렌지→빨강 그라디언트
        // 5~50px로 확장
        // 중앙 플래시 (초기 30%)
    }
}
```

**원인 5 - createExplosion() 함수 누락**:
```javascript
export function createExplosion(x, y) {
    for (let i = 0; i < 3; i++) {
        const ring = new ExplosionRing(x, y, i);
        particleContainer.addChild(ring);
        activeParticles.push(ring);
    }
}
```

**원인 6 - Tank onDestroy 콜백에서 호출 안 됨**:
```javascript
// Game.js - 수정 전
const tank = new Tank(..., (x, y) => createTankExplosionParticles(x, y));

// Game.js - 수정 후
const tank = new Tank(..., (x, y) => {
    createExplosion(x, y);                 // 폭발 링
    createTankExplosionParticles(x, y);    // 파티클
});
```

**로직 정리**:
```
발사체 충돌:
    createHitEffect()              → HitEffectRing (작은 링)
    createProjectileHitParticles() → Particle × 5 (스파크)

탱크 폭발:
    createExplosion()              → ExplosionRing × 3 (대형 링, 시차)
    createTankExplosionParticles() → Particle × 80 (대량 스파크)
```

**교훈**:
- 함수를 분리하면 각각 **명시적으로 호출**해야 함
- Export했다고 끝이 아니라 **import + 전달 + 호출**까지 확인
- 프로토타입에서 **2개 함수 호출**하는 패턴을 놓침

---

## 실수 및 교훈

### 실수 1: 랜덤 벽 생성 로직 누락

**발생 과정**:
- Step 6에서 Game.js 작성 시
- 프로토타입의 `generateGridBasedWalls()` 함수 (100+ lines) 발견
- "복잡하니까 일단 단순하게" → 중앙 벽 1개만 하드코딩
- "나중에 개선하자" → **잊어버림**

**누락된 로직**:
```javascript
// prototype.html - generateGridBasedWalls()
// - 5×4 그리드로 맵 분할
// - 6개 Safe Zone (탱크 스폰) 제외
// - 40% 확률로 각 셀에 벽 생성
// - 6가지 크기 (수직 3종 + 수평 3종)
// - 셀 내 랜덤 위치 (마진 유지)
```

**현재 코드**:
```javascript
// js/core/Game.js:147-169
createObstacleWalls() {
    const obstacles = [
        { x: 480, y: 360, width: 80, height: 80 }  // ❌ 하드코딩 1개
    ];
    // ❌ 랜덤 생성 로직 없음
}
```

**교훈**:
1. **"나중에"는 금물** - 임시 코드는 영구 코드가 됨
2. **체크리스트 작성** - 프로토타입의 모든 기능 명시
3. **단계별 검증** - 각 단계에서 기능 비교
4. **간단해 보여도** - 실제로는 중요한 로직일 수 있음

**해결 계획**:
- Phase 3에서 새로운 방식으로 재구현 예정
- 기존 로직 복원이 아닌 개선된 버전 작성

---

### 실수 2: 프로토타입 코드 분석 불충분

**문제점**:
- 클래스 **기본값**만 보고 판단
- 실제 **인스턴스 생성 시 전달값** 미확인
- 결과: 탱크 움직임 완전히 다름

**예시**:
```javascript
// Tank 클래스 정의
class Tank {
    constructor(x, y, config) {
        this.config = {
            thrustPower: config.thrustPower || 0.0003,  // 기본값
            rotationSpeed: config.rotationSpeed || 3.0,  // 기본값
        };
    }
}

// 실제 사용 (50줄 떨어진 곳)
const tank = new Tank(x, y, {
    thrustPower: 0.01,     // ← 실제 값!
    rotationSpeed: 0.01,   // ← 실제 값!
});
```

**교훈**:
- 클래스 정의만이 아닌 **실제 호출 부분** 확인
- `new ClassName()` 을 grep해서 **전달 인자** 확인
- 값이 다를 수 있는 **모든 config 추적**

---

### 실수 3: 효과 함수 분리 후 연결 누락

**패턴**:
```javascript
// 프로토타입: 하나의 함수에 모든 효과
function createProjectileHitParticles(x, y) {
    createRing();      // 충격파
    createSparks();    // 파티클
}
collision: createProjectileHitParticles(x, y);  // 1번 호출

// 모듈 버전: 함수 분리
export function createHitEffect(x, y) { ... }
export function createProjectileHitParticles(x, y) { ... }
collision: createProjectileHitParticles(x, y);  // ❌ 1개만 호출
```

**교훈**:
- 함수 분리 시 **모든 호출 지점 업데이트**
- Export 확인사항:
  1. ✅ Export 추가
  2. ✅ Import 추가
  3. ✅ 파라미터 전달
  4. ✅ 실제 호출
- **4단계 모두 확인**해야 함

---

### 실수 4: 테스트 범위 불충분

**문제**:
- 기능이 "작동한다"만 확인
- 세부 효과까지 비교 안 함
- 예: 탱크가 움직이면 OK → 속도는 확인 안 함
- 예: 충돌 시 파티클 나오면 OK → 충격파는 확인 안 함

**개선**:
```
체크리스트 예시:
□ 탱크 이동 속도 동일한가?
□ 탱크 회전 속도 동일한가?
□ 충돌 시 충격파 링 나오는가?
□ 충돌 시 스파크 파티클 나오는가?
□ 탱크 폭발 시 3개 링 나오는가?
□ 탱크 폭발 시 80개 파티클 나오는가?
□ 모든 시각 효과가 동일한가?
```

**교훈**:
- "작동한다" != "정확하다"
- **프로토타입과 1:1 비교** 필요
- 모든 시각/청각 효과 체크리스트화

---

## 최종 구조

### 디렉토리 구조
```
destruction-zone-web/
├── index.html                      # 메인 HTML (ES6 모듈)
├── prototype.html                  # 원본 프로토타입 (보존)
├── css/
│   └── main.css                   # 모든 스타일
├── js/
│   ├── main.js                    # 진입점 + 게임 루프
│   ├── config/
│   │   ├── constants.js           # 물리, 충돌, 스폰 상수
│   │   ├── colors.js              # TRON 색상 팔레트
│   │   └── weapons.js             # 무기 데이터
│   ├── core/
│   │   ├── Game.js                # 메인 게임 컨트롤러
│   │   ├── Renderer.js            # Canvas 2D 렌더러
│   │   ├── particles.js           # PixiJS 파티클 시스템
│   │   └── ProjectileRenderer.js  # PixiJS 발사체 렌더러
│   ├── entities/
│   │   ├── Tank.js                # 탱크 엔티티
│   │   └── Projectile.js          # 발사체 엔티티
│   ├── systems/
│   │   ├── collision.js           # 충돌 처리
│   │   ├── input.js               # 키보드 입력
│   │   └── ai.js                  # AI 로직
│   └── ui/
│       └── hud.js                 # UI 업데이트
├── docs/
│   └── devlogs/
│       └── phase2-modular-refactoring.md  # 이 문서
└── test files/
    ├── test-modules.html          # 모듈 로딩 테스트
    ├── test-particles.html        # 파티클 테스트
    ├── test-minimal.html          # 최소 렌더링 테스트
    ├── test-import-chain.html     # Import 체인 테스트
    └── index-debug.html           # 실시간 에러 로그
```

### 모듈 의존성 그래프
```
main.js
  ├─→ Game.js
  │     ├─→ constants.js
  │     ├─→ colors.js
  │     ├─→ weapons.js
  │     ├─→ particles.js (PixiJS)
  │     ├─→ ProjectileRenderer.js (PixiJS)
  │     ├─→ Renderer.js (Canvas 2D)
  │     ├─→ Tank.js
  │     │     └─→ constants.js
  │     ├─→ Projectile.js
  │     │     └─→ constants.js
  │     ├─→ collision.js
  │     ├─→ input.js
  │     ├─→ ai.js
  │     └─→ hud.js
  └─→ constants.js (PHYSICS)
```

### 렌더링 레이어
```
Layer 1 (Canvas 2D - 정적):
  - 배경 (#000011)
  - 그리드 (사이안 선)
  - 벽 (TRON 네온)

Layer 2 (PixiJS - Projectile Container):
  - 발사체 (미사일, 레이저)

Layer 3 (Canvas 2D - 동적):
  - 탱크 (TRON 3레이어)

Layer 4 (PixiJS - Particle Container):
  - 충격파 링 (HitEffectRing)
  - 폭발 링 (ExplosionRing × 3)
  - 파티클 (Particle)

Layer 5 (HTML):
  - UI 패널 (좌우 사이드바)
```

### 물리 + 렌더링 통합
```
Matter.js (물리 엔진)
  ├─→ Tank.body (삼각형 vertices)
  │     └─→ Canvas 2D rendering (TRON style)
  ├─→ Projectile.body (원형)
  │     └─→ PixiJS sprite (동기화)
  └─→ Wall.body (사각형)
        └─→ Canvas 2D rendering (TRON style)

PixiJS (독립 효과)
  ├─→ Particle (폭발 스파크)
  ├─→ HitEffectRing (충돌 링)
  └─→ ExplosionRing (탱크 폭발 링)
```

### 탱크 구성 (6대)
```
Tank 1 (좌상단, #00ffff Cyan):
  - 플레이어 조작 (Arrow Keys + Space)
  - HP: 100, Weapon: MISSILE

Tank 2-6 (AI 제어):
  - Tank 2 (우하단, #ff6600 Orange) - AI
  - Tank 3 (우상단, #bb88ff Light Purple) - AI
  - Tank 4 (좌하단, #00ff88 Emerald Green) - AI
  - Tank 5 (상단 중앙, #cccc00 Dark Yellow) - AI
  - Tank 6 (하단 중앙, #ff0055 Red Pink) - AI
  - 모든 AI는 플레이어를 추적하고 공격

AI 행동:
  - 목표 추적 (회전)
  - 거리 유지 (150-200px)
  - 조준 완료 시 발사 (1.5초 쿨다운)
```

---

## 통계

### 코드 라인 수
```
Before (prototype.html):  1803 lines
After (모듈화):
  - js/core/Game.js:             270 lines
  - js/entities/Tank.js:         305 lines
  - js/entities/Projectile.js:   145 lines
  - js/core/Renderer.js:         210 lines
  - js/core/particles.js:        270 lines
  - js/systems/collision.js:      88 lines
  - js/systems/input.js:         140 lines
  - js/systems/ai.js:             85 lines
  - js/ui/hud.js:                 56 lines
  - js/main.js:                   53 lines
  - 기타 (config, renderer):     ~300 lines

Total:                          ~1922 lines (15 files)
```

### 리팩토링 시간
```
Step 1 (Config):           30분
Step 2 (Particles):        30분
Step 3 (Entities):         45분
Step 4 (Systems):          60분
Step 5 (Renderer):         30분
Step 6 (Game):             45분
Step 7 (Main):             45분
Step 8 (Testing/Debug):   120분 (버그 수정 포함)
──────────────────────────────
Total:                    6시간 25분
```

### 발견된 버그
```
1. 탱크 이동/회전 속도 오류       ✅ 수정
2. Fixed Timestep 미적용         ✅ 수정 (개선)
3. 파티클 색상 반전              ✅ 수정
4. 충격파 이펙트 누락            ✅ 수정
5. 랜덤 벽 생성 누락             ⚠️ Phase 3에서 재구현
```

---

## 다음 단계 (Phase 3)

### 우선순위 1: 랜덤 벽 생성
- 프로토타입 로직 복원이 아닌 **새로운 방식** 설계
- 가능성: Perlin Noise, BSP, Cellular Automata 등
- 목표: 더 나은 맵 생성 알고리즘

### 우선순위 2: 무기 시스템 확장
- 현재: MISSILE, LASER, DOUBLE_MISSILE (3종)
- 목표: 34종 무기 구현 (`WEAPONS.md` 참조)

### 우선순위 3: 멀티플레이어 지원
- 현재: 6 탱크 (플레이어 1 + AI 5) ✅
- 목표: 로컬 멀티플레이어 (2-6 플레이어 동시 조작)

### 우선순위 4: 최적화
- PixiJS 파티클 풀링
- Canvas 2D 오프스크린 렌더링
- AI 연산 최적화

---

## 참고 문서

- `docs/devlogs/development-journey.md` - 전체 개발 여정
- `docs/devlogs/architecture.md` - Matter.js 아키텍처
- `docs/devlogs/physics-engine.md` - 물리 엔진 상세
- `docs/devlogs/rendering.md` - 렌더링 시스템
- `docs/devlogs/visual-design.md` - TRON 비주얼 디자인
- `WEAPONS.md` - 원본 무기 명세
- `README.md` - 프로젝트 개요

---

## 결론

Phase 2 모듈화 리팩토링은 **대부분 성공**했으나, 몇 가지 실수가 있었습니다:

**성공한 부분**:
- ✅ 명확한 관심사 분리
- ✅ 재사용 가능한 모듈
- ✅ 테스트 가능한 구조
- ✅ Fixed Timestep Accumulator (프로토타입보다 개선)
- ✅ 효과 로직 명확화 (함수 분리)

**실수한 부분**:
- ❌ 랜덤 벽 생성 누락
- ❌ 초기 파라미터 불일치
- ❌ 프로토타입 분석 불충분

**교훈**:
- "나중에"는 금물
- 기본값 ≠ 실제 사용값
- 함수 분리 시 호출 체인 전체 확인
- 체크리스트 기반 검증 필수

**다음 단계**:
Phase 3에서 랜덤 벽 생성을 **개선된 방식**으로 재구현하고, 무기 시스템을 확장할 예정입니다.
