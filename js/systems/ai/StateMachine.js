// ============================================
// Simplified AI State Machine
// ============================================
// 단순화된 3-상태 시스템: IDLE → PURSUE → ATTACK
//
// Design Philosophy:
// - 목표 획득: 좌표만 알면 됨 (LOS 불필요)
// - 추적(PURSUE): Navmesh로 벽 우회
// - 공격(ATTACK): LOS 확보 시에만 발사

import { EvasionController } from './EvasionController.js';

/**
 * AI States (Simplified)
 */
export const AIState = {
    IDLE: 'IDLE',       // 목표 없음 (적 탐색 중)
    PURSUE: 'PURSUE',   // 적 추적 중 (경로 따라가기)
    ATTACK: 'ATTACK'    // 공격 중 (사거리 내)
};

/**
 * Simplified State Machine for Tank AI
 *
 * 책임:
 * - 상태 전환 로직만 담당
 * - 행동 실행은 최소화 (조향만)
 */
export class StateMachine {
    /**
     * @param {Tank} tank - AI가 제어하는 탱크
     * @param {Object} difficulty - 난이도 설정
     */
    constructor(tank, difficulty) {
        this.tank = tank;
        this.difficulty = difficulty;

        // 현재 상태
        this.currentState = AIState.IDLE;

        // 상태 데이터
        this.stateData = {
            target: null,               // 현재 타겟
            lastTargetSeen: 0,          // 마지막 목격 시간
            lastTargetPosition: null,   // 마지막 목격 위치

            // 경로 추적 (간단하게)
            path: null,                 // Navmesh 경로
            currentWaypointIndex: 0,    // 현재 웨이포인트
            lastPathGenerated: 0        // 경로 생성 시간
        };

        // 타겟 변경 쿨다운
        this.lastTargetChangeTime = 0;

        // Constants
        this.ATTACK_RANGE = 250;            // 공격 사거리
        this.ATTACK_RANGE_EXIT = 280;       // 추격 전환 거리 (히스테리시스)
        this.PATH_REGEN_COOLDOWN = 200;     // 경로 재생성 쿨다운 (500ms → 200ms)
        this.TARGET_LOST_TIMEOUT = 1000;    // 목표 상실 타임아웃 (1초)
        this.WAYPOINT_REACH_DIST = 30;      // 웨이포인트 도달 거리
        this.TARGET_CHANGE_COOLDOWN = 2000; // 타겟 변경 쿨다운 (2초)

        // 회피 컨트롤러
        this.evasionController = new EvasionController(tank);
    }

    /**
     * 상태 전환 체크
     * @param {Object} context - {enemies, health, maxHealth, perception, walls}
     * @returns {string} 새로운 상태
     */
    checkTransitions(context) {
        const { perception } = context;
        const currentState = this.currentState;
        const now = Date.now();

        // 보이는 적 찾기
        const visibleEnemies = perception.enemies.filter(e => e.alive);
        const closestEnemy = perception.closestEnemy;

        // ============================================
        // 1. 목표 획득/갱신
        // ============================================

        // 타겟이 죽었으면 즉시 초기화
        if (this.stateData.target && !this.stateData.target.alive) {
            this.stateData.target = null;
            this.stateData.path = null;
            this.lastTargetChangeTime = 0; // 쿨다운 리셋
        }

        // 타겟 변경 쿨다운 체크
        const canChangeTarget = (now - this.lastTargetChangeTime) >= this.TARGET_CHANGE_COOLDOWN;

        if (closestEnemy && closestEnemy.alive) {
            // 타겟이 없으면 즉시 설정
            if (!this.stateData.target) {
                this.stateData.target = closestEnemy;
                this.stateData.path = null;
                this.lastTargetChangeTime = now;
            }
            // 타겟이 있지만 다른 적으로 변경하려는 경우
            else if (this.stateData.target !== closestEnemy && canChangeTarget) {
                this.stateData.target = closestEnemy;
                this.stateData.path = null;  // 경로 재생성 필요
                this.lastTargetChangeTime = now;
            }

            // 타겟 위치 갱신 (항상)
            this.stateData.lastTargetSeen = now;
            this.stateData.lastTargetPosition = {
                x: closestEnemy.body.position.x,
                y: closestEnemy.body.position.y
            };
        }

        // ============================================
        // 2. 상태 전환 결정
        // ============================================

        // IDLE: 목표 없음
        if (!this.stateData.target) {
            return AIState.IDLE;
        }

        // 목표 상실 타임아웃 체크
        const timeSinceLastSeen = now - this.stateData.lastTargetSeen;
        if (timeSinceLastSeen > this.TARGET_LOST_TIMEOUT) {
            this.stateData.target = null;
            this.stateData.path = null;
            return AIState.IDLE;
        }

        // 목표까지 거리 계산
        const targetPos = this.stateData.target.body.position;
        const myPos = this.tank.body.position;
        const distToTarget = Math.sqrt(
            (targetPos.x - myPos.x) ** 2 +
            (targetPos.y - myPos.y) ** 2
        );

        // ============================================
        // 회피 중에는 상태 전환 안 함 (무조건 ATTACK 유지)
        // ============================================
        if (this.evasionController.isEvading()) {
            return AIState.ATTACK;
        }

        // ATTACK: 사거리 내 + LOS 확보
        if (currentState === AIState.ATTACK) {
            // 히스테리시스: ATTACK_RANGE_EXIT 밖으로 나가야 PURSUE로 전환
            if (distToTarget > this.ATTACK_RANGE_EXIT) {
                return AIState.PURSUE;
            }
            // LOS 없으면 PURSUE로 (벽 뒤로 숨음)
            if (!perception.hasLOS) {
                return AIState.PURSUE;
            }
            return AIState.ATTACK;
        } else {
            // PURSUE에서 사거리 내 진입 + LOS 확보 시 ATTACK
            if (distToTarget <= this.ATTACK_RANGE && perception.hasLOS) {
                return AIState.ATTACK;
            }
        }

        // PURSUE: 추적 중
        return AIState.PURSUE;
    }

