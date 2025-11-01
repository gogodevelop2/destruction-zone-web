# Destruction Zone - 개발 로그

> **상세 기록**: 주제별로 정리된 상세 개발 로그는 [docs/devlogs/](./docs/devlogs/) 참고
>
> **전체 히스토리**: [docs/archive/devlog-original.md](./docs/archive/devlog-original.md)

---

## 📚 주제별 개발 로그

### 핵심 시스템
- **[아키텍처](./docs/devlogs/architecture.md)** - 설계 결정, Matter.js 중심 구조, 리팩토링 계획
- **[물리 엔진](./docs/devlogs/physics-engine.md)** - Matter.js 통합, 충돌 시스템, 안정성 개선
- **[렌더링](./docs/devlogs/rendering.md)** - Canvas/PixiJS 하이브리드, 발사체 마이그레이션
- **[AI 시스템](./docs/devlogs/ai-system.md)** - State Machine, Navmesh, LOS, 디버그 시스템

### 게임 요소
- **[비주얼 디자인](./docs/devlogs/visual-design.md)** - TRON 스타일, visualMargin, 네온 효과
- **[Procedural Walls](./docs/devlogs/procedural-walls.md)** - 그리드 기반 랜덤 벽 생성

### 개발 과정
- **[개발 여정](./docs/devlogs/development-journey.md)** - DOS 포팅 → 하이브리드 실패 → Matter.js 재시작

### 참고 문서
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 전체 시스템 아키텍처
- **[WEAPONS.md](./WEAPONS.md)** - 무기 시스템 명세 (34종)

### 아카이브
- **[PixiJS 마이그레이션 계획](./docs/archive/pixi-projectile-migration.md)** - 완료된 4단계 전환 계획
- **[전체 개발 히스토리](./docs/archive/devlog-original.md)** - 시간순 상세 기록

---

## 📅 최근 활동

### 2025년 11월

#### 11월 1일 - AI 시스템 대규모 리팩토링 ✅
**State Machine 단순화 (700줄 → 350줄)**
- 4-state (PATROL/CHASE/ATTACK/RETREAT) → 3-state (IDLE/PURSUE/ATTACK) 단순화
- PathState 서브스테이트 (NONE/FOLLOWING/COMPLETED) 완전 제거
- 경로 재생성 쿨다운: 500ms → 200ms (더 반응적)
- 웨이포인트 도달 거리: 50px → 30px (더 정밀)
- 조준 정확도: 0.1 rad (6°) → 0.05 rad (3°) 개선

**시야 시스템 재설계**
- 적 탐지 범위: 600px → Infinity (좌표는 항상 알 수 있음)
- LOS(Line of Sight) 분리: 추적은 좌표 기반, 공격은 LOS 필요
- LOS 안전 마진 추가: 5px (벽 모서리 충돌 방지)
- 벽 모서리 raycast 정밀 검사 (점-직선 거리 계산)

**Navmesh 개선**
- 삼각형 간격: 80px → 20px (더 정밀한 경로)
- 마진: 20px → 10px
- 양방향 벽-삼각형 교차 검사 (벽 꼭짓점 ↔ 삼각형 내부)
- 경계 포인트 균일 분포 (왜곡된 삼각형 제거)
- 과도한 안전거리 체크 제거 (45px 버퍼 삭제)

**디버그 시스템 구축**
- 중앙화된 DebugManager 싱글톤 생성 (`js/systems/DebugManager.js`)
- D 키 토글: Navmesh + LOS + Tank 중심점 시각화
- LOS 라인 시각화: 초록색 실선 (확보) / 빨간색 점선 (차단)
- 키보드 이벤트 충돌 해결 (input.js와 분리)

**코드 정리**
- 삭제된 파일 (4개):
  - `LegacyAI.js` - 구 AI 시스템
  - `SteeringBehavior.js` - Navmesh로 대체
  - `Pathfinding.js` - 그리드 기반 A* (Navmesh로 대체)
  - `TacticalPositioning.js` - 미사용 Phase 3 기능
- DIFFICULTY 설정 단순화 (visionRange, aimAccuracy 제거)

**기술적 세부사항:**
```javascript
// 단순화된 State Machine
AIState = { IDLE, PURSUE, ATTACK }

// LOS 안전 마진 (벽 모서리 감지)
const SAFE_MARGIN = 5; // 픽셀
// 점-직선 최단거리 = ||(P-A) - ((P-A)·n̂)n̂||

// 개선된 조준 시스템
aimThreshold = 0.05 rad; // ~3도
fire = (Math.abs(angleDiff) < aimThreshold);
```

