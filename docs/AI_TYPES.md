# AI Types - Original DOS Game Reference

> **출처**: `/dos-original/dzone-v1.3/DZONE.DOC` (Lines 656-680)

---

## 📋 5가지 로봇 AI 타입

### R1 PROTOTYPE
**특징:**
- 느린 사고 속도 (Slow thinkers)
- 긴장하고 불안정함 (Nervous)

**전투 패턴:**
- **타겟 선택**: 가장 낮은 점수를 가진 탱크만 공격
- **행동**: 기본적인 패턴

**구현 포인트:**
- 느린 반응 속도
- 약한 상대만 공격 (약자 타겟팅)
- 불안정한 움직임

---

### R2 AIMER
**특징:**
- 많이 움직이지 않음 (Don't move much)
- 포탑 사격에 능숙함 (Good with turrets)

**전투 패턴:**
- **타겟 선택**: 가장 가까운 탱크 공격
- **행동**: 정지 상태에서 정확한 조준

**구현 포인트:**
- 최소한의 이동
- 높은 조준 정확도
- 거리 기반 타겟팅

---

### R3 SEEKER
**특징:**
- 장거리 전투 회피 (Avoid long range)
- 근거리 빠른 킬을 위해 에너지 보존

**전투 패턴:**
- **타겟 선택**: 가장 가까운 탱크 공격
- **발사 속도**: 빠른 연사 (Faster firing rate)
- **행동**: 짧은 거리에서 에너지 집중 사용

**구현 포인트:**
- 근접 전투 선호
- 거리가 멀면 발사 자제
- 근접 시 공격적 연사

---

### R4 HUNTER
**특징:**
- 리더만 공격 (Only attack leaders)
- 하위 탱크는 무시 (Ignore inferior tanks)

**전투 패턴:**
- **타겟 선택**: 가장 높은 점수를 가진 탱크
- **발사**: 효율적인 발사 패턴 (Efficient firing)
- **행동**: 전략적 타겟 선택

**구현 포인트:**
- 점수 기반 타겟팅 (상위권만 공격)
- 에너지 효율적 사용
- 전략적 우선순위 설정

---

### R5 DESTROYER
**특징:**
- 가장 공격적 (Viciously attack)
- 포탑 집중 사용 (Use turrets heavily)

**전투 패턴:**
- **타겟 선택**: 가장 가까운 탱크를 맹렬히 공격
- **발사**: 효율적이면서도 공격적
- **행동**: 남은 크레딧을 점수 뇌물에 사용

**구현 포인트:**
- 최고 공격성
- 거리 기반 타겟팅 + 즉시 공격
- 에너지/자원 적극 사용

---

## 🎯 AI 타입별 주요 차이점

### 1. 이동 패턴 (Movement Pattern)
- **정지형**: R2 (Aimer)
- **보수적**: R1 (Prototype), R4 (Hunter)
- **공격적**: R3 (Seeker), R5 (Destroyer)

### 2. 타겟 선택 (Target Selection)
- **약자 우선**: R1 (lowest score)
- **거리 기반**: R2, R3, R5 (closest)
- **강자 우선**: R4 (leaders/highest score)

### 3. 발사 행동 (Firing Behavior)
- **보수적**: R1 (nervous), R4 (efficient)
- **거리 조건부**: R3 (short range only)
- **공격적**: R2 (good aim), R5 (viciously)

### 4. 에너지 관리 (Energy Management)
- **효율적**: R4 (efficient)
- **조건부 사용**: R3 (save for short range kills)
- **적극 사용**: R5 (spend excess)

---

## 💡 현재 구현 상태

**현재 AI (js/systems/ai.js):**
- 단일 AI 타입
- 기본 추적/회피 (chase/evade)
- 랜덤 발사

**개선 방향:**
- [ ] 5가지 AI 타입 클래스 구현
- [ ] 타입별 타겟 선택 로직
- [ ] 타입별 이동 패턴
- [ ] 타입별 발사 전략
- [ ] 게임 모드별 AI 타입 분배

---

## 📝 구현 예시 (의사 코드)

```javascript
class AIType {
    constructor(type) {
        this.type = type;  // 'R1', 'R2', 'R3', 'R4', 'R5'
        this.config = AI_TYPE_CONFIGS[type];
    }

    selectTarget(tank, allTanks) {
        switch(this.type) {
            case 'R1': return this.findLowestScore(allTanks);
            case 'R2': return this.findClosest(tank, allTanks);
            case 'R3': return this.findClosest(tank, allTanks);
            case 'R4': return this.findHighestScore(allTanks);
            case 'R5': return this.findClosest(tank, allTanks);
        }
    }

    shouldFire(tank, target, distance) {
        switch(this.type) {
            case 'R1': return this.nervousFiring();
            case 'R2': return this.precisionFiring(target);
            case 'R3': return distance < 200;  // Short range only
            case 'R4': return this.efficientFiring(tank);
            case 'R5': return true;  // Always aggressive
        }
    }

    getMovementStyle() {
        switch(this.type) {
            case 'R1': return 'cautious';
            case 'R2': return 'stationary';
            case 'R3': return 'aggressive_close';
            case 'R4': return 'strategic';
            case 'R5': return 'aggressive';
        }
    }
}
```

---

## 🔗 관련 문서

- **현재 AI 시스템**: `js/systems/ai.js`
- **게임 모드**: `js/modes/FreeForAllMode.js`, `js/modes/TeamBattleMode.js`
- **DOS 원본 문서**: `dos-original/dzone-v1.3/DZONE.DOC`
