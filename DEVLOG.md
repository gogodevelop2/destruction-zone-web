# Destruction Zone - 개발 로그

## 2025년 1월 27일 - Phase 1 프로토타입 완성

### 🎯 목표
Matter.js 물리 엔진을 기반으로 한 새로운 아키텍처 검증

---

## 📋 진행 사항

### 1. 프로젝트 재구조화

#### 기존 코드 아카이브
- **폴더**: `_archive/hybrid-physics-attempt-2025-01/`
- **이유**: 하이브리드 물리 방식(원본 + Matter.js)의 구조적 문제
  - 이중 물리 시스템으로 인한 동기화 문제
  - 회전 제어 복잡성 (수동 + 물리 혼합)
  - deltaTime 적용 불일치
  - 디버깅 어려움

#### 새 브랜치 생성
- **브랜치**: `matter-js-rewrite`
- **전략**: Matter.js를 **중심**에 두고 처음부터 재설계
- **원칙**: 물리 엔진이 유일한 진실의 원천 (Single Source of Truth)

---

### 2. 아키텍처 설계 문서 작성

**파일**: `ARCHITECTURE.md` (508줄)

**핵심 설계 원칙:**
1. Matter.js가 모든 물리 상태 관리 (위치, 회전, 속도)
2. 엔티티는 Matter.js body의 얇은 래퍼
3. 입력 → 힘 적용 → Matter.js 업데이트 → 렌더링
4. 충돌 이벤트는 Matter.js에서 처리

**구현 계획:**
- Phase 1: 프로토타입 (1-2시간)
- Phase 2: 핵심 기능 (3-4시간)
- Phase 3: 게임 시스템 통합 (2-3시간)
- Phase 4: 밸런싱 및 폴리싱 (1-2시간)

---

### 3. Phase 1 프로토타입 구현

#### 파일 구조
**단일 파일 프로토타입**: `prototype.html` (440줄)
- HTML + CSS + JavaScript 모두 포함
- 빠른 테스트와 반복 개발에 최적화

#### 구현된 기능

##### 3.1 Matter.js 월드 설정
```javascript
const engine = Engine.create({
    gravity: { x: 0, y: 0 }  // 탑다운 뷰, 중력 없음
});
```

- 경계 벽 4개 (정적 바디)
- 60 FPS 고정 타임스텝

##### 3.2 Tank 클래스 (Matter.js 래퍼)

**물리 바디 생성 - 삼각형**
```javascript
const vertices = [
    { x: size * 0.75, y: 0 },              // 앞
    { x: -size * 0.5, y: -size * 0.4 },    // 왼쪽 뒤
    { x: -size * 0.5, y: size * 0.4 }      // 오른쪽 뒤
];

this.body = Bodies.fromVertices(x, y, [vertices], {
    density: 0.08,
    friction: 0.8,
    frictionAir: 0.12,
    // ...
});
```

**설정 가능한 파라미터:**
- `size`: 탱크 크기
- `thrustPower`: 추진력
- `rotationSpeed`: 회전 속도
- `density`: 밀도 (질량 = 밀도 × 면적)
- `friction`: 마찰력
- `frictionAir`: 공기 저항
- `color`: 색상

##### 3.3 이동 시스템

**추진력 적용**
```javascript
const force = {
    x: Math.cos(this.body.angle) * forceMagnitude,
    y: Math.sin(this.body.angle) * forceMagnitude
};
Body.applyForce(this.body, this.body.position, force);
```

**브레이크 시스템**
```javascript
const brakeFactor = 0.05;
Body.setVelocity(this.body, {
    x: this.body.velocity.x * (1 - brakeFactor),
    y: this.body.velocity.y * (1 - brakeFactor)
});
```

**회전 제어**
```javascript
const targetAngularVelocity = direction * rotationSpeed;
Body.setAngularVelocity(this.body, targetAngularVelocity);
```

##### 3.4 자동차 스타일 조종

**전진/후진에 따른 조향 반전:**
```javascript
const steeringDirection = tank.thrust >= 0 ? 1 : -1;

if (keys['ArrowLeft']) {
    tank.rotation = -1 * steeringDirection;
} else if (keys['ArrowRight']) {
    tank.rotation = 1 * steeringDirection;
}
```

- **전진 중**: 좌 → 왼쪽 회전, 우 → 오른쪽 회전
- **후진 중**: 좌 → 오른쪽 회전, 우 → 왼쪽 회전 (반대!)

##### 3.5 정확한 렌더링

**문제**: 수동으로 정의한 vertices와 Matter.js가 계산한 실제 vertices가 다를 수 있음 (centroid 자동 계산)

**해결**: Matter.js의 실제 vertices를 렌더링에 사용
```javascript
const vertices = this.body.vertices;
for (let i = 0; i < vertices.length; i++) {
    const v = Vector.sub(vertices[i], pos);
    const vRotated = Vector.rotate(v, -angle);
    ctx.lineTo(vRotated.x, vRotated.y);
}
```

**결과**: 렌더링 삼각형과 물리 바디가 **완벽히 일치**

##### 3.6 디버그 시스템

**D 키 토글:**
- 물리 바디 윤곽선 (초록색) 표시
- 중심점 (빨간 점) 표시
- 렌더링과 물리의 정확한 일치 확인 가능

**Stats 창:**
```
STATS
FPS: 60
Pos: (480, 360)
Angle: 45.0°
Speed: 12.5 px/s
AngVel: 0.015

PHYSICS
Mass: 1.73
Density: 0.080
Friction: 0.80
```

##### 3.7 입력 처리

**화살표 키 스크롤 방지:**
```javascript
if (e.code.startsWith('Arrow')) {
    e.preventDefault();
}
```

**키보드 레이아웃:**
- ⬆️ Arrow Up: 전진
- ⬇️ Arrow Down: 후진
- ⬅️ Arrow Left: 좌회전 (전진 시) / 우회전 (후진 시)
- ➡️ Arrow Right: 우회전 (전진 시) / 좌회전 (후진 시)
- D: 디버그 모드 토글

---

### 4. 파라미터 튜닝 과정

