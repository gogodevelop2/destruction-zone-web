# 물리 엔진 설정값 레퍼런스

이 문서는 Destruction Zone Web Edition의 자체 물리엔진 설정값을 정리한 레퍼런스입니다.

**원본 게임**: Destruction Zone v1.3 (1994, DOS)
**물리 엔진**: 자체 구현 (2D top-down)
**코드 위치**: `js/core/physics.js`

---

## 1. Tank 물리 (`Physics.updateTankMovement`)

**코드 위치**: `js/core/physics.js:394-428`

### 1.1 기본 파라미터

```javascript
// 추진력 계산
thrustForce = tank.stats.speed * 200

// 최대 속도
maxSpeed = tank.stats.speed * 100  // pixels per second

// 회전 가속도
rotationAccel = tank.stats.rotationSpeed * 3 * deltaTime

// 최대 회전 속도
maxAngularSpeed = tank.stats.rotationSpeed * 5  // radians per second
```

### 1.2 마찰 (Friction)

```javascript
// 속도 마찰 (공기 저항)
velocity *= Math.pow(0.95, deltaTime * 60)
// 60fps 기준: 매 프레임 5% 감속

// 회전 마찰
angularVelocity *= Math.pow(0.9, deltaTime * 60)
// 60fps 기준: 매 프레임 10% 감속
```

### 1.3 Tank Stats 기준값 (STANDARD)

**코드 위치**: `js/entities/tank.js:104-155`

```javascript
// STANDARD 탱크 (기준)
stats = {
    speed: 1.0,           // 속도 배율
    rotationSpeed: 1.0,   // 회전 속도 배율
    maxShield: 40,        // 최대 실드
    maxWeaponEnergy: 100, // 최대 무기 에너지
    size: 30              // 크기 (pixels)
}
```

### 1.4 실제 계산값 (STANDARD 기준)

| 항목 | 계산식 | 결과 |
|------|--------|------|
| 추진력 | 1.0 × 200 | 200 px/s² |
| 최대 속도 | 1.0 × 100 | 100 px/s |
| 회전 가속 | 1.0 × 3 × 0.016 | 0.048 rad/frame |
| 최대 회전 속도 | 1.0 × 5 | 5 rad/s |

### 1.5 탱크 타입별 Stats 배율

| 탱크 타입 | Speed | Rotation | Armor | Size |
|-----------|-------|----------|-------|------|
| STANDARD | 1.0 | 1.0 | 1.0 | 30 |
| ROTRA I | 0.9 | 1.3 | 1.2 | 18 |
| ROTRA II | 1.3 | 1.5 | 0.7 | 18 |
| OPEC I | 1.4 | 1.3 | 1.4 | 16 |
| OPEC II | 1.5 | 1.4 | 1.6 | 15 |

### 1.6 업그레이드 시스템

**v1.3 업그레이드**: Binary (0 또는 1)

```javascript
// 업그레이드 비용 = 탱크 가격과 동일
// STANDARD: 1000 CR
// ROTRA I: 1850 CR
// ROTRA II: 2450 CR
// OPEC I: 3400 CR
// OPEC II: 4750 CR

// 업그레이드 효과
speed: 1.5x       // +50% 속도
rotation: 1.5x    // +50% 회전
armor: 1.33x      // +33% 실드
```

---

## 2. Projectile 물리 (`Physics.updateProjectileMovement`)

**코드 위치**: `js/core/physics.js:430-454`

### 2.1 기본 이동

```javascript
// 위치 업데이트 (등속 직선 운동)
projectile.x += projectile.velocity.x * deltaTime
projectile.y += projectile.velocity.y * deltaTime

// 수명 감소
projectile.lifetime -= deltaTime
```

### 2.2 유도 미사일 (Guided)

```javascript
// 목표 추적 강도
turnRate = projectile.guidanceStrength || 0.1  // 기본 10%

// 방향 보간
newDir = normalize(
    currentDir * (1 - turnRate) +
    targetDir * turnRate
)

// 속도 유지하며 방향만 변경
projectile.velocity = newDir * speed
```

---

## 3. 무기별 발사체 설정

**코드 위치**: `js/config/weapon-data.js`

