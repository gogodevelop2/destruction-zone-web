# Destruction Zone Web Edition - 개발 로그

이 문서는 완료된 작업을 날짜별로 기록합니다.

---

## 2025-10-27

### ⏪ 원래 물리엔진으로 복원 (Matter.js 보류)

**복원 사유**:
- Matter.js 힘(force) 기반 물리와 원본 속도 직접 제어 방식 간 근본적인 차이
- Matter.js 속도 직접 설정 방식으로도 조작감 불일치 발생
- 원점에서 재출발하여 차후 신중하게 접근하기로 결정

**복원 작업**:
- `tank.js`: Matter.js 관련 코드 제거, `Physics.updateTankMovement` 사용
- `engine.js`: physics 참조 전달 제거, Matter.js 충돌 콜백 제거
- `physics.js`: Matter.js 초기화 코드 주석 처리 (삭제하지 않음)
- Matter.js 라이브러리 파일은 유지 (`js/lib/matter.min.js`)

**현재 상태**:
- ✅ 원래 자체 물리엔진 사용 (원본 게임과 동일한 조작감)
- ✅ Matter.js 코드는 주석으로 보존 (향후 재시도 가능)
- ✅ index.html의 Matter.js 스크립트 태그 유지

---

### ✅ Matter.js 물리 엔진 전환 - Phase 2 완료 (Tank 통합) [보류됨]

**Tank 물리 파라미터 원본 게임 기준으로 재조정** (2025-10-27 최종):
- **접근 방식**: Matter.js 속도 직접 제어 (원본 물리 계산 + Matter.js 충돌/위치 업데이트)
  - `applyForce` 방식 ❌ (가속도 누적되어 제어 불가)
  - `setVelocity` 방식 ✅ (원본과 동일한 속도 제어)

- 원본 자체 물리엔진의 `Physics.updateTankMovement` 값 그대로 사용:
  - 추진력: `speed * 200` → 속도에 직접 더함
  - 최대 속도: `speed * 100` (pixels/sec)
  - 회전 가속: `rotationSpeed * 3 * deltaTime`
  - 최대 회전 속도: `rotationSpeed * 5` (rad/sec)
  - 마찰: `velocity *= Math.pow(0.95, deltaTime * 60)`
  - 회전 마찰: `angularVelocity *= Math.pow(0.9, deltaTime * 60)`

- Matter.js 바디 설정 (충돌 전용):
  - `frictionAir: 0` - 수동으로 마찰 처리
  - `friction: 0` - 수동으로 마찰 처리
  - `restitution: 0` - 반발 없음
  - `inertia: Infinity` - 충돌로 인한 회전 방지

**결과**: 원본 게임과 정확히 동일한 Tank 조작감

**Tank 엔티티 Matter.js 통합**:
- `tank.js`에 Matter.js 물리 바디 생성:
  - `createPhysicsBody()` - 삼각형 Tank 바디 생성
  - `destroyPhysicsBody()` - 바디 제거 (Tank 파괴 시)
  - `updateWithMatterPhysics()` - Matter.js 기반 물리 업데이트
    - 추진력을 `applyForce`로 적용
    - 회전력을 `setAngularVelocity`로 적용
    - 속도 제한 적용
    - 바디와 엔티티 동기화
- `engine.js`에서 Tank 생성 시 `physics` 참조 전달
- Matter.js 충돌 이벤트 시스템:
  - `physics.js`에 충돌 이벤트 리스너 추가
  - `onTankTankCollision()` - 탱크 간 충돌
  - `onProjectileTankCollision()` - 발사체-탱크 충돌
  - `onProjectileWallCollision()` - 발사체-벽 충돌
  - `setupPhysicsCollisions()` - GameEngine에서 콜백 설정
- 디버그 기능:
  - `main.js`에 'P' 키로 물리 디버그 모드 토글 추가
  - 초록색: 동적 바디, 빨강색: 경계벽, 청록색: 속도 벡터

