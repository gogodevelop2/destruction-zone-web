// ============================================
// AI Perception System
// ============================================
// Phase 1: 적 감지, LOS 확인
//
// 책임:
// - 시야 범위 내 적 탐지
// - Line of Sight 확인
// - 장애물 인식 (Phase 2)
// - 발사체 감지 (Phase 3)
//
// Reference: AI_DEVELOPMENT_PLAN.md

/**
 * Perception System
 * AI가 세상을 인식하는 시스템
 */
export class Perception {
    /**
     * @param {Matter} Matter - Matter.js 라이브러리
     */
    constructor(Matter) {
        this.Matter = Matter;
    }

    /**
     * 시야 범위 내 적 탐지
     *
     * @param {Tank} aiTank - AI 탱크
     * @param {Array<Tank>} allTanks - 모든 탱크
     * @param {number} maxRange - 최대 감지 거리 (기본 Infinity = 무제한)
     * @returns {Array<{tank, distance, angle}>} 감지된 적들 (거리순 정렬)
     */
    detectEnemies(aiTank, allTanks, maxRange = Infinity) {
        const enemies = [];
        const myPos = aiTank.body.position;

        for (const tank of allTanks) {
            // 자신 제외
            if (tank === aiTank) continue;

            // 죽은 탱크 제외
            if (!tank.alive) continue;

            // 거리 계산
            const dx = tank.body.position.x - myPos.x;
            const dy = tank.body.position.y - myPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 시야 범위 내인가? (기본값 Infinity = 항상 탐지)
            if (distance <= maxRange) {
                const angle = Math.atan2(dy, dx);

                enemies.push({
                    tank,
                    distance,
                    angle
                });
            }
        }

        // 거리순 정렬 (가까운 것부터)
        enemies.sort((a, b) => a.distance - b.distance);

        return enemies;
    }

    /**
     * Line of Sight (시야선) 확인
     * 두 점 사이에 벽이 있는지 체크
     *
     * @param {Vector} from - 시작점 (AI 위치)
     * @param {Vector} to - 목표점 (타겟 위치)
     * @param {Array<Body>} walls - 벽 배열
     * @returns {boolean} true = 시야 확보 (벽 없음), false = 시야 차단 (벽 있음)
     */
    hasLineOfSight(from, to, walls) {
        if (!walls || walls.length === 0) {
            return true;
        }

        const SAFE_MARGIN = 3; // 안전 마진 (픽셀)

        // 1. 직접 충돌 체크
        const collisions = this.Matter.Query.ray(walls, from, to);
        if (collisions.length > 0) {
            return false; // 벽과 직접 충돌
        }

        // 2. raycast가 벽 모서리를 스치는지 체크 (안전 마진)
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        if (lineLength === 0) return true;

        // 정규화된 방향 벡터
        const ndx = dx / lineLength;
        const ndy = dy / lineLength;

        // 각 벽의 모든 꼭짓점에 대해 거리 체크
        for (const wall of walls) {
            for (const vertex of wall.vertices) {
                // 점(vertex)에서 직선(from→to)까지 최단 거리 계산
                const vx = vertex.x - from.x;
                const vy = vertex.y - from.y;

                // 직선 위 투영점까지의 거리 (스칼라 투영)
                const projection = vx * ndx + vy * ndy;

                // 투영점이 선분 밖이면 스킵
                if (projection < 0 || projection > lineLength) {
                    continue;
                }

                // 투영점 좌표
                const projX = from.x + ndx * projection;
                const projY = from.y + ndy * projection;

                // 점에서 투영점까지 거리
                const distX = vertex.x - projX;
                const distY = vertex.y - projY;
                const distance = Math.sqrt(distX * distX + distY * distY);

                // 안전 마진보다 가까우면 차단
                if (distance < SAFE_MARGIN) {
                    return false;
                }
            }
        }

        return true; // 안전 마진 확보됨
    }