**타겟 선택 시스템 개선:**
- 우선순위: 방향 가중치 거리 → LOS → 포신 정렬 → 랜덤
- 방향 가중치: 정면 0.7배, 측면 1.0배, 후면 1.5배
- 타겟 변경 쿨다운: 2초 (우왕좌왕 방지)
- 포신 정렬 점수: 0° = 1.0, 180° = 0.0
- 모듈화된 구조: 8개 헬퍼 함수로 분리

**상세**: AI 시스템 아키텍처 변경 및 Navmesh 개선 내역은 [AI_DEVELOPMENT_PLAN.md](./AI_DEVELOPMENT_PLAN.md), [docs/devlogs/ai-system.md](./docs/devlogs/ai-system.md) 참고

---

### 2025년 10월

#### 10월 30일 - Procedural Wall Generation 구현 ✅
**그리드 기반 랜덤 벽 생성 시스템**
- 60px 그리드 시스템 구축 (`js/config/grid.js`)
- Spatial Hash Grid로 O(n) 충돌 감지
- 가로/세로 직사각형 벽 (50% / 50%)
- 안전지역 시스템 (스폰 주변 4셀 보호)

**검증 시스템:**
- Flood Fill 연결성 체크
- 스폰 균형 검증
- 최소 장애물 개수 (60%)
- LOS 체크 비활성화 (FFA 특성 고려)

**3가지 난이도 프리셋:**
- Easy: 8개 벽, 110px 간격 (오픈 아레나)
- Medium: 15개 벽, 50px 간격 (균형)
- Hard: 25개 벽, 40px 간격 (미로)
- **핵심 컨셉**: 매 라운드마다 랜덤 난이도 선택

**파라미터 튜닝:**
- 벽 크기: 15-25px × 30-80px (가늘고 작게)
- 생성 시간: ~3ms (목표 100ms의 3%)

**L자 벽 시도 및 포기:**
- `Bodies.fromVertices()` → 5각형 변형
- 두 직사각형 → 시각적으로 깔끔하지 않음
- 결론: 가로/세로 직사각형만으로 충분

**상세**: [procedural-walls.md](./docs/devlogs/procedural-walls.md)

---

#### 10월 30일 - GitHub Pages 공개 배포 ✅
**프로토타입 공개**
- GitHub 저장소 생성: https://github.com/gogodevelop2/destruction-zone-web
- GitHub Pages 배포: https://gogodevelop2.github.io/destruction-zone-web/
- `gh-pages` 브랜치: 배포용 (index.html만)
- `matter-js-rewrite` 브랜치: 개발용 (전체 소스)

**배포 구조:**
- CDN 기반 (Matter.js, PixiJS)
- 단일 HTML 파일 배포
- 외부 테스트 가능

---

#### 10월 30일 - PixiJS 발사체 전환 완료 ✅
**4단계 마이그레이션 성공**
- Phase 1: PixiJS 추가 (A/B 테스트)
- Phase 2: BlurFilter 제거 결정 (성능 우선)
- Phase 3: Canvas 완전 제거
- Phase 4: ProjectileRenderer 객체로 렌더링/물리 분리

**성과:**
- ✅ 100-200개 발사체 동시 처리 준비
- ✅ Projectiles + Particles 렌더링 통합 (모두 PixiJS)
- ✅ 명확한 렌더링/물리 레이어 분리
- ✅ 리팩토링 준비 완료 (상세 주석 + 인터페이스)

**렌더링 레이어:**
```
Background (Canvas) → Walls (Canvas) → Projectiles (PixiJS) → Tanks (Canvas) → Particles (PixiJS)
```

