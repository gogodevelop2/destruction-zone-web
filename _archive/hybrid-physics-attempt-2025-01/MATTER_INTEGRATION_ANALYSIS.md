# Matter.js 통합 실패 원인 분석

**날짜**: 2025-10-27
**상태**: 보류 (원래 물리엔진으로 복원됨)

---

## 문제 증상

Matter.js 전환 후 발생한 조작감 문제:

1. ❌ **탱크 이동 속도가 훨씬 빠름**
2. ❌ **가속도와 관성이 너무 큼** - 한번 움직이면 계속 밀려다님
3. ❌ **회전이 빨리 멈추지 않음** - 회전 관성 과다

---

## 근본 원인 분석

### 1. 물리 시뮬레이션 방식의 근본적 차이

#### 원본 자체 물리엔진 (Kinematic 방식)
```javascript
// 속도를 직접 조작 (Kinematic Control)
velocity += force * deltaTime        // 즉각 반영
velocity *= friction                 // 즉각 감속
position += velocity * deltaTime     // 위치 업데이트
```

**특징**:
- 키 입력 → 속도에 **즉각 반영**
- 마찰 → 속도에 **즉각 적용**
- 관성 없음 (키를 떼면 빠르게 멈춤)
- 아케이드 스타일 조작감

#### Matter.js 물리엔진 (Dynamic Simulation)
```javascript
// 힘을 누적하여 시뮬레이션 (Realistic Physics)
Body.applyForce(body, position, force)  // 힘 누적
// Matter.js 엔진이 자동으로:
// - 힘 → 가속도 (F = ma)
// - 가속도 → 속도 누적
// - 속도 → 위치
// - 마찰 적용 (점진적)
```

**특징**:
- 키 입력 → 힘 누적 → **점진적 가속**
- 마찰 → **점진적 감속** (관성 유지)
- 현실적인 물리 시뮬레이션
- 시뮬레이터 스타일 조작감

---

### 2. 구체적인 문제점

#### 문제 1: 속도가 훨씬 빠른 이유

**원본 물리 계산**:
```javascript
// thrustForce = 200 px/s²
velocity += thrustForce * deltaTime
// deltaTime = 0.016 (60fps)
// 매 프레임 velocity += 200 * 0.016 = 3.2 px/s

// 마찰 (매 프레임)
velocity *= Math.pow(0.95, deltaTime * 60)
velocity *= 0.95  // 5% 감속
```

**Matter.js 시도 1 (applyForce)**:
```javascript
// 잘못된 변환
const force = thrustForce * 0.00001  // 임의의 스케일링
Body.applyForce(body, position, force)

// Matter.js 내부:
// acceleration = force / mass
// velocity += acceleration * deltaTime
// 매 프레임 누적 → 빠르게 가속
```

**문제점**:
- 원본은 속도에 **직접 더하기** (200 px/s²)
- Matter.js는 힘을 **누적**하여 가속도로 변환
- 스케일링 계수(0.00001)가 부적절하면 과도한 가속

#### 문제 2: 관성이 너무 큰 이유

**원본 마찰**:
```javascript
// 매 프레임 5% 감속 (강한 마찰)
velocity *= 0.95

// 10프레임 후:
// velocity *= 0.95^10 = 0.599 (약 40% 감속)

// 키를 떼면:
// - 매 프레임 5%씩 빠르게 감속
// - 약 1초 후 거의 정지
```

**Matter.js frictionAir**:
```javascript
// 우리가 설정한 값
frictionAir: 0.05

// Matter.js 내부 계산 (선형 감속):
velocity *= (1 - frictionAir)
velocity *= 0.95  // 동일해 보이지만...

// 문제: Matter.js는 deltaTime과 독립적으로 적용
// 프레임레이트에 따라 마찰이 달라짐
```

**문제점**:
- 원본: `Math.pow(0.95, deltaTime * 60)` - **프레임레이트 독립적**
- Matter.js frictionAir: 프레임레이트에 **의존적**
- Matter.js는 내부 타임스텝으로 시뮬레이션 (복잡함)

#### 문제 3: 회전이 멈추지 않는 이유