    /**
     * 가장 가까운 적 반환
     *
     * 우선순위:
     * 1. 방향 가중치 거리 (앞/뒤/옆 고려)
     * 2. LOS 여부
     * 3. 포신 정렬 (조준 용이성)
     * 4. 랜덤
     *
     * @param {Tank} aiTank - AI 탱크
     * @param {Array<Tank>} allTanks - 모든 탱크
     * @param {Array<Body>} walls - 벽 배열
     * @param {number} maxRange - 최대 감지 거리
     * @returns {Tank|null} 선택된 적
     */
    findClosestEnemy(aiTank, allTanks, walls, maxRange = Infinity) {
        const enemies = this.detectEnemies(aiTank, allTanks, maxRange);
        if (enemies.length === 0) return null;

        // 1순위: 방향 가중치 적용 거리
        const candidates = this.applyDirectionWeight(aiTank, enemies);
        const closest = this.filterByDistance(candidates);
        if (closest.length === 1) return closest[0].tank;

        // 2순위: LOS
        const withLOS = this.filterByLOS(aiTank, closest, walls);
        if (withLOS.length === 0) return closest[0].tank;
        if (withLOS.length === 1) return withLOS[0].tank;

        // 3순위: 포신 정렬
        const bestAimed = this.filterByAiming(aiTank, withLOS);
        if (bestAimed.length === 1) return bestAimed[0].tank;

        // 4순위: 랜덤
        const randomIndex = Math.floor(Math.random() * bestAimed.length);
        return bestAimed[randomIndex].tank;
    }

    /**
     * 방향 가중치 적용
     * 정면: 0.7배, 측면: 1.0배, 후면: 1.5배
     */
    applyDirectionWeight(aiTank, enemies) {
        return enemies.map(e => {
            const weight = this.calculateDirectionWeight(aiTank, e.tank);
            return {
                tank: e.tank,
                distance: e.distance,
                weightedDistance: e.distance * weight
            };
        }).sort((a, b) => a.weightedDistance - b.weightedDistance);
    }

    /**
     * 방향 가중치 계산
     */
    calculateDirectionWeight(aiTank, enemy) {
        const angleDiff = this.getAngleDifference(aiTank, enemy);
        // 정면(0°): 0.7, 측면(90°): 1.0, 후면(180°): 1.5
        return 0.7 + (angleDiff / Math.PI) * 0.8;
    }

    /**
     * 같은 거리 필터링 (5px 오차)
     */
    filterByDistance(enemies) {
        const closest = enemies[0].weightedDistance;
        return enemies.filter(e => Math.abs(e.weightedDistance - closest) < 5);
    }

    /**
     * LOS 필터링
     */
    filterByLOS(aiTank, enemies, walls) {
        return enemies.filter(e =>
            this.hasLineOfSight(aiTank.body.position, e.tank.body.position, walls)
        );
    }

    /**
     * 포신 정렬 필터링
     */
    filterByAiming(aiTank, enemies) {
        const scored = enemies.map(e => ({
            tank: e.tank,
            score: this.calculateAimingScore(aiTank, e.tank)
        })).sort((a, b) => b.score - a.score);

        const bestScore = scored[0].score;
        return scored.filter(e => e.score >= bestScore * 0.95);
    }

    /**
     * 포신 정렬 점수 계산
     * 0° = 1.0 (완벽), 180° = 0.0 (반대)
     */
    calculateAimingScore(aiTank, enemy) {
        const angleDiff = this.getAngleDifference(aiTank, enemy);
        return 1.0 - (angleDiff / Math.PI);
    }

    /**
     * 각도 차이 계산 (절댓값)
     */
    getAngleDifference(aiTank, enemy) {
        const tankAngle = aiTank.body.angle;
        const dx = enemy.body.position.x - aiTank.body.position.x;
        const dy = enemy.body.position.y - aiTank.body.position.y;
        const angleToEnemy = Math.atan2(dy, dx);

        let diff = angleToEnemy - tankAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return Math.abs(diff);
    }

    /**
     * 적을 볼 수 있는지 체크 (LOS)
     * 공격 가능 여부 판단용
     *
     * @param {Tank} aiTank - AI 탱크
     * @param {Tank} target - 타겟 탱크
     * @param {Array<Body>} walls - 벽 배열
     * @returns {boolean} true = 볼 수 있음 (공격 가능)
     */
    canSeeTarget(aiTank, target, walls) {
        if (!target || !target.alive) return false;

        return this.hasLineOfSight(
            aiTank.body.position,
            target.body.position,
            walls
        );
    }

    /**
     * 위험한 발사체 탐지 (Phase 3에서 구현)
     *
     * @param {Tank} aiTank - AI 탱크
     * @param {Array<Projectile>} projectiles - 모든 발사체
     * @param {number} dangerRadius - 위험 거리 (기본 150px)
     * @returns {Array<{projectile, distance, willHit}>} 위험한 발사체들
     */
    detectIncomingProjectiles(aiTank, projectiles, dangerRadius = 150) {
        // TODO: Phase 3에서 구현
        // 발사체의 궤적을 계산하여 충돌 예측
        return [];
    }