#### 초기 문제들과 해결

**문제 1: 탱크가 움직이지 않음**
- 원인: `thrustPower: 0.0003` 너무 약함
- 해결: `0.002` → `0.2` → `0.1` → `0.025` → `0.015` → **0.01**
- 교훈: Matter.js의 force는 매우 작은 값을 요구

**문제 2: 회전이 너무 빠름**
- 원인: `rotationSpeed: 3.0` 너무 높음
- 해결: `3.0` → `1.0` → `0.1` → `0.03` → `0.015` → **0.01**
- 교훈: 초기 게임 상태는 느리게, 업그레이드로 향상

**문제 3: 삼각형으로 변경 후 속도 증가**
- 원인: 삼각형 바디가 원형보다 가벼움 (면적 차이)
- 해결: 추진력 재조정

**문제 4: 렌더링과 물리 바디 불일치**
- 원인: 수동 정의 vertices vs Matter.js 계산 vertices (centroid 차이)
- 해결: Matter.js의 실제 vertices를 렌더링에 사용
- 결과: 완벽한 일치

#### 최종 파라미터

```javascript
const tank = new Tank(480, 360, {
    size: 30,              // 탱크 크기
    thrustPower: 0.01,     // 추진력
    rotationSpeed: 0.01,   // 회전 속도
    density: 0.08,         // 밀도 (기본값)
    friction: 0.8,         // 마찰력 (기본값)
    frictionAir: 0.12,     // 공기 저항 (기본값)
    color: '#00ffff'       // 색상
});
```

---

### 5. 핵심 기술 결정

#### 5.1 원형 vs 삼각형 물리 바디

**결정**: 삼각형 사용 ✅

**이유:**
- **정교한 쾌적함 우선**: 사용자는 정확한 충돌을 기대
- **확장성**: 나중에 사각형, 복잡한 모양도 가능
- **시각적 일치**: 보이는 것 = 충돌하는 것

**구현:**
- `Bodies.fromVertices()` 사용
- Matter.js가 자동으로 centroid 계산
- 렌더링도 동일한 vertices 사용

#### 5.2 질량 시스템

**결정**: Density 기반 질량 시스템 ✅

**이유:**
- 장갑 두께 업그레이드 시 자동으로 질량 증가
- 크기에 비례하는 현실적인 질량
- 탱크 타입별로 다른 밀도 설정 가능

**예시:**
```javascript
// 가벼운 정찰 탱크
density: 0.05

// 일반 탱크
density: 0.08

// 중전차 (장갑 강화)
density: 0.15
```

#### 5.3 프레임 독립성

**주사율 독립성**: ✅ 완벽
```javascript
Engine.update(engine, 1000 / 60);  // 고정 60 FPS timestep
```
- 30 FPS든 120 FPS든 물리는 일관되게 작동

**해상도 독립성**: ✅ 캔버스 고정 크기 (960x720)
- CSS 스케일링만 사용
- 게임 공간은 항상 동일
- 일관된 플레이 경험

---

### 6. 성공 기준 달성 여부

**Phase 1 체크리스트:**

- ✅ Matter.js 월드 설정
- ✅ 기본 Tank 클래스 작성
- ✅ 이동 구현 (추진 + 회전)
- ✅ 키보드 컨트롤 연결
- ✅ 캔버스 렌더링
- ✅ 성능 테스트 (60 FPS 안정)
- ✅ 조작감 테스트 (자동차 스타일 조종)

**성공 기준:**
- ✅ 1개 탱크가 부드럽게 움직임 (60 FPS)
- ✅ 회전이 반응적임
- ✅ 컨트롤 느낌이 하이브리드 버전보다 좋음
- ✅ 벽 충돌이 정확함
- ✅ 렌더링과 물리 바디가 완벽히 일치

---

### 7. 배운 점

#### 7.1 Matter.js 힘 단위
- `Body.applyForce()`는 매우 작은 값 필요 (0.01 수준)
- 탱크 질량, 면적에 따라 크게 달라짐
- 테스트를 통한 반복 튜닝 필수

#### 7.2 Vertices와 Centroid
- `fromVertices()`는 자동으로 무게중심 계산
- 렌더링할 때도 같은 vertices 사용해야 정확
- 수동 계산보다 Matter.js 계산 신뢰

#### 7.3 사용자 경험 우선
- "정교한 쾌적함": 정확한 물리 + 쾌적한 튜닝
- 기술적 완벽함보다 사용자가 기대하는 동작이 우선
- 삼각형 충돌이 원형보다 복잡하지만 정확함이 더 중요

#### 7.4 자동차 스타일 조종
- 후진 시 조향 반전이 직관적
- 간단한 조건문으로 구현 가능
- 사용자 경험 크게 향상

---

### 8. 다음 단계 (Phase 2)

**예정 작업:**
1. Projectile 클래스 (발사체)
   - Matter.js sensor body 사용
   - 다양한 발사체 타입
2. 충돌 시스템
   - 발사체 → 탱크 충돌
   - 탱크 → 탱크 충돌
   - 데미지 계산
3. 기본 AI
   - 이동
   - 조준
   - 발사
4. 복수 탱크 테스트

**예상 소요 시간**: 3-4시간

---

## 📊 통계

- **작업 시간**: 약 2시간
- **파일 수**: 1개 (prototype.html)
- **코드 라인**: 440줄
- **커밋**: 3개
  - Archive: 하이브리드 시도 보관
  - Docs: 아키텍처 문서
  - Feat: 프로토타입 구현

---

## 🎯 결론

**Phase 1 성공!** ✅

Matter.js 기반 아키텍처가 작동함을 증명했습니다. 하이브리드 방식보다:
- 코드가 더 간단함
- 디버깅이 쉬움
- 확장성이 높음
- 물리가 정확함

다음 단계(Phase 2)로 진행할 준비가 완료되었습니다!

---

## 2025년 1월 27일 - Phase 2 완성

### 🎯 목표
발사체 시스템, 충돌 감지, 기본 AI 구현

---

## 📋 진행 사항

### 1. Projectile 클래스 구현