**파일 수정**:
- `js/entities/tank.js` - Matter.js 바디 생성 및 업데이트 로직 추가
- `js/core/engine.js` - physics 참조 전달, 충돌 콜백 설정
- `js/core/physics.js` - 충돌 이벤트 시스템 추가
- `js/main.js` - 'P' 키 디버그 토글 추가

**테스트 방법**:
1. 브라우저에서 `http://localhost:8000` 접속
2. New Game 시작
3. 'P' 키를 눌러 물리 디버그 모드 활성화
4. Tank 움직임 및 충돌 확인

**다음 단계**:
- Phase 3: Projectile 엔티티에 Matter.js 바디 적용
- Phase 4: 최종 테스트 및 최적화

---

### ✅ Matter.js 물리 엔진 전환 - Phase 1 완료

**Matter.js 통합 (v0.19.0)**:
- Matter.js 라이브러리 다운로드 및 추가 (79KB)
- `index.html`에 스크립트 태그 추가
- `physics.js`를 Matter.js 래퍼로 전환:
  - Matter.Engine 생성 (중력 0 - 탑다운 뷰)
  - 경계벽 자동 생성 (보이지 않는 물리 벽)
  - 엔티티 관리 시스템 (createCircleBody, createPolygonBody)
  - 동기화 메서드 (syncEntityToBody, syncBodyToEntity)
  - 기존 정적 메서드 유지 (Vector 연산 등 - 하위 호환성)
- `engine.js`에서 Physics 초기화 시 캔버스 크기 전달
- `renderer.js`에 물리 디버그 모드 추가:
  - `setDebugPhysics(enabled)` - 디버그 모드 토글
  - `renderPhysicsDebug(physics)` - Matter.js 바디 시각화
  - 경계 영역(빨강), 동적 바디(초록), 속도 벡터(청록) 표시

**파일 수정**:
- `js/lib/matter.min.js` - 추가
- `index.html` - Matter.js 스크립트 태그 추가
- `js/core/physics.js` - Matter.js 래퍼로 완전 재작성
- `js/core/engine.js` - Physics 초기화 수정
- `js/core/renderer.js` - 디버그 렌더링 추가

**다음 단계**:
- Phase 2: Tank 엔티티에 Matter.js 바디 적용
- Phase 3: Projectile 엔티티에 Matter.js 바디 적용
- Phase 4: 테스트 및 최적화

---

### ✅ 게임 데이터 파일 v1.3 기준 업데이트 완료

**tank-data.js 업데이트**:
- 탱크 가격 v1.3 기준으로 변경:
  - STANDARD: 0 → 1000 CR
  - ROTRA I: 500 → 1850 CR
  - ROTRA II: 1200 → 2450 CR
  - OPEC I: 800 → 3400 CR
  - OPEC II: 2000 → 4750 CR
- v1.3 스탯 시스템 추가 (SH/ROT/SP + 업그레이드 후)
- 업그레이드 시스템 v1.3으로 변경:
  - 3단계 → 1단계 (binary: 0 or 1)
  - 가격: 탱크 가격과 동일
  - ENERGY 업그레이드 제거 (v1.3에 없음)
- 주석에 출처 명시: `/dzone-v1.3/DZONE.DOC page 7`

**weapon-data.js 완전 재작성**:
- v1.3 기준 31종 무기 전체 정의 (기존 10종 → 31종)
- 7개 포트 전체 무기 데이터:
  - Port 1: 6종 (기존 유지)
  - Port 2: 5종 (SWIRL BLASTER 추가 🆕)
  - Port 3: 5종 (전체 신규, REAR CHAOS 포함 🆕)
  - Port 4: 6종 (전체 신규, OCTO BREAKER, SPARK FIENDS 포함 🆕)
  - Port 5: 4종 (전체 신규)
  - Port 6: 4종 (전체 신규, DEFLECTOR 포함 🆕)
  - Port 7: 4종 (전체 신규)
