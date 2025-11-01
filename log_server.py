#!/usr/bin/env python3
"""
Real-time Log Streaming Server
브라우저 → Python 서버 → Claude (파일 기록)

Flask + Socket.IO로 브라우저에서 로그를 받아서 파일에 기록
"""

from flask import Flask, render_template_string
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'destruction-zone-logs'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# 로그 파일 경로
LOG_FILE = 'game_logs.txt'

# HTML 템플릿 (모니터링 페이지)
MONITOR_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Game Log Monitor</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: monospace;
            padding: 20px;
        }
        #logs {
            white-space: pre-wrap;
            font-size: 12px;
        }
        .timestamp {
            color: #0af;
        }
    </style>
</head>
<body>
    <h1>🎮 Destruction Zone - Live Logs</h1>
    <div id="logs"></div>

    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script>
        const socket = io();
        const logsDiv = document.getElementById('logs');

        socket.on('log', (data) => {
            const line = document.createElement('div');
            line.innerHTML = `<span class="timestamp">[${data.timestamp}]</span> ${data.message}`;
            logsDiv.appendChild(line);

            // Auto-scroll
            window.scrollTo(0, document.body.scrollHeight);

            // 최대 1000줄 유지
            if (logsDiv.children.length > 1000) {
                logsDiv.removeChild(logsDiv.firstChild);
            }
        });

        socket.on('connect', () => {
            console.log('Connected to log server');
        });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """모니터링 페이지"""
    return render_template_string(MONITOR_HTML)

@socketio.on('connect')
def handle_connect():
    """클라이언트 연결"""
    print(f'[LOG SERVER] Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    """클라이언트 연결 해제"""
    print(f'[LOG SERVER] Client disconnected')

@socketio.on('game_log')
def handle_game_log(data):
    """게임 로그 수신"""
    timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
    message = data.get('message', '')

    # 파일에 기록
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f'[{timestamp}] {message}\n')

    # 모든 모니터링 클라이언트에게 전달
    emit('log', {
        'timestamp': timestamp,
        'message': message
    }, broadcast=True)

if __name__ == '__main__':
    print('=' * 60)
    print('🎮 Destruction Zone - Log Server')
    print('=' * 60)
    print(f'Log file: {LOG_FILE}')
    print(f'Monitor URL: http://localhost:5001')
    print(f'Game should connect to: ws://localhost:5001')
    print('=' * 60)

    # 로그 파일 초기화
    with open(LOG_FILE, 'w', encoding='utf-8') as f:
        f.write(f'=== Game Log Started at {datetime.now().isoformat()} ===\n')

    socketio.run(app, host='0.0.0.0', port=5001, debug=False, allow_unsafe_werkzeug=True)
