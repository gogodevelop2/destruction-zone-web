// ============================================
// Real-time Log Streaming to Python Server
// ============================================
// 브라우저 콘솔 로그 → WebSocket → Python 서버 → Claude

// Socket.IO 연결
let socket = null;
let isConnected = false;

// Socket.IO 스크립트 동적 로딩
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
script.onload = () => {
    // Socket.IO 연결
    socket = io('http://localhost:5001');

    socket.on('connect', () => {
        isConnected = true;
        console.log('[LOG] Connected to log server');
    });

    socket.on('disconnect', () => {
        isConnected = false;
        console.log('[LOG] Disconnected from log server');
    });
};
document.head.appendChild(script);

// 화면에 표시할 디버그 div (기존 유지)
const debugDiv = document.createElement('div');
debugDiv.id = 'debug-log';
debugDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 400px;
    max-height: 300px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 10px;
    padding: 10px;
    z-index: 10000;
    border: 1px solid #0f0;
`;
document.body.appendChild(debugDiv);

const logs = [];
const maxLogs = 50;

// 로그를 서버로 전송하는 함수
function sendLogToServer(message) {
    if (socket && isConnected) {
        socket.emit('game_log', { message });
    }
}

const originalLog = console.log;
console.log = function(...args) {
    originalLog.apply(console, args);

    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    // 중요한 로그만 캡처 (Navmesh, 경로 찾기, 상태 전환)
    if (message.includes('[Navmesh]') ||
        message.includes('-> ATTACK') ||
        message.includes('-> CHASE') ||
        message.includes('-> PATROL') ||
        message.includes('ENEMY DETECTED') ||
        message.includes('Path found') ||
        message.includes('No path found') ||
        message.includes('Waypoint') ||
        message.includes('waypoints reached') ||
        message.includes('Goal is safe') ||
        message.includes('Goal blocked') ||
        message.includes('Goal too close') ||
        message.includes('LOS confirmed') ||
        message.includes('No LOS - waiting')) {

        // 화면에 표시
        logs.push(message);
        if (logs.length > maxLogs) {
            logs.shift();
        }
        debugDiv.innerHTML = logs.join('<br>');
        debugDiv.scrollTop = debugDiv.scrollHeight;

        // 서버로 전송
        sendLogToServer(message);
    }
};