- v1.3 매뉴얼의 정확한 데미지/에너지/가격 반영
- 약어(abbrev) 추가 (예: MISIL, DOUBL, LASER 등)
- 특수 속성 추가:
  - `guided`: 유도 미사일
  - `breaksInto`: 분열 수
  - `direction`: 'rear' (후방 발사)
  - `effect`: 특수 효과 (teleport, heal, cloak 등)
  - `neverMiss`: SPARK FIENDS (절대 명중)
- 주석에 출처 명시: `/dzone-v1.3/DZONE.DOC pages 8-10`

**파일 수정**:
- `js/config/tank-data.js` - 완전 재작성
- `js/config/weapon-data.js` - 완전 재작성

**테스트 필요**:
- 상점에서 v1.3 가격 확인
- 탱크 구매 및 업그레이드 동작 확인
- Port 1-2 기존 무기 작동 확인

---

### 🎯 개발 목표 버전 변경: v1.0 → v1.3

**결정 사항**:
- 개발 기준을 **v1.3 (1994년 6월)** 최종 공개 버전으로 변경
- 기존 v1.0 (1993년 1월) 매뉴얼 대신 v1.3 매뉴얼 기준

**v1.3 발견**:
- `/dzone-v1.3/` 폴더에서 v1.3 게임 파일 확인
- DZONE.DOC 크기: 28KB (v1.0) → 32KB (v1.3)
- DZONE.EXE 크기: 89KB (v1.0) → 125KB (v1.3)
- 새 파일: SHOP.GDA (레이트레이싱 상점), SVGA16.GDA, IMPROVED.TXT

**폴더명 정리**:
- `original game/` → `/dzone-v1.0/` (Destruction Zone v1.0, 1993년 1월)
- `dzone/` → `/dzone-v1.3/` (Destruction Zone v1.3, 1994년 6월)

**v1.3 주요 변경 사항** (IMPROVED.TXT 기준):

**추가된 무기**:
- ✅ SWIRL BLASTER (Port 2) - 6개 스월러로 분열
- ✅ REAR CHAOS (Port 3) - TWIN SEEKERS 대체, 소형 유도탄 다수
- ✅ OCTO BREAKER (Port 4) - 8개로 분열
- ✅ SPARK FIENDS (Port 4) - 절대 빗나가지 않는 유도탄
- ✅ DEFLECTOR (Port 6) - ECM HACKER 대체, 미사일 반사

**제거된 무기** (v1.0에서):
- ❌ FUSION HEALER
- ❌ ELECTRON BOLT (LIGHTNING BOLT)
- ❌ TRACER (LIGHT TRACER)
- ❌ SELF DESTRUCT
- ❌ TWIN SEEKERS → REAR CHAOS로 대체
- ❌ ECM HACKER → DEFLECTOR로 대체

**추가된 도구**:
- ✅ TANK TURRET (1400 CR) - 포탑 시스템 🎯
- ✅ AUTO HEAL (4800 CR) - 쉴드 자동 재충전
- ✅ LARGER DEATH (800 CR) - 폭발 데미지 20배
- ✅ FAST RECHARGE (5300 CR) - 에너지 재충전 50% 증가

**AI 완전 재프로그래밍** (v1.2):
- R1 PROTOTYPE: 신경질적, 최저 점수 탱크 공격
- R2 AIMER: 정지 사격, 포탑 사용, 최근접 탱크
- R3 SEEKER: 근거리 전문, 빠른 발사, 포탑 불가
- R4 HUNTER: 최고 점수 탱크만, 포탑 사용
- R5 DESTROYER (신규): 무차별 공격, 포탑 애호가

**탱크 가격 변경**:
- STANDARD: 1000 CR (동일)
- ROTRA I: 2000 → 1850 CR
- ROTRA II: 2000 → 2450 CR
- OPEC I: 3200 → 3400 CR
- OPEC II: 4500 → 4750 CR

**총 무기 수**: 34종 (v1.0) → 31종 (v1.3)
**총 AI 로봇**: 4종 (v1.0) → 5종 (v1.3)
**총 도구**: 5종 (v1.0) → 9종 (v1.3)

