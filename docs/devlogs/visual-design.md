# 비주얼 디자인 개발 로그

## 목차
- [TRON 스타일 구현](#tron-스타일-구현)
- [visualMargin 시스템](#visualmargin-시스템)
- [네온 그래픽 기법](#네온-그래픽-기법)

---

## TRON 스타일 구현

**날짜**: 2025-10-29
**영감**: TRON Legacy 영화의 네온 그래픽

### 디자인 시스템

**3-Layer 렌더링:**
1. Dark interior (#0a0a0a) - 매우 어두운 내부
2. Colored neon glow - 플레이어별 색상
3. White core (1px) - 밝은 중심선

### 탱크 렌더링

```javascript
// Layer 1: Dark fill
ctx.fillStyle = '#0a0a0a';
ctx.fill();

// Layer 2: Outer neon glow
ctx.strokeStyle = tank.color;  // 플레이어 색상
ctx.lineWidth = 3;
ctx.lineJoin = 'round';  // 중요!
ctx.shadowColor = tank.color;
ctx.shadowBlur = 20;
ctx.stroke();

// Layer 3: Inner white core
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 1;
ctx.lineJoin = 'round';
ctx.shadowColor = '#ffffff';
ctx.shadowBlur = 5;
ctx.stroke();
```

### 벽 렌더링

**색상**: 하늘색 (#88ddff)
**스타일**: 탱크와 동일한 3-layer

```javascript
// Obstacle walls
ctx.fillStyle = '#0a0a0a';
ctx.strokeStyle = '#88ddff';
ctx.lineWidth = 3;
ctx.shadowBlur = 15;
```

### 파티클 효과

**탱크 폭발:**
- 색상 전환: Yellow (#ffff00) → White (#ffffff)
- 크기 믹스: 20% size-2, 80% size-1
- 생명 시간: 0.5-1.2초

**이전 (빨간색 종료):**
```javascript
startColor: 0xffff00,  // Yellow
endColor: 0xff0000     // Red
```

**현재 (흰색 종료):**
```javascript
startColor: 0xffff00,  // Yellow
endColor: 0xffffff     // White (더 깔끔)
```

### 시각적 효과

**shadowBlur의 역할:**
- 네온 glow 효과 생성
- 너무 크면 성능 저하
- 탱크: 20px, 벽: 15px, 코어: 5px

**lineJoin='round'의 중요성:**
- 기본값 'miter'는 날카로운 spike 생성
- 'round'로 부드러운 모서리
- 특히 탱크 앞 꼭지점에서 중요

### 배운 점

1. **어두운 배경 + 밝은 선 = 네온 효과**
   - 내부를 아주 어둡게 (#0a0a0a)
   - 외곽선을 밝게 + shadowBlur

2. **lineJoin 설정 필수**
   - 'miter' spike는 시각적으로 거슬림
   - 'round'가 TRON 스타일에 적합

3. **색상 일관성**
   - 플레이어별 고유 색상 유지
   - 중립 요소(벽)는 하늘색
   - 흰색 코어로 통일감

### 참고
- [TRON Legacy VFX](https://www.artofvfx.com/tron-legacy/)
- [Canvas lineJoin](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin)
- 커밋: ce1927d

---

## visualMargin 시스템

**날짜**: 2025-10-29
**목적**: 물리 정확도 유지하며 시각적 잘림 방지

### 문제 발견

**현상**: 탱크가 벽에 붙으면 시각적으로 잘림

**원인 분석:**
1. 물리 경계: Canvas 정확히 (0, 0, 960, 720)
2. 시각적 렌더링: stroke + shadowBlur가 물리 경계 넘어섬
   - lineWidth 3 → 양쪽 1.5px씩 확장
   - shadowBlur 20 → 약 20px 범위로 확산
3. 결과: 시각적 요소가 Canvas 밖으로 나가 잘림

### 해결책: 3px visualMargin

**핵심 아이디어**: 물리와 시각을 분리

```javascript
const visualMargin = 3;  // 3px 안쪽으로

// Physical boundaries
const boundaryWalls = [
    // Top: inner edge at y=3 (instead of 0)
    Bodies.rectangle(480, 3 - wallThickness/2, 960 + wallThickness*2, wallThickness),
    // Bottom: inner edge at y=717 (instead of 720)
    Bodies.rectangle(480, 717 + wallThickness/2, ...),
    // Left: inner edge at x=3
    Bodies.rectangle(3 - wallThickness/2, ...),
    // Right: inner edge at x=957
    Bodies.rectangle(957 + wallThickness/2, ...)
];
```

**결과:**
- 물리 경계: (3, 3, 957, 717)
- 시각 렌더링: stroke가 (0, 0, 960, 720)까지 확장
- 탱크가 물리 경계에 닿아도 시각적으로 잘리지 않음

### 장애물 벽도 동일 적용

```javascript
// Shrink rendering vertices 3px inward
const shrinkAmount = 3;
const visualVertices = [];
for (let vertex of wall.vertices) {
    const offset = Vector.sub(vertex, pos);
    const length = Vector.magnitude(offset);
    const shrinkRatio = Math.max(0, (length - shrinkAmount) / length);
    const shrunkenOffset = Vector.mult(offset, shrinkRatio);
    visualVertices.push(Vector.add(pos, shrunkenOffset));
}

// Draw using shrunken vertices
ctx.beginPath();
ctx.moveTo(visualVertices[0].x, visualVertices[0].y);
for (let v of visualVertices) {
    ctx.lineTo(v.x, v.y);
}
```

### 주석으로 보호

리팩토링 시 실수로 제거되지 않도록 상세한 주석:

```javascript
// IMPORTANT: Physical boundary is intentionally 3px smaller than canvas
// Reason: Tank rendering uses stroke (lineWidth 3) and shadowBlur (20px)
//         which extend beyond the physical vertices. Without this margin,
//         tanks touching walls would be visually cut off at canvas edge.
// Visual solution: Keep physics 3px inward, render extends to canvas edge
// DO NOT REMOVE: This prevents visual clipping while maintaining physics accuracy
```

### 배운 점

1. **물리와 시각은 다를 수 있다**
   - 게임에서 "충돌하는 것"과 "보이는 것"은 별개
   - 미학을 위해 시각을 조정해도 물리는 정확하게 유지

2. **Canvas stroke의 함정**
   - `stroke()`는 선의 중심에서 양쪽으로 확장
   - lineWidth 3 = 실제로는 ±1.5px
   - shadowBlur는 훨씬 더 넓게 확산

3. **3px라는 작은 마진의 큰 효과**
   - 겨우 3px 차이가 시각적 품질 크게 개선
   - 물리 정확도는 전혀 손상 없음

4. **문서화의 중요성**
   - 이런 미묘한 조정은 나중에 이유를 잊음
   - 상세한 주석으로 미래의 나 보호

### 참고
- 커밋: ce1927d
- 관련: [physics-engine.md](./physics-engine.md#collision-stability)

---

## 네온 그래픽 기법

### shadowBlur 최적화

**발견**: shadowBlur는 매우 무거운 연산

**Canvas 2D에서:**
```javascript
// 200개 발사체 × shadowBlur = 심각한 성능 저하
ctx.shadowColor = color;
ctx.shadowBlur = 10;  // 매 프레임 200번 호출
```

**PixiJS BlurFilter도 마찬가지:**
```javascript
// 여전히 무거움
const blurFilter = new PIXI.BlurFilter(3);
graphics.filters = [blurFilter];
```

**최종 결정**: BlurFilter 제거
- 깔끔한 렌더링
- 성능 우선
- 네온 느낌은 색상 조합으로 유지

### 색상 선택

**플레이어 색상:**
- 밝고 채도 높은 네온 색상
- #00ff00, #ff0000, #0088ff 등

**중립 요소:**
- 벽: #88ddff (하늘색)
- 코어: #ffffff (흰색)
- 배경: #1a1a2e (어두운 청색)

**파티클:**
- 시작: #ffff00 (노란색)
- 종료: #ffffff (흰색)

### 대비와 가독성

**어두운 배경 (#0a0a0a):**
- 네온 효과 극대화
- 밝은 선이 돋보임

**흰색 코어 (1px):**
- 중심을 더 밝게
- 디테일 추가
- 에너지 느낌

### 시각적 일관성

모든 요소에 동일한 렌더링 기법 적용:
1. Dark fill
2. Colored stroke (3px)
3. White core (1px)
4. lineJoin='round'

→ 통일된 비주얼 스타일