### 3.1 PORT 1: Front Fire

| 무기 | 속도 | 데미지 | 수명 | 특수 |
|------|------|--------|------|------|
| MISSILE | 200 px/s | 4 | 3.0s | - |
| DOUBLE MISSILE | 200 px/s | 6 | 3.0s | 2발 |
| TRIPLE MISSILE | 150 px/s | 9 | 3.5s | 3발 |
| BEAM LASER | 400 px/s | 6 | 2.0s | - |
| POWER LASER | 400 px/s | 12 | 2.0s | 2발 |
| TRI-STRIKER | 250 px/s | 18 | 3.5s | 3발 |

### 3.2 PORT 2: Blasters

| 무기 | 속도 | 데미지 | 수명 | 폭발 반경 |
|------|------|--------|------|-----------|
| BLASTER | 150 px/s | 90 | 4.0s | 30 px |
| GUIDE BLASTER | 120 px/s | 90 | 4.5s | 30 px (유도) |
| BLAST GUIDER | 150 px/s | 70 | 4.0s | 35 px |
| NUKE BLASTER | 130 px/s | 168 | 5.0s | 50 px |
| SWIRL BLASTER | 150 px/s | 48 | 4.0s | 40 px (6 swirlers) |

### 3.3 PORT 3: Surprise Attack

| 무기 | 속도 | 데미지 | 수명 | 방향 | 특수 |
|------|------|--------|------|------|------|
| REAR DOUBLE | 200 px/s | 8 | 3.0s | rear | 2발 |
| REAR GUIDED | 180 px/s | 8 | 3.5s | rear | 유도 |
| REAR CHAOS | 150 px/s | 14 | 1.5s | rear | 유도 |
| TELEPORT FOE | - | 0 | - | - | 순간이동 |
| REAR TRIPLE | 200 px/s | 15 | 3.0s | rear | 3발 |

### 3.4 PORT 4: Special Front Fire

| 무기 | 속도 | 데미지 | 수명 | 특수 |
|------|------|--------|------|------|
| TRI BREAKER | 180 px/s | 21 | 3.0s | 3분열 (7dmg) |
| GUIDED | 150 px/s | 6 | 4.0s | 유도 |
| QUINT BREAKER | 180 px/s | 30 | 3.0s | 5분열 (6dmg) |
| QUINT GUIDER | 150 px/s | 30 | 3.5s | 5분열 유도 |
| OCTO BREAKER | 180 px/s | 48 | 3.0s | 8분열 |
| SPARK FIENDS | 200 px/s | 16 | 5.0s | 유도, 절대명중 |

### 3.5 PORT 5: Aggressive Defence

| 무기 | 속도 | 데미지 | 수명 | 패턴 |
|------|------|--------|------|------|
| SWIRLER | 100 px/s | 8 | 2.0s | swirl |
| ELECTRO BUDS | 80 px/s | 15 | 3.0s | 유도 3발 |
| NORMAL BOMB | 0 | 100 | 10.0s | 폭탄 |
| DEATH BOMB | 0 | 350 | 10.0s | 폭탄 |

### 3.6 PORT 6: Special Defence

| 무기 | 에너지 | 지속시간 | 효과 |
|------|--------|----------|------|
| DEATH TOUCH | 7 | 2.0s | 접촉 데미지 15 |
| DEFLECTOR | 0 | 1.0s | 미사일 반사 |
| ECM WIPER | 4 | - | 모든 미사일 파괴 |
| CONFUSOR | 0 | 3.0s | 유도 무시 |

### 3.7 PORT 7: Harmless Defense

| 무기 | 에너지 | 지속시간 | 효과 |
|------|--------|----------|------|
| HEALER | 10 | - | +10 실드 회복 |
| GLOW SHIELD | 15 | 3.0s | 무적 |
| FADE SHIELD | 20 | 6.0s | 투명 |
| TELEPORT SELF | 4 | - | 자신 순간이동 |

---

## 4. 충돌 감지 시스템

**코드 위치**: `js/core/physics.js`

### 4.1 사용하는 충돌 감지 방법

