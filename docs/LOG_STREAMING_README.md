# 실시간 로그 스트리밍 시스템

## 개요
브라우저 게임 로그 → WebSocket → Python 서버 → Claude가 실시간 분석

## 구조
```
Browser (게임)
    ↓ [Socket.IO]
Python Server (log_server.py)
    ↓ [파일 기록]
game_logs.txt
    ↓ [Read tool]
Claude (실시간 분석)
```

## 사용 방법

### 1. 로그 서버 시작
```bash
# 가상환경 활성화 + 서버 실행
source venv/bin/activate && python3 log_server.py
```

서버가 시작되면:
- **로그 파일**: `game_logs.txt`
- **모니터 URL**: http://localhost:5001 (웹 브라우저에서 로그 실시간 확인)
- **WebSocket**: ws://localhost:5001 (게임이 연결하는 주소)

### 2. 게임 실행
```bash
# 게임 서버 실행 (다른 터미널)
python3 -m http.server 8000
```

게임 접속: http://localhost:8000

### 3. 로그 확인

**방법 1: 웹 모니터** (인간용)
- http://localhost:5001 접속
- 실시간 로그가 녹색 터미널 스타일로 표시됨

**방법 2: 파일 읽기** (Claude용)
- `game_logs.txt` 파일을 Read tool로 읽으면 됨
- 실시간으로 업데이트되는 로그 확인 가능

## 로그 필터링

현재 캡처되는 로그 (debug-logger.js):
- `[Steering ...]` - Steering Behavior 관련
- `[AI ...]` - AI 상태/행동 관련
- `[Tank ...]` - 탱크 관련

필터 수정이 필요하면 `debug-logger.js` 68번 줄 수정:
```javascript
if (message.includes('[Steering') || message.includes('[AI') || message.includes('[Tank')) {
```

## 디버깅 팁

### 연결 확인
브라우저 콘솔에서:
```
[LOG] Connected to log server
```
이 메시지가 보이면 정상 연결

### 로그 서버 상태 확인
```bash
# 서버 프로세스 확인
ps aux | grep log_server.py

# 로그 파일 확인
tail -f game_logs.txt
```

## 파일 구조

- `log_server.py` - Flask + Socket.IO 서버
- `debug-logger.js` - 브라우저 로그 캡처 + WebSocket 전송
- `game_logs.txt` - 저장된 로그 (실시간 업데이트)
- `requirements.txt` - Python 의존성
- `venv/` - 가상 환경

## 예상 로그 형식

```
[22:35:47.123] [Steering 2] Avoid: (0.45, -0.32) mag: 0.55
[22:35:47.223] [Steering 2] Avoid: (0.52, -0.28) mag: 0.59
[22:35:47.323] [AI 2] State: CHASE -> ATTACK
[22:35:47.423] [Tank 2] Fire projectile at angle 1.23
```

## Claude의 로그 분석 방법

1. `game_logs.txt` 읽기
2. Steering 힘의 패턴 분석:
   - 회피 힘이 진동하는가? (oscillation)
   - 특정 각도에서만 문제가 발생하는가?
   - Seek/Avoid 힘의 균형이 적절한가?
3. 파라미터 튜닝 제안
4. 코드 수정 후 다시 테스트

## 주의사항

- 포트 5001이 이미 사용 중이면 `log_server.py`에서 포트 번호 변경
- 로그 파일이 너무 커지면 주기적으로 삭제/초기화
- 개발용 서버이므로 프로덕션 환경에서는 사용 금지