**새로운 핵심 기능**:
1. 🎯 **포탑 시스템** - 무기 독립 회전
2. 🎨 **레이트레이싱 상점 화면**
3. 📺 **SuperVGA 지원** (800x600, 1024x768)
4. 🎯 **미션 모드 확장** (4개 → 8개)

**문서 업데이트**:
- `PLAN.md`: v1.3 매뉴얼 기준으로 전체 수정
  - 무기 31종 상세 목록 (데미지/에너지/가격)
  - 탱크 5종 스탯 및 업그레이드 정보
  - AI 5종 행동 패턴
  - 도구 9종 기능 및 가격
  - 파일 구조에 `/dzone-v1.3/`, `/dzone-v1.0/` 폴더 명시
- `PLAN.md`: 개발 우선순위 재설정
  - 포탑 시스템 추가
  - 무기 목록 v1.3 기준 재작성
- 폴더명 변경으로 문서 전체 경로 업데이트

---

### 📋 Matter.js 물리 엔진 전환 결정

**결정 사항**:
- 자체 물리 엔진을 **Matter.js**로 전환하기로 결정
- Planck.js와 비교 후 Matter.js 선택

**Matter.js 선택 이유**:
1. ✅ 2D 게임에 최적화 (87KB, 가벼움)
2. ✅ Canvas 렌더러 내장 (디버그 시각화 쉬움)
3. ✅ 정확한 폴리곤 충돌 감지 (삼각형 탱크에 적합)
4. ✅ 직관적인 API (낮은 러닝 커브)
5. ✅ 활발한 커뮤니티 및 문서

**Planck.js 대비 장점**:
- 더 간단한 API (Box2D 스타일보다 직관적)
- 렌더링 엔진 내장 (Planck.js는 순수 물리만)
- 빠른 통합 가능 (1-2일 vs 3-5일)
- 기존 Canvas 렌더링 시스템과 쉽게 통합

**전환 계획** (3.5일 예상):
- Phase 1: 준비 및 설정 (1일)
- Phase 2: 탱크 물리 전환 (1일)
- Phase 3: 프로젝타일 물리 전환 (1일)
- Phase 4: 테스트 및 최적화 (0.5일)
- Phase 5: 고급 물리 기능 (선택 사항)

**기대 효과**:
- 더 정확한 충돌 감지
- 자연스러운 물리 시뮬레이션 (탱크 충돌 시 반발력)
- 빠른 프로젝타일 관통 문제 해결
- 향후 폭발 파편 효과 및 파괴 가능 지형 추가 가능

**문서 업데이트**:
- `PLAN.md`: Phase 2.1에 Matter.js 전환 계획 추가
- `PLAN.md`: 파일 구조에 Matter.js 변경 사항 명시
- `PLAN.md`: 설계 결정사항에 물리 엔진 전환 기록

---

### ✅ 구매한 무기/업그레이드 적용 시스템 완성

**구현 내용**:
- Tank 클래스에 `applyUpgrades()` 메서드 추가
  - TankData에서 업그레이드 정보 가져와 스탯에 적용
  - Speed, Rotation, Armor, Energy 업그레이드 지원
- Tank 클래스에 `ownedWeapons` 속성 추가
  - 플레이어가 구매한 무기 목록 저장
- `nextWeapon()` 메서드 개선
  - 구매한 무기만 순환하도록 수정
  - Port 1/2에서 소유한 무기만 전환
- GameEngine 수정
  - `createInitialTanks()`: 플레이어 데이터를 탱크 생성 시 전달
  - `resetRound()`: 탱크를 재생성하여 상점 변경사항 적용

**테스트 결과**:
- ✅ 상점에서 무기 구매 후 게임에서 사용 가능
- ✅ A키로 구매한 무기만 순환
- ✅ 업그레이드 구매 시 탱크 스탯 증가 확인
- ✅ 탱크 변경 시 새 탱크로 플레이 가능

**파일 수정**:
- `js/entities/tank.js`
- `js/core/engine.js`

---

### ✅ 상점 종료 버그 수정

