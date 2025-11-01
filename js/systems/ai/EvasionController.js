// ============================================
// Evasion Controller
// ============================================
// 회피 기동 전담 모듈
// 책임: 회피 시작/종료, 후진/반격 실행

/**
 * 회피 상태
 */
export const EvasionState = {
    NONE: 'NONE',                   // 회피 안 함
    RETREATING: 'RETREATING',       // 후진 중
    COUNTERATTACKING: 'COUNTERATTACKING'  // 반격 중 (벽에 막혔을 때)
};

/**
 * EvasionController
 * 회피 기동을 독립적으로 관리
 */
export class EvasionController {
    /**
     * @param {Tank} tank - AI 탱크
     */
    constructor(tank) {
        this.tank = tank;

        // 상태
        this.state = EvasionState.NONE;
        this.isActive = false;

        // 타이밍
        this.startTime = null;
        this.startPos = null;

        // 반격 관리
        this.counterattackAttempts = 0;
        this.MAX_COUNTERATTACK_ATTEMPTS = 1;  // 1회만 반격 시도

        // 설정
        this.EVASION_DURATION = 3000;  // 3초
        this.MIN_MOVE_DIST = 50;       // 최소 이동 거리
        this.ACTIVE_WINDOW = 3000;     // 공격자 활성 시간 (3초)
                                        // NOTE: StateMachine.js checkRearAttacker()에도 동일 값 정의됨
                                        // TODO: 난이도별 차별화 필요 시 DIFFICULTY 객체로 이동 예정
    }

    /**
     * 회피 시작 가능 여부
     * @param {number} attackerCount - 활성 공격자 수
     * @param {boolean} hasRearAttacker - 후방 공격 여부
     * @returns {boolean}
     */
    canStart(attackerCount, hasRearAttacker) {
        // 이미 회피 중이면 불가
        if (this.isActive) return false;

        // 조건: 2명 이상 OR 후방 공격
        return attackerCount >= 2 || hasRearAttacker;
    }

    /**
     * 회피 시작
     */
    start() {
        const now = Date.now();
        const myPos = this.tank.body.position;

        this.isActive = true;
        this.state = EvasionState.RETREATING;
        this.startTime = now;
        this.startPos = { x: myPos.x, y: myPos.y };
        this.counterattackAttempts = 0;
    }

    /**
     * 매 프레임 업데이트
     * @returns {Object|null} {thrust, rotation, fire} 또는 null (회피 종료)
     */
    update() {
        if (!this.isActive) return null;

        const now = Date.now();
        const elapsed = now - this.startTime;

        // ============================================
        // 1. 종료 체크 (3초 경과)
        // ============================================
        if (elapsed > this.EVASION_DURATION) {
            return this.checkAndTransition(now);
        }

        // ============================================
        // 2. 활성 공격자 체크 (없으면 종료)
        // ============================================
        const activeAttackers = this.getActiveAttackers(now);
        if (activeAttackers.length === 0) {
            this.end();
            return null;
        }

        // ============================================
        // 3. 상태별 실행
        // ============================================
        if (this.state === EvasionState.RETREATING) {
            return this.executeRetreat(activeAttackers);
        } else if (this.state === EvasionState.COUNTERATTACKING) {
            return this.executeCounterattack(activeAttackers, now);
        }

        return null;
    }

    /**
     * 3초 경과 후 전환 체크
     * @param {number} now - 현재 시간
     * @returns {Object|null}
     */
    checkAndTransition(now) {
        const myPos = this.tank.body.position;

        // 이동 거리 계산
        const movedDist = Math.sqrt(
            (myPos.x - this.startPos.x) ** 2 +
            (myPos.y - this.startPos.y) ** 2
        );

        if (movedDist >= this.MIN_MOVE_DIST) {
            // 충분히 이동 → 정상 종료
            this.end();
            return null;
        }

        // 거의 안 움직임 (벽에 막힘)
        if (this.state === EvasionState.COUNTERATTACKING) {
            // 이미 반격 중이었는데도 못 움직임 → 포기
            this.end();
            return null;
        }

        // 반격 시도 횟수 체크
        if (this.counterattackAttempts >= this.MAX_COUNTERATTACK_ATTEMPTS) {
            this.end();
            return null;
        }

        // 반격 모드로 전환
        this.state = EvasionState.COUNTERATTACKING;
        this.startTime = now;
        this.startPos = { x: myPos.x, y: myPos.y };
        this.counterattackAttempts++;

        // 반격 실행 계속
        const activeAttackers = this.getActiveAttackers(now);
        return this.executeCounterattack(activeAttackers, now);
    }

