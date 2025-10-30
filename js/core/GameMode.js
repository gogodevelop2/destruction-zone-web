// ============================================
// GameMode - Abstract Base Class
// ============================================

/**
 * Abstract GameMode class
 * 모든 게임 모드가 상속받아야 하는 기본 클래스
 *
 * 각 모드는 다음을 정의해야 함:
 * - 스폰 위치 (spawn positions)
 * - AI 타겟 선택 로직 (target selection)
 * - 승리 조건 (win condition)
 */
export default class GameMode {
    /**
     * @param {Game} game - Game instance
     */
    constructor(game) {
        this.game = game;
    }

    /**
     * Get spawn positions for all tanks
     * @returns {Array<{x: number, y: number, team: number}>} Spawn positions with team info
     */
    getSpawnPositions() {
        throw new Error('getSpawnPositions() must be implemented by subclass');
    }

    /**
     * Get AI target for a given tank
     * @param {Tank} aiTank - AI controlled tank
     * @param {Array<Tank>} allTanks - All tanks in game
     * @returns {Tank|null} Target tank, or null if no valid target
     */
    getAITarget(aiTank, allTanks) {
        throw new Error('getAITarget() must be implemented by subclass');
    }

    /**
     * Check win condition
     * @param {Array<Tank>} tanks - All tanks in game
     * @returns {{won: boolean, winner: string|null}} Win state and winner
     */
    checkWinCondition(tanks) {
        throw new Error('checkWinCondition() must be implemented by subclass');
    }

    /**
     * Get mode name for display
     * @returns {string}
     */
    getName() {
        throw new Error('getName() must be implemented by subclass');
    }

    /**
     * Get mode description
     * @returns {string}
     */
    getDescription() {
        throw new Error('getDescription() must be implemented by subclass');
    }

    /**
     * Helper: Calculate distance between two tanks
     * @param {Tank} tank1
     * @param {Tank} tank2
     * @returns {number} Distance in pixels
     */
    getDistance(tank1, tank2) {
        const dx = tank1.body.position.x - tank2.body.position.x;
        const dy = tank1.body.position.y - tank2.body.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Helper: Find closest tank from a list
     * @param {Tank} fromTank - Reference tank
     * @param {Array<Tank>} tanks - Candidate tanks
     * @returns {Tank|null} Closest tank, or null if list is empty
     */
    findClosestTank(fromTank, tanks) {
        if (tanks.length === 0) return null;

        let closestTank = tanks[0];
        let minDistance = this.getDistance(fromTank, closestTank);

        for (let i = 1; i < tanks.length; i++) {
            const distance = this.getDistance(fromTank, tanks[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestTank = tanks[i];
            }
        }

        return closestTank;
    }
}