**문제**: 상점에서 "Exit Shop & Continue" 버튼 클릭 시 게임 화면으로 전환되지 않음

**원인**: `window.gameEngine` 참조 오류 (실제로는 `window.game.engine`)

**수정 내용**:
- ShopSystem.js: 올바른 참조로 수정 및 화면 전환 로직 추가
- GameEngine.js: `continueFromShop()` 메서드 간소화
- main.js: 게임 루프 주석 개선

**파일 수정**:
- `js/systems/shop.js`
- `js/core/engine.js`
- `js/main.js`

---

### ✅ 개발 문서 재구성

**변경 내용**:
- 문서를 2개로 분리:
  1. **PLAN.md**: 전체 개발 계획서 (원본 사양, 로드맵, 디자인 가이드)
  2. **CHANGELOG.md**: 개발 로그 (완료 작업, 날짜별 기록)

**추가된 내용** (PLAN.md):
- 원본 게임 자료 위치 및 파일 설명
- 원본 게임 디자인 사양 (DZONE.DOC 기준)
- 핵심 게임 메커니즘 상세 설명 (배경 스토리 포함)
- 7개 포트별 무기 전체 목록
- 완전한 로드맵 (Phase 1-3)
- 원본 게임 데이터 참조 가이드

**수정된 내용**:
- 잘못된 게임 메커니즘 설명 삭제 ("물리적 공유 공간", "3개의 공" 등)
- 원본 매뉴얼 기반 정확한 설명으로 교체

---

## 2025-10-26

### ✅ 완전한 상점 시스템 구현

**구현 내용**:

1. **상점 데이터 구조**:
   - `tank-data.js`: 5종 탱크 타입 (STANDARD, ROTRA I/II, OPEC I/II)
   - `tank-data.js`: 4종 업그레이드 (Speed, Rotation, Armor, Energy) - 각 3단계
   - `weapon-data.js`: Port 1/2 무기 가격 정보 추가

2. **상점 UI 시스템**:
   - 3개 탭 (Weapons, Tanks, Upgrades)
   - 플레이어 상태 표시 (Credits, Score, Tank, Price Multiplier)
   - 아이템 세부 정보 및 구매 버튼
   - 소유 여부 표시 (OWNED/CURRENT)

3. **구매 시스템**:
   - 무기 구매: 인벤토리에 자동 추가, 중복 구매 방지
   - 탱크 변경: 즉시 탱크 타입 변경
   - 업그레이드: 레벨별 단계적 업그레이드 (최대 레벨 3)
   - 실시간 피드백: 구매 성공/실패 메시지

4. **가격 시스템**:
   - 스코어 기반 가격 증가 (10점당 5%)
   - 동적 가격 표시
   - 구매 가능 여부 표시

5. **게임 연동**:
   - 3라운드마다 자동 상점 오픈 (라운드 4, 7, 10, 13)
   - 게임 일시정지
   - Exit 버튼으로 다음 라운드 진행

**파일 수정/생성**:
- `js/config/tank-data.js` - 전체 재작성
- `js/config/weapon-data.js` - 가격 정보 추가
- `js/systems/shop.js` - 전체 구현
- `js/core/engine.js` - 상점 연동
- `js/core/state.js` - 플레이어 인벤토리 초기화
- `css/ui.css` - 상점 탭 스타일 추가

---

## 2025-08-15

### ✅ 완전한 라운드 시스템 구현

**구현 내용**:
- 라운드 타이머 시스템 (5분 제한, 테스트용 30초)
- 실시간 타이머 UI (색상 변화: 초록→주황→빨강)
- 시각적 진행 바
- 승리 조건 처리:
  - 킬 승리: 상대 파괴 시 즉시 승리
  - 타임아웃 승리: 시간 종료 시 체력 많은 플레이어 승리
- 점수 및 보상 시스템:
  - 킬 승리: 3점 + 50크레딧
  - 생존 보너스: 1점
- 라운드 진행 관리:
  - 자동 라운드 리셋
  - 탱크 위치/체력/에너지 복구
  - 15라운드 최대 제한
  - 3라운드마다 상점 접근 준비

