# Phase 2: 모듈화 리팩토링 요약

**기간**: 2025-10-30
**소요시간**: 약 6.5시간
**결과**: prototype.html (1803 lines) → 15개 모듈 (~1922 lines)

---

## 목표

단일 HTML 파일을 유지보수 가능한 ES6 모듈 구조로 리팩토링

---

## 완료된 작업

### 1. 모듈 분리 (7단계)
```
Step 1: Configuration & Constants (30분)
Step 2: Particle System (30분)
Step 3: Entity Classes (45분)
Step 4: Systems (60분)
Step 5: Renderer (30분)
Step 6: Core Game Classes (45분)
Step 7: Main Entry Point (45분)
```

### 2. 발견 및 수정한 버그 (4개)

#### 버그 1: 탱크 움직임 오류
- **문제**: 회전 너무 빠름, 이동 너무 느림
- **원인**: 기본값(0.0003, 3.0) 사용, 실제값(0.01, 0.01) 미적용
- **해결**: Game.js에서 올바른 파라미터 전달

#### 버그 2: 프레임레이트 의존성
- **문제**: 60fps와 120fps에서 게임 속도 다름
- **원인**: Fixed timestep을 계산했으나 사용 안 함
- **해결**: Fixed Timestep Accumulator 구현 (업계 표준)

#### 버그 3: 파티클 색상 반전
- **문제**: 충돌 효과가 주황→흰색 (정답: 흰색→주황)
- **원인**: colors.js에서 색상 순서 반대
- **해결**: HIT_START/HIT_END 교체

#### 버그 4: 충격파 효과 누락
- **문제**: 발사체 충돌 시 링 없음, 탱크 폭발 시 링 없음
- **원인**:
  - HitEffectRing, ExplosionRing 클래스 누락
  - createHitEffect(), createExplosion() 함수 누락
  - 함수 분리 후 호출 연결 안 됨
- **해결**:
  - 2개 클래스 추가
  - 2개 함수 추가 및 export
  - Game.js에서 import + 전달 + 호출

### 3. 구조 개선

#### Fixed Timestep Accumulator
```javascript
// Before: 프레임레이트에 의존
game.update(PHYSICS.FIXED_TIMESTEP);  // 항상 1/60

// After: 프레임레이트 독립
let accumulator = 0;
while (accumulator >= PHYSICS.FIXED_TIMESTEP) {
    game.update(PHYSICS.FIXED_TIMESTEP);
    accumulator -= PHYSICS.FIXED_TIMESTEP;
}
```

**효과**: 모든 환경(60fps/120fps/30fps)에서 동일한 게임 속도

#### 효과 함수 분리
```javascript
// 충돌 효과
createHitEffect(x, y);              // 충격파 링
createProjectileHitParticles(x, y); // 스파크 파티클

// 탱크 폭발
createExplosion(x, y);              // 3개 폭발 링 (시차)
createTankExplosionParticles(x, y); // 80개 파티클
```

**효과**: 각 함수의 책임 명확, 재사용성 증가

---

## 주요 실수 및 교훈

### 실수 1: 랜덤 벽 생성 누락 ❌
- **문제**: 100+ 줄 로직을 "나중에"로 미루고 중앙 벽 1개만 하드코딩
- **교훈**: "나중에"는 금물, 모든 기능을 체크리스트화

### 실수 2: 프로토타입 분석 불충분
- **문제**: 클래스 기본값만 보고 실제 전달값 확인 안 함
- **교훈**: 기본값 ≠ 실제 사용값, `new ClassName()` 호출부 확인 필수

### 실수 3: 함수 분리 후 연결 누락
- **문제**: 함수는 export했으나 import + 전달 + 호출 누락
- **교훈**: Export/Import/전달/호출 4단계 모두 확인

### 실수 4: 테스트 범위 불충분
- **문제**: "작동한다" 확인만, 세부 효과 비교 안 함
- **교훈**: 프로토타입과 1:1 비교 체크리스트 필요

---

## 최종 구조

```
js/
├── main.js                    # 진입점 + 게임 루프 (Fixed Timestep)
├── config/
│   ├── constants.js           # 물리/충돌/스폰 상수
│   ├── colors.js              # TRON 색상
│   └── weapons.js             # 무기 데이터
├── core/
│   ├── Game.js                # 메인 컨트롤러
│   ├── Renderer.js            # Canvas 2D (배경/그리드/벽/탱크)
│   ├── particles.js           # PixiJS 파티클 시스템
│   └── ProjectileRenderer.js  # PixiJS 발사체 렌더러
├── entities/
│   ├── Tank.js                # 탱크 (Matter.js + Canvas 2D)
│   └── Projectile.js          # 발사체 (Matter.js + PixiJS)
├── systems/
│   ├── collision.js           # 충돌 처리
│   ├── input.js               # 키보드 입력
│   └── ai.js                  # AI 로직
└── ui/
    └── hud.js                 # UI 업데이트
```

---

## 렌더링 레이어

```
Layer 1: Canvas 2D (배경, 그리드, 벽)
Layer 2: PixiJS Projectile Container (발사체)
Layer 3: Canvas 2D (탱크)
Layer 4: PixiJS Particle Container (충격파, 폭발 링, 파티클)
Layer 5: HTML (UI 패널)
```

---

## 통계

| 항목 | Before | After |
|------|--------|-------|
| 파일 수 | 1개 | 15개 |
| 총 라인 수 | 1,803 | ~1,922 |
| 소요 시간 | - | 6.5시간 |
| 발견 버그 | - | 5개 |
| 수정 버그 | - | 4개 |
| 미해결 | - | 1개 (랜덤 벽) |

---

## 남은 작업

### Phase 3 계획

1. **랜덤 벽 생성** (새로운 알고리즘)
   - 프로토타입 복원 X
   - 개선된 방식으로 재구현 O

2. **무기 시스템 확장**
   - 현재: 3종 (MISSILE, LASER, DOUBLE_MISSILE)
   - 목표: 34종

3. **멀티플레이어 지원**
   - 현재: 6 탱크 (플레이어 1 + AI 5) ✅
   - 목표: 로컬 멀티플레이어 (2-6 플레이어)

4. **최적화**
   - 파티클 풀링
   - 오프스크린 렌더링
   - AI 연산 최적화

---

## 결론

Phase 2는 **대부분 성공**했으나, 일부 기능(랜덤 벽)이 누락되었습니다.

**주요 성과**:
- ✅ 명확한 모듈 구조
- ✅ Fixed Timestep Accumulator (프로토타입보다 개선)
- ✅ 효과 로직 명확화
- ✅ 4개 버그 발견 및 수정

**개선 필요**:
- ❌ 랜덤 벽 생성 (Phase 3에서 재구현)
- ⚠️ 리팩토링 전 체크리스트 작성 부족

**교훈**:
> "나중에 하자"는 안 된다. 모든 기능을 체크리스트에 명시하고, 단계별로 검증하라.

---

**상세 내용**: `docs/devlogs/phase2-modular-refactoring.md` 참조
