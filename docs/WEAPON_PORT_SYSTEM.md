# Weapon Port System Design

**Date:** 2025-11-08
**Purpose:** 탱크 무기 포트 시스템 설계 (DOS 원본 기반)

---

## 1. DOS 원본 포트 시스템 분석

### 1.1 포트 구조 (7개 포트)

DOS 원본 게임에서 각 탱크는 **7개의 무기 포트**를 가지고 있습니다:

| Port | Category | Weapon Count | Description |
|------|----------|--------------|-------------|
| **Port 1** | Front Fire | 6 weapons | 전방 직접 공격 무기 (미사일, 레이저) |
| **Port 2** | Blasters | 5 weapons | 2단계 분열 무기 (탄두 → 자탄) |
| **Port 3** | Surprise Attack | 5 weapons | 후방 공격 및 특수 전술 무기 |
| **Port 4** | Special Front Fire | 6 weapons | 전방 특수 무기 (브레이커, 유도) |
| **Port 5** | Aggressive Defence | 4 weapons | 공격적 방어 무기 (선회, 폭탄) |
| **Port 6** | Special Defence | 4 weapons | 특수 방어 무기 (반사, 무력화) |
| **Port 7** | Harmless Defense | 4 weapons | 비공격 방어 무기 (실드, 텔레포트) |

**총 34개 무기**

---

### 1.2 포트별 무기 목록

#### PORT 1: Front Fire (전방 직접 공격)
```
1. MISSILE       - 기본 미사일 ($2)
2. DOUBLE MISSILE - 2발 동시 ($100)
3. TRIPLE MISSILE - 3발 동시 ($600)
4. BEAM LASER     - 빠른 레이저 ($150)
5. POWER LASER    - 듀얼 레이저 ($1,650)
6. TRI-STRIKER    - 3발 레이저급 속도 ($3,350)
```

#### PORT 2: Blasters (2단계 분열 무기)
```
1. BLASTER        - 기본 블라스터 ($650)
2. GUIDE BLASTER  - 유도 탄두 ($1,200)
3. BLAST GUIDER   - 유도 자탄 ($2,500)
4. NUKE BLASTER   - 고위력 블라스터 ($3,400)
5. SWIRL BLASTER  - 선회 자탄 ($3,800)
```

#### PORT 3: Surprise Attack (후방/특수 전술)
```
1. REAR DOUBLE    - 후방 2발 ($130)
2. REAR GUIDED    - 후방 유도 2발 ($650)
3. REAR CHAOS     - 후방 미니 유도탄 ($1,000)
4. TELEPORT FOE   - 적 텔레포트 ($1,600)
5. REAR TRIPLE    - 후방 3발 ($2,200)
```

#### PORT 4: Special Front Fire (브레이커/유도)
```
1. TRI BREAKER    - 3발 분열 ($250)
2. GUIDED         - 유도 미사일 ($400)
3. QUINT BREAKER  - 5발 분열 ($1,350)
4. QUINT GUIDER   - 5발 유도 분열 ($2,250)
5. OCTO BREAKER   - 8발 분열 ($4,000)
6. SPARK FIENDS   - 절대 빗나가지 않는 유도 ($5,400)
```

#### PORT 5: Aggressive Defence (공격적 방어)
```
1. SWIRLER        - 탱크 주위 선회 ($225)
2. ELECTRO BUDS   - 3발 느린 유도 ($800)
3. NORMAL BOMB    - 설치형 폭탄 ($500)
4. DEATH BOMB     - 고위력 설치 폭탄 ($3,250)
```

#### PORT 6: Special Defence (특수 방어)
```
1. DEATH TOUCH    - 접촉 데미지 (2초) ($350)
2. DEFLECTOR      - 미사일 반사 (1초) ($2,200)
3. ECM WIPER      - 미사일 전부 파괴 ($800)
4. CONFUSOR       - 유도 무력화 (3초) ($480)
```

#### PORT 7: Harmless Defense (비공격 방어)
```
1. HEALER         - 체력 회복 ($350)
2. GLOW SHIELD    - 무적 (3초) ($800)
3. FADE SHIELD    - 투명 (6초) ($1,200)
4. TELEPORT SELF  - 자신 텔레포트 ($2,000)
```

---

## 2. 포트 시스템 규칙

### 2.1 기본 규칙

1. **1 포트 = 1 무기**
   - 각 포트에는 최대 1개 무기만 장착 가능
   - 포트는 비어있을 수 있음 (null)

