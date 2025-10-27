# Destruction Zone Web Edition - 개발 계획서

## 📋 프로젝트 개요

**Destruction Zone**은 1992년 Julian Cochran의 클래식 DOS 게임을 현대적인 웹 게임으로 리메이크한 프로젝트입니다.

- **원본**: DOS 게임 (VGA, 탑다운 뷰 탱크 배틀)
- **목표 버전**: **v1.3 (1994년 6월)** - 최종 공개 버전
- **목표**: 웹 브라우저에서 플레이 가능한 HTML5 게임
- **배포**: GitHub Pages 예정
- **라이선스**: Creative Commons BY-NC 4.0

### 📚 원본 게임 자료

프로젝트에는 두 버전의 원본 DOS 게임 파일이 포함되어 있습니다:

#### `/dzone-v1.3/` 폴더 ⭐ **개발 기준 버전**
**Destruction Zone v1.3 (1994년 6월)** - 최종 공개 버전
- `DZONE.DOC` (32KB) - v1.3 매뉴얼 (모든 무기, 탱크, 가격 정보)
- `DZONE.EXE` (125KB) - v1.3 실행 파일
- `DZONE.GDA` (77KB) - 게임 그래픽
- `SHOP.GDA` (73KB) - 레이트레이싱 상점 화면
- `SVGA16.GDA` (6.6KB) - SuperVGA 지원 (800x600, 1024x768)
- `IMPROVED.TXT` - 버전별 변경 사항 문서
- `SETUP.EXE` (19KB) - 설정 프로그램

#### `/dzone-v1.0/` 폴더 (참고용)
**Destruction Zone v1.0 (1993년 1월)** - 초기 버전
- `DZONE.DOC` (28KB) - v1.0 매뉴얼
- `DZONE.EXE` (89KB) - v1.0 실행 파일
- `DTITLE.GDA` (126KB) - 타이틀 화면

**참고**: 이 프로젝트의 모든 게임 데이터(무기 스탯, 탱크 가격, 업그레이드 시스템)는 **`/dzone-v1.3/DZONE.DOC`** 매뉴얼을 기준으로 합니다.

---

## 🎨 원본 게임 디자인 사양 (DZONE.DOC 기준)

### 그래픽 및 시각 디자인
- **뷰 방식**: 탑다운 뷰 (위에서 내려다보는 시점)
- **탱크 디자인**:
  - 3점 벡터 이미지로 표현되는 삼각형 탱크
  - 3개의 거대한 실린더로 구성 (내부에 연료가 보임)
  - 방사능 연료로 인한 고유 색상 글로우 효과
  - 체력에 따라 빛의 밝기 변화
- **배경**: 매 라운드마다 랜덤 생성
- **그래픽**: VGA/EGA 그래픽 (320x200 또는 640x480)

### 웹 버전 구현 상태
- ✅ 탑다운 뷰 구현
- ✅ 삼각형 탱크 (3점 벡터)
- ✅ 3개 실린더 표현 (3개의 작은 사각형)
- ✅ 탱크별 고유 색상 글로우
- ✅ 체력 비례 글로우 강도
- ✅ 우주 정거장 느낌의 배경 (별 + 그리드)

---

## 🎯 핵심 게임 메커니즘 (원본 매뉴얼 페이지 2-3)

### 게임 배경 스토리
은하계 어딘가에 떠있는 우주 정거장 "Dark Zone"에서 펼쳐지는 전투 게임. 도전자들이 정거장에 도착하면 불을 켜서 "Destruction Zone"으로 변신합니다.

### 핵심 게임 플레이 요소
1. **삼각형 호버 탱크**: 3개의 거대한 실린더로 구성, 전기력으로 바닥과 천장 사이에 떠있음
2. **방사능 연료 시스템**:
   - 탱크는 고유 색상으로 빛남
   - 무기 에너지 소모 시 빛이 어두워짐
   - Zone의 빛을 흡수하여 에너지 회복 (자동 재충전)
3. **라운드 기반 전투**:
   - 탱크 파괴 시 텔레포트로 탈출 (컨트롤러는 무사)
   - 모든 플레이어가 생존하여 다음 라운드 계속
4. **3라운드마다 상점**: 획득한 돈으로 무기와 도구 구매
5. **로봇 탱크**: 플레이어 부족 시 AI 로봇이 참가