**물리 바디 생성 - 원형**
```javascript
this.body = Bodies.circle(x, y, this.config.size, {
    isSensor: false,  // 물리적 충돌 활성화
    label: 'projectile',
    density: 0.4,  // 탱크의 5배
    frictionAir: 0,
    restitution: 0,  // 튕김 없음
    friction: 0.1
});
```

**주요 기능:**
- Matter.js body로 구현 (센서가 아닌 물리 바디)
- 속도 벡터 기반 발사
- 자동 수명 관리 (3초)
- 화면 밖 자동 제거
- 시각적 트레일 효과

**최종 파라미터:**
```javascript
{
    speed: 3,        // px/s
    size: 2,         // radius
    damage: 10,
    density: 0.4     // 탱크(0.08)의 5배
}
```

### 2. 발사 시스템

**발사 위치 계산:**
```javascript
const barrelLength = size * 0.75 + 5;  // 삼각형 앞 끝 + 5px
const spawnX = tank.body.position.x + Math.cos(tank.body.angle) * barrelLength;
const spawnY = tank.body.position.y + Math.sin(tank.body.angle) * barrelLength;
```

**해결한 문제:**
- 초기: 발사체가 탱크 내부에서 생성되어 즉시 충돌
- 해결: 삼각형 맨 앞 끝에서 생성하도록 위치 조정
- 결과: 발사체가 탱크 밖에서 깔끔하게 생성됨

### 3. 충돌 시스템

**Matter.js 충돌 이벤트 활용:**
```javascript
Matter.Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        // 발사체 → 탱크 충돌
        if (projectile && tank) {
            handleProjectileHit(projectile, tank);
        }

        // 발사체 → 벽 충돌
        if (projectile && wall) {
            handleProjectileWallHit(projectile);
        }
    });
});
```

**충돌 처리:**
- 발사체 → 탱크: 피격 이펙트 + 발사체 제거
- 발사체 → 벽: 작은 이펙트 + 발사체 제거 (튕기지 않음)
- 탱크 → 탱크: Matter.js가 자동 처리 (물리적 충돌)

### 4. 피격 이펙트

**확장하는 원형 링 + 글로우:**
```javascript
const progress = effect.age / effect.maxAge;
const alpha = 1 - progress;
const radius = 3 + progress * 9;  // 3px → 12px

// 외부 링
ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
ctx.arc(x, y, radius, 0, Math.PI * 2);

// 내부 플래시
ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);

// 중앙 글로우
ctx.shadowBlur = 20;
ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
ctx.arc(x, y, 5, 0, Math.PI * 2);
```

**파라미터:**
- 지속시간: 0.15초 (짧고 강렬)
- 크기: 3px → 12px (작고 정확)
- 색상: 노란색 → 주황색 그라데이션

### 5. 기본 AI 구현

**추적 알고리즘:**
```javascript
function updateAI(deltaTime) {
    const enemy = enemyTank;
    const target = playerTank;

    // 목표까지 각도 계산
    const dx = target.body.position.x - enemy.body.position.x;
    const dy = target.body.position.y - enemy.body.position.y;
    const angleToTarget = Math.atan2(dy, dx);

    // 각도 차이 정규화
    let angleDiff = angleToTarget - enemy.body.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // 회전
    if (Math.abs(angleDiff) > 0.1) {
        enemy.rotation = angleDiff > 0 ? 1 : -1;
    }

    // 거리 기반 이동
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 200) {
        enemy.thrust = 1;  // 전진
    } else if (distance < 150) {
        enemy.thrust = -1;  // 후진
    }

    // 조준 후 발사
    if (Math.abs(angleDiff) < 0.2 && aiFireCooldown <= 0) {
        fireProjectile(enemy, '#ff00ff');
        aiFireCooldown = AI_FIRE_COOLDOWN;
    }
}
```

**AI 동작:**
- 플레이어 방향으로 회전
- 거리 유지 (150~200px)
- 조준 정확도: ±0.2 라디안 (약 ±11.5도)
- 발사 쿨다운: 1.5초

### 6. 복수 탱크 지원

**2개 탱크 동시 작동:**
```javascript
const playerTank = new Tank(480, 360, {
    size: 30,
    thrustPower: 0.01,
    rotationSpeed: 0.01,
    color: '#00ffff'  // 청록색
});
playerTank.id = 'player';

const enemyTank = new Tank(240, 180, {
    size: 30,
    thrustPower: 0.01,
    rotationSpeed: 0.01,
    color: '#ff00ff'  // 분홍색
});
enemyTank.id = 'enemy';
```

### 7. 입력 처리 개선

**스크롤 방지:**
```javascript
window.addEventListener('keydown', (e) => {
    // 화살표 키 + 스페이스바 스크롤 방지
    if (e.code.startsWith('Arrow') || e.code === 'Space') {
        e.preventDefault();
    }
    keys[e.code] = true;
});
```

**키 레이아웃:**
- ⬆️ Arrow Up: 전진
- ⬇️ Arrow Down: 후진
- ⬅️ Arrow Left: 좌회전 (전진 시) / 우회전 (후진 시)
- ➡️ Arrow Right: 우회전 (전진 시) / 좌회전 (후진 시)
- Space: 발사
- D: 디버그 모드 토글

---

## 🔧 파라미터 튜닝 과정

### 발사체 속도
**문제:** 초기 속도가 너무 빨라서 보이지 않음
- 초기: 400 px/s (너무 빠름)
- 1차 조정: 150 px/s (여전히 빠름)
- 2차 조정: 7.5 px/s (1/20로 축소)
- **최종: 3 px/s** ✅

### 발사체 크기
**문제:** 크기가 너무 커서 탱크와 충돌
- 초기: 3 px (기본값)
- 1차 확대: 6 px (가시성 향상)
- **최종: 2 px** (작고 정확) ✅

### 발사체 밀도
**목적:** 탱크를 밀어내는 효과
- 초기 테스트: 0.8 (탱크의 10배)
- **최종: 0.4** (탱크의 5배) ✅