2. **포트 카테고리 제한**
   - Port 1 = Front Fire 무기만
   - Port 2 = Blaster 무기만
   - Port 3 = Surprise Attack 무기만
   - ... (각 포트는 해당 카테고리만 장착 가능)

3. **키바인딩**
   - 키 1~7 = 포트 1~7 선택
   - 포트 선택 시 해당 포트의 무기로 전환
   - 빈 포트 선택 시 발사 불가

4. **초기 상태**
   - Port 1: MISSILE (기본 무기, 모든 탱크 소유)
   - Port 2~7: null (비어있음)

### 2.2 게임 플레이 규칙 (DOS 원본 DZONE.DOC 기반)

#### **무기 구매 및 교체 시스템**

**DOS 매뉴얼 원문:**
> "Each tank has seven weapon ports, used for different purposes, and each weapon occupies a particular port."
>
> "Be careful when buying new weapons. **New weapons replace any number of old weapons of the same port without warning**. Use the PAGE UP key before you buy any new weapon, or you may be replacing an even better weapon."

**규칙:**

1. **무기 구매 → 빈 포트에 장착**
   ```javascript
   // Port 4가 비어있을 때 GUIDED 구매
   weaponPorts[4] = 'GUIDED';  // ← 새 무기 추가
   ```

2. **무기 구매 → 무기 있는 포트에 장착**
   ```javascript
   // Port 1에 MISSILE이 있을 때 DOUBLE_MISSILE 구매
   weaponPorts[1] = 'DOUBLE_MISSILE';  // ← 기존 MISSILE 사라짐! (경고 없음)
   ```

3. **초기 게임 상태**
   - Port 1: MISSILE (유일하게 장착된 무기)
   - Port 2~7: null (전부 비어있음)
   - 게임 시작 후 상점에서 무기 구매하여 포트 채우기

4. **무기 교체 주의사항**
   - ⚠️ 같은 포트에 새 무기 구매 시 기존 무기는 **경고 없이 사라짐**
   - ⚠️ 더 좋은 무기를 실수로 교체할 수 있음
   - ✅ DOS 원본: PAGE UP 키로 현재 무기 확인 후 구매 권장

---

## 3. 웹 구현 설계

### 3.1 데이터 구조

#### Tank.js - 포트 시스템

```javascript
class Tank {
    constructor(...) {
        // === WEAPON PORT SYSTEM ===

        // 포트별 장착된 무기 (null = 비어있음)
        this.weaponPorts = {
            1: 'MISSILE',  // Port 1: 기본 무기 (항상 있음)
            2: null,       // Port 2: 비어있음
            3: null,       // Port 3: 비어있음
            4: null,       // Port 4: 비어있음
            5: null,       // Port 5: 비어있음
            6: null,       // Port 6: 비어있음
            7: null        // Port 7: 비어있음
        };

        // 현재 선택된 포트 (1-7)
        this.currentPort = 1;

        // 현재 사용 중인 무기 타입 ('MISSILE', 'LASER', null 등)
        this.currentWeapon = this.weaponPorts[1];  // 'MISSILE'

        // 무기 에너지 (기존)
        this.maxWeaponEnergy = 100;
        this.weaponEnergy = 100;
        this.weaponRechargeRate = 20;

        // Two-stage 상태 (기존)
        this.activePrimary = null;
        this.canFirePrimary = true;
    }

    /**
     * 포트 선택 (키 1~7 입력 시)
     * @param {number} portNumber - 포트 번호 (1-7)
     */
    selectPort(portNumber) {
        if (portNumber < 1 || portNumber > 7) return;

        // 포트 변경
        this.currentPort = portNumber;

        // 해당 포트의 무기 가져오기
        const weaponType = this.weaponPorts[portNumber];

        if (weaponType) {
            // 무기가 있으면 전환
            this.switchWeapon(weaponType, WEAPON_DATA);
        } else {
            // 빈 포트
            this.currentWeapon = null;
            // Two-stage 상태 초기화
            this.activePrimary = null;
            this.canFirePrimary = true;
        }
    }

    /**
     * 포트에 무기 장착
     * @param {number} portNumber - 포트 번호 (1-7)
     * @param {string|null} weaponType - 무기 타입 (null = 제거)
     * @returns {boolean} 성공 여부
     */
    equipWeapon(portNumber, weaponType) {
        if (portNumber < 1 || portNumber > 7) return false;

        // 무기 제거 (null)
        if (!weaponType) {
            // Port 1 (MISSILE)은 제거 불가
            if (portNumber === 1) {
                console.warn('Cannot remove MISSILE from Port 1');
                return false;
            }

            this.weaponPorts[portNumber] = null;

            // 현재 선택된 포트면 무기 해제
            if (this.currentPort === portNumber) {
                this.currentWeapon = null;
            }

            return true;
        }

        // TODO: 무기 카테고리 검증
        // - 해당 포트에 장착 가능한 무기인지 체크
        // - 예: Port 1은 Front Fire 무기만 가능

        // 무기 장착
        this.weaponPorts[portNumber] = weaponType;

        // 현재 선택된 포트면 즉시 전환
        if (this.currentPort === portNumber) {
            this.selectPort(portNumber);
        }

        return true;
    }

    /**
     * 포트 정보 조회
     * @returns {Object} 포트 상태
     */
    getPortInfo() {
        return {
            currentPort: this.currentPort,
            currentWeapon: this.currentWeapon,
            ports: { ...this.weaponPorts }
        };
    }
}
```