---

## 🎮 게임 시스템 (v1.3 매뉴얼 기준)

### 7개 무기 포트 (총 31종)
각각 다른 용도의 무기 시스템:

#### **Port 1: Front Fire (6종)**
전방 공격 무기
1. MISSILE (4/4) - 기본 무기, 가격 2
2. DOUBLE MISSILE (6/4) - 가격 100
3. TRIPLE MISSILE (9/5) - 가격 600
4. BEAM LASER (6/6) - 가격 150
5. POWER LASER (12/6) - 가격 1650
6. TRI-STRIKER (18/6) - 가격 3350

#### **Port 2: Blasters (5종)**
더블 파이어 시스템 (발사 후 재발사로 분열)
1. BLASTER (90/23) - 가격 650
2. GUIDE BLASTER (90/28) - 유도 탄두, 가격 1200
3. BLAST GUIDER (70/34) - 유도 미사일로 분열, 가격 2500
4. NUKE BLASTER (168/40) - 대형 블래스터, 가격 3400
5. SWIRL BLASTER (48/20) - 6개 스월러로 분열, 가격 3800 🆕

#### **Port 3: Surprise Attack (5종)**
후방 및 특수 공격
1. REAR DOUBLE (8/5) - 후방 2발, 가격 130
2. REAR GUIDED (8/5) - 후방 유도 2발, 가격 650
3. REAR CHAOS (14/5) - 소형 유도탄 다수 🆕 (TWIN SEEKERS 대체), 가격 1000
4. TELEPORT FOE (0/4) - 적 강제 텔레포트, 가격 1600
5. REAR TRIPLE (15/6) - 후방 3발, 가격 2200

#### **Port 4: Special Front Fire (6종)**
브레이커 및 유도 무기
1. TRI BREAKER (21/12) - 3개로 분열, 가격 250
2. GUIDED (6/6) - 기본 유도탄, 가격 400
3. QUINT BREAKER (30/12) - 5개로 분열, 가격 1350
4. QUINT GUIDER (30/20) - 5개 유도탄, 가격 2250
5. OCTO BREAKER (48/16) - 8개로 분열 🆕, 가격 4000
6. SPARK FIENDS (16/9) - 절대 빗나가지 않는 유도탄, 가격 5400

#### **Port 5: Aggressive Defence (2종)**
방어 및 폭탄
1. SWIRLER (8/3) - 탱크 주위 회전, 가격 225
2. ELECTRO BUDS (15/4) - 느린 유도탄 3발, 가격 800
3. NORMAL BOMB (100/25) - 일반 폭탄, 가격 500
4. DEATH BOMB (350/40) - 강력한 폭탄, 가격 3250

#### **Port 6: Special Defence (4종)**
특수 방어 시스템
1. DEATH TOUCH (15/7) - 접촉 시 대미지, 가격 350
2. DEFLECTOR (0/0) - 미사일 반사 🆕 (ECM HACKER 대체), 가격 2200
3. ECM WIPER (0/4) - 모든 미사일 파괴, 가격 800
4. CONFUSOR (0/0) - 유도탄 무시, 가격 480

#### **Port 7: Harmless Defense (3종)**
보조 및 회복
1. HEALER (10/10) - 에너지→쉴드 변환, 가격 350
2. GLOW SHIELD (0/15) - 완전 방어, 가격 800
3. FADE SHIELD (0/20) - 투명화, 가격 1200
4. TELEPORT SELF (0/4) - 자기 텔레포트, 가격 2000

### 5종류 탱크 (v1.3 기준)
탱크별 스탯: Shield(Armor) / Rotation / Speed

1. **STANDARD** (1000 CR)
   - 스탯: SH 3(4) / ROT 4(6) / SP 2(3)
   - 특징: 기본 균형형, 가장 큰 사이즈

2. **ROTRA I** (1850 CR)
   - 스탯: SH 4(6) / ROT 6(9) / SP 2(3)
   - 특징: 빠른 회전, 향상된 방어력

3. **ROTRA II** (2450 CR)
   - 스탯: SH 2(3) / ROT 8(12) / SP 3(4)
   - 특징: 소형 고기동, 낮은 방어력