```javascript
// 원형 충돌 (Tank ↔ Tank, Projectile ↔ Tank)
circleCollision(circle1, circle2)
distance < (radius1 + radius2)

// AABB 충돌 (사각형)
aabbCollision(rect1, rect2)
overlap check on x and y axes

// 다각형 충돌 (Tank 삼각형)
polygonCollision(poly1, poly2)
SAT (Separating Axis Theorem)

// 선-원 충돌 (레이저 ↔ Tank)
lineIntersectsCircle(lineStart, lineEnd, circle)
```

### 4.2 경계 처리

```javascript
// 화면 경계 제한 (Tank)
constrainToBounds(entity, width, height, margin)
entity는 경계 안에 갇힘

// 화면 경계 랩어라운드 (미구현)
wrapToBounds(entity, width, height)
한쪽 끝에서 반대쪽으로
```

---

## 5. 에너지 시스템

**코드 위치**: `js/entities/tank.js:173-188`

### 5.1 무기 에너지

```javascript
// 최대 무기 에너지
maxWeaponEnergy = 100  // 기본값

// 에너지 재생
regeneration = 10 * deltaTime  // 초당 10
// 60fps 기준: 프레임당 0.166

// 무기 발사 시 에너지 소비
energyCost = weapon.energyCost
weaponEnergy -= energyCost
```

### 5.2 실드 시스템

```javascript
// 최대 실드
maxShield = stats.maxShield * armorUpgrade

// 데미지 처리
shield -= damage
if (shield <= 0) {
    isAlive = false
}

// 실드 재생 없음 (원본 게임 동일)
```

---

## 6. Vector 연산 유틸리티

**코드 위치**: `js/core/physics.js:204-262`

### 6.1 기본 연산

```javascript
// 벡터 생성
createVector(x, y) → {x, y}

// 벡터 덧셈/뺄셈
addVectors(v1, v2)
subtractVectors(v1, v2)

// 스칼라 곱셈
multiplyVector(v, scalar)

// 내적
dotProduct(v1, v2) → scalar

// 크기
magnitude(v) → scalar

// 정규화
normalize(v) → unit vector
```

### 6.2 각도 연산

```javascript
// 벡터 → 각도
angle(v) → radians
Math.atan2(v.y, v.x)

// 각도 → 벡터
fromAngle(angle, magnitude) → {x, y}
x = cos(angle) * magnitude
y = sin(angle) * magnitude

// 벡터 회전
rotateVector(v, angle) → {x, y}
x' = x*cos - y*sin
y' = x*sin + y*cos
```

---

## 7. 게임 상수

**코드 위치**: `js/config/game-config.js`

### 7.1 기본 설정

```javascript
CANVAS: {
    WIDTH: 960,
    HEIGHT: 720
}

// 라운드 설정
ROUND: {
    DURATION: 180,  // 3분 (초)
    WIN_SCORE: 1000
}
```

---

## 8. 성능 관련 참고사항

### 8.1 프레임레이트 독립성

모든 물리 계산은 `deltaTime`을 사용하여 프레임레이트에 독립적입니다:

```javascript
// deltaTime = 현재 프레임과 이전 프레임 간 시간차 (초 단위)
// 60fps 기준: deltaTime ≈ 0.0166 (1/60)

// 프레임 독립적 계산 예시
velocity += acceleration * deltaTime
position += velocity * deltaTime
```

### 8.2 마찰 계산 주의사항

```javascript
// 잘못된 방법 (프레임레이트 의존적)
velocity *= 0.95  // ❌

// 올바른 방법 (프레임레이트 독립적)
velocity *= Math.pow(0.95, deltaTime * 60)  // ✅
// 60fps 기준으로 정규화
```

---

## 9. 향후 개선 가능 항목

1. **Matter.js 통합** (보류됨)
   - 더 정교한 충돌 처리
   - 물리 시뮬레이션 개선
   - 파일: `js/lib/matter.min.js` (준비됨)

2. **발사체 물리 개선**
   - 중력 효과 (특정 무기용)
   - 바람 저항
   - 탄도 계산

3. **폭발 물리**
   - 폭발 충격파
   - 넉백 효과
   - 연쇄 폭발

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-10-27
**작성자**: Claude Code
**참조**: 원본 게임 Destruction Zone v1.3 (1994)