#### weapons.js - 포트 카테고리 추가

```javascript
export const WEAPON_DATA = {
    MISSILE: {
        name: 'MISSILE',
        type: 'MISSILE',
        port: 1,              // ← 추가: 소속 포트
        category: 'FRONT_FIRE', // ← 추가: 카테고리
        // ... 기존 데이터
    },

    LASER: {
        name: 'BEAM LASER',
        type: 'LASER',
        port: 1,
        category: 'FRONT_FIRE',
        // ...
    },

    BLASTER: {
        name: 'BLASTER',
        type: 'BLASTER',
        port: 2,              // ← 추가
        category: 'BLASTER',   // ← 추가
        // ...
    },

    GUIDED: {
        name: 'GUIDED',
        type: 'GUIDED',
        port: 4,              // ← 추가: Port 4 소속
        category: 'SPECIAL_FRONT_FIRE', // ← 추가
        // ...
    }
};

// 포트 카테고리 정의
export const PORT_CATEGORIES = {
    1: 'FRONT_FIRE',
    2: 'BLASTER',
    3: 'SURPRISE_ATTACK',
    4: 'SPECIAL_FRONT_FIRE',
    5: 'AGGRESSIVE_DEFENCE',
    6: 'SPECIAL_DEFENCE',
    7: 'HARMLESS_DEFENSE'
};
```

### 3.2 입력 시스템 변경

#### input.js - 포트 선택으로 변경

```javascript
export function handleInput(playerTank, fireProjectile, WEAPON_DATA, ...) {
    // ... 이동/회전 로직 (기존)

    // Fire projectile (Space key)
    if (keys['Space'] && !keys['Space_fired']) {
        // 현재 무기가 없으면 발사 불가
        if (!playerTank.currentWeapon) {
            console.log('No weapon equipped in current port');
            keys['Space_fired'] = true;
            return;
        }

        // 기존 발사 로직
        const weaponData = WEAPON_DATA[playerTank.currentWeapon];
        // ...
    }

    // === WEAPON PORT SELECTION (키 1~7) ===
    if (keys['Digit1']) {
        playerTank.selectPort(1);
        keys['Digit1'] = false;
    }
    if (keys['Digit2']) {
        playerTank.selectPort(2);
        keys['Digit2'] = false;
    }
    if (keys['Digit3']) {
        playerTank.selectPort(3);
        keys['Digit3'] = false;
    }
    if (keys['Digit4']) {
        playerTank.selectPort(4);
        keys['Digit4'] = false;
    }
    if (keys['Digit5']) {
        playerTank.selectPort(5);
        keys['Digit5'] = false;
    }
    if (keys['Digit6']) {
        playerTank.selectPort(6);
        keys['Digit6'] = false;
    }
    if (keys['Digit7']) {
        playerTank.selectPort(7);
        keys['Digit7'] = false;
    }
}
```

### 3.3 UI 표시

#### HUD에 포트 상태 표시

```javascript
// 포트 상태 UI (예시)
[1:MISSILE] [2:----] [3:----] [4:GUIDED] [5:----] [6:----] [7:----]
    ^^^ 현재 선택

// 또는 더 자세한 표시
Port 1: MISSILE  ← Current
Port 2: (empty)
Port 3: (empty)
Port 4: GUIDED
Port 5: (empty)
Port 6: (empty)
Port 7: (empty)
```

---

## 4. 구현 단계