4. **OPEC I** (3400 CR)
   - 스탯: SH 4(6) / ROT 6(9) / SP 3(4)
   - 특징: 빠른 이동, 우수한 방어력

5. **OPEC II** (4750 CR)
   - 스탯: SH 5(7) / ROT 7(10) / SP 3(4)
   - 특징: 최고 방어력, 빠른 회전

**참고**: 괄호 안 숫자는 업그레이드 후 스탯

### 업그레이드 시스템
각 업그레이드 비용 = 해당 탱크 가격 (탱크 변경 시 업그레이드 소멸)

- **Speed Upgrade**: 전후진 속도 증가
- **Rotation Upgrade**: 회전 속도 증가
- **Armor Upgrade**: 쉴드 용량 증가

### AI 로봇 시스템 (v1.3 - 완전 재프로그래밍)
5종 로봇, 각각 고유 성격

1. **R1 PROTOTYPE**: 신경질적, 최저 점수 탱크만 공격
2. **R2 AIMER**: 정지 사격 선호, 포탑 사용 능숙, 최근접 탱크 공격
3. **R3 SEEKER**: 근거리 전문, 빠른 발사, 포탑 사용 불가, 최근접 탱크 추적
4. **R4 HUNTER**: 최고 점수 탱크만 공격, 포탑 사용, 선택적 전투
5. **R5 DESTROYER** 🆕: 사거리 내 모든 것 파괴, 포탑 애호가, SCORE BRIBE 사용

### 도구 시스템 (v1.3 기준)
11종 도구 아이템

1. **RED DOT** (150 CR) - 발사 불가 시 빨간 점 표시
2. **TANK TURRET** 🆕 (1400 CR) - 포탑 설치 (무기 독립 회전)
3. **SHOPPING CARD** (2200 CR) - 모든 아이템 25% 할인
4. **SCORE BRIBE** (2500 CR) - 크레딧→점수 변환
5. **RAPID FIRE** (450 CR) - Port 1 연사 가능
6. **AUTO HEAL** 🆕 (4800 CR) - 쉴드 자동 재충전 (라운드 시작 30초)
7. **LARGER DEATH** 🆕 (800 CR) - 폭발 데미지 20배
8. **FAST RECHARGE** 🆕 (5300 CR) - 무기 에너지 재충전 50% 증가
9. **FUEL UPGRADE** (8400 CR) - 무기 데미지 66% 증가

**v1.0에서 제거된 도구**:
- ❌ FUSION HEALER
- ❌ ELECTRON BOLT
- ❌ SELF DESTRUCT

### 게임 모드
- **HOSTILE MODE**: 개인전 (모두가 적)
- **TEAMS MODE**: 팀전 (팀별 협력)

---

## 📋 전체 개발 로드맵

### Phase 1: 핵심 게임플레이 완성 ✅
**목표**: 완전히 플레이 가능한 1vs1 전투 게임

#### 1.1 기본 인프라 ✅
- 프로젝트 구조 설계
- HTML5 Canvas 게임 화면
- CSS 스타일링 (레트로 느낌)
- 모듈화된 JavaScript 아키텍처

#### 1.2 코어 시스템 ✅
- 자체 물리 엔진 (2D 벡터, 충돌 감지)
- 렌더링 시스템 (Canvas 2D)
- 입력 시스템 (키보드, 멀티플레이어)
- 상태 관리 시스템

#### 1.3 전투 시스템 ✅
- 탱크 시스템 (물리 기반 이동, 체력, 에너지)
- 무기 시스템 (Port 1: 6종, Port 2: 4종)
- 충돌 시스템 (탱크-탱크, 프로젝타일-탱크)
- 폭발 효과 및 범위 데미지

#### 1.4 라운드 시스템 ✅
- 5분 라운드 타이머 (테스트용 30초)
- 승리 조건 (킬, 타임아웃)
- 점수 및 보상 시스템
- 라운드 진행 관리

#### 1.5 상점 시스템 ✅
- 3라운드마다 상점 자동 오픈
- 무기/탱크/업그레이드 구매
- 스코어 기반 가격 증가 (10점당 5%)
- 인벤토리 관리

#### 1.6 무기 적용 시스템 ✅
- 구매한 무기를 탱크에 로드
- 구매한 무기만 순환
- 업그레이드 실제 스탯 적용

---