**파일 수정**:
- `js/core/state.js`
- `js/core/engine.js`
- `js/core/renderer.js`

---

### ✅ 완전한 전투 시스템 구현

**구현 내용**:

1. **탱크 시스템**:
   - 삼각형 탱크 렌더링
   - 물리 기반 이동 (추진력, 회전, 마찰)
   - 체력, 에너지 시스템
   - 5종류 탱크 스탯 차이 구현

2. **확장된 무기 시스템**:
   - **Port 1 완전 구현**: MISSILE, LASER, DOUBLE MISSILE, TRIPLE MISSILE, POWER LASER, TRI-STRIKER (6종)
   - **Port 2 기본 구현**: BLASTER (1종, 데이터만 4종)
   - 각 무기별 다른 데미지, 속도, 에너지 소모량
   - 다중 프로젝타일 지원 (2~3발 동시 발사)
   - 포트 기반 무기 데이터 시스템
   - 무기 변경 시스템 (A키로 Port 1 내 순환, S키로 포트 전환)
   - 설정 기반 무기 밸런스

3. **완전한 충돌 시스템**:
   - 탱크-탱크 충돌
   - 프로젝타일-탱크 충돌 및 데미지
   - 폭발 효과 및 범위 데미지
   - 경계 충돌 처리

4. **실시간 UI 시스템**:
   - 라운드 정보, 타이머, 점수
   - 체력/에너지 바

**파일 생성/수정**:
- `js/entities/tank.js`
- `js/entities/weapon.js`
- `js/entities/projectile.js`
- `js/entities/explosion.js`
- `js/systems/collision.js`
- `js/config/weapon-data.js`

---

### ✅ 기본 AI 시스템 구현

**구현 내용**:
- 플레이어 추적 및 조준
- 거리 기반 전술 (접근/후퇴)
- 자동 사격 시스템
- 적응형 AI 행동 (R1 PROTOTYPE 스타일)

**파일 수정**:
- `js/systems/ai.js`
- `js/core/engine.js`

---

### ✅ 조작 시스템 구현

**macOS 최적화 컨트롤**:
- 방향키: 탱크 이동/회전
- A키: 무기 변경 (Port 1의 6종 무기 순환)
- S키: Port 1 ↔ Port 2 전환
- D키: 무기 발사
- ESC: 일시정지
- T키: 디버그 정보

**파일 수정**:
- `js/core/input.js`
- `js/core/engine.js`

---

## 초기 개발 (날짜 미상)

### ✅ 프로젝트 초기 설정

**구현 내용**:
- 프로젝트 구조 설계 및 파일 생성
- HTML5 Canvas 기반 게임 화면
- CSS 스타일링 (레트로 게임 느낌)
- 모듈화된 JavaScript 아키텍처

**파일 생성**:
- `index.html`
- `css/main.css`, `css/game.css`, `css/ui.css`
- 기본 JavaScript 구조

---

### ✅ 코어 시스템 구현

**구현 내용**:
- 자체 물리 엔진: 2D 벡터 연산, 충돌 감지, 탱크 이동
- 렌더링 시스템: Canvas 2D 그래픽, 배경, 탱크, 프로젝타일
- 입력 시스템: 키보드 입력 처리, 멀티플레이어 지원 구조
- 게임 상태 관리: 플레이어 데이터, 점수, 라운드 관리

**파일 생성**:
- `js/core/physics.js`
- `js/core/renderer.js`
- `js/core/input.js`
- `js/core/state.js`
- `js/core/engine.js`

---

## 📊 현재 상태 요약

### ✅ 완료된 기능 (플레이 가능)
- 1vs1 전투 (플레이어 vs AI)
- 10종 무기 시스템 (Port 1: 6종, Port 2: 4종)
- 완전한 라운드 시스템 (타이머, 승리조건, 점수)
- 완전한 상점 시스템 (무기/탱크/업그레이드 구매)
- 구매한 무기/업그레이드 적용
- 실시간 전투 (데미지, 폭발, 체력)
- 스마트 AI (R1 PROTOTYPE 스타일)
- 실시간 UI (라운드, 타이머, 점수, 체력, 상점)

