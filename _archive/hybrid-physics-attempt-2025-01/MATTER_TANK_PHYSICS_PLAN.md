# Matter.js 탱크 물리 재설계 계획

**날짜**: 2025-10-27
**개정**: 실제 탱크 물리 기반 접근

---

## 기존 분석의 오류

❌ **잘못된 이해**: 원본 게임 = 아케이드 스타일, 관성 없음
✅ **올바른 이해**: 원본 게임 = **실제 탱크 물리 시뮬레이션**

---

## 실제 탱크의 물리적 특성

### 1. 무한궤도 시스템

```
[탱크 중량: 수십 톤]
       ↓
[무한궤도 ↔ 지면]
  - 접지 면적: 매우 넓음
  - 마찰 계수: 매우 높음 (μ ≈ 0.8-1.0)
  - 결과: 미끄러짐 거의 없음
```

**특징**:
- 접지력이 타이어의 수배
- 급가속/급정지 가능
- 제자리 회전 가능
- 험지 주행 가능

### 2. 중량과 관성

```
질량(m) = 30-60톤
관성(I) = m × r²  (매우 큼)
```

**하지만**:
```
마찰력(F) = μ × N = μ × mg
         = 0.9 × 30톤 × 9.8m/s²
         = 264,600 N  (엄청난 마찰력!)

감속도 = F / m = μ × g ≈ 8.8 m/s²
```

**결론**:
- 큰 질량 → 큰 관성
- BUT 큰 마찰 → 빠른 감속
- **관성보다 마찰이 지배적**

### 3. 브레이크 시스템

**일반 차량**:
- 액셀 OFF → 엔진 브레이크 (약함)
- 브레이크 ON → 강제 정지

**탱크**:
- 무한궤도 정지 → 즉시 브레이크 (매우 강함)
- 양쪽 궤도 역회전 → 제자리 회전
- 한쪽 궤도 정지 → 선회

---

## 원본 물리엔진의 실제 의미

### 마찰 계수

```javascript
velocity *= Math.pow(0.95, deltaTime * 60)
// 60fps 기준: 매 프레임 5% 감속
```

**물리적 의미**:
```
감속률 5%/frame = 5% × 60fps = 300%/s (비현실적?)
아니다! 이것은 브레이크다:

브레이크 감속도 ≈ 8.8 m/s²
초당 속도 변화 = 8.8 m/s
비율로 환산 = 8.8 / v₀

v₀ = 100 px/s = 약 3 m/s라면
감속 비율 = 8.8 / 3 ≈ 293%/s ✓

매우 정확한 시뮬레이션!
```

### 회전 마찰

```javascript
angularVelocity *= 0.9
// 매 프레임 10% 감속
```

**물리적 의미**:
```
제자리 회전 시:
- 양쪽 궤도가 반대로 회전
- 정지 시 양쪽 동시 브레이크
- 회전 관성 모멘트가 크지만
- 브레이크 토크도 매우 큼
- 결과: 빠른 정지
```

---

## Matter.js 재설계 전략

### 핵심 원칙

1. ✅ **높은 마찰** (무한궤도 ↔ 지면)
2. ✅ **큰 질량** (수십 톤 탱크)
3. ✅ **능동 브레이크** (키 OFF 시)

### 설정값 매핑

#### 1. 바닥 마찰 (Ground Friction)

```javascript
// Matter.js 설정
{
    friction: 0.9,           // 정지 마찰 계수 (매우 높음)
    frictionStatic: 1.0,     // 정적 마찰 계수

    // 주의: friction은 표면 간 마찰
    // 탱크가 지면에 닿을 때만 작동
}
```

**문제**: Matter.js에서 무한궤도 시뮬레이션 불가
**해결**: `frictionAir`로 대체

```javascript
{
    frictionAir: 0.15,  // 공기 저항이 아닌 "지면 저항"으로 해석
    // 실제로는 궤도-지면 마찰을 근사
}
```

#### 2. 중량 (Mass)

```javascript
{
    density: 0.1,  // 밀도 높임
    // 또는
    mass: 100,     // 직접 질량 설정
}

// 탱크 크기 = 30px × 30px ≈ 900px²
// density = 0.1 → mass ≈ 90
// 상대적으로 무거운 물체
```

#### 3. 브레이크 (Active Braking)

**핵심**: 키 입력이 없을 때 **능동적으로 감속**

```javascript
updateWithMatter(deltaTime) {
    if (this.thrustPower !== 0) {
        // 가속 중
        const force = calculateThrust();
        Body.applyForce(body, position, force);

    } else {
        // 브레이크 작동!
        const brakeForce = {
            x: -body.velocity.x * BRAKE_STRENGTH,
            y: -body.velocity.y * BRAKE_STRENGTH
        };
        Body.applyForce(body, position, brakeForce);
    }

    if (this.rotationPower !== 0) {
        // 회전 중
        Body.setAngularVelocity(body, targetAngularVelocity);

    } else {
        // 회전 브레이크!
        const brakeTorque = -body.angularVelocity * ROTATION_BRAKE;
        Body.setAngularVelocity(
            body,
            body.angularVelocity + brakeTorque
        );
    }
}
```

---

## 구체적인 Matter.js 설정값

### 물리 바디 설정