### Phase 2: 물리 엔진 및 고급 기능 (현재 진행 중)
**목표**: Matter.js 물리 엔진 통합 및 완전한 무기 시스템

#### 2.1 Matter.js 물리 엔진 전환 🚧
**목표**: 자체 물리 엔진을 Matter.js로 전환하여 더 정교한 게임 구성

- [ ] **Phase 1: 준비 및 설정** (1일)
  - [ ] Matter.js 라이브러리 추가 (`js/lib/matter.min.js`)
  - [ ] Physics 클래스를 Matter.js 래퍼로 전환
  - [ ] Matter 엔진 초기화 (중력 제거, 경계 벽 생성)
  - [ ] 디버그 렌더링 시스템 추가

- [ ] **Phase 2: 탱크 물리 전환** (1일)
  - [ ] Tank 클래스에 Matter.js Body 통합
  - [ ] 이동/회전 로직을 Matter.js API로 전환
  - [ ] 탱크-탱크 충돌을 Matter.js 이벤트로 처리
  - [ ] 충돌 시 충격 데미지 계산

- [ ] **Phase 3: 프로젝타일 물리 전환** (1일)
  - [ ] Projectile 클래스에 Matter.js Body 통합
  - [ ] 프로젝타일-탱크 충돌 감지 개선
  - [ ] 벽 경계 충돌 및 튕김 처리
  - [ ] 빠른 프로젝타일 관통 문제 해결

- [ ] **Phase 4: 테스트 및 최적화** (0.5일)
  - [ ] 모든 무기 타입 테스트 (Port 1-2)
  - [ ] 60 FPS 성능 유지 확인
  - [ ] 물리 정확도 검증 (벽 통과 방지)
  - [ ] 기존 자체 Physics 클래스 제거

- [ ] **Phase 5: 고급 물리 기능** (선택 사항)
  - [ ] 폭발 효과 물리 개선 (파편 효과)
  - [ ] 탱크 충돌 시 자연스러운 반발력
  - [ ] 파괴 가능한 장애물 준비

**Matter.js 선택 이유**:
- ✅ 2D 게임에 최적화된 가벼운 물리 엔진 (87KB)
- ✅ Canvas 렌더러 내장 (디버그 시각화)
- ✅ 정확한 폴리곤 충돌 감지 (삼각형 탱크)
- ✅ 자연스러운 물리 기반 이동 및 회전
- ✅ 활발한 커뮤니티 및 풍부한 문서

**예상 통합 시간**: 3.5일

#### 2.2 고급 AI 시스템 (v1.3 - 완전 재프로그래밍)
**현재 구현**: R1 PROTOTYPE (기본 AI)
**남은 작업**: R2-R5 (4종) + 고급 AI 행동

- [ ] **R2 AIMER**: 정지 사격 스타일
  - 움직임 최소화, 포탑 사용 능숙
  - 최근접 탱크 조준
  - 장거리 사격 선호

- [ ] **R3 SEEKER**: 근거리 전투 전문
  - 최근접 탱크 추적
  - 빠른 발사 속도
  - 포탑 사용 불가 (특징)
  - 단거리 에너지 집중

- [ ] **R4 HUNTER**: 선택적 공격
  - 최고 점수 탱크만 공격
  - 포탑 사용 능숙
  - 효율적 발사로 크레딧 축적
  - 약자 무시 (자존심 높음)

- [ ] **R5 DESTROYER** 🆕: 무차별 공격
  - 사거리 내 모든 적 공격
  - 포탑 애호가
  - 크레딧→SCORE BRIBE 변환
  - 최종 점수 경쟁력 높음

- [ ] **고급 AI 행동**:
  - 포탑 시스템 활용 (R2, R4, R5)
  - 무기 포트 선택 전략
  - 상점 이용 로직
  - 도구 아이템 구매 및 사용

#### 2.3 무기 시스템 확장 (v1.3 매뉴얼 기준 - 총 31종)
**현재 구현**: Port 1 (6종), Port 2 일부 (BLASTER만 작동)
**남은 작업**: Port 2-7 (25종)