    /**
     * 후진 실행
     * @param {Array} activeAttackers - 활성 공격자 위치 배열
     * @returns {Object} {thrust, rotation, fire}
     */
    executeRetreat(activeAttackers) {
        const myPos = this.tank.body.position;
        const myAngle = this.tank.body.angle;

        // 공격자들의 중심점 계산
        let centerX = 0;
        let centerY = 0;
        for (const pos of activeAttackers) {
            centerX += pos.x;
            centerY += pos.y;
        }
        centerX /= activeAttackers.length;
        centerY /= activeAttackers.length;

        // 도망 방향 계산
        const dx = myPos.x - centerX;
        const dy = myPos.y - centerY;

        let fleeAngle;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            // 중심점 = 내 위치 (공격자가 정반대) → 현재 뒤쪽으로 후진
            fleeAngle = myAngle + Math.PI;
        } else {
            fleeAngle = Math.atan2(dy, dx);
        }

        // 후진 각도 = 도망 방향 + 180°
        const backwardAngle = fleeAngle + Math.PI;

        // 각도 차이 계산
        let angleDiff = backwardAngle - myAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // 회전
        let rotation = 0;
        const rotationThreshold = 0.15;  // ~9도
        if (Math.abs(angleDiff) > rotationThreshold) {
            rotation = angleDiff > 0 ? 1 : -1;
        }

        return {
            thrust: -1,      // 후진
            rotation: rotation,
            fire: true       // 후진하면서 발사
        };
    }

    /**
     * 반격 실행
     * @param {Array} activeAttackers - 활성 공격자 위치 배열
     * @param {number} now - 현재 시간
     * @returns {Object} {thrust, rotation, fire}
     */
    executeCounterattack(activeAttackers, now) {
        const myPos = this.tank.body.position;
        const myAngle = this.tank.body.angle;

        // 가장 최근 공격자 찾기
        let latestAttacker = null;
        let latestTime = 0;

        for (const [attackerId, data] of Object.entries(this.tank.attackers)) {
            if (now - data.lastHitTime < this.ACTIVE_WINDOW) {
                if (data.lastHitTime > latestTime) {
                    latestTime = data.lastHitTime;
                    latestAttacker = data.lastPos;
                }
            }
        }

        if (!latestAttacker) {
            // 공격자 없음 → 종료
            this.end();
            return null;
        }

        // 공격자 방향 계산
        const dx = latestAttacker.x - myPos.x;
        const dy = latestAttacker.y - myPos.y;
        const targetAngle = Math.atan2(dy, dx);

        // 각도 차이
        let angleDiff = targetAngle - myAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // 회전
        let rotation = 0;
        const rotationThreshold = 0.15;
        if (Math.abs(angleDiff) > rotationThreshold) {
            rotation = angleDiff > 0 ? 1 : -1;
        }

        return {
            thrust: 1,       // 전진 반격!
            rotation: rotation,
            fire: true
        };
    }

    /**
     * 활성 공격자 위치 수집
     * @param {number} now - 현재 시간
     * @returns {Array} 활성 공격자 위치 배열
     */
    getActiveAttackers(now) {
        const activeAttackers = [];
        for (const [attackerId, data] of Object.entries(this.tank.attackers)) {
            if (now - data.lastHitTime < this.ACTIVE_WINDOW) {
                activeAttackers.push(data.lastPos);
            }
        }
        return activeAttackers;
    }

    /**
     * 회피 종료
     */
    end() {
        this.isActive = false;
        this.state = EvasionState.NONE;
        this.startTime = null;
        this.startPos = null;
        this.counterattackAttempts = 0;

        // 공격자 정보 초기화
        this.tank.attackers = {};
    }

    /**
     * 현재 상태 (디버깅용)
     * @returns {string}
     */
    getState() {
        return this.state;
    }

    /**
     * 활성 여부 (디버깅용)
     * @returns {boolean}
     */
    isEvading() {
        return this.isActive;
    }
}
