// ============================================
// Guided Weapon System
// ============================================

import { normalizeAngle } from '../utils/math.js';

/**
 * GuidedSystem - 유도 무기 관리 시스템
 *
 * RESPONSIBILITIES:
 * - 유도 미사일의 타겟 탐지
 * - 타겟 선택 로직 (NEAREST, LOCKED, SMART)
 * - 타겟 업데이트 주기 관리
 *
 * DOES NOT HANDLE:
 * - 방향 조정 로직 (Phase 1-3에서 구현 예정)
 * - Projectile 생성/파괴
 */
export class GuidedSystem {
    /**
     * @param {Object} game - Game 인스턴스 (tanks 배열 접근용)
     */
    constructor(game) {
        this.game = game;
    }

    /**
     * 유도 미사일 업데이트
     * @param {Projectile} projectile - 업데이트할 발사체
     * @param {number} deltaTime - 프레임 시간 (초)
     */
    updateProjectile(projectile, deltaTime) {
        if (!projectile.isGuided || !projectile.active) {
            return;
        }

        const config = projectile.guidedConfig;
        if (!config) {
            return;
        }

        // 타겟 업데이트 카운터 증가
        projectile.targetUpdateCounter++;

        // updateInterval마다 타겟 재탐색
        if (projectile.targetUpdateCounter >= config.updateInterval) {
            projectile.currentTarget = this.findTarget(projectile, config);
            projectile.targetUpdateCounter = 0;
        }

        // 타겟이 있으면 방향 조정
        // Safety check: Ensure body exists (added 2025-11-08)
        // Prevents runtime error when target is destroyed but reference still exists
        if (projectile.currentTarget &&
            projectile.currentTarget.alive &&
            projectile.currentTarget.body &&
            projectile.currentTarget.body.position) {
            this.adjustVelocityTowardTarget(projectile, config);
        }
    }

    /**
     * 타겟 찾기 (targetType에 따라 분기)
     * @param {Projectile} projectile - 발사체
     * @param {Object} config - guidedConfig
     * @returns {Tank|null} - 찾은 타겟 또는 null
     */
    findTarget(projectile, config) {
        switch (config.targetType) {
            case 'NEAREST':
                return this.findNearestEnemy(projectile, config.detectionRange);

            case 'LOCKED':
                // LOCKED mode: Maintains current target, re-acquires if target dies
                // Behavior clarified 2025-11-08:
                // - Keeps tracking same target while alive (persistent tracking)
                // - Finds new target if current target is destroyed (re-acquisition)
                // - This is NOT a "true lock" that stops guidance on target death
                //
                // For true lock behavior (stop guidance when target dies), use:
                //   return projectile.currentTarget?.alive ? projectile.currentTarget : null;
                if (projectile.currentTarget && projectile.currentTarget.alive) {
                    return projectile.currentTarget;
                }
                // Re-acquire new target if current target is dead or missing
                return this.findNearestEnemy(projectile, config.detectionRange);

            case 'SMART':
                return this.findBestTarget(projectile, config.detectionRange);

            default:
                return this.findNearestEnemy(projectile, config.detectionRange);
        }
    }

    /**
     * 가장 가까운 적 탱크 찾기
     * @param {Projectile} projectile - 발사체
     * @param {number} range - 탐지 거리 (px)
     * @returns {Tank|null}
     */
    findNearestEnemy(projectile, range) {
        const myPos = projectile.body.position;
        const ownerId = projectile.ownerId;

        let nearest = null;
        let minDist = range;

        for (const tank of this.game.tanks) {
            // 자기 자신이거나 죽은 탱크는 제외
            if (!tank.alive || tank.id === ownerId) {
                continue;
            }

            const tankPos = tank.body.position;
            const dist = Math.hypot(
                tankPos.x - myPos.x,
                tankPos.y - myPos.y
            );

            if (dist < minDist) {
                minDist = dist;
                nearest = tank;
            }
        }

        return nearest;
    }

    /**
     * 최적의 타겟 찾기 (거리 + 각도 고려)
     * @param {Projectile} projectile - 발사체
     * @param {number} range - 탐지 거리 (px)
     * @returns {Tank|null}
     */
    findBestTarget(projectile, range) {
        const myPos = projectile.body.position;
        const myVel = projectile.body.velocity;
        const ownerId = projectile.ownerId;

        // 현재 진행 방향
        const currentAngle = Math.atan2(myVel.y, myVel.x);

        let bestTarget = null;
        let bestScore = Infinity;

        for (const tank of this.game.tanks) {
            if (!tank.alive || tank.id === ownerId) {
                continue;
            }

            const tankPos = tank.body.position;
            const dist = Math.hypot(
                tankPos.x - myPos.x,
                tankPos.y - myPos.y
            );

            if (dist > range) {
                continue;
            }

            // 타겟 방향 각도
            const targetAngle = Math.atan2(
                tankPos.y - myPos.y,
                tankPos.x - myPos.x
            );

            // 각도 차이 계산 (-π ~ π 범위)
            const angleDiff = normalizeAngle(targetAngle - currentAngle);

            // 점수 계산: 거리 + 각도 가중치
            // 각도가 작을수록, 거리가 가까울수록 점수 낮음 (좋음)
            const angleWeight = 100; // 각도 가중치
            const score = dist + Math.abs(angleDiff) * angleWeight;

            if (score < bestScore) {
                bestScore = score;
                bestTarget = tank;
            }
        }

        return bestTarget;
    }

    /**
     * 타겟 방향으로 속도 조정
     * @param {Projectile} projectile - 발사체
     * @param {Object} config - guidedConfig
     */
    adjustVelocityTowardTarget(projectile, config) {
        // Additional safety check (defense in depth)
        const target = projectile.currentTarget;
        if (!target || !target.alive || !target.body || !target.body.position) {
            return;  // Early return if target is invalid
        }

        const targetPos = target.body.position;
        const myPos = projectile.body.position;
        const myVel = projectile.body.velocity;

        // === STEP 1: 각도 계산 ===

        // 타겟 방향 각도 계산
        const dx = targetPos.x - myPos.x;
        const dy = targetPos.y - myPos.y;
        const targetAngle = Math.atan2(dy, dx);

        // 현재 진행 방향 각도
        const currentAngle = Math.atan2(myVel.y, myVel.x);

        // === STEP 2: 각도 차이 정규화 ===

        // 각도 차이 계산 및 정규화 (최단 회전 방향 결정)
        const angleDiff = normalizeAngle(targetAngle - currentAngle);

        // angleDiff > 0: 좌회전 (반시계)
        // angleDiff < 0: 우회전 (시계)
        // angleDiff = 0: 정면

        // === STEP 3: 회전 속도 적용 및 속도 벡터 조정 ===

        // turnRate 적용 (점진적 회전)
        const turnRate = config.turnRate;
        const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate);

        // 새 방향 각도
        const newAngle = currentAngle + turn;

        // 현재 속력 유지 (속도는 바뀌지만 속력은 동일)
        const speed = Math.sqrt(myVel.x * myVel.x + myVel.y * myVel.y);

        // 새 속도 벡터 계산
        const newVel = {
            x: Math.cos(newAngle) * speed,
            y: Math.sin(newAngle) * speed
        };

        // Matter.js에 새 속도 적용
        projectile.Matter.Body.setVelocity(projectile.body, newVel);
    }
}