- [ ] **Port 2 완성**: GUIDE BLASTER, BLAST GUIDER, NUKE BLASTER, SWIRL BLASTER (4종)
  - [ ] GUIDE BLASTER: 유도 탄두 블래스터
  - [ ] BLAST GUIDER: 유도 미사일로 분열
  - [ ] NUKE BLASTER: 대형 블래스터
  - [ ] SWIRL BLASTER: 6개 스월러 분열 🆕

- [ ] **Port 3**: REAR DOUBLE, REAR GUIDED, REAR CHAOS, TELEPORT FOE, REAR TRIPLE (5종)
  - [ ] REAR DOUBLE: 후방 2발
  - [ ] REAR GUIDED: 후방 유도 2발
  - [ ] REAR CHAOS: 소형 유도탄 다수 🆕 (TWIN SEEKERS 대체)
  - [ ] TELEPORT FOE: 적 강제 텔레포트
  - [ ] REAR TRIPLE: 후방 3발

- [ ] **Port 4**: TRI BREAKER, GUIDED, QUINT BREAKER, QUINT GUIDER, OCTO BREAKER, SPARK FIENDS (6종)
  - [ ] TRI BREAKER: 3개 분열
  - [ ] GUIDED: 기본 유도탄
  - [ ] QUINT BREAKER: 5개 분열
  - [ ] QUINT GUIDER: 5개 유도탄
  - [ ] OCTO BREAKER: 8개 분열 🆕
  - [ ] SPARK FIENDS: 절대 명중 🆕

- [ ] **Port 5**: SWIRLER, ELECTRO BUDS, NORMAL BOMB, DEATH BOMB (4종)
  - [ ] SWIRLER: 탱크 주위 회전
  - [ ] ELECTRO BUDS: 느린 유도탄 3발
  - [ ] NORMAL BOMB: 일반 폭탄
  - [ ] DEATH BOMB: 강력한 폭탄

- [ ] **Port 6**: DEATH TOUCH, DEFLECTOR, ECM WIPER, CONFUSOR (4종)
  - [ ] DEATH TOUCH: 접촉 데미지
  - [ ] DEFLECTOR: 미사일 반사 🆕 (ECM HACKER 대체)
  - [ ] ECM WIPER: 전체 미사일 파괴
  - [ ] CONFUSOR: 유도탄 무시

- [ ] **Port 7**: HEALER, GLOW SHIELD, FADE SHIELD, TELEPORT SELF (4종)
  - [ ] HEALER: 에너지→쉴드 변환
  - [ ] GLOW SHIELD: 완전 방어
  - [ ] FADE SHIELD: 투명화
  - [ ] TELEPORT SELF: 자기 텔레포트

#### 2.4 도구 시스템 (v1.3 기준 - 9종)
- [ ] RED DOT (150 CR) - 발사 불가 표시
- [ ] TANK TURRET 🆕 (1400 CR) - 포탑 시스템 (무기 독립 회전)
- [ ] SHOPPING CARD (2200 CR) - 25% 할인
- [ ] SCORE BRIBE (2500 CR) - 크레딧→점수 변환
- [ ] RAPID FIRE (450 CR) - Port 1 연사
- [ ] AUTO HEAL 🆕 (4800 CR) - 쉴드 자동 재충전
- [ ] LARGER DEATH 🆕 (800 CR) - 폭발 데미지 20배
- [ ] FAST RECHARGE 🆕 (5300 CR) - 에너지 재충전 50% 증가
- [ ] FUEL UPGRADE (8400 CR) - 데미지 66% 증가

---

### Phase 3: 현대적 개선사항 (우선순위 낮음)
**목표**: 현대 웹 게임 표준 기능

#### 3.1 사용자 경험 개선
- [ ] 현대적 플레이어 등록 (이름, 프로필)
- [ ] 반응형 UI (모바일 지원, 터치 컨트롤)
- [ ] 사운드 시스템 (효과음, 배경음악)
- [ ] 설정 메뉴 (키 설정, 볼륨, 그래픽)

#### 3.2 멀티플레이어
- [ ] 로컬 멀티플레이어 (2-3명 동시)
- [ ] 온라인 멀티플레이어 (WebSocket 기반)

#### 3.3 추가 기능
- [ ] 저장/로드 시스템
- [ ] 통계 및 최고 점수
- [ ] 리플레이 기능
- [ ] 팀 모드 구현

---

## 🗂️ 파일 구조