**원본 회전 마찰**:
```javascript
// 매 프레임 10% 감속 (매우 강한 마찰)
angularVelocity *= 0.9

// 키를 떼면:
// - 10프레임 후 약 35%로 감소
// - 빠르게 정지
```

**Matter.js 시도**:
```javascript
// 우리가 수동으로 적용
angularVelocity *= Math.pow(0.9, deltaTime * 60)

// 하지만 Matter.js 내부에서도 마찰 적용
// → 중복 적용 또는 충돌
```

**문제점**:
- Matter.js 자체 각속도 마찰과 충돌
- `inertia: Infinity` 설정으로 회전 동작이 이상해짐
- 수동 마찰 적용 타이밍 문제

---

### 3. 시도한 해결 방법들

#### 시도 1: applyForce 방식
```javascript
// tank.js (실패)
const force = thrustForce * 0.00001;
Body.applyForce(body, position, force);
```
**문제**: 스케일링 계수가 임의적, 관성 제어 불가

#### 시도 2: setVelocity 방식
```javascript
// tank.js (실패)
let velocity = body.velocity;
velocity += thrustForce * deltaTime;
velocity *= friction;
Body.setVelocity(body, velocity);
```
**문제**:
- Matter.js 내부 시뮬레이션과 충돌
- 충돌 반응(impulse)이 덮어써짐
- 여전히 관성 문제

#### 시도 3: 물리 바디 설정 조정
```javascript
{
    frictionAir: 0.05,    // 마찰 증가
    friction: 0.1,        // 표면 마찰
    restitution: 0.3,     // 반발 감소
    density: 0.01,        // 질량 증가
    inertia: Infinity     // 회전 관성 제거
}
```
**문제**:
- 값 조정으로는 근본적인 시뮬레이션 방식 차이 해결 불가
- 한 요소를 고치면 다른 요소가 망가짐

---

## 왜 이런 차이가 생기는가?

### 원본 물리엔진의 설계 철학

```
[키 입력] → [즉각 속도 변화] → [강한 마찰] → [빠른 정지]
           ↑ 직접 제어       ↑ 5-10% 감속  ↑ 1초 내
```

**특징**:
- **직접 제어**: 속도를 프로그래머가 완전히 제어
- **강한 마찰**: 매 프레임 5-10% 감속
- **빠른 반응**: 키 입력이 즉시 반영
- **예측 가능**: 단순한 수식

→ **아케이드 게임에 적합**

### Matter.js의 설계 철학

```
[키 입력] → [힘 추가] → [F=ma] → [속도 누적] → [점진적 마찰] → [천천히 정지]
           ↑ 간접      ↑ 가속도  ↑ 관성       ↑ 1-5% 감속   ↑ 수초
```

**특징**:
- **간접 제어**: 힘만 가할 수 있음
- **약한 마찰**: 현실적인 1-5% 감속
- **점진적 반응**: 가속도 → 속도 → 위치
- **복잡한 시뮬레이션**: 충돌, 반발, 관성 등

→ **물리 시뮬레이터에 적합**

---

## 핵심 불일치 요소

### 1. 제어 방식

| 항목 | 원본 | Matter.js |
|------|------|-----------|
| 입력 방식 | 속도 직접 조작 | 힘 적용 |
| 반응 속도 | 즉각 | 점진적 |
| 예측성 | 높음 (단순) | 낮음 (복잡) |

### 2. 마찰 모델

| 항목 | 원본 | Matter.js |
|------|------|-----------|
| 마찰 강도 | 5-10% (강함) | 1-5% (약함) |
| 적용 방식 | 곱셈 | 선형 감속 |
| 프레임 독립 | 있음 | 없음 (내부처리) |

### 3. 관성

| 항목 | 원본 | Matter.js |
|------|------|-----------|
| 관성 존재 | 거의 없음 | 많음 (현실적) |
| 정지 시간 | ~1초 | 수초 |
| 조작감 | 반응적 | 무거움 |

---

## 해결이 어려운 이유

### 1. 설계 목적이 다름

- **원본**: 1992년 DOS 게임, 아케이드 조작감
- **Matter.js**: 현대 물리 시뮬레이터, 현실적 물리

### 2. 추상화 레벨이 다름

