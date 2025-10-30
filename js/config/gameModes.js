// ============================================
// Game Mode Configuration
// ============================================

/**
 * Game mode types
 */
export const GAME_MODE = {
    FREE_FOR_ALL: 'FREE_FOR_ALL',  // 개인전 (6명 모두 적)
    TEAM_BATTLE: 'TEAM_BATTLE'      // 팀전 (3vs3)
};

/**
 * Team definitions
 */
export const TEAM = {
    NONE: 0,   // 개인전 (팀 없음)
    RED: 1,    // 빨간팀
    BLUE: 2    // 파란팀
};

/**
 * Free For All spawn positions (정육각형 배치)
 * 화면 중앙(480, 360)을 기준으로 반지름 330의 정육각형
 */
export const FFA_SPAWNS = [
    { x: 480, y: 30 },        // 1: 상단 (12시) - 360 - 330
    { x: 765.8, y: 195 },     // 2: 우상단 (2시) - 480 + 330*cos(30°), 360 - 330*sin(30°)
    { x: 765.8, y: 525 },     // 3: 우하단 (4시) - 480 + 330*cos(30°), 360 + 330*sin(30°)
    { x: 480, y: 690 },       // 4: 하단 (6시) - 360 + 330
    { x: 194.2, y: 525 },     // 5: 좌하단 (8시) - 480 - 330*cos(30°), 360 + 330*sin(30°)
    { x: 194.2, y: 195 }      // 6: 좌상단 (10시) - 480 - 330*cos(30°), 360 - 330*sin(30°)
];

/**
 * Team Battle spawn positions (3vs3, 좌우 대칭)
 * RED팀은 왼쪽, BLUE팀은 오른쪽 진영
 */
export const TEAM_SPAWNS = {
    RED: [  // 왼쪽 진영 (빨간팀)
        { x: 100, y: 100 },    // 좌상단
        { x: 100, y: 360 },    // 좌중앙
        { x: 100, y: 620 }     // 좌하단
    ],
    BLUE: [ // 오른쪽 진영 (파란팀)
        { x: 860, y: 100 },    // 우상단
        { x: 860, y: 360 },    // 우중앙
        { x: 860, y: 620 }     // 우하단
    ]
};

/**
 * Team colors for Team Battle mode
 */
export const TEAM_COLORS = {
    RED: [
        '#ff0055',  // Red Pink
        '#ff6600',  // Orange
        '#cc0000'   // Dark Red
    ],
    BLUE: [
        '#00ffff',  // Cyan
        '#0088ff',  // Blue
        '#bb88ff'   // Light Purple
    ]
};
