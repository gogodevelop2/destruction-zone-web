# 아키텍처 설계 & 리팩토링

## 목차
- [Matter.js 중심 아키텍처](#matterjs-중심-아키텍처)
- [프로젝트 재구조화](#프로젝트-재구조화)
- [Phase별 구현 계획](#phase별-구현-계획)

---

## Matter.js 중심 아키텍처

**날짜**: 2025-01-27
**목적**: 하이브리드 물리 방식의 문제 해결

### 배경: 하이브리드 방식의 실패

기존 시도 (아카이브: `_archive/hybrid-physics-attempt-2025-01/`)
- 원본 DOS 물리 + Matter.js 혼합
- **문제점**:
  - 이중 물리 시스템으로 인한 동기화 이슈
  - 회전 제어 복잡성 (수동 + 물리 혼합)
  - deltaTime 적용 불일치
  - 디버깅 극도로 어려움

### 새 아키텍처 원칙

**Single Source of Truth**: Matter.js만 사용

```
입력 (키보드/AI)
    ↓
힘/토크 계산
    ↓
Matter.js에 힘 적용 (Body.applyForce)
    ↓
Matter.js 물리 시뮬레이션
    ↓
렌더링 (body.position, body.angle 읽기)
```

**핵심 원칙:**
1. Matter.js가 모든 물리 상태 관리 (위치, 회전, 속도)
2. 엔티티는 Matter.js body의 얇은 래퍼
3. 입력 → 힘 적용 → Matter.js 업데이트 → 렌더링
4. 충돌 이벤트는 Matter.js에서 처리

### 아키텍처 문서

**파일**: `ARCHITECTURE.md` (508줄 → 현재 더 확장됨)

**Phase별 계획:**
- Phase 1: 프로토타입 (1-2시간) ✅
- Phase 2: 핵심 기능 (3-4시간) ✅
- Phase 3: 게임 시스템 통합 (2-3시간)
- Phase 4: 밸런싱 및 폴리싱 (1-2시간)

### 구현 성과

**Phase 1 완성** (2025-01-27)
- 단일 파일 프로토타입: `prototype.html`
- Tank 클래스: Matter.js Bodies.fromVertices 기반
- 회전 제어: Body.setAngularVelocity
- 이동: Body.applyForce
- 충돌 처리: Matter.js Events

**Phase 2 완성** (2025-10-29)
- Projectile 클래스: 발사체 물리
- Collision 시스템: 카테고리 필터링
- AI 시스템: 기본 추적/회피
- 멀티플레이: 6탱크 동시 플레이

### 배운 점

1. **물리 엔진 완전 신뢰하기**
   - 반쯤 신뢰하면 더 복잡해짐
   - 물리 엔진의 결과를 그대로 사용

2. **단순함이 최고**
   - 하이브리드 < 순수 Matter.js
   - 복잡도 ↓, 버그 ↓, 유지보수성 ↑

3. **프로토타입부터 올바른 구조**
   - 나중에 리팩토링하려면 비용 큼
   - 처음부터 아키텍처 문서 작성

### 참고
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- 커밋: 232649c (Phase 1), 60a82e4 (Phase 2)

---

## 프로젝트 재구조화

**날짜**: 2025-01-27
**브랜치**: `matter-js-rewrite`

### 기존 코드 아카이브
- 폴더: `_archive/hybrid-physics-attempt-2025-01/`
- 보존 이유: 시행착오 학습 자료

### 새 시작
- 깨끗한 브랜치에서 재시작
- Matter.js 중심 설계
- 단일 파일 프로토타입으로 검증 후 확장

---

## Phase별 구현 계획

### Phase 1: 프로토타입 ✅
- 기본 탱크 이동/회전
- 단순 발사체
- 벽 충돌

### Phase 2: 핵심 기능 ✅
- 발사체 물리 정교화
- AI 시스템
- 충돌 감지 및 피해

### Phase 3: 게임 시스템 (진행중)
- 무기 시스템 확장
- 렌더링 최적화 (PixiJS)
- 모듈 분리 리팩토링

### Phase 4: 폴리싱 (예정)
- 밸런싱
- 사운드
- UI/UX

---

## 다음 단계: 모듈 분리 리팩토링

**현재**: 단일 파일 프로토타입 (prototype.html)
**목표**: 모듈 구조

```
src/
├── rendering/
│   ├── PixiRenderer.js
│   ├── ProjectileRenderer.js
│   └── ParticleRenderer.js
├── entities/
│   ├── Tank.js
│   ├── Projectile.js
│   └── Particle.js
├── physics/
│   └── PhysicsWorld.js
└── ai/
    └── TankAI.js
```

**준비 상황:**
- ProjectileRenderer 이미 분리됨
- 상세한 리팩토링 주석 추가됨
- 인터페이스 명확화 완료