- **원본**: Low-level (속도, 위치 직접 제어)
- **Matter.js**: High-level (힘, 제약조건으로 제어)

### 3. 마찰 모델이 다름

- **원본**: 지수 감쇠 (`velocity *= 0.95`)
- **Matter.js**: 선형 감쇠 (`velocity *= (1 - frictionAir)`)

### 4. 시뮬레이션 스텝이 다름

- **원본**: deltaTime 직접 사용
- **Matter.js**: 내부 고정 타임스텝 + 보간

---

## Matter.js를 사용하려면?

### 옵션 1: 완전히 새로운 조작감 받아들이기

```javascript
// Matter.js 네이티브 방식 채택
// - 현실적인 물리
// - 관성 있는 움직임
// - 전체 게임 밸런스 재조정 필요
```

**필요 작업**:
- 무기 속도, 데미지 재조정
- AI 행동 패턴 수정
- 맵 크기 조정
- 플레이어 학습 곡선 변경

### 옵션 2: Kinematic Body 사용

```javascript
// Matter.js에서 Kinematic Body로 Tank 설정
body.isStatic = false;
body.velocity.x = calculatedVelocity.x;  // 직접 설정
body.velocity.y = calculatedVelocity.y;
// 충돌 감지는 하지만 물리 시뮬레이션은 무시
```

**문제점**:
- Kinematic body는 충돌 반응이 제한적
- Tank끼리 충돌 시 밀리지 않음
- Matter.js의 장점을 활용하지 못함

### 옵션 3: 하이브리드 접근

```javascript
// 이동은 원본 물리엔진
// 충돌 감지만 Matter.js 사용
updateMovement() {
    // 원본 방식으로 속도 계산
    velocity = customPhysics(input);

    // Matter.js body 위치 수동 동기화
    Body.setPosition(body, position);

    // 충돌 체크는 Matter.js 이벤트 사용
    onCollision(event) { ... }
}
```

**문제점**:
- 복잡도 증가
- 두 시스템 간 동기화 오버헤드
- 버그 발생 가능성

---

## 결론

### Matter.js 통합 실패 이유

1. **철학적 불일치**: 아케이드 vs 시뮬레이터
2. **제어 방식 차이**: 직접 vs 간접
3. **마찰 모델 차이**: 강함/즉각 vs 약함/점진
4. **관성 차이**: 없음 vs 있음

### 원본 물리엔진을 유지하는 이유

✅ **원본 게임과 동일한 조작감**
✅ **단순하고 예측 가능**
✅ **빠른 반응, 강한 마찰**
✅ **아케이드 스타일에 적합**

### Matter.js를 향후 사용하려면

**필요 조건**:
1. 완전히 새로운 게임 밸런스 설계
2. 조작감 변경 수용
3. 전체 게임 재조정
4. 또는 Kinematic/Hybrid 방식 구현

**현재 결론**:
원본 물리엔진 유지가 최선. Matter.js는 새로운 게임 모드나 다른 프로젝트에서 활용.

---

---

## 재분석: 실제 탱크 물리 기반 접근 (2025-10-27 개정)

### 기존 분석의 오류

❌ **잘못된 이해**:
- 원본 게임 = 단순 아케이드 스타일 (관성 없음)
- Matter.js = 현실 물리 (관성 많음)
- 두 접근 방식이 근본적으로 다름

✅ **올바른 이해**:
- 원본 게임 = **실제 탱크 물리 시뮬레이션**
- Matter.js = 범용 물리 엔진
- 둘 다 현실 물리를 다루지만, **탱크 특성**을 명시적으로 구현해야 함

### 실제 탱크의 물리적 특성

#### 1. 무한궤도 (Tracked Vehicle)

```
특징:
- 접지 면적이 타이어의 10배 이상
- 마찰 계수 μ ≈ 0.8-1.0 (매우 높음)
- 미끄러짐이 거의 없음
- 제자리 회전 가능
```

**원본 게임에서의 구현**:
```javascript
velocity *= Math.pow(0.95, deltaTime * 60)
// 매 프레임 5% 감속 = 매우 높은 마찰력
```

#### 2. 큰 질량 (Heavy Mass)