### Phase 1: 기본 포트 시스템
- [x] DOS 원본 규칙 분석 완료
- [ ] Tank.js에 포트 데이터 구조 추가
- [ ] selectPort() 메서드 구현
- [ ] equipWeapon() 메서드 구현 (기본)
- [ ] input.js 키바인딩 변경 (포트 선택)
- [ ] 빈 포트 발사 방지 로직

### Phase 2: 무기 카테고리 검증
- [ ] weapons.js에 port, category 속성 추가
- [ ] PORT_CATEGORIES 상수 정의
- [ ] equipWeapon()에서 카테고리 검증
- [ ] 잘못된 포트 장착 시 에러 처리

### Phase 3: UI 통합
- [ ] HUD에 포트 상태 표시
- [ ] 현재 포트 하이라이트
- [ ] 빈 포트 시각적 표시
- [ ] 무기 이름 표시

### Phase 4: 게임 밸런스 (나중에)
- [ ] 초기 무기 설정 (Port 1만 MISSILE)
- [ ] 무기 구매 시스템 (상점)
- [ ] 무기 가격 시스템
- [ ] 포트 장착/제거 UI

---

## 5. 테스트 시나리오

### 5.1 기본 포트 전환
```
1. 게임 시작 → Port 1 (MISSILE) 선택됨
2. 키 4 누름 → Port 4로 전환 시도
3. Port 4가 비어있음 → currentWeapon = null
4. 스페이스바 → 발사 안 됨 (로그: "No weapon equipped")
5. 키 1 누름 → Port 1 (MISSILE)로 복귀
6. 스페이스바 → MISSILE 발사 ✓
```

### 5.2 무기 장착
```
1. playerTank.equipWeapon(4, 'GUIDED') 실행
2. Port 4에 GUIDED 장착됨
3. 키 4 누름 → GUIDED로 전환 ✓
4. 스페이스바 → GUIDED 발사 ✓
```

### 5.3 무기 제거
```
1. playerTank.equipWeapon(4, null) 실행
2. Port 4 비워짐
3. 키 4 누름 → currentWeapon = null
4. 스페이스바 → 발사 안 됨 ✓
```

### 5.4 Port 1 보호
```
1. playerTank.equipWeapon(1, null) 시도
2. 에러: "Cannot remove MISSILE from Port 1"
3. Port 1은 여전히 MISSILE ✓
```

---

## 6. DOS 원본과의 차이점

### 6.1 유지할 것
- ✅ 7개 포트 시스템
- ✅ 포트별 카테고리 분리
- ✅ 키 1~7 바인딩
- ✅ Port 1 = MISSILE (기본)

### 6.2 나중에 구현
- ⏳ 무기 구매 시스템
- ⏳ 무기 가격
- ⏳ 상점 UI
- ⏳ 경제 시스템 (돈, 점수)

### 6.3 단순화할 것
- ⚠️ Port 6, 7 (Special Defence, Harmless Defense)
  - 게임플레이 복잡도 높음
  - Phase 1에서는 제외하고 나중에 구현

---

## 7. 시스템 개선 (2025-11-08)

### 7.1 equipWeapon() Validation

**문제:**
- 잘못된 무기 타입 전달 시 에러 없이 장착됨
- WEAPON_DATA에 없는 무기도 장착 가능
- 런타임 에러 발생 가능성

**해결:**
```javascript
// Tank.js
equipWeapon(portNumber, weaponType, WEAPON_DATA) {
    // Port validation
    if (portNumber < 1 || portNumber > 7) {
        console.error(`Invalid port number: ${portNumber}`);
        return false;
    }

    // Weapon type validation (신규 추가 2025-11-08)
    if (!WEAPON_DATA[weaponType]) {
        console.error(`Cannot equip unknown weapon: ${weaponType}`);
        return false;
    }

    this.weaponPorts[portNumber] = weaponType;
    this.selectPort(portNumber, WEAPON_DATA);
    return true;
}
```

**효과:**
- 런타임 에러 사전 방지
- 명확한 에러 메시지 제공
- 개발 중 오타 조기 발견

---

### 7.2 Energy Management Consolidation

**문제:**
- 에너지 체크 로직이 input.js에 분산
- Tank 클래스에 에너지 관리 메서드 없음
- 중복 코드 발생

