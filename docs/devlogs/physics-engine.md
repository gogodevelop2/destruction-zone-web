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

```javascript
const isLaser = (weaponData.type === 'LASER');

this.body = Bodies.circle(x, y, weaponData.size, {
    isSensor: false,  // 모두 물리 바디
    density: isLaser ? 0.001 : 0.4,  // 레이저는 밀도 낮게
    frictionAir: 0,
    restitution: 0,
    friction: 0.1
});
```

**레이저 특성:**
- 밀도 0.001 (거의 없음)
- 탱크를 밀지 않음
- 빠른 속도

**미사일 특성:**
- 밀도 0.4 (일반)
- 탱크와 물리적 상호작용
- 느린 속도

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
