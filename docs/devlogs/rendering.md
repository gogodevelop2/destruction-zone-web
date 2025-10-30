# 렌더링 시스템 개발 로그

## 목차
- [PixiJS 발사체 마이그레이션](#pixijs-발사체-마이그레이션)
- [렌더링 레이어 구조](#렌더링-레이어-구조)
- [파티클 시스템](#파티클-시스템)

---

## PixiJS 발사체 마이그레이션

**날짜**: 2025-10-30
**목적**: Canvas 2D → PixiJS WebGL 전환으로 100-200개 발사체 동시 처리

### 배경

**문제**:
- 탱크 6대가 더블/트리플 미사일 사용 시 **100-200개 발사체** 동시 처리 필요
- Canvas 2D shadowBlur는 매우 무거움 (200개 × shadowBlur = 심각한 성능 저하)
- 프레임 드롭 발생 가능성

**해결책**:
- PixiJS WebGL 렌더링으로 전환
- 파티클 시스템이 이미 PixiJS 사용 중이므로 통합 가능

### 4단계 마이그레이션

계획 문서: [pixi-projectile-migration.md](../archive/pixi-projectile-migration.md)

#### Phase 1: PixiJS 추가 (A/B 테스트)

**작업 내용:**
- projectileContainer 생성 및 stage 추가
- createProjectileGraphics() 함수 구현
  - LASER: 긴 beam (외부 컬러 + 내부 white core)
  - MISSILE: 원형 (컬러 fill)
- Projectile 클래스에 pixiSprite 추가
- A/B 테스트 플래그 (usePixiRendering)

```javascript
// projectileContainer 추가
const projectileContainer = new PIXI.Container();
pixiApp.stage.addChild(projectileContainer);

// Projectile에서 사용
this.pixiSprite = createProjectileGraphics(type, color, weaponData);
projectileContainer.addChild(this.pixiSprite);
```

#### Phase 2: 성능 최적화 결정

**BlurFilter 제거 결정:**
- Canvas vs PixiJS 비교 테스트
- BlurFilter도 무거움 판단
- 깔끔한 렌더링으로 확정 (성능 우선)

**비교 결과:**
- Canvas shadowBlur: 매우 무거움
- PixiJS BlurFilter: 여전히 무거움
- PixiJS without filter: 빠르고 깔끔

#### Phase 3: Canvas 렌더링 완전 제거

**작업 내용:**
- `Projectile.render()` 메서드 삭제
- usePixiRendering 플래그 제거
- 게임 루프에서 `projectile.render(ctx)` 호출 제거
- 100% PixiJS 렌더링으로 전환

**최종 코드:**
```javascript
// render() 메서드 없음 - PixiJS가 자동 렌더링
// update()에서 위치/회전만 동기화
update(deltaTime) {
    if (this.pixiSprite) {
        this.pixiSprite.position.set(pos.x, pos.y);
        this.pixiSprite.rotation = angle;
    }
}
```

#### Phase 4: 리팩토링 준비

**ProjectileRenderer 객체 생성:**
```javascript
const ProjectileRenderer = {
    container: null,

    init(pixiContainer) {
        this.container = pixiContainer;
    },

    createGraphics(type, color, weaponData) {
        // LASER/MISSILE 타입별 Graphics 생성
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

**책임 분리:**
- **ProjectileRenderer**: 렌더링 전담 (sprite 생성, container 관리)
- **Projectile**: 물리/로직 전담 (생명주기, 충돌, Matter.js)

### 성과

✅ **렌더링 통합**: Projectiles + Particles 모두 PixiJS
✅ **성능**: BlurFilter 없이 깔끔한 렌더링, 100-200개 처리 준비
✅ **아키텍처**: 명확한 렌더링/물리 분리
✅ **리팩토링 준비**: 상세한 주석 및 인터페이스

### 렌더링 레이어 최종 구조

```
1. Background (Canvas 2D)
2. Walls (Canvas 2D)
3. Projectiles (PixiJS) ← 전환 완료
4. Tanks (Canvas 2D)
5. Particles (PixiJS)
```

PixiJS 레이어는 Canvas 위에 투명하게 오버레이:
```javascript
pixiApp = new PIXI.Application({
    backgroundAlpha: 0,  // 완전 투명
    antialias: true
});
```

### 배운 점

1. **BlurFilter는 생각보다 무겁다**
   - WebGL이라고 모든 효과가 빠른 건 아님
   - 200개 × BlurFilter = 여전히 무거움

2. **A/B 테스트의 중요성**
   - Canvas와 PixiJS를 쉽게 전환하며 비교
   - 플래그 하나로 안전한 마이그레이션

3. **렌더링 레이어 분리가 핵심**
   - 물리와 렌더링 완전 분리
   - 리팩토링 시 각 레이어 독립적으로 이동 가능

4. **Phase별 접근의 효과**
   - 한 번에 다 바꾸면 위험
   - 단계별로 검증하며 진행

### 참고
- [pixi-projectile-migration.md](../archive/pixi-projectile-migration.md)
- [PixiJS Graphics API](https://pixijs.download/release/docs/PIXI.Graphics.html)
- 커밋: 3d93927

---

## 렌더링 레이어 구조

### 하이브리드 렌더링 시스템

**Canvas 2D**: 정적 요소
- Background
- Walls
- Tanks

**PixiJS WebGL**: 동적 다수 요소
- Projectiles (100-200개)
- Particles (폭발 효과)

**장점:**
- Canvas: 단순한 도형은 충분히 빠름
- PixiJS: 대량 객체 처리에 강함
- 각 기술의 장점 활용

### PixiJS 초기화

```javascript
function initPixiJS() {
    pixiApp = new PIXI.Application({
        width: 960,
        height: 720,
        backgroundAlpha: 0,  // 투명 배경 (중요!)
        antialias: true
    });

    // 렌더링 순서 (아래부터)
    projectileContainer = new PIXI.Container();
    pixiApp.stage.addChild(projectileContainer);

    particleContainer = new PIXI.Container();
    pixiApp.stage.addChild(particleContainer);
}
```

---

## 파티클 시스템

**구현**: PixiJS Graphics 기반

### Particle 클래스

```javascript
class Particle extends PIXI.Graphics {
    constructor(x, y, vx, vy, config) {
        super();

        // 원형 파티클
        this.beginFill(config.startColor);
        this.drawCircle(0, 0, config.radius);
        this.endFill();

        // 생명주기
        this.maxLife = config.lifetime;
        this.life = this.maxLife;
    }

    update(deltaTime) {
        // 위치, 속도, 색상 보간
        this.life -= deltaTime;
        return this.life > 0;
    }
}
```

### 탱크 폭발 효과

**파티클 수**: 20-30개
**크기 믹스**: 20% size-2, 80% size-1
**색상 전환**: Yellow → White

```javascript
function createTankExplosionParticles(x, y) {
    for (let i = 0; i < 25; i++) {
        const particle = new Particle(x, y, vx, vy, {
            lifetime: 0.5 + Math.random() * 0.7,
            startColor: 0xffff00,  // Yellow
            endColor: 0xffffff,    // White
            radius: Math.random() < 0.2 ? 2 : 1
        });
        activeParticles.push(particle);
        particleContainer.addChild(particle);
    }
}
```

### 성능

PixiJS로 파티클 렌더링:
- 50-100개 파티클도 부드러움
- 색상 보간 GPU에서 처리
- 자동 배치 렌더링
