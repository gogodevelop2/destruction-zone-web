// ============================================
// Free For All Mode (개인전)
// ============================================

import GameMode from '../core/GameMode.js';
import { FFA_SPAWNS, TEAM } from '../config/gameModes.js';

/**
 * Free For All Mode (개인전)
 * - 6명이 모두 적
 * - 마지막 1명이 승리
 * - AI는 가장 가까운 적을 공격
 */
export default class FreeForAllMode extends GameMode {
    getName() {
        return 'Free For All';
    }

    getDescription() {
        return '6명 개인전 - 마지막 1명이 승리';
    }

    /**
     * Get spawn positions for all 6 tanks
     * 모두가 적이므로 최대한 멀리 떨어진 코너에 배치
     */
    getSpawnPositions() {
        return FFA_SPAWNS.map(spawn => ({
            x: spawn.x,
            y: spawn.y,
            team: TEAM.NONE  // 팀 없음
        }));
    }

    /**
     * Get AI target (가장 가까운 살아있는 탱크)
     * @param {Tank} aiTank - AI tank
     * @param {Array<Tank>} allTanks - All tanks
     * @returns {Tank|null} Closest alive enemy tank
     */
    getAITarget(aiTank, allTanks) {
        // 살아있는 다른 탱크들 필터링
        const aliveTanks = allTanks.filter(t =>
            t.alive && t !== aiTank
        );

        if (aliveTanks.length === 0) return null;

        // 가장 가까운 탱크 선택
        return this.findClosestTank(aiTank, aliveTanks);
    }

    /**
     * Check win condition (마지막 1명 남았는가?)
     * @param {Array<Tank>} tanks - All tanks
     * @returns {{won: boolean, winner: string|null}}
     */
    checkWinCondition(tanks) {
        const aliveTanks = tanks.filter(t => t.alive);

        if (aliveTanks.length === 1) {
            return {
                won: true,
                winner: aliveTanks[0].id
            };
        }

        if (aliveTanks.length === 0) {
            // 동시에 죽은 경우 (거의 불가능하지만)
            return {
                won: true,
                winner: 'Draw'
            };
        }

        return { won: false, winner: null };
    }
}