```
destruction-zone-web/
├── index.html              # 메인 페이지
├── PLAN.md                 # 이 문서 (개발 계획서)
├── CHANGELOG.md            # 개발 로그 (완료 작업 기록)
├── css/                    # 스타일시트
│   ├── main.css           # 메인 스타일
│   ├── game.css           # 게임 화면
│   └── ui.css             # UI 컴포넌트
├── js/
│   ├── lib/               # 외부 라이브러리
│   │   └── matter.min.js  # 🆕 Matter.js 물리 엔진 (Phase 2.1)
│   ├── core/              # 코어 시스템
│   │   ├── engine.js      # 게임 엔진
│   │   ├── renderer.js    # 렌더링 (Matter.js 디버그 통합)
│   │   ├── physics.js     # 🔄 Matter.js 래퍼로 전환 예정
│   │   ├── input.js       # 입력 처리
│   │   └── state.js       # 상태 관리
│   ├── entities/          # 게임 엔티티
│   │   ├── tank.js        # 🔄 Matter.js Body 통합 예정
│   │   ├── weapon.js      # 무기 시스템
│   │   ├── projectile.js  # 🔄 Matter.js Body 통합 예정
│   │   └── explosion.js   # 폭발 효과
│   ├── systems/           # 게임 시스템
│   │   ├── shop.js        # 상점
│   │   ├── scoring.js     # 점수 시스템
│   │   ├── ai.js          # AI 시스템
│   │   └── collision.js   # 🔄 Matter.js 이벤트 기반으로 재작성 예정
│   ├── ui/                # UI 시스템
│   │   ├── menu.js        # 메뉴
│   │   ├── hud.js         # HUD
│   │   ├── registration.js # 플레이어 등록
│   │   └── scoreboard.js  # 스코어보드
│   ├── config/            # 설정 파일
│   │   ├── game-config.js # 게임 설정
│   │   ├── tank-data.js   # 탱크 데이터
│   │   └── weapon-data.js # 무기 데이터
│   └── main.js            # 메인 진입점
├── assets/                # 게임 에셋 (향후)
├── dzone-v1.3/            # 원본 DOS 게임 v1.3 (개발 기준) ⭐
│   ├── DZONE.DOC         # v1.3 매뉴얼
│   ├── DZONE.EXE         # v1.3 실행 파일
│   ├── SHOP.GDA          # 레이트레이싱 상점 화면
│   ├── SVGA16.GDA        # SuperVGA 지원
│   ├── IMPROVED.TXT      # 버전 변경 사항
│   └── *.GDA             # 그래픽 데이터
├── dzone-v1.0/            # 원본 DOS 게임 v1.0 (참고용)
│   ├── DZONE.DOC         # v1.0 매뉴얼
│   ├── DZONE.EXE         # v1.0 실행 파일
│   └── *.GDA             # 그래픽 데이터
```

**Matter.js 통합 후 변경 파일**:
- 🆕 `js/lib/matter.min.js` - Matter.js 라이브러리 추가
- 🔄 `js/core/physics.js` - Matter.js 래퍼로 전환
- 🔄 `js/core/renderer.js` - 디버그 렌더링 추가
- 🔄 `js/entities/tank.js` - Matter Body 통합
- 🔄 `js/entities/projectile.js` - Matter Body 통합
- 🔄 `js/systems/collision.js` - 이벤트 기반으로 재작성

---

## 🎮 조작법

### 키보드 컨트롤 (macOS 최적화)
- **방향키**: 탱크 이동/회전
- **A키**: 무기 변경 (현재 포트 내 순환)
- **S키**: Port 1 ↔ Port 2 전환
- **D키**: 무기 발사
- **ESC**: 일시정지
- **T키**: 디버그 정보 (F12 콘솔)

---

## 📖 원본 게임 데이터 참조 가이드

이 프로젝트의 모든 게임 밸런스와 데이터는 **v1.3 매뉴얼**을 기준으로 합니다:

### v1.3 매뉴얼 참조 ⭐ **개발 기준**
- **위치**: `/dzone-v1.3/DZONE.DOC` (32KB, 1994년 7월)
- **무기 데이터**: 페이지 8-10
  - Port 1-7 전체 무기 (31종)
  - 데미지/에너지, 가격, 상세 설명