### 충돌 이펙트
**문제:** 이펙트가 너무 크고 오래 지속
- 초기: 10~40px, 0.5초
- **최종: 3~12px (30%), 0.15초 (30%)** ✅

---

## 📊 성능 측정

**현재 상태:**
- FPS: 60 안정
- 동시 발사체: 10+ 가능
- 탱크 수: 2개
- Matter.js bodies: ~15개 (탱크 2 + 벽 4 + 발사체 N)

---

## ✅ Phase 2 체크리스트

- ✅ Projectile 클래스 작성
- ✅ 발사 시스템 구현
- ✅ 충돌 감지 (발사체 → 탱크)
- ✅ 충돌 감지 (발사체 → 벽)
- ✅ 피격 이펙트
- ✅ 기본 AI (추적 + 발사)
- ✅ 복수 탱크 지원
- ✅ 입력 처리 개선

**성공 기준:**
- ✅ 발사체가 정확하게 발사됨
- ✅ 충돌 감지가 정확함
- ✅ AI가 플레이어를 추적하고 공격함
- ✅ 60 FPS 안정
- ✅ 시각적 피드백이 명확함

---

## 💡 배운 점

### 1. 센서 vs 물리 바디
- **센서 바디**: 충돌 감지만, 물리적 힘 없음
- **물리 바디**: 충돌 + 힘 전달
- 발사체는 물리 바디로 구현하여 탱크를 밀어낼 수 있도록 함

### 2. 발사 위치 계산
- 발사체는 탱크 외부에서 생성되어야 함
- 삼각형 vertices의 앞 끝 위치 활용
- 추가 오프셋 (+5px)으로 안전 마진 확보

### 3. AI 각도 정규화
- `atan2()` 결과는 [-π, π] 범위
- 각도 차이 계산 시 정규화 필수
- 회전 방향 결정에 사용

### 4. 충돌 이벤트 처리
- Matter.js는 양방향 충돌 감지 (A→B, B→A)
- 중복 처리 방지 필요
- label을 활용한 타입 구분

---

## 🐛 해결한 버그

### 버그 1: 발사체가 자기 탱크와 충돌
**증상:** 스페이스바 누르면 즉시 폭발 이펙트
**원인:** 발사체가 탱크 내부에서 생성됨
**해결:** 발사 위치를 삼각형 앞 끝 + 5px로 이동

### 버그 2: 발사체가 너무 빨라서 안 보임
**증상:** 발사 후 발사체가 보이지 않음
**원인:** 속도가 400 px/s로 너무 빠름
**해결:** 속도를 3 px/s로 대폭 축소 (1/133)

### 버그 3: 스페이스바 누르면 스크롤
**증상:** 발사할 때마다 페이지 스크롤
**원인:** 스페이스바 기본 동작 (페이지 스크롤)
**해결:** `e.preventDefault()` 추가

### 버그 4: 충돌 이펙트가 너무 큼
**증상:** 이펙트가 화면을 가림
**원인:** 반경 40px, 지속 0.5초
**해결:** 반경 12px, 지속 0.15초로 축소 (30%)

---

## 📈 다음 단계 (Phase 3)

**예정 작업:**
1. 체력/실드 시스템
   - 탱크별 체력바 표시
   - 실드 데미지 계산
   - 파괴 애니메이션
2. 무기 시스템 확장
   - 7가지 무기 타입
   - 무기별 발사체 속성
   - 무기 에너지 관리
3. 라운드 관리
   - 타이머
   - 승리 조건
   - 라운드 전환
4. UI 통합
   - HUD (체력, 에너지, 점수)
   - 스코어보드
   - 등록 화면

**예상 소요 시간**: 2-3시간

---

## 📊 통계

**Phase 2 작업 시간**: 약 1.5시간
**코드 라인 수**:
- prototype.html: 440줄 → 706줄 (+266줄)
- 추가된 기능:
  - Projectile 클래스: 90줄
  - 충돌 시스템: 60줄
  - AI 시스템: 45줄
  - 이펙트 시스템: 50줄
  - 기타: 21줄

**커밋**:
- Phase 2: Projectile, Collision, AI 구현

---

## 🎯 결론

**Phase 2 성공!** ✅

핵심 전투 메커니즘이 완성되었습니다:
- 발사체가 정확하게 작동함
- 충돌 감지가 정확함
- AI가 도전적임
- 물리 기반 전투가 재미있음

Matter.js의 충돌 이벤트 시스템이 매우 강력하고 사용하기 쉽습니다. 물리 바디로 발사체를 만들어 탱크를 밀어내는 효과도 자연스럽게 구현되었습니다.

다음 단계(Phase 3)로 진행할 준비가 완료되었습니다!

---

## 📝 참고 자료