### 🚧 진행 중
- **Matter.js 물리 엔진 전환** (3.5일 예상)
  - Phase 1: 준비 및 설정
  - Phase 2: 탱크 물리 전환
  - Phase 3: 프로젝타일 물리 전환
  - Phase 4: 테스트 및 최적화

### 📋 다음 작업 대기 (v1.3 기준)
- **Port 2-7 무기 구현** (25종)
  - Port 2 완성: 4종
  - Port 3: 5종 (REAR CHAOS 포함 🆕)
  - Port 4: 6종 (OCTO BREAKER, SPARK FIENDS 포함 🆕)
  - Port 5: 4종
  - Port 6: 4종 (DEFLECTOR 포함 🆕)
  - Port 7: 4종
- **포탑 시스템** 🆕 (무기 독립 회전)
- **고급 AI 로봇** (R2-R5, R5는 신규 🆕)
- **도구 시스템** (9종, TANK TURRET 등 4종 신규 🆕)

---

## 🐛 알려진 이슈

### 해결됨 ✅
- [2025-10-27] 상점 종료 버그 → 수정 완료
- [2025-08-15] AI 탱크 비활성화 → 수정 완료
- [2025-08-15] 프로젝타일-탱크 충돌 미구현 → 수정 완료
- [2025-10-26] 상점 시스템 미완성 → 구현 완료

### 현재 이슈
- Port 2 무기가 데이터만 있고 실제 발사 기능은 BLASTER만 작동
- Port 3-7 무기 미구현
- 사운드 시스템 없음

---

## 🎯 다음 개발 목표 (v1.3 기준)

1. **Matter.js 물리 엔진 전환** (3.5일 예상) ⬅️ **우선순위 1**
   - Phase 1: 준비 및 설정 (1일)
   - Phase 2: 탱크 물리 전환 (1일)
   - Phase 3: 프로젝타일 물리 전환 (1일)
   - Phase 4: 테스트 및 최적화 (0.5일)
   - Phase 5: 고급 물리 기능 (선택 사항)

2. **Port 2-7 무기 구현** (v1.3 - 25종)
   - Port 2 완성: 4종 (GUIDE BLASTER, BLAST GUIDER, NUKE BLASTER, SWIRL BLASTER 🆕)
   - Port 3: 5종 (REAR 시리즈 + TELEPORT FOE + REAR CHAOS 🆕)
   - Port 4: 6종 (BREAKER 시리즈 + GUIDED + SPARK FIENDS 🆕 + OCTO BREAKER 🆕)
   - Port 5: 4종 (SWIRLER, ELECTRO BUDS, BOMBS)
   - Port 6: 4종 (DEATH TOUCH, DEFLECTOR 🆕, ECM 시리즈)
   - Port 7: 4종 (HEALER, SHIELDS, TELEPORT SELF)

3. **포탑 시스템** 🆕 ⬅️ **v1.3 핵심 기능**
   - 무기 독립 회전 메커니즘
   - 포탑 설치/제거 시스템
   - AI 포탑 활용 로직 (R2, R4, R5)

4. **고급 AI 로봇** (R2-R5)
   - R2 AIMER: 정지 사격 스타일
   - R3 SEEKER: 근거리 전문
   - R4 HUNTER: 선택적 공격
   - R5 DESTROYER 🆕: 무차별 공격

5. **도구 시스템** (v1.3 - 9종)
   - RED DOT, TANK TURRET 🆕, SHOPPING CARD, SCORE BRIBE
   - RAPID FIRE, AUTO HEAL 🆕, LARGER DEATH 🆕, FAST RECHARGE 🆕, FUEL UPGRADE

6. **기타**:
   - 팀 모드
   - 사운드 시스템
   - 미션 모드 (8개 미션)

---

*📅 마지막 업데이트: 2025-10-27*
*🤖 이 문서는 Claude Code로 생성되었습니다.*