```
실제 탱크: 30-60톤
관성: I = m × r² (매우 큼)

BUT:
마찰력 = μ × mg = 0.9 × 30톤 × 9.8m/s²
        ≈ 264,600 N (엄청난 마찰력!)

→ 큰 관성이지만 마찰력이 더 지배적
```

#### 3. 브레이크 시스템 ⭐

**일반 차량**:
- 액셀 OFF → 엔진 브레이크 (약함)
- 브레이크 페달 → 강제 정지

**탱크 (무한궤도)**:
- 궤도 엔진 OFF → **즉시 궤도 정지** (브레이크)
- 양쪽 궤도 역회전 → 제자리 회전
- 한쪽 정지 → 선회

**원본 게임에서의 구현**:
```javascript
// 매 프레임 마찰 적용 = 브레이크!
velocity *= 0.95          // 이동 브레이크
angularVelocity *= 0.9    // 회전 브레이크
```

이것은 단순 마찰이 아니라 **능동적 브레이크 시스템**이었음!

### 이전 Matter.js 시도의 실패 원인

**문제**: 브레이크를 구현하지 않았음

```javascript
// 시도 1: applyForce만 사용
if (thrustPower !== 0) {
    applyForce(...);  // 가속
}
// 키를 떼면? → 아무것도 안 함
// → Matter.js 자체 frictionAir만 의존 (너무 약함)
// → 관성으로 계속 움직임 ❌

// 시도 2: setVelocity 직접 제어
velocity = calculate();
setVelocity(velocity);
// 문제: Matter.js 충돌 impulse와 충돌 ❌
```

### 새로운 접근 방식: 3가지 핵심 요소

#### 1. 높은 바닥 마찰

```javascript
{
    friction: 0.9,        // 표면 마찰 (무한궤도 ↔ 지면)
    frictionStatic: 1.0,  // 정적 마찰
    frictionAir: 0.15     // "지면 저항"으로 해석
}
```

#### 2. 큰 중량

```javascript
{
    density: 0.1,  // 밀도 높임
    // size 30 기준 → mass ≈ 90
}
```

#### 3. 능동적 브레이크 시스템 ⭐⭐⭐

**핵심 구현**:

```javascript
updateWithMatter(deltaTime) {
    if (this.thrustPower !== 0) {
        // 가속 중
        const force = calculateThrust();
        Body.applyForce(body, position, force);
    } else {
        // 🔴 브레이크 작동! 🔴
        const brakeForce = {
            x: -body.velocity.x * BRAKE_STRENGTH,
            y: -body.velocity.y * BRAKE_STRENGTH
        };
        Body.applyForce(body, position, brakeForce);
    }

    if (this.rotationPower !== 0) {
        // 회전 중
        setAngularVelocity(...);
    } else {
        // 🔴 회전 브레이크! 🔴
        const brakeTorque = -body.angularVelocity * ROTATION_BRAKE;
        setAngularVelocity(body.angularVelocity + brakeTorque);
    }
}
```

### 예상 효과

✅ **빠른 정지**: 브레이크로 인해 키를 떼면 즉시 감속
✅ **미끄러지지 않음**: 높은 마찰로 정확한 제어
✅ **현실적 충돌**: 적절한 질량으로 충돌 반응
✅ **원본과 동일한 조작감**: 실제 탱크 물리 재현

### 다음 시도 시 체크리스트

- [ ] 브레이크 시스템 구현 (키 OFF 시)
- [ ] 높은 마찰 설정 (friction, frictionAir)
- [ ] 적절한 질량 설정 (density)
- [ ] 브레이크 강도 조정 (BRAKE_STRENGTH, ROTATION_BRAKE)
- [ ] 원본 게임과 가속/정지 시간 비교 테스트

### 핵심 교훈

**이전**: "Matter.js는 관성이 커서 안 됨"
**현재**: "브레이크를 구현하지 않아서 안 됨"

실제 탱크 = 큰 관성 + 큰 마찰 + **능동적 브레이크**

---

**문서 버전**: 2.0 (재분석 포함)
**최초 작성**: 2025-10-27
**개정**: 2025-10-27 (실제 탱크 물리 기반 재분석 추가)
**참조**: PHYSICS_REFERENCE.md, CHANGELOG.md, MATTER_TANK_PHYSICS_PLAN.md
