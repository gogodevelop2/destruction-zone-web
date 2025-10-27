# Matter.js 물리 엔진 전환 계획 v2.0

**날짜**: 2025-10-27
**버전**: 2.0 (브레이크 시스템 기반 재설계)
**상태**: 계획 수립 완료

---

## 📋 목차

1. [이전 실패 분석 요약](#이전-실패-분석-요약)
2. [핵심 해결 전략](#핵심-해결-전략)
3. [상세 구현 계획](#상세-구현-계획)
4. [단계별 체크리스트](#단계별-체크리스트)
5. [테스트 및 검증](#테스트-및-검증)
6. [롤백 계획](#롤백-계획)

---

## 이전 실패 분석 요약

### ❌ 문제점

1. **속도가 너무 빠름**: 힘(force) 기반 가속이 과도하게 누적
2. **관성이 너무 큼**: 키를 떼도 계속 밀려다님
3. **회전이 멈추지 않음**: 회전 관성 제어 실패

### 🔍 근본 원인

**브레이크 시스템 미구현**이 핵심 문제였음!

```javascript
// ❌ 이전 시도 (실패)
if (thrustPower !== 0) {
    applyForce(thrust);  // 가속만
}
// 키를 떼면? → 아무것도 안 함 → Matter.js의 약한 frictionAir만 의존
// → 계속 밀려다님

// ✅ 새로운 접근
if (thrustPower !== 0) {
    applyForce(thrust);  // 가속
} else {
    applyForce(brake);   // 🔴 브레이크 작동!
}
```

### 💡 핵심 인사이트

원본 게임은 **실제 탱크 물리**를 시뮬레이션:
- 무한궤도 = 높은 마찰
- 큰 질량 = 큰 관성
- **능동적 브레이크** = 키 OFF 시 즉시 감속

---

## 핵심 해결 전략

### 3대 핵심 요소

#### 1. 🔴 능동적 브레이크 시스템 (최우선)

```javascript
updatePhysics(deltaTime) {
    // === 이동 ===
    if (키 입력 있음) {
        추진력 적용
    } else {
        브레이크 적용 ⭐⭐⭐
    }

    // === 회전 ===
    if (회전 입력 있음) {
        회전력 적용
    } else {
        회전 브레이크 적용 ⭐⭐⭐
    }
}
```

#### 2. ⚙️ 물리 바디 설정

```javascript
{
    // 무한궤도 시뮬레이션
    friction: 0.8,           // 높은 표면 마찰
    frictionStatic: 1.0,     // 정적 마찰
    frictionAir: 0.12,       // 지면 저항

    // 탱크 중량
    density: 0.08,           // 적절한 질량

    // 충돌 특성
    restitution: 0.1,        // 낮은 반발
    inertia: Infinity        // 충돌로 인한 회전 방지
}
```

#### 3. 🎯 원본 물리 값 직접 매핑

```javascript
// 원본 값 그대로 사용
thrustForce = speed * 200        // px/s²
maxSpeed = speed * 100           // px/s
rotationAccel = rotSpeed * 3     // rad/s²
maxAngularSpeed = rotSpeed * 5   // rad/s

// Matter.js 스케일 변환만 추가
matterForce = thrustForce * SCALE_FACTOR
```

---

## 상세 구현 계획

### Phase 1: 준비 및 테스트 환경 (0.5일)

#### 1.1 브랜치 생성 및 백업

```bash
# 현재 코드 백업
git add .
git commit -m "백업: Matter.js v2 시도 전"

# 새 브랜치 생성
git checkout -b matter-integration-v2

# 이전 Matter.js 코드 확인
# (주석으로 보존된 코드 활용)
```

#### 1.2 디버그 시스템 강화

**파일**: `js/main.js`

```javascript
// 디버그 모드 개선
window.debugMode = {
    physics: false,           // 'P' 키
    velocityVectors: false,   // 'V' 키
    stats: false,             // 'I' 키 (Info)
    comparison: false         // 'C' 키 (원본 vs Matter 비교)
};

// 실시간 통계 표시
renderDebugStats() {
    if (!debugMode.stats) return;

    const tank = tanks[0];
    const original = calculateOriginalPhysics(tank);
    const matter = tank.body;

    // 화면에 표시
    ctx.fillText(`원본 속도: ${original.speed}`, 10, 60);
    ctx.fillText(`Matter 속도: ${matter.speed}`, 10, 80);
    ctx.fillText(`차이: ${Math.abs(original.speed - matter.speed)}`, 10, 100);
}
```

#### 1.3 테스트 체크리스트 준비

**파일**: `MATTER_TEST_CHECKLIST.md` (새로 생성)

---

### Phase 2: Tank 물리 전환 (1.5일)

#### 2.1 Tank 클래스 수정

**파일**: `js/entities/tank.js`

##### 2.1.1 물리 바디 생성

```javascript
createPhysicsBody() {
    const size = this.stats.size * 0.8;

    // 삼각형 꼭짓점 (탱크 모양)
    const vertices = [
        { x: 0, y: -size },           // 앞
        { x: -size * 0.6, y: size * 0.5 },   // 왼쪽 뒤
        { x: size * 0.6, y: size * 0.5 }     // 오른쪽 뒤
    ];

    this.body = Matter.Bodies.fromVertices(
        this.x,
        this.y,
        vertices,
        {
            // === 무한궤도 시뮬레이션 ===
            friction: 0.8,           // 높은 표면 마찰
            frictionStatic: 1.0,     // 정적 마찰
            frictionAir: 0.12,       // 지면 저항 (브레이크 보조)

            // === 탱크 중량 ===
            density: 0.08,           // mass ≈ 70-90

            // === 충돌 특성 ===
            restitution: 0.1,        // 낮은 반발
            inertia: Infinity,       // 충돌로 인한 회전 차단

            // === 식별 ===
            label: `tank_${this.id}`,
            plugin: {
                tankId: this.id
            }
        },
        true  // flagInternal
    );

    // 초기 각도 설정
    Matter.Body.setAngle(this.body, this.angle);

    // 월드에 추가
    this.physics.addBody(this.body);

    console.log(`Tank ${this.id} body created: mass=${this.body.mass}`);
}
```

##### 2.1.2 브레이크 시스템 구현 ⭐

```javascript
// 브레이크 상수 (클래스 최상단)
static BRAKE_STRENGTH = 12.0;      // 이동 브레이크 (조정 필요)
static ROTATION_BRAKE = 0.4;       // 회전 브레이크 (조정 필요)
static FORCE_SCALE = 0.00008;      // Matter.js 힘 스케일

updateWithMatterPhysics(deltaTime) {
    if (!this.body) return;

    const body = this.body;
    const stats = this.stats;

    // ========================================
    // 1. 추진 또는 브레이크
    // ========================================

    if (this.thrustPower !== 0) {
        // === 추진 중 ===

        // 원본 물리 값 그대로 사용
        const thrustMagnitude = this.thrustPower * stats.speed * 200;

        // 추진 방향 (탱크가 향하는 방향)
        const thrustDir = Physics.fromAngle(body.angle, 1);

        // Matter.js 힘으로 변환
        const force = {
            x: thrustDir.x * thrustMagnitude * Tank.FORCE_SCALE,
            y: thrustDir.y * thrustMagnitude * Tank.FORCE_SCALE
        };

        Matter.Body.applyForce(body, body.position, force);

    } else {
        // === 브레이크 작동 🔴 ===

        // 현재 속도에 비례한 브레이크 힘
        const currentSpeed = Math.sqrt(
            body.velocity.x ** 2 + body.velocity.y ** 2
        );

        if (currentSpeed > 0.1) {  // 최소 속도 이상일 때만
            const brakeForce = {
                x: -body.velocity.x * Tank.BRAKE_STRENGTH * Tank.FORCE_SCALE,
                y: -body.velocity.y * Tank.BRAKE_STRENGTH * Tank.FORCE_SCALE
            };

            Matter.Body.applyForce(body, body.position, brakeForce);
        } else {
            // 완전 정지
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
        }
    }

    // ========================================
    // 2. 회전 또는 회전 브레이크
    // ========================================

    if (this.rotationPower !== 0) {
        // === 회전 중 ===

        // 원본 물리 값 그대로 사용
        const rotationAccel = this.rotationPower * stats.rotationSpeed * 3 * deltaTime;

        // 각속도에 가속도 추가
        const newAngularVel = body.angularVelocity + rotationAccel;

        // 최대 회전 속도 제한
        const maxAngularSpeed = stats.rotationSpeed * 5;
        const clampedAngularVel = Math.max(
            -maxAngularSpeed,
            Math.min(maxAngularSpeed, newAngularVel)
        );

        Matter.Body.setAngularVelocity(body, clampedAngularVel);

    } else {
        // === 회전 브레이크 🔴 ===

        if (Math.abs(body.angularVelocity) > 0.01) {
            // 회전 속도에 비례한 브레이크
            const angularBrake = body.angularVelocity * Tank.ROTATION_BRAKE;
            Matter.Body.setAngularVelocity(
                body,
                body.angularVelocity - angularBrake
            );
        } else {
            // 완전 정지
            Matter.Body.setAngularVelocity(body, 0);
        }
    }

    // ========================================
    // 3. 속도 제한 (안전장치)
    // ========================================

    // 최대 이동 속도
    const maxSpeed = stats.speed * 100;
    const currentSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);

    if (currentSpeed > maxSpeed) {
        const scale = maxSpeed / currentSpeed;
        Matter.Body.setVelocity(body, {
            x: body.velocity.x * scale,
            y: body.velocity.y * scale
        });
    }

    // ========================================
    // 4. 동기화
    // ========================================

    this.x = body.position.x;
    this.y = body.position.y;
    this.angle = body.angle;
    this.velocity = { ...body.velocity };
    this.angularVelocity = body.angularVelocity;
}
```

##### 2.1.3 update() 메서드 수정

```javascript
update(deltaTime) {
    if (!this.isAlive) return;

    // Matter.js 물리 업데이트
    this.updateWithMatterPhysics(deltaTime);

    // 에너지 재생
    this.updateEnergy(deltaTime);

    // 무기 쿨다운
    if (this.weaponCooldown > 0) {
        this.weaponCooldown -= deltaTime;
    }
}
```

#### 2.2 Physics 클래스 수정

**파일**: `js/core/physics.js`

```javascript
// Matter.js 초기화 부분 주석 해제 및 수정

constructor(width, height) {
    this.width = width;
    this.height = height;

    // Matter.js 엔진 생성
    this.engine = Matter.Engine.create({
        gravity: { x: 0, y: 0 }  // 탑다운 뷰 (중력 없음)
    });

    this.world = this.engine.world;

    // 경계벽 생성
    this.createBoundaries();

    console.log('Physics: Matter.js engine initialized');
}

createBoundaries() {
    const wallThickness = 50;
    const options = {
        isStatic: true,
        friction: 0.8,
        restitution: 0.1,
        label: 'wall'
    };

    const walls = [
        // 위
        Matter.Bodies.rectangle(
            this.width / 2, -wallThickness / 2,
            this.width, wallThickness, options
        ),
        // 아래
        Matter.Bodies.rectangle(
            this.width / 2, this.height + wallThickness / 2,
            this.width, wallThickness, options
        ),
        // 왼쪽
        Matter.Bodies.rectangle(
            -wallThickness / 2, this.height / 2,
            wallThickness, this.height, options
        ),
        // 오른쪽
        Matter.Bodies.rectangle(
            this.width + wallThickness / 2, this.height / 2,
            wallThickness, this.height, options
        )
    ];

    Matter.World.add(this.world, walls);
}

update(deltaTime) {
    // Matter.js 시뮬레이션 업데이트
    // deltaTime을 밀리초로 변환 (Matter.js는 ms 단위 사용)
    Matter.Engine.update(this.engine, deltaTime * 1000);
}

addBody(body) {
    Matter.World.add(this.world, body);
}

removeBody(body) {
    Matter.World.remove(this.world, body);
}
```

#### 2.3 GameEngine 수정

**파일**: `js/core/engine.js`

```javascript
update(deltaTime) {
    if (this.isPaused) return;

    // 1. Matter.js 물리 시뮬레이션
    this.physics.update(deltaTime);

    // 2. 탱크 업데이트 (Matter.js 기반)
    this.tanks.forEach(tank => tank.update(deltaTime));

    // 3. 프로젝타일 업데이트 (원본 물리)
    this.projectiles.forEach(proj => proj.update(deltaTime));

    // 4. 폭발 효과
    this.explosions.forEach(exp => exp.update(deltaTime));

    // 5. AI 업데이트
    this.updateAI(deltaTime);

    // 6. 충돌 감지 (Matter.js 이벤트 사용)
    // physics.js의 충돌 이벤트로 처리됨

    // 7. 라운드 시스템
    this.updateRound(deltaTime);

    // 8. 정리
    this.cleanupEntities();
}
```

---

### Phase 3: 충돌 시스템 전환 (0.5일)

#### 3.1 Matter.js 충돌 이벤트 설정

**파일**: `js/core/physics.js`

```javascript
setupCollisions() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;

            // Tank ↔ Tank 충돌
            if (bodyA.label.startsWith('tank_') && bodyB.label.startsWith('tank_')) {
                this.handleTankTankCollision(bodyA, bodyB, pair);
            }

            // Projectile ↔ Tank 충돌
            if (this.isProjectile(bodyA) && this.isTank(bodyB)) {
                this.handleProjectileTankCollision(bodyA, bodyB);
            }
            if (this.isTank(bodyA) && this.isProjectile(bodyB)) {
                this.handleProjectileTankCollision(bodyB, bodyA);
            }

            // Projectile ↔ Wall 충돌
            if (this.isProjectile(bodyA) && bodyB.label === 'wall') {
                this.handleProjectileWallCollision(bodyA);
            }
            if (bodyA.label === 'wall' && this.isProjectile(bodyB)) {
                this.handleProjectileWallCollision(bodyB);
            }
        });
    });
}

handleTankTankCollision(bodyA, bodyB, pair) {
    // 충돌 강도 계산
    const collision = pair.collision;
    const impactVelocity = collision.depth;

    // 충격 데미지 (빠른 충돌일수록 큰 데미지)
    if (impactVelocity > 2) {
        const damage = Math.floor(impactVelocity * 0.5);

        // 콜백 호출 (GameEngine에서 설정)
        if (this.onTankCollision) {
            this.onTankCollision(bodyA, bodyB, damage);
        }
    }
}
```

**파일**: `js/core/engine.js`

```javascript
constructor(canvas, state) {
    // ...

    // 충돌 콜백 설정
    this.physics.onTankCollision = (bodyA, bodyB, damage) => {
        const tankA = this.getTankByBody(bodyA);
        const tankB = this.getTankByBody(bodyB);

        if (tankA && tankB) {
            tankA.takeDamage(damage);
            tankB.takeDamage(damage);

            console.log(`Tank collision: ${damage} damage`);
        }
    };
}

getTankByBody(body) {
    return this.tanks.find(tank => tank.body === body);
}
```

---

### Phase 4: 브레이크 튜닝 (1일)

#### 4.1 실시간 파라미터 조정 UI

**파일**: `js/main.js`

```javascript
// 디버그 UI 추가
const tuningParams = {
    BRAKE_STRENGTH: 12.0,
    ROTATION_BRAKE: 0.4,
    FORCE_SCALE: 0.00008,
    friction: 0.8,
    frictionAir: 0.12,
    density: 0.08
};

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    if (!window.debugMode.tuning) return;

    switch(e.key) {
        case '1':  // BRAKE_STRENGTH 증가
            tuningParams.BRAKE_STRENGTH += 1;
            updateTankParams();
            console.log(`BRAKE_STRENGTH: ${tuningParams.BRAKE_STRENGTH}`);
            break;
        case '2':  // BRAKE_STRENGTH 감소
            tuningParams.BRAKE_STRENGTH -= 1;
            updateTankParams();
            console.log(`BRAKE_STRENGTH: ${tuningParams.BRAKE_STRENGTH}`);
            break;
        // ... 다른 파라미터들
    }
});

function updateTankParams() {
    Tank.BRAKE_STRENGTH = tuningParams.BRAKE_STRENGTH;
    Tank.ROTATION_BRAKE = tuningParams.ROTATION_BRAKE;
    Tank.FORCE_SCALE = tuningParams.FORCE_SCALE;
}
```

#### 4.2 원본 vs Matter 비교 테스트

**테스트 시나리오**:

1. **정지 거리 테스트**
   - 최고 속도에서 키 OFF
   - 정지까지 걸린 시간 측정
   - 원본: ~1초 / Matter: ~1초 (목표)

2. **가속 시간 테스트**
   - 정지 상태에서 최고 속도까지
   - 원본: ~0.5초 / Matter: ~0.5초 (목표)

3. **회전 응답성 테스트**
   - 제자리 180도 회전 시간
   - 회전 정지 시간

4. **조작감 주관 평가**
   - 원본 DOS 게임 플레이 영상과 비교
   - 개발자 직접 플레이 테스트

#### 4.3 자동 튜닝 스크립트 (선택)

```javascript
// 자동으로 최적 파라미터 찾기
async function autoTune() {
    const testCases = [
        { brake: 10, rotation: 0.3 },
        { brake: 12, rotation: 0.4 },
        { brake: 15, rotation: 0.5 },
        { brake: 18, rotation: 0.6 },
        { brake: 20, rotation: 0.7 }
    ];

    for (const params of testCases) {
        Tank.BRAKE_STRENGTH = params.brake;
        Tank.ROTATION_BRAKE = params.rotation;

        const score = await runTest();
        console.log(`Params: ${JSON.stringify(params)}, Score: ${score}`);
    }
}
```

---

### Phase 5: Projectile 전환 (0.5일)

#### 5.1 간단한 발사체는 원본 물리 유지

```javascript
// Projectile 클래스는 원본 물리 유지
// 이유:
// 1. 발사체는 등속 직선 운동 (간단함)
// 2. Matter.js로 전환해도 이득 없음
// 3. 성능 오버헤드만 증가

// 단, 충돌 감지는 Matter.js 사용 가능 (선택)
```

#### 5.2 특수 발사체만 Matter.js (선택)

```javascript
// 폭탄, 유도탄 등 특수 무기는 Matter.js Body로 구현 가능
// 예: NORMAL BOMB (정지된 폭탄)
createBombBody() {
    this.body = Matter.Bodies.circle(this.x, this.y, this.radius, {
        isStatic: true,  // 움직이지 않음
        isSensor: true,  // 충돌 감지만
        label: 'bomb'
    });
}
```

---

## 단계별 체크리스트

### Phase 1: 준비 ✅

- [ ] Git 브랜치 생성 (`matter-integration-v2`)
- [ ] 현재 코드 백업 커밋
- [ ] 디버그 시스템 강화 (`debugMode` 객체)
- [ ] 실시간 통계 UI 추가
- [ ] 테스트 체크리스트 문서 생성

### Phase 2: Tank 물리 전환 ✅

- [ ] `Tank.createPhysicsBody()` 구현
  - [ ] 삼각형 vertices 생성
  - [ ] 물리 속성 설정 (friction, density 등)
  - [ ] Matter.js World에 추가
- [ ] `Tank.updateWithMatterPhysics()` 구현
  - [ ] 추진력 적용 로직
  - [ ] **브레이크 시스템 구현** ⭐
  - [ ] 회전 로직
  - [ ] **회전 브레이크 구현** ⭐
  - [ ] 속도 제한
  - [ ] 동기화
- [ ] `Tank.update()` 메서드 수정
- [ ] `Physics` 클래스 Matter.js 초기화
- [ ] `GameEngine.update()` 수정

### Phase 3: 충돌 시스템 ✅

- [ ] `Physics.setupCollisions()` 구현
- [ ] Tank ↔ Tank 충돌 이벤트
- [ ] Projectile ↔ Tank 충돌 (원본 방식 유지 가능)
- [ ] Wall 경계 충돌
- [ ] GameEngine 충돌 콜백 연결

### Phase 4: 브레이크 튜닝 ✅

- [ ] 실시간 파라미터 조정 UI
- [ ] 정지 거리 테스트
- [ ] 가속 시간 테스트
- [ ] 회전 응답성 테스트
- [ ] 원본 vs Matter 비교 영상 녹화
- [ ] 최적 파라미터 결정
  - [ ] `BRAKE_STRENGTH`: ?
  - [ ] `ROTATION_BRAKE`: ?
  - [ ] `FORCE_SCALE`: ?
  - [ ] `friction`: ?
  - [ ] `frictionAir`: ?

### Phase 5: Projectile (선택) ✅

- [ ] 간단한 발사체는 원본 물리 유지로 결정
- [ ] 특수 발사체 (폭탄 등) Matter.js 전환 (선택)

### Phase 6: 최종 검증 ✅

- [ ] 모든 무기 타입 테스트
- [ ] AI 동작 확인
- [ ] 상점 시스템 연동 확인
- [ ] 성능 프로파일링 (60 FPS 유지)
- [ ] 메모리 누수 체크
- [ ] 여러 탱크 타입 테스트

---

## 테스트 및 검증

### 테스트 환경

```bash
# 로컬 서버 실행
cd /Users/joejeon/Documents/develop/destruction-zone-web
python3 -m http.server 8080

# 브라우저
http://localhost:8080

# 디버그 모드 활성화
- P키: 물리 디버그 렌더링
- V키: 속도 벡터 표시
- I키: 실시간 통계
- C키: 원본 vs Matter 비교
- T키: 튜닝 모드 (파라미터 조정)
```

### 정량적 테스트

#### 1. 정지 거리 테스트

```javascript
// 테스트 시나리오
function testStopDistance() {
    const tank = createTank();

    // 1. 최고 속도까지 가속
    accelerateToMaxSpeed(tank);

    // 2. 키 OFF
    const startPos = tank.position;
    const startTime = performance.now();

    // 3. 완전 정지까지 대기
    waitUntilStop(tank, () => {
        const stopTime = performance.now();
        const stopDistance = distance(startPos, tank.position);

        console.log(`정지 시간: ${stopTime - startTime}ms`);
        console.log(`정지 거리: ${stopDistance}px`);

        // 원본과 비교
        const originalStopTime = 1000;  // 1초 (예상)
        const diff = Math.abs(stopTime - startTime - originalStopTime);
        console.log(`원본과 차이: ${diff}ms`);
    });
}
```

**목표**:
- 정지 시간: 800ms ~ 1200ms (원본: ~1초)
- 정지 거리: 비슷한 수준

#### 2. 가속 시간 테스트

```javascript
function testAcceleration() {
    const tank = createTank();
    const maxSpeed = tank.stats.speed * 100;

    const startTime = performance.now();

    // 최고 속도 도달까지
    waitUntilMaxSpeed(tank, maxSpeed, () => {
        const accelTime = performance.now() - startTime;
        console.log(`가속 시간: ${accelTime}ms`);

        // 원본: ~500ms
        const originalAccelTime = 500;
        const diff = Math.abs(accelTime - originalAccelTime);
        console.log(`원본과 차이: ${diff}ms`);
    });
}
```

**목표**:
- 가속 시간: 400ms ~ 600ms (원본: ~500ms)

#### 3. 회전 테스트

```javascript
function testRotation() {
    const tank = createTank();

    // 180도 회전 시간
    const targetAngle = Math.PI;
    const startTime = performance.now();

    rotateUntil(tank, targetAngle, () => {
        const rotateTime = performance.now() - startTime;
        console.log(`180도 회전 시간: ${rotateTime}ms`);
    });

    // 회전 정지 시간
    startRotation(tank);
    const stopStartTime = performance.now();

    stopRotation(tank);
    waitUntilRotationStop(tank, () => {
        const stopTime = performance.now() - stopStartTime;
        console.log(`회전 정지 시간: ${stopTime}ms`);
    });
}
```

### 정성적 테스트

#### 1. 조작감 평가 (주관적)

- [ ] 키 입력 반응성: 즉각적인가?
- [ ] 관성 느낌: 너무 무겁거나 가볍지 않은가?
- [ ] 브레이크 강도: 자연스럽게 멈추는가?
- [ ] 회전 반응: 부드럽고 정확한가?
- [ ] 전체 느낌: 원본 게임과 유사한가?

#### 2. 원본 게임 비교

```
원본 DOS 게임 (DOSBox):
- /dzone-v1.3/DZONE.EXE 실행
- 플레이 영상 녹화
- 움직임 패턴 관찰

Matter.js 버전:
- 같은 조작으로 플레이
- 영상 나란히 비교
- 차이점 기록
```

---

## 성공 기준

### 필수 조건 (Must Have)

1. ✅ **정지 시간**: 원본 ±30% 이내
2. ✅ **가속 시간**: 원본 ±30% 이내
3. ✅ **60 FPS 유지**: 탱크 2대 + 발사체 20개
4. ✅ **충돌 정확도**: 100% (빠진 충돌 없음)
5. ✅ **버그 없음**: 벽 관통, 이상 움직임 등

### 선호 조건 (Nice to Have)

1. ⭐ **조작감**: 원본과 거의 구분 불가
2. ⭐ **회전 정지**: 원본 ±30% 이내
3. ⭐ **충돌 반응**: 자연스러운 밀림
4. ⭐ **성능**: 탱크 4대 이상에서도 60 FPS

---

## 롤백 계획

### 롤백 조건

다음 중 하나라도 해당 시 롤백:

1. ❌ 3일 이상 소요 (예상: 3.5일)
2. ❌ 정지 시간 차이 > 50%
3. ❌ 성능 < 50 FPS (탱크 2대)
4. ❌ 조작감이 원본과 너무 다름
5. ❌ 해결 불가능한 버그 발생

### 롤백 절차

```bash
# 1. 원본 브랜치로 복귀
git checkout main

# 2. matter-integration-v2 브랜치 보관
git branch matter-integration-v2-failed

# 3. 원본 물리 엔진 확인
# 정상 작동 확인

# 4. 실패 원인 문서화
# MATTER_INTEGRATION_ANALYSIS.md 업데이트
```

### 실패 시 대안

1. **하이브리드 접근**: 이동은 원본, 충돌만 Matter.js
2. **다른 물리 엔진**: Planck.js, p2.js 검토
3. **원본 물리 개선**: 자체 엔진 최적화
4. **포기**: 원본 물리 엔진으로 계속 개발

---

## 예상 파라미터 값

### 초기 설정 (실험 시작점)

```javascript
// Tank 클래스
static BRAKE_STRENGTH = 12.0;      // 조정 필요 (10-20 예상)
static ROTATION_BRAKE = 0.4;       // 조정 필요 (0.3-0.7 예상)
static FORCE_SCALE = 0.00008;      // 조정 필요 (0.00005-0.0002 예상)

// Matter.js Body
{
    friction: 0.8,           // 조정 필요 (0.5-1.0)
    frictionStatic: 1.0,     // 고정
    frictionAir: 0.12,       // 조정 필요 (0.1-0.2)
    density: 0.08,           // 조정 필요 (0.05-0.15)
    restitution: 0.1,        // 고정
    inertia: Infinity        // 고정
}
```

### 튜닝 가이드

#### BRAKE_STRENGTH가 너무 높으면:
- 너무 빨리 멈춤
- 부자연스러움
- **해결**: 값 감소 (10으로)

#### BRAKE_STRENGTH가 너무 낮으면:
- 계속 미끄러짐
- 관성이 너무 큼
- **해결**: 값 증가 (15-20으로)

#### ROTATION_BRAKE가 너무 높으면:
- 회전이 뚝뚝 끊김
- 부자연스러움
- **해결**: 값 감소 (0.3으로)

#### ROTATION_BRAKE가 너무 낮으면:
- 회전이 안 멈춤
- 제어 불가
- **해결**: 값 증가 (0.6-0.7으로)

#### FORCE_SCALE이 너무 높으면:
- 가속이 너무 빠름
- 폭발적 움직임
- **해결**: 값 감소 (0.00005로)

#### FORCE_SCALE이 너무 낮으면:
- 움직이지 않음
- 느린 가속
- **해결**: 값 증가 (0.0001-0.0002로)

---

## 타임라인

### Day 1 (전반)
- Phase 1: 준비 및 테스트 환경 (0.5일)

### Day 1 (후반) ~ Day 2
- Phase 2: Tank 물리 전환 (1.5일)

### Day 3 (전반)
- Phase 3: 충돌 시스템 전환 (0.5일)

### Day 3 (후반) ~ Day 4
- Phase 4: 브레이크 튜닝 (1일)

### Day 4 (말)
- Phase 5: Projectile (선택, 0.5일)
- 최종 검증 및 문서화

**총 예상 시간**: 3.5 ~ 4일

---

## 핵심 포인트 요약

### 🔴 최우선 과제

1. **브레이크 시스템 구현** (이전 실패 원인)
2. **원본 물리 값 직접 사용** (변환 최소화)
3. **실시간 튜닝 도구** (빠른 반복)

### ⚙️ 중요 설정

- `friction: 0.8` - 무한궤도 마찰
- `frictionAir: 0.12` - 지면 저항
- `BRAKE_STRENGTH: 12.0` - 브레이크 강도
- `ROTATION_BRAKE: 0.4` - 회전 브레이크

### 📊 성공 지표

- 정지 시간: ~1초 (원본과 유사)
- 가속 시간: ~0.5초 (원본과 유사)
- 성능: 60 FPS 유지
- 조작감: 원본과 거의 동일

### 🚨 롤백 조건

- 3일 초과
- 성능 < 50 FPS
- 조작감 너무 다름
- 해결 불가 버그

---

**문서 버전**: 2.0
**작성 날짜**: 2025-10-27
**참조 문서**:
- `MATTER_INTEGRATION_ANALYSIS.md` - 이전 실패 분석
- `MATTER_TANK_PHYSICS_PLAN.md` - 탱크 물리 이론
- `PHYSICS_REFERENCE.md` - 원본 물리 레퍼런스
- `CHANGELOG.md` - 개발 이력

---

**🎯 이번에는 성공한다! 핵심은 브레이크다!**