```javascript
createPhysicsBody() {
    const size = this.stats.size * 0.8;
    const vertices = [...]; // 삼각형

    this.body = Matter.Bodies.fromVertices(x, y, vertices, {
        // 1. 마찰 (무한궤도 ↔ 지면)
        friction: 0.9,           // 표면 마찰 (높음)
        frictionStatic: 1.0,     // 정적 마찰 (매우 높음)
        frictionAir: 0.15,       // 지면 저항 (높음)

        // 2. 중량
        density: 0.1,            // 밀도 (높음)
        // 결과 mass ≈ 90 (size 30 기준)

        // 3. 관성
        inertia: Infinity,       // 충돌로 인한 회전 차단
        // 회전은 오직 엔진으로만

        // 4. 반발
        restitution: 0.1,        // 반발 거의 없음 (탱크는 안 튐)

        label: `tank_${this.id}`
    });
}
```

### 브레이크 상수

```javascript
// 브레이크 강도 (원본: velocity *= 0.95)
// 1프레임에 5% 감속 = 60fps에서 300%/s
const BRAKE_STRENGTH = 15.0;  // 경험적 조정 필요

// 회전 브레이크 (원본: angularVelocity *= 0.9)
// 1프레임에 10% 감속 = 60fps에서 600%/s
const ROTATION_BRAKE = 0.5;   // 경험적 조정 필요
```

### 움직임 업데이트

```javascript
updateWithMatter(deltaTime) {
    const body = this.body;

    // === 추진 또는 브레이크 ===
    if (this.thrustPower !== 0) {
        // 추진력 계산 (원본: speed * 200)
        const thrustMagnitude = this.thrustPower * this.stats.speed * 200;
        const thrustDirection = Physics.fromAngle(body.angle, 1);

        // Matter.js 힘으로 변환
        // F = m × a
        // a = 200 px/s²
        // m ≈ 90
        // F = 18000 (Matter.js 단위)
        const force = {
            x: thrustDirection.x * thrustMagnitude * 0.0001,
            y: thrustDirection.y * thrustMagnitude * 0.0001
        };

        Matter.Body.applyForce(body, body.position, force);
    } else {
        // 브레이크 작동
        const brakeForce = {
            x: -body.velocity.x * BRAKE_STRENGTH * 0.0001,
            y: -body.velocity.y * BRAKE_STRENGTH * 0.0001
        };

        Matter.Body.applyForce(body, body.position, brakeForce);
    }

    // === 회전 또는 회전 브레이크 ===
    if (this.rotationPower !== 0) {
        // 회전 가속 (원본: rotationSpeed * 3 * deltaTime)
        const rotationAccel = this.rotationPower * this.stats.rotationSpeed * 3 * deltaTime;
        Matter.Body.setAngularVelocity(
            body,
            body.angularVelocity + rotationAccel
        );
    } else {
        // 회전 브레이크
        const angularBrake = body.angularVelocity * ROTATION_BRAKE;
        Matter.Body.setAngularVelocity(
            body,
            body.angularVelocity - angularBrake
        );
    }

    // === 속도 제한 ===
    const maxSpeed = this.stats.speed * 100;
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    if (speed > maxSpeed) {
        Matter.Body.setVelocity(body, {
            x: body.velocity.x * maxSpeed / speed,
            y: body.velocity.y * maxSpeed / speed
        });
    }

    const maxAngularSpeed = this.stats.rotationSpeed * 5;
    if (Math.abs(body.angularVelocity) > maxAngularSpeed) {
        Matter.Body.setAngularVelocity(
            body,
            Math.sign(body.angularVelocity) * maxAngularSpeed
        );
    }

    // 엔티티 속성 동기화
    this.physics.syncEntityToBody(this);
}
```

---

## 조정 가능한 파라미터

### 1차 조정 (물리 바디)

```javascript
friction: 0.5 ~ 1.0          // 표면 마찰
frictionAir: 0.1 ~ 0.2       // 지면 저항
density: 0.05 ~ 0.2          // 질량
restitution: 0 ~ 0.2         // 반발
```

### 2차 조정 (브레이크)

```javascript
BRAKE_STRENGTH: 10 ~ 20      // 이동 브레이크
ROTATION_BRAKE: 0.3 ~ 0.7    // 회전 브레이크
```

### 3차 조정 (힘 변환)

```javascript
thrustForce * 0.00005 ~ 0.0002   // 추진력 스케일
rotationAccel 직접 사용           // 회전 가속
```

---

## 테스트 계획

### Phase 1: 기본 설정
1. 위 설정값으로 구현
2. 움직임 테스트
3. 원본과 비교

### Phase 2: 미세 조정
1. BRAKE_STRENGTH 조정
2. frictionAir 조정
3. density 조정

### Phase 3: 충돌 테스트
1. Tank ↔ Tank 충돌
2. Tank ↔ Wall 충돌
3. 반발 확인

### Phase 4: 최종 검증
1. 원본 게임 플레이 영상과 비교
2. 가속 시간 측정
3. 정지 시간 측정
4. 회전 속도 측정

---

## 예상 결과

✅ **브레이크 구현**으로 빠른 정지
✅ **높은 마찰**로 미끄러짐 없음
✅ **적절한 질량**으로 충돌 시 현실적 반응
✅ **원본과 유사한 조작감**

---

## 핵심 교훈

**잘못된 접근**:
- Matter.js = 현실 물리, 원본 = 아케이드
- Matter.js는 관성이 큼 → 사용 불가

**올바른 접근**:
- Matter.js = 현실 물리, 원본 = 현실 물리 (탱크)
- **브레이크 시스템 추가**로 해결 가능
- 실제 탱크 = 큰 마찰 + 능동 브레이크

---

**문서 버전**: 2.0
**작성 날짜**: 2025-10-27 (개정)
**참조**: 실제 탱크 물리학
