# Projectile Render System

**Date:** 2025-11-08
**Purpose:** Projectile 렌더링 시스템 구조 설명

---

## 1. 시스템 개요

Projectile 렌더링은 **2단계 구조**로 동작합니다:

1. **weapons.js**: 각 무기의 renderConfig 정의
2. **ProjectileRenderer.js**: renderType별 렌더링 핸들러

---

## 2. 렌더링 흐름

```
Weapon Data (weapons.js)
    ↓
Projectile 생성
    ↓
ProjectileRenderer.createGraphics()
    ↓
Render Handler 실행
    ↓
PixiJS Graphics 객체 생성
```

### 예시: MISSILE 발사

```javascript
// 1. weapons.js에서 무기 데이터 읽기
MISSILE: {
    renderType: 'SHORT_BEAM',
    renderConfig: {
        length: 6,
        width: 2,
        coreWidth: 1,
        hasCore: true
    }
}

// 2. Projectile 생성 시 전달
new Projectile(x, y, angle, WEAPON_DATA.MISSILE, ...)

// 3. ProjectileRenderer가 렌더링
ProjectileRenderer.createGraphics('MISSILE', color, weaponData)

// 4. SHORT_BEAM 핸들러 실행
renderHandlers['SHORT_BEAM'](graphics, color, renderConfig)

// 5. PixiJS Graphics 객체 반환
return graphics;  // 6px 길이의 빔
```

---

## 3. 설계 결정: Option B (개별 제어)

### 선택한 방식

**각 무기가 명시적으로 renderConfig 지정**

```javascript
// weapons.js
MISSILE: {
    renderConfig: { length: 6 }  // ← 명시적 지정
}

GUIDED: {
    renderConfig: { length: 6 }  // ← 명시적 지정
}

// ProjectileRenderer.js
'SHORT_BEAM': (graphics, color, config) => {
    const length = config.length || 6;  // ← 폴백만 (안전장치)
}
```

### 장점
- ✅ 무기마다 다른 렌더링 설정 가능
  - 예: MISSILE=6, GUIDED=8
- ✅ weapons.js만 보면 모든 정보 파악 가능
- ✅ 유연한 커스터마이징

### 단점
- ❌ 같은 타입 무기 여러 개 수정 시 반복 작업
- ❌ 렌더러 기본값은 실제로 사용 안 됨

---

## 4. 대안: Option A (상속)

### 구현하지 않은 방식

**렌더러 기본값을 단일 소스로 사용**

```javascript
// weapons.js - renderConfig 제거
MISSILE: {
    renderType: 'SHORT_BEAM'
    // renderConfig 없음!
}

GUIDED: {
    renderType: 'SHORT_BEAM'
    // renderConfig 없음!
}

// ProjectileRenderer.js - 여기서만 관리
'SHORT_BEAM': (graphics, color, config) => {
    const length = 6;  // ← 여기만 바꾸면 모든 SHORT_BEAM 무기 변경
}
```

### 장점 (구현 안 함)
- ✅ 한 곳만 수정하면 모든 무기 변경
- ✅ 중복 없음

### 단점 (구현 안 함)
- ❌ 무기별 개별 제어 불가
- ❌ 모든 SHORT_BEAM이 같은 모양

---

## 5. 사용 가이드

### 특정 무기만 변경

```javascript
// weapons.js
GUIDED: {
    renderConfig: {
        length: 8,  // ← GUIDED만 8로 변경
    }
}
```

### 모든 SHORT_BEAM 무기 변경

```javascript
// weapons.js - 각각 수정
MISSILE: { renderConfig: { length: 8 } }
DOUBLE_MISSILE: { renderConfig: { length: 8 } }
TRIPLE_MISSILE: { renderConfig: { length: 8 } }
GUIDED: { renderConfig: { length: 8 } }
```

### 렌더러 기본값 수정 (폴백)