**상세**: [rendering.md - PixiJS 발사체 마이그레이션](./docs/devlogs/rendering.md#pixijs-발사체-마이그레이션)

---

#### 10월 29일 - TRON 스타일 + visualMargin 구현 ✅
**네온 그래픽 시스템**
- Dark interior + Colored neon + White core (3-layer)
- lineJoin='round'로 miter spike 제거
- 탱크/벽 모두 TRON 스타일 적용

**visualMargin 시스템**
- 문제: stroke + shadowBlur가 Canvas 밖으로 나가 시각적으로 잘림
- 해결: 물리 경계를 3px 안쪽으로 (3, 3, 957, 717)
- 결과: 물리 정확도 유지 + 시각적 잘림 방지

**충돌 안정성 개선**
- positionIterations: 6 → 10
- velocityIterations: 4 → 8
- restitution: 0.0, chamfer: 2
- 결과: 탱크 진동(jitter) 감소

**상세**: [visual-design.md - TRON 스타일](./docs/devlogs/visual-design.md#tron-스타일-구현)

---

### 2025년 1월

#### 1월 27일 - Phase 1-2 프로토타입 완성 ✅
**Matter.js 중심 아키텍처 확립**
- 하이브리드 물리 방식 포기 (복잡도 문제)
- Matter.js를 Single Source of Truth로 사용
- 브랜치: `matter-js-rewrite`

**Phase 1 완성:**
- 단일 파일 프로토타입 (prototype.html)
- Tank 클래스 (Bodies.fromVertices)
- 회전/이동 제어
- 벽 충돌

**Phase 2 완성:**
- Projectile 클래스 (LASER/MISSILE)
- 충돌 필터링 (카테고리 시스템)
- 기본 AI (추적/회피)
- 6탱크 멀티플레이

**상세**: [architecture.md - Matter.js 중심 아키텍처](./docs/devlogs/architecture.md#matterjs-중심-아키텍처)

---

## 🎯 현재 상태

**완료:**
- ✅ Matter.js 물리 엔진 통합
- ✅ TRON 스타일 비주얼
- ✅ PixiJS 렌더링 마이그레이션
- ✅ 6탱크 멀티플레이 프로토타입
- ✅ 기본 AI 시스템

**진행 중:**
- 🔄 모듈 분리 리팩토링 준비
- 🔄 추가 무기 구현 계획

**다음 단계:**
- [ ] 모듈 구조로 리팩토링 (src/rendering/, src/entities/)
- [ ] 추가 무기 구현 (WEAPONS.md 기반, 34종 중 2종 구현됨)
- [ ] AI 개선 (전략적 행동)
- [ ] 사운드 시스템

---

## 💡 핵심 배운 점

### 아키텍처
- **물리 엔진 완전 신뢰**: 반쯤 신뢰하면 더 복잡해짐
- **단순함이 최고**: 하이브리드 < 순수 Matter.js
- **문서화 우선**: 복잡한 결정은 상세히 기록

### 렌더링
- **물리와 시각 분리**: 충돌 경계 ≠ 렌더링 경계
- **3px visualMargin**: 작은 마진이 큰 차이
- **BlurFilter는 무겁다**: 성능 우선 시 제거 고려

### 물리 엔진
- **단일 점 충돌 불안정**: Chamfer로 완화
- **Iterations 증가**: 정확도 vs 성능 trade-off
- **lineJoin='round'**: Miter spike 방지

### 개발 프로세스
- **Phase별 접근**: 한 번에 다 바꾸면 위험
- **A/B 테스트**: 안전한 마이그레이션
- **주석으로 보호**: 미래의 나를 위한 배려

---

## 📊 프로젝트 통계

**파일:**
- prototype.html: ~1900줄 (단일 파일 프로토타입)
- ARCHITECTURE.md: 상세 설계 문서
- WEAPONS.md: 34종 무기 명세

**구현 현황:**
- 무기: 2/34 (MISSILE, LASER)
- AI: 기본 추적/회피
- 탱크: 6대 동시 플레이
- 렌더링: 하이브리드 (Canvas + PixiJS)

**성능:**
- 6탱크 + 100-200 발사체 처리 가능
- 60 FPS 목표 (PixiJS 전환으로 달성)

---

## 📝 관련 문서

### 개발 문서
- [전체 히스토리](./docs/archive/devlog-original.md) - 시간순 상세 기록
- [변경 이력](./CHANGELOG.md) - 커밋 단위 요약

### 기술 문서
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 설계
- [WEAPONS.md](./WEAPONS.md) - 무기 시스템
- [PIXI_PROJECTILE_MIGRATION.md](./PIXI_PROJECTILE_MIGRATION.md) - PixiJS 마이그레이션

### 외부 참고
- [Matter.js Docs](https://brm.io/matter-js/docs/)
- [PixiJS Graphics API](https://pixijs.download/release/docs/PIXI.Graphics.html)
- [Canvas lineJoin](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin)
- [TRON Legacy VFX](https://www.artofvfx.com/tron-legacy/)