    /**
     * 상태 변경
     * @param {string} newState
     */
    changeState(newState) {
        if (this.currentState !== newState) {
            this.currentState = newState;
            this.lastStateChange = Date.now();
        }
    }

    /**
     * 현재 상태 실행 (행동 계산)
     * @param {Object} context - 게임 상태
     * @param {Function} findPathFn - 경로 탐색 함수
     * @returns {Object} {thrust, rotation, fire}
     */
    execute(context, findPathFn) {
        const currentState = this.currentState;

        switch (currentState) {
            case AIState.IDLE:
                return this.executeIdle();

            case AIState.PURSUE:
                return this.executePursue(findPathFn);

            case AIState.ATTACK:
                return this.executeAttack();

            default:
                return { thrust: 0, rotation: 0, fire: false };
        }
    }

    /**
     * IDLE 상태 실행
     * 제자리에서 회전하며 적 탐색
     */
    executeIdle() {
        return {
            thrust: 0,
            rotation: 0.3,  // 천천히 회전
            fire: false
        };
    }

    /**
     * PURSUE 상태 실행
     * Navmesh 경로를 따라 목표 추적
     */
    executePursue(findPathFn) {
        if (!this.stateData.target) {
            return { thrust: 0, rotation: 0, fire: false };
        }

        const now = Date.now();
        const myPos = this.tank.body.position;
        const targetPos = this.stateData.lastTargetPosition || this.stateData.target.body.position;

        // ============================================
        // 1. 경로 생성/재생성
        // ============================================
        const needsPath = !this.stateData.path || this.stateData.path.length === 0;
        const pathCooldownPassed = (now - this.stateData.lastPathGenerated) > this.PATH_REGEN_COOLDOWN;

        if ((needsPath || pathCooldownPassed) && findPathFn) {
            // 경로 찾기
            const newPath = findPathFn(myPos, targetPos);

            if (newPath && newPath.length > 0) {
                this.stateData.path = newPath;
                this.stateData.currentWaypointIndex = 0;
                this.stateData.lastPathGenerated = now;
            } else if (needsPath) {
                // 경로 없으면 직진
                this.stateData.path = [targetPos];
                this.stateData.currentWaypointIndex = 0;
            }
        }

        // ============================================
        // 2. 웨이포인트 추적
        // ============================================
        if (!this.stateData.path || this.stateData.path.length === 0) {
            return { thrust: 0, rotation: 0, fire: false };
        }

        // 현재 웨이포인트
        const currentWaypoint = this.stateData.path[this.stateData.currentWaypointIndex];

        if (!currentWaypoint) {
            // 경로 끝 도달
            this.stateData.path = null;
            return { thrust: 0, rotation: 0, fire: false };
        }

        // 웨이포인트까지 거리
        const distToWaypoint = Math.sqrt(
            (currentWaypoint.x - myPos.x) ** 2 +
            (currentWaypoint.y - myPos.y) ** 2
        );

        // 웨이포인트 도달 체크
        if (distToWaypoint < this.WAYPOINT_REACH_DIST) {
            this.stateData.currentWaypointIndex++;

            if (this.stateData.currentWaypointIndex >= this.stateData.path.length) {
                // 마지막 웨이포인트 도달
                this.stateData.path = null;
                return { thrust: 0, rotation: 0, fire: false };
            }

            // 다음 웨이포인트로
            return this.executePursue(findPathFn);
        }

        // ============================================
        // 3. 조향 계산
        // ============================================
        return this.steerTowards(currentWaypoint);
    }