- [Matter.js 공식 문서](https://brm.io/matter-js/docs/)
- [Matter.js Collision Events](https://brm.io/matter-js/docs/classes/Engine.html#events)
- ARCHITECTURE.md - 전체 설계 문서
- prototype.html - 작동하는 프로토타입

---
---

## 2025년 1월 28일 - Phase 3A UI & Weapon System 완성

### 🎯 목표
게임 인터페이스 구축 및 무기 시스템 확장

---

## 📋 진행 사항

### 1. 원본 게임 UI 분석

#### DOSBox 설치 및 원본 게임 실행
- **설치**: `brew install dosbox-x` + Rosetta 2
- **실행**: dzone-v1.3/DZONE.EXE 분석
- **발견**: 우측 세로 사이드바에 6개 탱크 슬롯 배치
  - 각 슬롯: 무기명, 세로 게이지 2개
  - 미니멀한 디자인

#### 웹 버전 레이아웃 결정
**최종 레이아웃**: 좌우 사이드바 방식
```
┌─────┬───────────┬─────┐
│ T1  │           │ T4  │
│ ███ │           │ ███ │
├─────┤  게임화면  ├─────┤
│ T2  │           │ T5  │
│ ███ │           │ ███ │
├─────┤           ├─────┤
│ T3  │           │ T6  │
│ ███ │           │ ███ │
└─────┴───────────┴─────┘
```

**장점**:
- 원본과 유사한 느낌
- 최대 6대 탱크 지원
- 게임 화면 중앙 배치
- 좌우 대칭으로 균형감

---

### 2. UI 시스템 구현

#### HTML 구조
```html
<div id="gameContainer">
  <div id="leftStats">  <!-- 좌측 3개 -->
    <div class="tank-stat" id="tank1-stat">...</div>
    <div class="tank-stat" id="tank2-stat">...</div>
    <div class="tank-stat" id="tank3-stat">...</div>
  </div>
  <canvas id="gameCanvas"></canvas>
  <div id="rightStats"> <!-- 우측 3개 -->
    <div class="tank-stat" id="tank4-stat">...</div>
    <div class="tank-stat" id="tank5-stat">...</div>
    <div class="tank-stat" id="tank6-stat">...</div>
  </div>
</div>
```

#### 스탯 패널 내용
각 탱크 슬롯마다:
- **탱크 이름**: 탱크 색상으로 표시
- **HP 게이지**: 세로 막대 (초록색, 아래→위)
- **WPN 게이지**: 세로 막대 (노란색, 아래→위)
- **현재 무기**: 무기 이름 표시
- **점수**: $XXX 형식

#### CSS 스타일링
**미니멀 디자인 원칙**:
- 슬롯 폭: 60px (좁게)
- 게이지 폭: 12px (가늘게)
- 폰트: monospace (심플)
- 색상: 밝게, 효과 제거
- 배경: 어두운 반투명

```css
.tank-stat {
  width: 60px;
  height: 240px; /* 720px ÷ 3 */
  background: rgba(0, 10, 15, 0.8);
  border: 1px solid #006666;
}

.gauge {
  width: 12px;
  height: 140px;
  background: rgba(0, 0, 0, 0.9);
}

.gauge-fill {
  position: absolute;
  bottom: 0; /* 아래에서 위로 */
  height: X%; /* 실시간 업데이트 */
}
```

---

### 3. 게임 상태와 UI 연결

#### Tank 클래스 확장
```javascript
// 무기 에너지 시스템 추가
this.maxWeaponEnergy = 100;
this.weaponEnergy = 100;
this.weaponRechargeRate = 20; // per second

// 점수 시스템
this.score = 0;

// update() 메서드에 에너지 충전 추가
if (this.weaponEnergy < this.maxWeaponEnergy) {
  this.weaponEnergy = Math.min(
    this.maxWeaponEnergy,
    this.weaponEnergy + this.weaponRechargeRate / 60
  );
}
```

#### UI 업데이트 함수
```javascript
function updateUI() {
  tanks.forEach((tank, index) => {
    const statPanel = document.getElementById(`tank${index + 1}-stat`);

    if (tank && tank.alive) {
      // 탱크 이름 & 색상
      nameEl.textContent = tank.id;
      nameEl.style.color = tank.config.color;

      // 체력 게이지
      const healthPercent = (tank.health / tank.config.maxHealth) * 100;
      healthFill.style.height = `${healthPercent}%`;

      // 무기 에너지 게이지
      const energyPercent = (tank.weaponEnergy / tank.maxWeaponEnergy) * 100;
      weaponFill.style.height = `${energyPercent}%`;

      // 무기 & 점수
      weaponInfo.textContent = WEAPON_DATA[tank.currentWeapon].name;
      scoreEl.textContent = `$${tank.score}`;
    }
  });
}
```

#### 게임 루프 통합
```javascript
function gameLoop() {
  // ... 물리 업데이트
  render();
  updateUI(); // 매 프레임 UI 업데이트
  requestAnimationFrame(gameLoop);
}
```

---

### 4. Shield 제거 및 단순화

#### 설계 결정
**Shield 시스템 제거** → 체력만 사용
- 이유: 게임 단순화, UI 복잡도 감소
- 원본 게임의 Shield는 선택적 아이템으로 재구현 가능

#### 코드 변경
```javascript
// Tank 클래스
this.config = {
  maxHealth: 100  // maxShield 제거
};
this.health = this.config.maxHealth;
// this.shield 제거

// takeDamage 단순화
takeDamage(damage) {
  this.health -= damage; // shield 로직 제거
  if (this.health <= 0) {
    this.destroy();
  }
}
```

#### 렌더링 정리
- 탱크 위 health bar 제거 (`renderHealthBars()` 메서드 삭제)
- 모든 상태는 사이드바 UI로만 표시
- 게임 화면 깔끔하게 유지

---

### 5. 무기 시스템 확장

#### 무기 데이터 문서화
**파일**: `WEAPONS.md`, `WEAPONS_KR.md`
- 원본 DZONE.DOC (1994) 분석
- 34개 전체 무기 문서화
- 7개 포트별 분류
- 각 무기의 damage, speed, energy, price, 전략 팁

#### 속도 스케일링 시스템
**문제**: weapon-data.js의 speed=200이 실제로는 너무 빠름
**원인**: DOS 게임 단위 vs 웹 픽셀 단위 차이

**해결책**: 스케일 팩터 도입
```javascript
const SPEED_SCALE_FACTOR = 0.01;  // 200 * 0.01 = 2px/frame

// Projectile 생성 시
const actualSpeed = weaponData.speed * SPEED_SCALE_FACTOR;
```

**장점**:
- 원본 게임 데이터 보존
- 밸런싱 쉬움
- 역사적 데이터 유지

#### 무기별 렌더링 차별화
**MISSILE**: 원형 + 꼬리
```javascript
ctx.fillStyle = this.color;
ctx.arc(pos.x, pos.y, this.weaponData.size, 0, Math.PI * 2);
// + trail
```

**LASER**: 긴 빔 + 글로우
```javascript
const beamLength = 20;
ctx.strokeStyle = this.color;
ctx.lineCap = 'round';
// 빔 그리기
```

#### 충돌 필터링 최적화
**문제**: 미사일끼리 충돌해서 튕겨나감
**해결**: Matter.js collisionFilter 활용

```javascript
const COLLISION_CATEGORY = {
  TANK: 0x0001,
  PROJECTILE: 0x0002,
  WALL: 0x0004
};

// Projectile body
collisionFilter: {
  category: COLLISION_CATEGORY.PROJECTILE,
  mask: COLLISION_CATEGORY.TANK | COLLISION_CATEGORY.WALL
  // PROJECTILE 제외 → 미사일끼리 통과
}
```

**결과**:
- 미사일끼리 통과
- 탱크/벽과는 충돌
- 물리적 특성 유지 (isSensor: false)

#### 무기별 물리 특성
**LASER**: 낮은 밀도
```javascript
density: isLaser ? 0.001 : 0.4
```
- 탱크를 밀지 않음
- 데미지만 줌
- 벽에 부딪히면 사라짐

**MISSILE**: 일반 밀도
- 탱크를 살짝 밀음
- 물리적 충격 + 데미지

---

### 6. 무기 에너지 시스템

#### 에너지 소비
```javascript
function fireProjectile(tank) {
  const weaponData = WEAPON_DATA[tank.currentWeapon];

  // 에너지 체크
  if (tank.weaponEnergy < weaponData.energyCost) {
    return; // 발사 불가
  }

  // 에너지 소모
  tank.weaponEnergy -= weaponData.energyCost;

  // 발사체 생성
  // ...
}
```

#### 에너지 충전
```javascript
// Tank.update() 내부
if (this.weaponEnergy < this.maxWeaponEnergy) {
  this.weaponEnergy = Math.min(
    this.maxWeaponEnergy,
    this.weaponEnergy + this.weaponRechargeRate / 60
  );
}
```

**밸런스**:
- 최대 에너지: 100
- 충전 속도: 20/초 (초당 1/5 충전)
- MISSILE: 4 에너지 (0.2초 충전)
- LASER: 6 에너지 (0.3초 충전)

#### 실시간 UI 반영
- WPN 게이지가 발사 시 즉시 감소
- 서서히 차오름
- 시각적 피드백 명확

---

### 7. 다중 발사체 시스템

#### DOUBLE_MISSILE 구현
```javascript
const projectileCount = weaponData.projectileCount || 1;

if (projectileCount > 1) {
  const spacing = 6;  // 미사일 간격
  const perpAngle = tank.body.angle + Math.PI / 2;

  for (let i = 0; i < projectileCount; i++) {
    // 중심에서 좌우로 배치
    const offset = (i - (projectileCount - 1) / 2) * spacing;

    const spawnX = tank.body.position.x +
                   Math.cos(tank.body.angle) * barrelLength +
                   Math.cos(perpAngle) * offset;
    // ...
  }
}
```

**특징**:
- 2개 이상 발사체를 평행 배치
- 탱크 진행 방향에 수직으로 분산
- 중심 기준 대칭 배치
- 확장 가능 (TRIPLE, QUAD 등)

---

## 🎮 구현된 무기 (3개)

### 1. MISSILE
- **타입**: 기본 발사체
- **데미지**: 4
- **에너지**: 4
- **속도**: 200 (2px/frame)
- **렌더링**: 원형 + 꼬리
- **물리**: 일반 밀도 (0.4)

### 2. LASER
- **타입**: 빔
- **데미지**: 6
- **에너지**: 6
- **속도**: 400 (4px/frame, 2배 빠름)
- **렌더링**: 20px 긴 빔 + 글로우
- **물리**: 낮은 밀도 (0.001)

### 3. DOUBLE_MISSILE
- **타입**: 다중 발사체
- **데미지**: 6 (총합)
- **에너지**: 4
- **속도**: 200
- **발사체**: 2개 평행
- **렌더링**: 원형 + 꼬리

---

## 📊 통계

**Phase 3A 작업 시간**: 약 3시간
**코드 라인 수**:
- prototype.html: 706줄 → 1,350줄 (+644줄)
- 추가된 기능:
  - UI 시스템: 200줄
  - 무기 에너지 시스템: 80줄
  - 다중 발사체: 50줄
  - 무기별 렌더링: 70줄
  - 충돌 필터링: 30줄
  - 기타: 214줄

**추가 파일**:
- WEAPONS.md: 401줄 (영문)
- WEAPONS_KR.md: 한글 번역 + 추가 정보

**커밋**:
- Phase 3A: UI & Weapon System 구현

---

## 🎯 결론

**Phase 3A 성공!** ✅

게임 인터페이스와 무기 시스템의 기초가 완성되었습니다:
- 실시간 UI가 게임 상태를 정확히 반영
- 무기 에너지 시스템이 밸런스있게 작동
- 여러 타입의 무기가 각각 다른 느낌
- 원본 게임의 미니멀한 느낌 재현

**핵심 설계 결정**:
1. **Shield 제거**: 게임 단순화
2. **충돌 필터링**: 미사일끼리 통과
3. **속도 스케일링**: 원본 데이터 보존
4. **밀도 차별화**: 무기별 물리 특성

**다음 단계**: Phase 3B (Game Flow Systems)
- Round Management
- Shop System
- 추가 무기 구현 (TRIPLE, TRI-STRIKER, BLASTER 등)

---

## 🔧 기술적 하이라이트

### Matter.js collisionFilter 활용
비트 마스크를 사용한 정교한 충돌 제어:
```javascript
category: 0x0002,           // 이 객체는 PROJECTILE
mask: 0x0001 | 0x0004       // TANK, WALL과만 충돌
// PROJECTILE과는 충돌 안함
```

### CSS Flexbox 레이아웃
```css
#gameContainer {
  display: flex;
  flex-direction: row;  /* 좌-중-우 */
}

.tank-stat {
  height: 240px;  /* 720 ÷ 3 */
}
```

### 실시간 게이지 업데이트
```javascript
// CSS height 속성을 동적으로 변경
element.style.height = `${percentage}%`;
```

---

## 📝 참고 자료

- WEAPONS.md - 34개 전체 무기 문서
- ARCHITECTURE.md - 업데이트된 Phase 구조
- [Matter.js Collision Filtering](https://brm.io/matter-js/docs/classes/Body.html#property_collisionFilter)
- dzone-v1.3/DZONE.DOC - 원본 게임 매뉴얼

---
---

## 2025년 1월 28일 - PixiJS Particle Effects 추가

### 🎯 목표
향후 특수 효과 확장을 위한 PixiJS 파티클 시스템 구축

---

## 📋 진행 사항

### 1. PixiJS 통합

#### 기술 선택
- **PixiJS v7.3.2**: WebGL 기반 2D 렌더링 라이브러리
- **외부 라이브러리 없음**: pixi-particles 대신 네이티브 구현
- **하이브리드 렌더링**: Canvas 2D (게임 오브젝트) + PixiJS (파티클)

#### 아키텍처
```
┌──────────────────────────────┐
│   PixiJS Canvas (Layer 2)    │ ← 파티클 전용
│   (backgroundAlpha: 0)       │
├──────────────────────────────┤
│   Canvas 2D (Layer 1)        │ ← 게임 오브젝트
│   (Matter.js 렌더링)         │
└──────────────────────────────┘
```

**핵심**: CSS absolute positioning으로 투명 오버레이

---

### 2. PixiJS 초기화

#### HTML 구조 변경
```html
<!-- 기존 -->
<canvas id="gameCanvas"></canvas>

<!-- 변경 후 -->
<div id="canvasWrapper">
  <canvas id="gameCanvas"></canvas>
  <div id="pixiContainer"></div>
</div>
```

#### CSS 오버레이 설정
```css
#canvasWrapper {
  position: relative;
}

#pixiContainer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;  /* 클릭 이벤트 통과 */
}
```

#### 초기화 코드
```javascript
let pixiApp;
let particleContainer;
const activeParticles = [];

function initPixiJS() {
  pixiApp = new PIXI.Application({
    width: 960,
    height: 720,
    backgroundAlpha: 0,  // ✅ 완전 투명 (transparent: true 아님!)
    antialias: true
  });

  document.getElementById('pixiContainer')
    .appendChild(pixiApp.view);

  particleContainer = new PIXI.Container();
  pixiApp.stage.addChild(particleContainer);
}
```

**중요**: `backgroundAlpha: 0`이 핵심! `transparent: true`는 opaque black으로 렌더링됨.

---

### 3. Particle 클래스 (Native 구현)

#### PIXI.Graphics 확장
```javascript
class Particle extends PIXI.Graphics {
  constructor(x, y, vx, vy, config) {
    super();

    // 원형 파티클 그리기
    this.beginFill(config.startColor || 0xffff00);
    this.drawCircle(0, 0, config.radius || 3);
    this.endFill();

    this.position.set(x, y);
    this.vx = vx;
    this.vy = vy;

    this.maxLife = config.lifetime || 1.0;
    this.life = this.maxLife;
    this.startColor = config.startColor;
    this.endColor = config.endColor;
    this.damping = config.damping || 0.95;
  }

  update(deltaTime) {
    // 위치 업데이트
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // 속도 감속
    this.vx *= this.damping;
    this.vy *= this.damping;

    // 생명 감소
    this.life -= deltaTime;

    // 투명도
    this.alpha = this.life / this.maxLife;

    // 색상 변화 (50% 기준)
    const progress = 1 - (this.life / this.maxLife);
    this.tint = progress < 0.5 ? this.startColor : this.endColor;

    return this.life > 0;  // 생존 여부
  }
}
```

**특징**:
- `PIXI.Graphics`로 원형 파티클 생성
- 간단한 물리 시뮬레이션 (velocity + damping)
- 색상 전환 (`tint` 속성 활용)
- 알파 페이드 아웃
- 자체 생명 주기 관리

---

### 4. 파티클 생성 함수

#### 탱크 폭발 파티클
```javascript
function createTankExplosionParticles(x, y) {
  if (!particleContainer) return;

  const count = 80;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 150;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const particle = new Particle(x, y, vx, vy, {
      lifetime: 0.5 + Math.random() * 0.7,
      startColor: 0xffff00,  // 노란색
      endColor: 0xff0000,    // 빨간색
      damping: 0.95,
      radius: 3  // 큰 파티클
    });

    particleContainer.addChild(particle);
    activeParticles.push(particle);
  }
}
```

**효과**:
- 80개 파티클
- 방사형으로 사방 퍼짐
- 노란색 → 빨간색 전환
- 수명: 0.5~1.2초

#### 미사일 충돌 파티클
```javascript
function createProjectileHitParticles(x, y) {
  if (!particleContainer) return;

  const count = 5;  // 작은 스파크
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const particle = new Particle(x, y, vx, vy, {
      lifetime: 0.2 + Math.random() * 0.3,
      startColor: 0xffffff,  // 흰색
      endColor: 0xff8800,    // 주황색
      damping: 0.92,
      radius: 1  // 작은 파티클 (1/3 크기)
    });

    particleContainer.addChild(particle);
    activeParticles.push(particle);
  }
}
```

**효과**:
- 5개 파티클 (탱크 폭발의 1/16)
- 흰색 → 주황색 스파크
- 수명: 0.2~0.5초
- radius 1 (탱크 폭발의 1/3)

---

### 5. 파티클 라이프사이클 관리

#### 업데이트 & 정리
```javascript
function updateParticles(deltaTime) {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const particle = activeParticles[i];
    const alive = particle.update(deltaTime);

    if (!alive) {
      particleContainer.removeChild(particle);
      particle.destroy();  // PixiJS 메모리 해제
      activeParticles.splice(i, 1);
    }
  }
}
```

**자동 정리**:
- 역순 순회 (splice 안전)
- 죽은 파티클 컨테이너에서 제거
- `destroy()` 호출로 메모리 누수 방지
- 배열에서도 제거

---

### 6. 게임 이벤트 연결

#### Tank.destroy() 연결
```javascript
destroy() {
  if (!this.alive) return;

  this.alive = false;

  // Canvas 폭발 링 (기존)
  createExplosion(this.body.position.x, this.body.position.y);

  // PixiJS 파티클 (신규)
  createTankExplosionParticles(this.body.position.x, this.body.position.y);

  World.remove(world, this.body);
}
```

#### handleProjectileHit() 연결
```javascript
function handleProjectileHit(projectileBody, tankBody) {
  // ... 데미지 처리 ...

  // Canvas 이펙트 (기존)
  createHitEffect(projectileBody.position.x, projectileBody.position.y);

  // PixiJS 파티클 (신규)
  createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);

  projectile.destroy();
}
```

#### handleProjectileWallHit() 연결
```javascript
function handleProjectileWallHit(projectileBody) {
  // ... 발사체 찾기 ...

  createHitEffect(projectileBody.position.x, projectileBody.position.y);
  createProjectileHitParticles(projectileBody.position.x, projectileBody.position.y);

  projectile.destroy();
}
```

---

### 7. 게임 루프 통합

#### 초기화
```javascript
console.log('🚀 Matter.js Prototype Starting...');

// PixiJS 초기화 (게임 루프 전)
initPixiJS();

requestAnimationFrame(gameLoop);
```

#### 업데이트 루프
```javascript
function gameLoop(currentTime) {
  // ... deltaTime 계산 ...

  // 파티클 업데이트 (매 프레임)
  updateParticles(deltaTime);

  // 물리 업데이트
  Engine.update(engine, 1000 / 60);

  // 렌더링
  render();
  updateUI();

  requestAnimationFrame(gameLoop);
}
```

---

## 🔧 문제 해결 과정

### 문제 1: 탱크가 안 보임
**증상**: PixiJS 추가 후 탱크가 화면에서 사라짐

**원인**: `transparent: true` 옵션이 opaque black으로 렌더링되어 Canvas 2D 레이어를 가림

**해결**:
```javascript
// ❌ 작동 안함
new PIXI.Application({ transparent: true })

// ✅ 작동함
new PIXI.Application({ backgroundAlpha: 0 })
```

**교훈**: PixiJS v7에서는 `backgroundAlpha: 0`가 올바른 방법

### 문제 2: pixi-particles 라이브러리 로딩 실패
**증상**: CDN에서 pixi-particles 로드 실패 (404, MIME type 에러)

**원인**: 외부 라이브러리 호환성 문제

**해결**: 외부 라이브러리 포기, PixiJS 네이티브 기능만 사용
- `PIXI.Graphics`로 파티클 그리기
- 직접 물리 시뮬레이션 구현
- 더 가볍고 안정적

**교훈**: 의존성 최소화, 네이티브 기능 우선

### 문제 3: 파티클 크기 혼동
**증상**: 미사일 충돌 파티클이 탱크 폭발 파티클만큼 큼

**원인**: 개수만 줄이고(15→5) 크기(radius)는 동일하게 유지

**해결**: `radius` 파라미터 추가
```javascript
// 탱크 폭발
radius: 3  // 큰 파티클

// 미사일 충돌
radius: 1  // 작은 스파크 (1/3)
```

**교훈**: 사용자 피드백의 정확한 의도 파악 중요

### 문제 4: 코드 지저분해짐
**증상**: pixi-particles 제거 중 코드가 복잡하게 얽힘

**해결**: `git restore prototype.html`로 깔끔하게 되돌리고 처음부터 재작업

**교훈**: 복잡한 리팩토링보다 클린 스타트가 나을 때가 있음

---

## 📊 통계

**작업 시간**: 약 1시간
- PixiJS 통합 시도 1차 (실패): 20분
- 디버깅 및 재시작: 15분
- 클린 구현: 25분

**코드 라인 수**:
- prototype.html: 1,350줄 → 1,523줄 (+173줄)
- 추가된 기능:
  - PixiJS 초기화: 30줄
  - Particle 클래스: 50줄
  - 파티클 생성 함수: 50줄
  - 라이프사이클 관리: 20줄
  - 이벤트 연결: 23줄

**커밋**:
- feat: Add PixiJS particle effects system

---

## 🎯 결론

**PixiJS 파티클 시스템 완성!** ✅

**구현된 기능**:
- ✅ PixiJS 투명 오버레이 (backgroundAlpha: 0)
- ✅ 네이티브 파티클 클래스 (PIXI.Graphics)
- ✅ 탱크 폭발 효과 (80개, radius 3)
- ✅ 미사일 충돌 효과 (5개, radius 1)
- ✅ 자동 라이프사이클 관리
- ✅ 하이브리드 렌더링 안정화

**핵심 설계 결정**:
1. **외부 라이브러리 제거**: pixi-particles 대신 네이티브 구현
2. **하이브리드 렌더링**: Canvas 2D + PixiJS 오버레이
3. **간단한 물리**: velocity + damping으로 충분
4. **파티클 차별화**: 크기(radius)로 탱크/미사일 구분

**향후 확장 가능**:
- 추가 파티클 효과 (추진 불꽃, 실드 임팩트 등)
- 더 복잡한 파티클 패턴 (스월러, 트레일 등)
- 텍스처 기반 파티클 (PIXI.Sprite)
- 파티클 풀링 최적화

**다음 단계**: Phase 3B 계속 진행
- Round Management
- Shop System
- 추가 무기 구현

---

## 🔬 기술적 하이라이트

### PixiJS backgroundAlpha vs transparent
```javascript
// ❌ 검은 화면
{ transparent: true }

// ✅ 투명 오버레이
{ backgroundAlpha: 0 }
```

### CSS 오버레이 기법
```css
#canvasWrapper { position: relative; }
#pixiContainer {
  position: absolute;
  top: 0; left: 0;
  pointer-events: none;  /* 클릭 통과 */
}
```

### PIXI.Graphics 동적 색상
```javascript
// tint로 색상 변경 (beginFill 후에도 가능)
particle.tint = progress < 0.5 ? startColor : endColor;
```

### 역순 배열 순회
```javascript
// splice 안전하게 하기
for (let i = array.length - 1; i >= 0; i--) {
  if (shouldRemove) {
    array.splice(i, 1);
  }
}
```

---

## 📝 참고 자료

- [PixiJS v7 Documentation](https://pixijs.download/release/docs/index.html)
- [PIXI.Graphics](https://pixijs.download/release/docs/PIXI.Graphics.html)
- [PIXI.Application Options](https://pixijs.download/release/docs/PIXI.Application.html)
