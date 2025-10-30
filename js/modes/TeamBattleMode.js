// ============================================
// Team Battle Mode (3vs3 팀전)
// ============================================

import GameMode from '../core/GameMode.js';
import { TEAM_SPAWNS, TEAM } from '../config/gameModes.js';

/**
 * Team Battle Mode (3vs3 팀전)
 * - RED팀 vs BLUE팀
 * - 한 팀이 전멸하면 다른 팀 승리
 * - AI는 가장 가까운 적팀 탱크를 공격
 */
export default class TeamBattleMode extends GameMode {
    getName() {
        return 'Team Battle (3vs3)';
    }

    getDescription() {
        return '3vs3 팀전 - RED팀 vs BLUE팀';
    }

    /**
     * Get spawn positions for 3vs3 team battle
     * RED팀 3명은 왼쪽, BLUE팀 3명은 오른쪽 배치
     */
    getSpawnPositions() {
        const spawns = [];

        // RED팀 스폰 (왼쪽 진영 3명)
        TEAM_SPAWNS.RED.forEach(spawn => {
            spawns.push({
                x: spawn.x,
                y: spawn.y,
                team: TEAM.RED
            });
        });

        // BLUE팀 스폰 (오른쪽 진영 3명)
        TEAM_SPAWNS.BLUE.forEach(spawn => {
            spawns.push({
                x: spawn.x,
                y: spawn.y,
                team: TEAM.BLUE
            });
        });

        return spawns;
    }

    /**
     * Get AI target (가장 가까운 적팀 탱크)
     * @param {Tank} aiTank - AI tank
     * @param {Array<Tank>} allTanks - All tanks
     * @returns {Tank|null} Closest alive enemy tank
     */
    getAITarget(aiTank, allTanks) {
        // 적팀 탱크들만 필터링 (살아있고, 자신이 아니고, 다른 팀)
        const enemyTanks = allTanks.filter(t =>
            t.alive && t !== aiTank && t.team !== aiTank.team
        );

        if (enemyTanks.length === 0) return null;

        // 가장 가까운 적 탱크 선택
        return this.findClosestTank(aiTank, enemyTanks);
    }

    /**
     * Check win condition (한 팀이 전멸했는가?)
     * @param {Array<Tank>} tanks - All tanks
     * @returns {{won: boolean, winner: string|null}}
     */
    checkWinCondition(tanks) {
        const redAlive = tanks.filter(t => t.alive && t.team === TEAM.RED);
        const blueAlive = tanks.filter(t => t.alive && t.team === TEAM.BLUE);

        // 양팀 모두 전멸 (동시에 죽은 경우)
        if (redAlive.length === 0 && blueAlive.length === 0) {
            return {
                won: true,
                winner: 'Draw'
            };
        }

        // RED팀 전멸 → BLUE팀 승리
        if (redAlive.length === 0) {
            return {
                won: true,
                winner: 'BLUE Team'
            };
        }

        // BLUE팀 전멸 → RED팀 승리
        if (blueAlive.length === 0) {
            return {
                won: true,
                winner: 'RED Team'
            };
        }

        // 아직 양팀 모두 살아있음
        return { won: false, winner: null };
    }
}