- **탱크 데이터**: 페이지 7
  - 5종 탱크의 스탯, 가격, 특성 (업그레이드 포함)
- **AI 로봇**: 페이지 12
  - R1-R5 로봇의 전투 스타일 (v1.2에서 완전 재프로그래밍)
- **도구 시스템**: 페이지 11
  - 9종 도구 아이템 (포탑 포함)
- **점수 시스템**: 페이지 5-6
  - 랭킹 기반 가격 시스템

### 버전 변경 사항
- **변경 사항 문서**: `/dzone-v1.3/IMPROVED.TXT`
  - v1.0 → v1.1 → v1.2 → v1.3 진화 과정
  - 제거/추가된 무기 목록
  - AI 재프로그래밍 내역

**원본 게임 실행**:
- v1.3 (권장): DOSBox로 `/dzone-v1.3/DZONE.EXE` 실행
- v1.0 (참고용): DOSBox로 `/dzone-v1.0/DZONE.EXE` 실행

---

## 🔧 개발 환경

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Graphics**: Canvas 2D API
- **Physics**: 자체 개발 2D 물리 엔진
- **Build**: 없음 (순수 웹 기술)

### 개발 도구
- **IDE**: Claude Code
- **Version Control**: Git
- **Hosting**: GitHub Pages (예정)
- **Testing**: 브라우저 개발자 도구

### 로컬 실행
```bash
cd /Users/joejeon/documents/destruction-zone-web
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

---

## 📝 설계 결정사항

1. **물리 엔진 전환 (2025-10-27)**:
   - ~~자체 물리 엔진~~ → **Matter.js 채택**
   - 이유: 더 정교한 충돌 감지, 자연스러운 물리 시뮬레이션, 디버깅 도구
   - Planck.js 대신 Matter.js 선택: 낮은 러닝 커브, Canvas 렌더러 내장, 충분한 성능
2. **모듈형 아키텍처**: 기능별 파일 분리로 디버깅 편의성
3. **원본 충실도**: 게임 메커니즘은 원본 그대로, UI만 현대화
4. **macOS 친화적 조작**: Home/PageUp 대신 A/D키 사용
5. **Canvas 2D 사용**: WebGL 대신 간단한 2D Canvas로 원본 느낌 재현

---

## 🎯 다음 개발 우선순위

1. **Matter.js 물리 엔진 전환** (3.5일 예상) ⬅️ **현재 작업**
   - Phase 1: 준비 및 설정
   - Phase 2: 탱크 물리 전환
   - Phase 3: 프로젝타일 물리 전환
   - Phase 4: 테스트 및 최적화
   - Phase 5: 고급 물리 기능 (선택)

2. **Port 2-7 무기 구현** (v1.3 기준 - 25종)
   - Port 2 완성: 4종 (GUIDE BLASTER, BLAST GUIDER, NUKE BLASTER, SWIRL BLASTER)
   - Port 3: 5종 (REAR 시리즈 + TELEPORT FOE + REAR CHAOS)
   - Port 4: 6종 (BREAKER 시리즈 + GUIDED + SPARK FIENDS + OCTO BREAKER)
   - Port 5: 4종 (SWIRLER, ELECTRO BUDS, BOMBS)
   - Port 6: 4종 (DEATH TOUCH, DEFLECTOR, ECM 시리즈)
   - Port 7: 4종 (HEALER, SHIELDS, TELEPORT SELF)

3. **포탑 시스템** 🆕
   - 무기 독립 회전 메커니즘
   - 포탑 설치/제거 시스템
   - AI 포탑 활용 로직

4. **고급 AI 로봇** (R2-R5)
   - R2 AIMER: 정지 사격 스타일
   - R3 SEEKER: 근거리 전문
   - R4 HUNTER: 선택적 공격
   - R5 DESTROYER: 무차별 공격

5. **도구 시스템** (9종)
   - RED DOT, TANK TURRET, SHOPPING CARD, SCORE BRIBE
   - RAPID FIRE, AUTO HEAL, LARGER DEATH, FAST RECHARGE, FUEL UPGRADE

6. **기타**:
   - 팀 모드
   - 사운드 시스템
   - 미션 모드 (8개 미션)

---

*📅 마지막 업데이트: 2025-10-27*
*🤖 이 문서는 Claude Code로 생성되었습니다.*
