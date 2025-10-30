# 개발 여정 (Development Journey)

## 목차
- [DOS 원본에서 웹으로](#dos-원본에서-웹으로)
- [하이브리드 물리 시도와 실패](#하이브리드-물리-시도와-실패)
- [Matter.js 중심 재시작](#matterjs-중심-재시작)

---

## DOS 원본에서 웹으로

### 시작점: Destruction Zone (1994)

**원본 게임:**
- 작성자: Julian Cochran
- 버전: v1.0, v1.3
- 플랫폼: DOS
- 언어: (추정) Turbo Pascal/C

**게임 특징:**
- 6탱크 동시 플레이
- 34종 무기 시스템 (7개 포트)
- 탑다운 슈팅
- 물리 기반 이동 (관성)
- AI 탱크

**보존된 자료:**
- `dos-original/dzone-v1.0/`, `dos-original/dzone-v1.3/` - 원본 DOS 실행파일
- `WEAPONS.md` - 원본 매뉴얼에서 추출한 무기 명세

### 초기 웹 포팅 시도

**목표:** DOS 게임을 웹으로 충실히 재현

**접근:**
- Canvas 2D API 사용
- DOS 물리 엔진 역설계 시도
- JavaScript로 직접 구현

**구현 내용:**
```
old-web-version/ (삭제됨)
├── js/
│   ├── core/
│   │   ├── engine.js      # 게임 루프
│   │   ├── physics.js     # 직접 구현한 물리
│   │   └── renderer.js    # Canvas 렌더링
│   ├── entities/
│   │   ├── tank.js        # 탱크 클래스
│   │   ├── projectile.js  # 발사체
│   │   └── weapon.js      # 무기 시스템
│   ├── systems/
│   │   ├── ai.js          # AI 시스템
│   │   ├── collision.js   # 충돌 감지
│   │   └── scoring.js     # 점수 시스템
│   └── ui/                # UI 컴포넌트
└── index.html
```

**문제 발견:**
- 물리 엔진 구현의 복잡성
- 충돌 감지의 정확도 문제
- 회전 및 관성 시뮬레이션 어려움
- 탱크 형태(삼각형) 충돌 처리 복잡

---

## 하이브리드 물리 시도와 실패

**날짜:** 2025년 1월 초

### 시도: 외부 물리 엔진 도입

**동기:**
- 직접 구현한 물리의 한계
- 정확한 충돌 감지 필요
- Matter.js 발견

**접근 방식: 하이브리드**

원본 DOS 물리 시스템 + Matter.js 충돌 감지

```javascript
// 하이브리드 구조 (실패한 접근)
class Tank {
    constructor() {
        // 1. DOS 스타일 물리 상태
        this.position = { x, y };
        this.velocity = { x, y };
        this.angle = 0;
        this.angularVelocity = 0;

        // 2. Matter.js 바디 (충돌용만)
        this.matterBody = Bodies.fromVertices(x, y, vertices, {
            isSensor: true  // 센서로만 사용 시도
        });
    }

    update(deltaTime) {
        // DOS 스타일 물리 업데이트
        this.velocity.x += forceX;
        this.velocity.y += forceY;
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

        // Matter.js 바디 위치 동기화 시도
        Body.setPosition(this.matterBody, this.position);
        Body.setAngle(this.matterBody, this.angle);
        // ⚠️ 문제: Matter.js가 이 위치를 다시 바꿔버림
    }
}
```

### 발생한 문제들

#### 1. 이중 물리 시스템 충돌

**증상:**
- DOS 물리가 위치를 업데이트 → Matter.js가 다시 변경
- Matter.js가 충돌 처리 → DOS 물리가 무시
- 탱크가 예상치 못한 방향으로 이동

**원인:**
- 두 개의 "진실의 원천" (Source of Truth)
- 서로 다른 좌표계와 단위
- 동기화 타이밍 문제

#### 2. 회전 제어의 악몽

```javascript
// 수동 회전 (키보드 입력)
if (leftKey) {
    this.angularVelocity = -turnSpeed;
}

// Matter.js도 회전 관리
Body.setAngularVelocity(this.matterBody, this.angularVelocity);

// ⚠️ Matter.js가 관성, 마찰 등으로 각속도 수정
// 결과: 의도한 회전과 실제 회전이 다름
```

**문제:**
- 키보드로 정밀 제어 불가능
- Matter.js 물리 vs 게임 피드백 충돌
- 플레이어 입력 반응 지연

#### 3. deltaTime 불일치

```javascript
// DOS 물리: 고정 타임스텝
const DOS_TIMESTEP = 1/60;
this.position.x += this.velocity.x * DOS_TIMESTEP;

// Matter.js: 가변 타임스텝
Engine.update(engine, deltaTime);

// ⚠️ 두 시스템이 다른 시간 개념 사용
// 결과: 점점 동기화 틀어짐
```

#### 4. 충돌 반응의 혼란

```javascript
// Matter.js 충돌 이벤트
Events.on(engine, 'collisionStart', (event) => {
    // Matter.js가 자동으로 충돌 반응 적용
    // 하지만 우리는 DOS 물리를 따로 업데이트
    // ⚠️ 충돌 반응이 두 번 적용되거나 무시됨
});
```

### 디버깅의 어려움

**문제:**
- 버그 원인 파악 불가능
  - DOS 물리 문제? Matter.js 문제? 동기화 문제?
- 한 쪽을 수정하면 다른 쪽이 망가짐
- 코드 복잡도 기하급수적 증가

**시도한 해결책 (모두 실패):**
- isSensor 모드 (센서로만 사용)
  → 충돌 감지만 하고 반응 없음, 그럼 왜 Matter.js?
- 위치 수동 동기화
  → 동기화 코드가 물리 코드보다 복잡해짐
- Matter.js 물리 비활성화 시도
  → 그럼 직접 구현하는 것과 동일

### 최종 결정: 포기

**날짜:** 2025년 1월 중순

**결론:**
> "하이브리드는 두 시스템의 장점이 아니라 **단점을 합친 것**이다."

**아카이브:**
- `_archive/hybrid-physics-attempt-2025-01/` (현재 삭제됨)
- 시도의 기록은 보존했지만 코드는 불필요

---

## Matter.js 중심 재시작

**날짜:** 2025년 1월 27일
**브랜치:** `matter-js-rewrite`

### 핵심 깨달음

**Single Source of Truth**
- 물리 상태는 Matter.js **만** 관리
- 엔티티는 Matter.js body의 얇은 래퍼
- 렌더링은 body.position, body.angle **읽기만**

### 새 아키텍처 원칙

```javascript
// 올바른 접근
class Tank {
    constructor(x, y) {
        // Matter.js 바디 = 유일한 물리 상태
        this.body = Bodies.fromVertices(x, y, vertices, {
            // Matter.js가 완전히 제어
        });

        // 게임 로직만 추가
        this.health = 100;
        this.weaponEnergy = 100;
    }

    update(deltaTime, input) {
        // 입력 → 힘으로 변환
        if (input.forward) {
            const force = {
                x: Math.cos(this.body.angle) * thrust,
                y: Math.sin(this.body.angle) * thrust
            };
            Body.applyForce(this.body, this.body.position, force);
        }

        if (input.left) {
            Body.setAngularVelocity(this.body, -turnSpeed);
        }

        // Matter.js가 나머지 처리
        // 우리는 결과만 읽음
    }

    render(ctx) {
        // Matter.js 결과 읽기만
        const pos = this.body.position;
        const angle = this.body.angle;

        // 렌더링
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        // ... 그리기
        ctx.restore();
    }
}
```

### 게임 루프 구조

```javascript
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;

    // 1. 입력 처리
    handleInput();

    // 2. 게임 로직 (힘 적용)
    tanks.forEach(tank => tank.update(deltaTime, input));

    // 3. Matter.js 물리 시뮬레이션
    Engine.update(engine, deltaTime * 1000);

    // 4. 렌더링 (Matter.js 상태 읽기)
    render(ctx);

    requestAnimationFrame(gameLoop);
}
```

### 성공 요인

**1. 단순함**
- 하나의 물리 시스템
- 명확한 데이터 흐름
- 버그 추적 용이

**2. Matter.js 완전 신뢰**
- 충돌 감지/반응
- 회전 관성
- 속도 제한
- 모든 물리 → Matter.js에 맡김

**3. 빠른 프로토타입**
- 단일 파일 (prototype.html)
- 2시간 만에 동작하는 프로토타입
- 하이브리드는 2주 동안 실패

### 결과

**Phase 1 (2025-01-27):**
- ✅ 탱크 이동/회전 완벽 작동
- ✅ 벽 충돌 정확
- ✅ 6탱크 동시 플레이

**Phase 2 (2025-10-29):**
- ✅ 발사체 물리
- ✅ 충돌 감지
- ✅ AI 시스템
- ✅ TRON 스타일

**Phase 3 (2025-10-30):**
- ✅ PixiJS 렌더링 통합
- ✅ 리팩토링 준비 완료

---

## 배운 교훈

### 1. 기술 선택

**❌ 잘못된 접근:**
- 기존 코드 보존하려고 하이브리드 시도
- "두 기술 모두 사용하면 더 좋을 것"이라는 착각

**✅ 올바른 접근:**
- 기술 선택 시 명확한 책임 분리
- "Single Source of Truth" 원칙
- 기존 코드에 집착하지 말 것

### 2. 복잡도 관리

**하이브리드의 복잡도:**
```
복잡도 = (System A) × (System B) × (동기화 로직)
```

**순수 접근의 복잡도:**
```
복잡도 = System A
```

→ 하이브리드는 단순히 2배가 아니라 **10배 이상** 복잡

### 3. 프로토타입의 중요성

**하이브리드 시도:**
- 2주 동안 작업
- 결과: 작동 안 함
- 스트레스: 극심

**Matter.js 순수:**
- 2시간 프로토타입
- 결과: 완벽 작동
- 확신: 즉시

→ 빠른 프로토타입으로 **빠른 실패** 또는 **빠른 성공**

### 4. 코드 버리기

**집착:**
- "이미 많이 작성했는데..."
- "언젠가 쓸모있을지도..."

**현실:**
- 나쁜 구조는 계속 발목 잡음
- 깨끗한 재시작 > 더러운 유지보수

→ **Sunk Cost Fallacy 극복**

### 5. 문서화

**하이브리드 시도:**
- 코드만 작성
- 왜 안 되는지 모름
- 같은 실수 반복

**Matter.js 재시작:**
- ARCHITECTURE.md 먼저 작성
- 설계 원칙 명확
- 팀원(미래의 나)과 소통

---

## 타임라인 요약

```
2024년 말
└─ DOS 원본 분석 시작

2025년 1월 초
├─ 웹 포팅 시도 (직접 물리 구현)
└─ 한계 발견

2025년 1월 중순
├─ Matter.js 발견
├─ 하이브리드 시도
│   ├─ 1주차: 이상한 버그들
│   ├─ 2주차: 디버깅 지옥
│   └─ 포기 결정
└─ 아카이브: _archive/hybrid-physics-attempt-2025-01/

2025년 1월 27일
├─ 완전히 새로운 시작
├─ ARCHITECTURE.md 작성
├─ prototype.html 2시간 작성
└─ ✅ 성공!

2025년 10월 29일
└─ Phase 2 완성 (Projectile, AI, TRON)

2025년 10월 30일
└─ PixiJS 마이그레이션 완료
```

---

## 현재 상태

**삭제된 것:**
- ❌ 구 웹 버전 (`js/`, `css/`, `index.html`)
- ❌ 하이브리드 시도 (`_archive/hybrid-physics-attempt-2025-01/`)

**보존된 것:**
- ✅ 개발 여정 (이 문서)
- ✅ DOS 원본 (`dos-original/dzone-v1.0/`, `dos-original/dzone-v1.3/`)
- ✅ 원본 매뉴얼 추출 데이터 (`WEAPONS.md`)

**현재 작업:**
- ✅ `prototype.html` - Matter.js 중심 프로토타입
- ✅ 리팩토링 준비 완료
- ✅ 다음: 모듈 분리 (src/ 구조)

---

## 참고

### 관련 문서
- [architecture.md](./architecture.md) - 현재 아키텍처 상세
- [physics-engine.md](./physics-engine.md) - Matter.js 통합 기술

### 핵심 원칙 (다시는 잊지 말 것)
1. **Single Source of Truth** - 하나의 시스템만 상태 관리
2. **빠른 프로토타입** - 2주 고민 < 2시간 테스트
3. **코드 버릴 용기** - Sunk Cost 무시
4. **문서화 우선** - 설계 → 구현
5. **단순함이 최고** - 복잡도는 적