```javascript
// ProjectileRenderer.js
'SHORT_BEAM': (graphics, color, config) => {
    const length = config.length || 8;  // ← 기본값만 변경
}

// ⚠️ 주의: weapons.js에 length가 있으면 이 값은 무시됨!
```

---

## 6. Render Type 목록

| Type | Description | Config |
|------|-------------|--------|
| **SHORT_BEAM** | 짧은 빔 (미사일) | length, width, coreWidth, hasCore |
| **LONG_BEAM** | 긴 빔 (레이저) | length, width, coreWidth, hasCore |
| **CIRCLE** | 원형 (탄두, 폭탄) | radius, fillAlpha, hasOutline, hasGlow |
| **SMALL_CIRCLE** | 작은 원 (자탄) | radius |

---

## 7. 새 Render Type 추가

### 예시: STAR 추가

```javascript
// ProjectileRenderer.js
renderHandlers: {
    'STAR': (graphics, color, config) => {
        const colorHex = parseInt(color.replace('#', ''), 16);
        const points = config.points || 5;
        const radius = config.radius || 4;

        // 별 그리기 로직...
        graphics.beginFill(colorHex, 1);
        // ...
        graphics.endFill();
    }
}

// weapons.js
SWIRLER: {
    renderType: 'STAR',
    renderConfig: {
        points: 5,
        radius: 4
    }
}
```

---

## 8. 렌더러 vs 무기 데이터 비교

### 렌더러 (ProjectileRenderer.js)

**역할:**
- Render Type 핸들러 정의
- 폴백 기본값 제공 (안전장치)

**수정 시기:**
- 새 Render Type 추가
- 폴백 기본값 변경

**영향:**
- renderConfig 없는 무기만 영향

### 무기 데이터 (weapons.js)

**역할:**
- 각 무기의 renderConfig 명시
- 실제 렌더링 값 제공

**수정 시기:**
- 특정 무기 외형 변경
- 모든 같은 타입 무기 변경

**영향:**
- 해당 무기만 영향

---

## 9. FAQ

### Q: 왜 두 곳에서 값을 지정하나?

**A:** 유연성을 위해
- weapons.js = 무기별 개별 제어
- ProjectileRenderer = 폴백 (안전장치)

### Q: 모든 SHORT_BEAM을 한 번에 바꾸려면?

**A:** weapons.js에서 각각 수정해야 함
- 또는 Option A로 리팩토링 고려

### Q: 렌더러 기본값만 바꾸면?

**A:** 영향 없음 (weapons.js에 값이 있으면)
- renderConfig 없는 무기만 변경됨

### Q: 새 무기 추가 시 renderConfig 필수?

**A:** 아니요, 선택 사항
- 없으면 렌더러 기본값 사용
- 하지만 명시하는 것 권장 (Option B)

---

## 10. 주의사항

⚠️ **렌더러 기본값은 실제로 거의 사용 안 됨**
- 모든 무기가 weapons.js에 renderConfig 있음
- 폴백은 안전장치일 뿐

⚠️ **모든 같은 타입 무기 변경 시 반복 작업 필요**
- MISSILE, DOUBLE_MISSILE, TRIPLE_MISSILE, GUIDED
- 각각 수정해야 함

⚠️ **Option A로 변경하려면?**
- weapons.js에서 모든 renderConfig 제거
- 렌더러 기본값만 사용
- 무기별 개별 제어 불가능해짐

---

## 11. 현재 무기별 Render Type

```
SHORT_BEAM:
- MISSILE (length: 6)
- DOUBLE_MISSILE (length: 6)
- TRIPLE_MISSILE (length: 6)
- GUIDED (length: 6)

LONG_BEAM:
- LASER (length: 20)
- POWER_LASER (length: 20)

CIRCLE:
- BLASTER (primary, radius: 1.5)

SMALL_CIRCLE:
- BLASTER (secondary, radius: 1)
```

---

**설계 결정 기록: Option B (개별 제어) 채택**
**날짜: 2025-11-08**
**이유: 무기별 커스터마이징 유연성**