    /**
     * ATTACK 상태 실행
     * 적을 향해 조준하고 발사
     */
    executeAttack() {
        if (!this.stateData.target) {
            return { thrust: 0, rotation: 0, fire: false };
        }

        // ============================================
        // 회피 기동 체크 및 실행
        // ============================================
        const attackerCount = this.tank.getActiveAttackerCount();
        const hasRearAttacker = this.checkRearAttacker();

        // 회피 시작 가능 여부
        if (this.evasionController.canStart(attackerCount, hasRearAttacker)) {
            this.evasionController.start();
        }

        // 회피 중이면 회피 행동 실행
        const evasionAction = this.evasionController.update();
        if (evasionAction) {
            return evasionAction;
        }

        // ============================================
        // 정상 공격
        // ============================================
        const targetPos = this.stateData.target.body.position;
        const myPos = this.tank.body.position;
        const myAngle = this.tank.body.angle;

        // 목표 방향 계산
        const dx = targetPos.x - myPos.x;
        const dy = targetPos.y - myPos.y;
        const targetAngle = Math.atan2(dy, dx);

        // 각도 차이 계산
        let angleDiff = targetAngle - myAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // 회전
        const aimThreshold = 0.05;  // ~3도 (조준 정확도)
        let rotation = 0;
        if (Math.abs(angleDiff) > aimThreshold) {
            rotation = angleDiff > 0 ? 1 : -1;
        }

        // 조준이 정확히 맞을 때만 발사
        const canShoot = Math.abs(angleDiff) < aimThreshold;

        return {
            thrust: 0,              // 공격 중에는 정지
            rotation: rotation,
            fire: canShoot          // 조준 맞을 때만 발사
        };
    }

    /**
     * 특정 위치로 조향
     * @param {Vector} targetPos - 목표 위치
     * @returns {Object} {thrust, rotation}
     */
    steerTowards(targetPos) {
        const myPos = this.tank.body.position;
        const myAngle = this.tank.body.angle;

        // 목표 방향 계산
        const dx = targetPos.x - myPos.x;
        const dy = targetPos.y - myPos.y;
        const targetAngle = Math.atan2(dy, dx);

        // 각도 차이 계산 (-π ~ π)
        let angleDiff = targetAngle - myAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // 회전 방향 결정
        const rotationThreshold = 0.08; // ~4.5도 (더 정확한 조향)
        let rotation = 0;

        if (Math.abs(angleDiff) > rotationThreshold) {
            rotation = angleDiff > 0 ? 1 : -1;
        }

        // 추력 (방향이 얼추 맞으면 전진)
        const thrust = Math.abs(angleDiff) < Math.PI / 4 ? 1 : 0; // 45도 이내

        return { thrust, rotation, fire: false };
    }

    /**
     * 후방 공격자 체크
     * 105° ~ 180° 범위에서 공격받는지 확인
     * @returns {boolean} 후방 공격 여부
     */
    checkRearAttacker() {
        const now = Date.now();
        // NOTE: EvasionController.js에도 동일 값(3000) 정의됨
        // TODO: 난이도별 차별화 필요 시 DIFFICULTY 객체로 이동 예정
        const ACTIVE_WINDOW = 3000;  // 공격자 활성 시간 (3초)
        const myAngle = this.tank.body.angle;
        const myPos = this.tank.body.position;

        for (const [attackerId, data] of Object.entries(this.tank.attackers)) {
            const timeSinceHit = now - data.lastHitTime;

            if (timeSinceHit < ACTIVE_WINDOW) {
                // 공격자 방향 계산
                const dx = data.lastPos.x - myPos.x;
                const dy = data.lastPos.y - myPos.y;
                const attackerAngle = Math.atan2(dy, dx);

                // 각도 차이 계산 (-π ~ π)
                let angleDiff = attackerAngle - myAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                // 후방 판정: 105° ~ 180° 범위 (180° 중심으로 양쪽 15°씩 제외한 150°)
                // 0° = 정면, 180° = 정후방
                const REAR_MIN = Math.PI * 5/12;  // 75° (105°부터 후방 판정)
                const REAR_MAX = Math.PI;          // 180°

                if (Math.abs(angleDiff) >= REAR_MIN && Math.abs(angleDiff) <= REAR_MAX) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 현재 상태 가져오기 (디버깅용)
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * 상태 데이터 가져오기 (디버깅용)
     */
    getStateData() {
        return this.stateData;
    }

}
