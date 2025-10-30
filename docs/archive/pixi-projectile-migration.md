# PixiJS Projectile Migration Plan

**작성일**: 2025-10-29
**목적**: Canvas 2D 발사체 렌더링을 PixiJS로 전환하여 성능 개선 (100-200개 동시 처리)

---

## 배경

### 현재 문제
- 탱크 6대가 더블/트리플 미사일 사용 시 **100-200개 발사체** 동시 처리
- Canvas 2D shadowBlur는 매우 무거움 (200개 × shadowBlur = 심각한 성능 저하)
- 프레임 드롭 발생 가능성

### 해결책
- PixiJS WebGL 렌더링으로 전환
- 파티클 시스템이 이미 PixiJS 사용 중이므로 통합 가능

---

## Phase 0: 사전 조사 (현재 상태 파악)

### 작업 내용
1. ✅ 현재 파티클 시스템이 PixiJS를 어떻게 사용하는지 확인
2. ✅ Projectile 클래스의 현재 렌더링 로직 분석
3. ✅ PixiJS Container 구조 파악

### 현재 구조
```javascript
// prototype.html 내부
pixiApp (PIXI.Application)
└── particleContainer (PIXI.Container)
    └── Particle 객체들 (PIXI.Graphics)
```

### Projectile 현재 렌더링 (Canvas 2D)
- **위치**: `Projectile.render(ctx)` 메서드 (line 968-1043)
- **미사일**: Circle + Trail (shadowBlur 10)
- **레이저**: Line beam (shadowBlur 15) + white core (shadowBlur 5)

---

## Phase 1: PixiJS Projectile 클래스 생성 (기존과 병행)

### 목표
기존 Canvas 렌더링을 유지하면서 PixiJS 렌더링 추가 (A/B 테스트 가능)

### 작업 내용

#### 1.1 projectileContainer 생성
```javascript
// PixiJS Setup 섹션에 추가
const projectileContainer = new PIXI.Container();
pixiApp.stage.addChild(projectileContainer);

// 렌더링 레이어 순서:
// 1. Background (canvas)
// 2. Walls (canvas)
// 3. Projectiles (PixiJS) ← 새로 추가
// 4. Tanks (canvas)
// 5. Particles (PixiJS)
```

#### 1.2 Projectile Graphics 생성 함수
```javascript
function createProjectileGraphics(type, color, weaponData) {
    const graphics = new PIXI.Graphics();

    if (type === 'LASER') {
        // 레이저: 긴 선
        const beamLength = 20;
        graphics.lineStyle(2, color, 1);
        graphics.moveTo(-beamLength/2, 0);
        graphics.lineTo(beamLength/2, 0);

        // 중앙 흰색 코어
        graphics.lineStyle(1, 0xffffff, 1);
        graphics.moveTo(-beamLength/2, 0);
        graphics.lineTo(beamLength/2, 0);

        // Glow 효과 (BlurFilter 사용)
        const blurFilter = new PIXI.BlurFilter(4);
        graphics.filters = [blurFilter];

    } else {
        // 미사일: 원
        graphics.beginFill(color, 1);
        graphics.drawCircle(0, 0, weaponData.size);
        graphics.endFill();

        // Glow 효과
        const blurFilter = new PIXI.BlurFilter(3);
        graphics.filters = [blurFilter];
    }

    return graphics;
}
```

#### 1.3 Projectile 클래스 수정
```javascript
class Projectile {
    constructor(x, y, vx, vy, weaponData, ownerTank) {
        // ... 기존 코드 ...

        // PixiJS sprite 생성
        this.pixiSprite = createProjectileGraphics(
            weaponData.type,
            this.colorHex,
            weaponData
        );
        this.pixiSprite.position.set(x, y);
        projectileContainer.addChild(this.pixiSprite);

        // Canvas 렌더링 플래그 (A/B 테스트용)
        this.usePixiRendering = true; // false로 바꾸면 Canvas로 렌더링
    }

    update(deltaTime) {
        // ... 기존 코드 ...

        // PixiJS sprite 위치 동기화
        if (this.pixiSprite) {
            const pos = this.body.position;
            const vel = this.body.velocity;
            const angle = Math.atan2(vel.y, vel.x);

            this.pixiSprite.position.set(pos.x, pos.y);
            this.pixiSprite.rotation = angle;
        }
    }

    destroy() {
        if (this.active) {
            World.remove(world, this.body);

            // PixiJS sprite 제거
            if (this.pixiSprite) {
                projectileContainer.removeChild(this.pixiSprite);
                this.pixiSprite.destroy();
                this.pixiSprite = null;
            }

            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        // 플래그에 따라 Canvas 또는 PixiJS 사용
        if (this.usePixiRendering) {
            // PixiJS가 자동으로 렌더링 (아무것도 안 함)
            return;
        }

        // 기존 Canvas 렌더링 코드 (백업용)
        // ... 기존 코드 유지 ...
    }
}
```

---

## Phase 2: 렌더링 전환

### 작업 내용

#### 2.1 A/B 테스트
```javascript
// 전역 플래그로 쉽게 전환 가능
const USE_PIXI_PROJECTILES = true; // false로 바꾸면 Canvas 렌더링
```

#### 2.2 성능 측정
- Chrome DevTools Performance 탭 사용
- Canvas 렌더링 vs PixiJS 렌더링 FPS 비교
- 200개 발사체 동시 처리 시 프레임 타임 측정

#### 2.3 비주얼 검증
- Canvas와 PixiJS 렌더링 결과 비교
- Glow 효과가 비슷한지 확인
- 색상, 크기, 회전 정확도 확인

