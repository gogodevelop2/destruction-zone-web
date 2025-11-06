# Matter.js 물리 엔진 통합

## 목차
- [충돌 안정성](#충돌-안정성)
- [충돌 필터링](#충돌-필터링)
- [탱크 물리](#탱크-물리)
- [발사체 물리](#발사체-물리)

---

## 충돌 안정성

**날짜**: 2025-10-29
**문제**: 탱크가 벽에 수직으로 닿으면 진동 (jittering)

### 문제 분석

**현상:**
- 탱크 앞 꼭지점이 벽과 수직 충돌 시 좌우 진동
- 뒷 꼭지점은 문제 없음

**원인:**
- 단일 점 충돌은 불안정함
- 뒷 꼭지점은 선분(두 점)이라 안정적
- 앞 꼭지점은 하나의 점이라 불안정

### 해결 시도

#### 1. positionIterations & velocityIterations 증가

```javascript
const engine = Engine.create({
    gravity: { x: 0, y: 0 },
    positionIterations: 10,  // Default 6 → 10
    velocityIterations: 8    // Default 4 → 8
});
```

**효과**: 진동 속도 감소 (완전 제거는 안됨)

#### 2. restitution = 0

```javascript
this.body = Bodies.fromVertices(x, y, [vertices], {
    restitution: 0.0,  // 튕김 완전 제거
    // ...
});
```

**효과**: 튕김 제거로 약간 개선

#### 3. chamfer 적용

```javascript
this.body = Bodies.fromVertices(x, y, [vertices], {
    chamfer: { radius: 2 },  // 모서리 둥글게
    // ...
});
```

**효과**: 날카로운 모서리 제거, 충돌 안정성 향상

### 최종 설정

```javascript
const engine = Engine.create({
    gravity: { x: 0, y: 0 },
    positionIterations: 10,
    velocityIterations: 8
});

this.body = Bodies.fromVertices(x, y, [vertices], {
    density: 0.002,
    friction: 0.8,
    frictionAir: 0.05,
    frictionStatic: 1.0,
    restitution: 0.0,
    chamfer: { radius: 2 },
    // ...
});
```

**결과**: 진동이 거의 눈에 띄지 않을 정도로 감소 (완벽하진 않지만 허용 가능)

### 배운 점

1. **단일 점 충돌은 본질적으로 불안정**
   - 물리 엔진의 한계
   - Iterations 증가로 완화 가능 (성능 trade-off)

2. **Chamfer의 효과**
   - 모서리를 살짝 둥글게만 해도 큰 차이
   - 시각적으로는 거의 차이 없음

3. **완벽한 안정성은 어려움**
   - 게임플레이에 영향 없는 수준이면 OK
   - 성능과 안정성의 균형

### 참고
- [Matter.js Engine Options](https://brm.io/matter-js/docs/classes/Engine.html#property_positionIterations)
- 커밋: ce1927d

---

## 충돌 필터링

**목적**: 특정 객체끼리만 충돌하도록 제어

### 충돌 카테고리

```javascript
const COLLISION_CATEGORY = {
    TANK: 0x0001,       // 0000 0001
    PROJECTILE: 0x0002, // 0000 0010
    WALL: 0x0004        // 0000 0100
};
```

### 탱크 충돌 설정

```javascript
// 탱크: 탱크, 발사체, 벽과 충돌
this.body = Bodies.fromVertices(x, y, [vertices], {
    collisionFilter: {
        category: COLLISION_CATEGORY.TANK,
        mask: COLLISION_CATEGORY.TANK |
              COLLISION_CATEGORY.PROJECTILE |
              COLLISION_CATEGORY.WALL
    }
});
```

### 발사체 충돌 설정

```javascript
// 발사체: 탱크, 벽과 충돌 (발사체끼리는 X)
this.body = Bodies.circle(x, y, size, {
    collisionFilter: {
        category: COLLISION_CATEGORY.PROJECTILE,
        mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.WALL
        // 발사체 카테고리 제외 = 발사체끼리 충돌 안함
    }
});
```

### 벽 충돌 설정

```javascript
// 벽: 탱크, 발사체와 충돌
Bodies.rectangle(x, y, w, h, {
    isStatic: true,
    collisionFilter: {
        category: COLLISION_CATEGORY.WALL,
        mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.PROJECTILE
    }
});
```

### 충돌 이벤트 처리

```javascript
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        // Projectile vs Tank
        if (isProjectile(bodyA) && isTank(bodyB)) {
            handleProjectileHit(bodyA, bodyB);
        }

        // Projectile vs Wall
        if (isProjectile(bodyA) && isWall(bodyB)) {
            destroyProjectile(bodyA);
        }
    });
});
```

### 배운 점

1. **비트 마스크의 강력함**
   - 간단하고 효율적
   - 복잡한 충돌 규칙도 명확하게 표현

2. **발사체끼리 충돌 제외**
   - 게임플레이상 불필요
   - 성능 향상

---

## 탱크 물리

### Bodies.fromVertices 사용

```javascript
// 삼각형 모양 탱크
const vertices = [
    { x: 15, y: 0 },   // 앞 꼭지점
    { x: -10, y: -10 }, // 뒤 왼쪽
    { x: -10, y: 10 }   // 뒤 오른쪽
];

this.body = Bodies.fromVertices(x, y, [vertices], {
    density: 0.002,
    friction: 0.8,
    frictionAir: 0.05,
    // ...
}, true); // true = flagInternal (자동 분해)
```

### 회전 제어

```javascript
// 입력에 따라 각속도 설정
if (leftKey) {
    Body.setAngularVelocity(this.body, -this.config.turnSpeed);
} else if (rightKey) {
    Body.setAngularVelocity(this.body, this.config.turnSpeed);
} else {
    Body.setAngularVelocity(this.body, 0);
}
```

### 이동 제어

```javascript
// 탱크 방향으로 힘 적용
const force = {
    x: Math.cos(this.body.angle) * this.config.thrust,
    y: Math.sin(this.body.angle) * this.config.thrust
};
Body.applyForce(this.body, this.body.position, force);
```

### 속도 제한

```javascript
const vel = this.body.velocity;
const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
const maxSpeed = this.config.maxSpeed;

if (speed > maxSpeed) {
    Body.setVelocity(this.body, {
        x: (vel.x / speed) * maxSpeed,
        y: (vel.y / speed) * maxSpeed
    });
}
```

---

## 발사체 물리

### 레이저 vs 미사일

**날짜**: 2025-11-06
**업데이트**: isSensor 속성을 통한 무기별 물리 특성 분리

```javascript
// 무기별 isSensor 설정 (weapons.js)
MISSILE: {
    density: 0.4,
    isSensor: false,  // 물리 충격 적용
}

LASER: {
    density: 0.00001,  // 거의 질량 없음
    isSensor: true,    // 충돌 감지만, 물리 충격 없음
}

// Projectile.js에서 사용
this.body = Bodies.circle(x, y, weaponData.size, {
    isSensor: weaponData.isSensor ?? false,
    density: weaponData.density || 0.4,
    frictionAir: 0,
    restitution: 0,
    friction: 0.1
});
```

**레이저 특성 (isSensor: true):**
- 밀도 0.00001 (거의 질량 없음)
- 충돌 감지: O (Matter.js가 처리)
- 물리 충격: X (탱크를 밀지 않음)
- 속도: 45 DOS units (18 px/frame, 9x faster than MISSILE)

**미사일 특성 (isSensor: false):**
- 밀도 0.4 (일반)
- 충돌 감지: O
- 물리 충격: O (탱크를 약간 밀 수 있음)
- 속도: 5 DOS units (2.0 px/frame)

### 고속 발사체 물리 문제 해결

**문제**: 레이저(18 px/frame) 같은 고속 발사체가 탱크를 과도하게 밀어냄

**원인 분석** (서브스텝 2회 기준):
1. 레이저가 한 서브스텝(9px)에 탱크 표면 도달
2. 다음 서브스텝에서 9px 더 이동 → 탱크 안으로 4.93px 침투
3. Matter.js는 침투 깊이에 비례하여 충격량 적용
4. 결과: 레이저 크기(1.5px)의 3.3배 침투 → 과도한 밀림 (0.18 px/frame)

**해결책**: `isSensor: true` 적용
- Matter.js가 여전히 충돌을 감지하고 이벤트 발생
- 물리적 충격만 적용하지 않음
- 데미지 적용은 정상 작동 (collisionStart 이벤트 동일)

**장점**:
- 코드 수정 최소 (weapons.js + Projectile.js)
- 충돌 감지 정확도 동일 (Matter.js 사용)
- 성능 향상 (물리 계산 감소)
- 무기별 유연한 설정 가능

**참고**: 원작 DOS 게임도 발사체가 탱크를 밀지 않음

---

## 물리 서브스텝 (Sub-stepping)

**날짜**: 2025-11-06
**목적**: 고속 발사체의 터널링(tunneling) 문제 해결

### 문제 상황

레이저(18 px/frame)가 너무 빨라서 한 프레임에 탱크를 완전히 통과:
```
프레임 1: [레이저] ----18px---→        [탱크]
프레임 2:                      [탱크]  [레이저] ← 충돌 감지 실패!
```

### 해결책: 서브스텝

한 프레임을 여러 개의 작은 스텝으로 분할:

```javascript
// Game.js update() 메서드
const SUBSTEPS = 2;  // 2x physics updates per frame
const substepDelta = deltaTime / SUBSTEPS;

for (let substep = 0; substep < SUBSTEPS; substep++) {
    // 물리 엔진 업데이트 (각 8.33ms)
    Matter.Engine.update(this.engine, substepDelta * 1000);

    // 발사체 업데이트 (각 서브스텝마다)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        this.projectiles[i].update(substepDelta);
        if (!this.projectiles[i].active) {
            this.projectiles.splice(i, 1);
        }
    }
}
```

### 효과

**이동 거리 감소**:
- 이전: 레이저가 18px 한 번에 이동
- 현재: 레이저가 9px씩 2번 이동

**충돌 정확도 향상**:
- 터널링 위험 50% 감소
- 고속 발사체도 정확히 감지

**성능 영향**:
- 물리 계산 2배 증가
- 오버헤드: ~1ms per frame (60 FPS → 59 FPS 수준)
- 게임 규모 작아서 무시 가능

### 서브스텝과 게임 로직

**서브스텝 내에서 실행**:
- 물리 엔진 업데이트 ✓
- 발사체 업데이트 ✓ (lifetime 계산 정확)

**서브스텝 밖에서 실행**:
- 탱크 업데이트 (1회만)
- AI 업데이트 (1회만)
- 파티클 업데이트 (1회만, 시각 효과)

### 배운 점

1. **서브스텝은 충돌 감지만 개선**
   - 물리적 충격 문제는 별도 해결 필요 (isSensor)

2. **게임 로직과 물리 분리**
   - AI는 1회/프레임으로 충분
   - 시각 효과는 정밀도 불필요

3. **미래 확장성**
   - 더 빠른 무기 추가 시 SUBSTEPS 증가 가능
   - 또는 isSensor로 해결

### 초기 속도 설정

```javascript
const actualSpeed = weaponData.speed * SPEED_SCALE_FACTOR;
const velocity = {
    x: Math.cos(angle) * actualSpeed,
    y: Math.sin(angle) * actualSpeed
};
Body.setVelocity(this.body, velocity);
```

### 생명주기

```javascript
update(deltaTime) {
    this.age += deltaTime;

    // 수명 또는 범위 초과 시 제거
    if (this.age >= this.lifetime || this.isOutOfBounds()) {
        this.destroy();
    }
}

isOutOfBounds() {
    const pos = this.body.position;
    return pos.x < 0 || pos.x > 960 || pos.y < 0 || pos.y > 720;
}
```