    /**
     * 주변 벽 감지 (Phase 2에서 구현)
     *
     * @param {Tank} aiTank - AI 탱크
     * @param {Array<Body>} walls - 벽 배열
     * @param {number} detectionRange - 감지 거리 (기본 200px)
     * @returns {Array<Body>} 근처 벽들
     */
    detectNearbyWalls(aiTank, walls, detectionRange = 200) {
        // TODO: Phase 2에서 구현
        // 경로 탐색과 함께 사용
        const nearbyWalls = [];
        const myPos = aiTank.body.position;

        for (const wall of walls) {
            // 벽의 중심점까지 거리 계산 (간단한 버전)
            const wallPos = wall.position;
            const dx = wallPos.x - myPos.x;
            const dy = wallPos.y - myPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= detectionRange) {
                nearbyWalls.push(wall);
            }
        }

        return nearbyWalls;
    }

    /**
     * 타겟이 시야각 내에 있는가?
     *
     * @param {Tank} aiTank - AI 탱크
     * @param {Tank} target - 타겟 탱크
     * @param {number} fovAngle - 시야각 (라디안, 기본 π = 180도)
     * @returns {boolean} true = 시야각 내
     */
    isInFieldOfView(aiTank, target, fovAngle = Math.PI) {
        const dx = target.body.position.x - aiTank.body.position.x;
        const dy = target.body.position.y - aiTank.body.position.y;
        const angleToTarget = Math.atan2(dy, dx);

        // 탱크의 정면 방향
        const tankAngle = aiTank.body.angle;

        // 각도 차이 계산
        let angleDiff = angleToTarget - tankAngle;

        // 정규화 [-π, π]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // 시야각의 절반과 비교
        return Math.abs(angleDiff) <= fovAngle / 2;
    }

    /**
     * 특정 위치가 안전한가? (적이 가까이 없음)
     *
     * @param {Vector} position - 확인할 위치
     * @param {Array<Tank>} enemies - 적 탱크들
     * @param {number} safeDistance - 안전 거리 (기본 300px)
     * @returns {boolean} true = 안전
     */
    isPositionSafe(position, enemies, safeDistance = 300) {
        for (const enemy of enemies) {
            if (!enemy.alive) continue;

            const dx = enemy.body.position.x - position.x;
            const dy = enemy.body.position.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < safeDistance) {
                return false;
            }
        }

        return true;
    }

    /**
     * 적들의 평균 위치 계산 (후퇴 방향 결정용)
     *
     * @param {Array<Tank>} enemies - 적 탱크들
     * @returns {Vector|null} 평균 위치 {x, y}
     */
    calculateThreatCenter(enemies) {
        const aliveEnemies = enemies.filter(e => e.alive);

        if (aliveEnemies.length === 0) {
            return null;
        }

        let sumX = 0, sumY = 0;
        aliveEnemies.forEach(enemy => {
            sumX += enemy.body.position.x;
            sumY += enemy.body.position.y;
        });

        return {
            x: sumX / aliveEnemies.length,
            y: sumY / aliveEnemies.length
        };
    }

    /**
     * 거리 계산 유틸리티
     *
     * @param {Vector} posA - 위치 A
     * @param {Vector} posB - 위치 B
     * @returns {number} 거리
     */
    distance(posA, posB) {
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 각도 계산 유틸리티
     *
     * @param {Vector} from - 시작점
     * @param {Vector} to - 목표점
     * @returns {number} 각도 (라디안)
     */
    angleTo(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return Math.atan2(dy, dx);
    }

    /**
     * 각도 차이 계산 (정규화)
     *
     * @param {number} angle1 - 각도 1
     * @param {number} angle2 - 각도 2
     * @returns {number} 정규화된 차이 [-π, π]
     */
    angleDifference(angle1, angle2) {
        let diff = angle2 - angle1;

        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return diff;
    }

    /**
     * 디버그: 인식 상태 로그
     *
     * @param {Tank} aiTank - AI 탱크
     * @param {Object} perceptionData - 인식 데이터
     */
    debugLog(aiTank, perceptionData) {
        console.log(`[Perception ${aiTank.id}]`, {
            enemiesDetected: perceptionData.enemies?.length || 0,
            closestEnemy: perceptionData.closestEnemy?.id || 'none',
            hasLOS: perceptionData.hasLOS || false
        });
    }
}

/**
 * Helper: Perception 데이터 구조
 *
 * @typedef {Object} PerceptionData
 * @property {Array<{tank, distance, angle}>} enemies - 감지된 적들
 * @property {Tank|null} closestEnemy - 가장 가까운 적
 * @property {boolean} hasLOS - LOS 확보 여부
 * @property {Array<Body>} nearbyWalls - 주변 벽들
 * @property {Array} threats - 위험한 발사체들
 */