---

## Phase 3: Canvas 렌더링 제거

### 전제 조건
- ✅ PixiJS 렌더링 성능이 더 좋음
- ✅ 비주얼이 Canvas와 동일하거나 더 좋음
- ✅ 버그 없음

### 작업 내용

#### 3.1 Canvas 렌더링 코드 삭제
```javascript
class Projectile {
    render(ctx) {
        // 이 메서드 전체 삭제 또는 비활성화
        // PixiJS가 자동으로 렌더링하므로 불필요
    }
}
```

#### 3.2 플래그 제거
```javascript
// usePixiRendering 플래그 제거
// 모든 projectile은 항상 PixiJS 사용
```

#### 3.3 정리
- 불필요한 주석 제거
- console.log 디버깅 코드 제거

---

## Phase 4: 리팩토링 준비

### 목표
나중에 모듈로 분리하기 쉽게 구조화

### 작업 내용

#### 4.1 렌더링 로직 분리
```javascript
// 별도 객체로 렌더링 로직 분리
const ProjectileRenderer = {
    container: null,

    init(pixiApp) {
        this.container = new PIXI.Container();
        pixiApp.stage.addChild(this.container);
    },

    createGraphics(type, color, weaponData) {
        // createProjectileGraphics 로직 이동
    },

    add(sprite) {
        this.container.addChild(sprite);
    },

    remove(sprite) {
        this.container.removeChild(sprite);
        sprite.destroy();
    }
};
```

#### 4.2 주석 추가
```javascript
// NOTE: 리팩토링 시 이 부분을 src/rendering/ProjectileRenderer.js로 이동
// Projectile 클래스는 src/entities/Projectile.js로 이동
// 렌더링과 물리/로직을 완전히 분리할 것
```

#### 4.3 인터페이스 명확화
```javascript
// Projectile 클래스의 책임:
// 1. 물리 시뮬레이션 (Matter.js)
// 2. 생명주기 관리 (age, lifetime)
// 3. 충돌 처리
//
// ProjectileRenderer의 책임:
// 1. PixiJS Graphics 생성
// 2. 위치/회전 동기화
// 3. 렌더링
```

---

## 리팩토링 시 최종 구조 (참고용)

```
src/
├── rendering/
│   ├── PixiRenderer.js          // PixiJS 초기화 및 전역 관리
│   ├── ProjectileRenderer.js    // 발사체 렌더링 (PixiJS)
│   └── ParticleRenderer.js      // 파티클 렌더링 (PixiJS)
├── entities/
│   ├── Projectile.js            // 발사체 물리 + 로직
│   ├── Particle.js              // 파티클 물리 + 로직
│   └── Tank.js                  // 탱크
└── physics/
    └── PhysicsWorld.js          // Matter.js 관리
```

---

## 체크리스트

### Phase 0: 사전 조사
- [ ] 파티클 시스템 PixiJS 사용 방식 분석
- [ ] Projectile 렌더링 코드 위치 확인
- [ ] PixiJS Container 구조 이해

### Phase 1: PixiJS 렌더링 추가
- [ ] projectileContainer 생성
- [ ] createProjectileGraphics() 함수 구현
- [ ] Projectile 클래스에 pixiSprite 추가
- [ ] update()에서 위치 동기화
- [ ] destroy()에서 sprite 제거
- [ ] A/B 테스트 플래그 추가

### Phase 2: 성능 테스트
- [ ] PixiJS 렌더링 활성화 테스트
- [ ] Canvas 렌더링과 FPS 비교
- [ ] 비주얼 검증 (색상, 크기, glow)
- [ ] 버그 확인

### Phase 3: Canvas 제거
- [ ] Canvas render() 메서드 제거
- [ ] 플래그 제거
- [ ] 코드 정리

### Phase 4: 리팩토링 준비
- [ ] ProjectileRenderer 객체 분리
- [ ] 주석 추가 (리팩토링 가이드)
- [ ] 인터페이스 명확화

---

## 주의사항

### 성능 관련
- BlurFilter는 무거울 수 있음 → 필요시 glow 스프라이트 사용 고려
- Container의 자식 개수가 많으면 ParticleContainer 사용 고려
- Sprite pooling 구현 고려 (생성/삭제 반복 방지)

### 비주얼 관련
- Canvas shadowBlur와 PixiJS BlurFilter 효과 차이 있음
- 색상 값: Canvas는 CSS color, PixiJS는 hex number (0xRRGGBB)
- 투명도: Canvas는 globalAlpha, PixiJS는 alpha property

### 렌더링 순서
- PixiJS stage의 자식 추가 순서가 렌더링 순서
- projectileContainer는 particleContainer보다 먼저 추가 (아래 레이어)

---

## 참고 자료

### PixiJS 공식 문서
- Graphics: https://pixijs.download/release/docs/PIXI.Graphics.html
- BlurFilter: https://pixijs.download/release/docs/PIXI.BlurFilter.html
- Container: https://pixijs.download/release/docs/PIXI.Container.html

### 현재 코드 위치
- **Projectile 클래스**: prototype.html line ~900-1044
- **파티클 시스템**: prototype.html line ~340-480
- **PixiJS 초기화**: prototype.html line ~342-390

---

## 완료 후 예상 효과

- ✅ 200개 발사체도 60 FPS 유지
- ✅ 파티클과 발사체 렌더링 통합 (일관성)
- ✅ 리팩토링 시 렌더링 레이어 쉽게 분리 가능
- ✅ 향후 고급 효과 추가 용이 (bloom, trail particle 등)