**해결:**
```javascript
// Tank.js - 중앙화된 에너지 관리
/**
 * 무기 발사 가능 여부 확인
 * @param {Object} weaponData - 무기 데이터
 * @returns {boolean} 발사 가능 여부
 */
canFire(weaponData) {
    return this.weaponEnergy >= weaponData.energyCost;
}

/**
 * 무기 에너지 소비
 * @param {Object} weaponData - 무기 데이터
 * @returns {boolean} 성공 여부 (에너지 부족 시 false)
 */
consumeEnergy(weaponData) {
    if (!this.canFire(weaponData)) {
        console.log(`[${this.id}] Not enough energy! (need ${weaponData.energyCost}, have ${this.weaponEnergy.toFixed(1)})`);
        return false;
    }
    this.weaponEnergy -= weaponData.energyCost;
    return true;
}
```

**사용 예시:**
```javascript
// input.js - Before
if (tank.weaponEnergy >= weaponData.energyCost) {
    tank.weaponEnergy -= weaponData.energyCost;
    fireProjectile(tank);
}

// input.js - After
if (tank.consumeEnergy(weaponData)) {
    fireProjectile(tank);
}
```

**효과:**
- 코드 중복 제거 (DRY 원칙)
- 에너지 로직 중앙화 (단일 책임 원칙)
- 유지보수성 향상 (1곳만 수정)
- 일관된 에러 메시지

---

### 7.3 getFirePoints() Optimization

**문제:**
- 모든 변수를 미리 계산 (불필요한 연산)
- CENTER pattern일 때도 perpAngle, sideDistance 계산
- 성능 낭비

**해결:**
```javascript
// input.js - Before (모든 변수 미리 계산)
function getFirePoints(tank, firePattern) {
    const centerDistance = size * 0.75 + 5;
    const perpAngle = tankAngle + Math.PI / 2;
    const sideDistance = size * 0.75;
    const sideSpacing = 6;

    if (firePattern === 'CENTER') {
        // centerDistance만 사용
    }
}

// input.js - After (조건부 변수 계산, 2025-11-08 최적화)
function getFirePoints(tank, firePattern) {
    const points = [];

    // CENTER pattern or ALL pattern includes center point
    if (firePattern === 'CENTER' || firePattern === 'ALL') {
        const centerDistance = size * 0.75 + 5;  // ← CENTER일 때만 계산
        points.push({ x, y });
    }

    // SIDES pattern or ALL pattern includes left and right points
    if (firePattern === 'SIDES' || firePattern === 'ALL') {
        const perpAngle = tankAngle + Math.PI / 2;  // ← SIDES일 때만 계산
        const sideDistance = size * 0.75;
        const sideSpacing = 6;
        points.push({ x: leftX, y: leftY });
        points.push({ x: rightX, y: rightY });
    }

    return points;
}
```

**성능 개선:**
| Fire Pattern | Before | After | 개선 |
|--------------|--------|-------|------|
| CENTER | 5 연산 | 1 연산 | 80% 감소 |
| SIDES | 5 연산 | 4 연산 | 20% 감소 |
| ALL | 5 연산 | 5 연산 | 동일 |

**효과:**
- 불필요한 연산 제거
- 코드 의도 명확화 (패턴별 필요 변수만 계산)
- MISSILE (CENTER) 발사 시 4개 연산 절약

---

### 7.4 개선 사항 요약

| 개선 항목 | 문제 | 해결 | 효과 |
|----------|------|------|------|
| **equipWeapon() Validation** | 잘못된 무기 타입 방지 없음 | WEAPON_DATA 검증 추가 | 런타임 에러 방지 |
| **Energy Management** | 에너지 로직 분산, 중복 | Tank 메서드 중앙화 | 코드 중복 제거 |
| **getFirePoints() Optimization** | 불필요한 변수 계산 | 조건부 변수 계산 | 성능 20-80% 개선 |

**파일 변경:**
- `js/entities/Tank.js`: canFire(), consumeEnergy() 추가, equipWeapon() validation
- `js/systems/input.js`: 에너지 로직 간소화, getFirePoints() 최적화

**관련 문서:**
- [GUIDED_SYSTEM.md](./GUIDED_SYSTEM.md) - 유도 미사일 시스템
- [DEVLOG.md](../DEVLOG.md) - 2025-11-08 개발 내역

---

## 8. 다음 단계

**완료:**
- ✅ Tank.js 수정 (weaponPorts, selectPort, equipWeapon)
- ✅ input.js 수정 (키바인딩 변경)
- ✅ 발사 로직 수정 (빈 포트 체크)
- ✅ 테스트 (포트 전환, 장착, 제거)
- ✅ 시스템 개선 (validation, energy, optimization)

**향후 계획:**
- [ ] 무기 구매 시스템
- [ ] 무기 가격 및 경제 시스템
- [ ] 상점 UI
- [ ] Port 6, 7 특수 방어 무기 구현
