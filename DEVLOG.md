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
