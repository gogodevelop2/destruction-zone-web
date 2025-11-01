// ============================================
// AI Controller
// ============================================
// Phase 1: StateMachine + Perception + Pathfinding 통합
//
// 책임:
// - 모든 AI 탱크 관리
// - 10 FPS 업데이트 (성능 최적화)
// - StateMachine + Perception + Pathfinding 연결
//
// Reference: AI_DEVELOPMENT_PLAN.md

import { StateMachine, AIState } from './StateMachine.js';
import { Perception } from './Perception.js';
import { Navmesh } from './Navmesh.js';

/**
 * Difficulty Configuration
 *
 * 주의: visionRange는 무제한(Infinity)으로 고정됨
 * aimAccuracy는 현재 미사용 (조준 정확도는 aimThreshold로 고정)
 */
export const DIFFICULTY = {
    easy: {
        reactionTime: 800,      // ms 반응 지연
        shotCooldown: 3500,     // 3.5초 쿨다운
        updateRate: 8           // 8 FPS
    },
    medium: {
        reactionTime: 400,
        shotCooldown: 2000,
        updateRate: 10
    },
    hard: {
        reactionTime: 150,
        shotCooldown: 1200,
        updateRate: 12
    }
};

/**
 * AI Controller
 * 개별 AI 탱크를 제어
 */
export class AIController {
    /**
     * @param {Tank} tank - AI가 제어하는 탱크
     * @param {Matter} Matter - Matter.js 라이브러리
     * @param {string} difficulty - 난이도 ('easy', 'medium', 'hard')
     * @param {Function} findPathFn - 경로 탐색 함수 (AIManager.findPath)
     */
    constructor(tank, Matter, difficulty = 'medium', findPathFn = null) {
        this.tank = tank;
        this.Matter = Matter;
        this.findPath = findPathFn;

        // 난이도 설정
        this.difficulty = DIFFICULTY[difficulty] || DIFFICULTY.medium;

        // 하위 시스템
        this.stateMachine = new StateMachine(tank, this.difficulty);
        this.perception = new Perception(Matter);

        // 발사 쿨다운
        this.fireCooldown = 0;
        this.lastFireTime = 0;

        // 업데이트 타이밍
        this.lastUpdateTime = 0;
        this.updateInterval = 1000 / this.difficulty.updateRate; // 100ms @ 10 FPS

        console.log(`[AI ${tank.id}] Initialized with difficulty: ${difficulty}`);
    }

    /**
     * AI 업데이트 (10 FPS)
     *
     * @param {number} currentTime - 현재 시간 (ms)
     * @param {Object} gameState - 게임 상태
     * @param {Function} fireProjectile - 발사 콜백
     */
    update(currentTime, gameState, fireProjectile) {
        // 업데이트 주기 체크 (10 FPS)
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }

        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        // 탱크가 죽었으면 업데이트 안함
        if (!this.tank.alive) return;

        // 1. Perception: 세상 인식
        const perceptionData = this.perceiveWorld(gameState);

        // 2. Decision: 상태 전환 체크
        const context = {
            enemies: gameState.tanks,
            health: this.tank.health,
            maxHealth: this.tank.maxHealth || 100,
            perception: perceptionData,
            walls: gameState.walls  // LOS 체크용 벽 정보
        };

        const newState = this.stateMachine.checkTransitions(context);
        this.stateMachine.changeState(newState);

        // 3. Execution: 현재 상태 실행 (Navmesh 경로 탐색)
        const action = this.stateMachine.execute(context, this.findPath);

        // 4. Action: 탱크 제어
        this.applyAction(action, currentTime, fireProjectile);
    }

    /**
     * 세상 인식 (Perception)
     *
     * @param {Object} gameState - 게임 상태
     * @returns {Object} 인식 데이터
     */
    perceiveWorld(gameState) {
        const { tanks, walls } = gameState;

        // 적 감지 (시야 무제한 - 거리 제한 없음)
        const enemies = this.perception.detectEnemies(
            this.tank,
            tanks,
            Infinity  // 시야 범위 무제한
        );

        // 가장 가까운 적 (좌표는 항상 알 수 있음 - LOS 불필요)
        const closestEnemy = this.perception.findClosestEnemy(
            this.tank,
            tanks,
            walls || [],
            Infinity  // 시야 범위 무제한
        );

        // LOS 체크 (공격 가능 여부)
        const hasLOS = closestEnemy ? this.perception.canSeeTarget(
            this.tank,
            closestEnemy,
            walls || []
        ) : false;

        return {
            enemies,
            closestEnemy,
            hasLOS  // 실제 LOS 여부 (공격 가능 여부)
        };
    }

    /**
     * 행동 적용
     *
     * @param {Object} action - StateMachine이 반환한 행동
     * @param {number} currentTime - 현재 시간
     * @param {Function} fireProjectile - 발사 콜백
     */
    applyAction(action, currentTime, fireProjectile) {
        const { thrust, rotation, fire } = action;

        // 이동 제어
        this.tank.thrust = thrust;
        this.tank.rotation = rotation;

        // 발사 제어
        if (fire && this.canFire(currentTime)) {
            // 난이도별 반응 지연 시뮬레이션
            setTimeout(() => {
                if (this.tank.alive) {
                    fireProjectile(this.tank);
                    this.lastFireTime = currentTime;
                }
            }, this.difficulty.reactionTime);
        }
    }

    /**
     * 발사 가능 여부
     *
     * @param {number} currentTime - 현재 시간
     * @returns {boolean}
     */
    canFire(currentTime) {
        const timeSinceLastFire = currentTime - this.lastFireTime;
        return timeSinceLastFire >= this.difficulty.shotCooldown;
    }

    /**
     * 현재 상태 정보 (디버깅용)
     *
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            tank: this.tank.id,
            state: this.stateMachine.getCurrentState(),
            stateData: this.stateMachine.getStateData(),
            difficulty: Object.keys(DIFFICULTY).find(
                key => DIFFICULTY[key] === this.difficulty
            )
        };
    }
}

/**
 * AI Manager
 * 여러 AI 탱크를 관리 (Staggered Updates + Pathfinding)
 */
export class AIManager {
    /**
     * @param {Matter} Matter - Matter.js 라이브러리
     * @param {number} mapWidth - 맵 너비 (기본 960)
     * @param {number} mapHeight - 맵 높이 (기본 720)
     */
    constructor(Matter, mapWidth = 960, mapHeight = 720) {
        this.Matter = Matter;
        this.controllers = [];
        this.updateInterval = 100; // 10 FPS base
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        // Navmesh 시스템 (Triangle-based pathfinding)
        this.navmesh = new Navmesh(mapWidth, mapHeight, Matter);
        console.log('[AIManager] Navmesh system initialized');
    }

    /**
     * AI 탱크 등록
     *
     * @param {Tank} tank - 탱크
     * @param {string} difficulty - 난이도
     */
    registerAI(tank, difficulty = 'medium') {
        // findPath 바인딩 (this 유지)
        const findPathFn = (start, goal) => this.findPath(start, goal);

        const controller = new AIController(tank, this.Matter, difficulty, findPathFn);

        // Staggered update를 위한 offset 설정
        const offset = (this.controllers.length * this.updateInterval) / 6;
        controller.lastUpdateTime = -offset;

        this.controllers.push(controller);

        console.log(`[AIManager] Registered AI ${tank.id} with offset ${offset}ms`);
    }

    /**
     * 장애물 맵 업데이트 (게임 시작 시 또는 맵 변경 시 호출)
     * @param {Array<Body>} walls - 벽 배열
     */
    updateObstacles(walls) {
        // Navmesh 재생성
        this.navmesh.build(walls);
        console.log('[AIManager] Navmesh updated');
    }

    /**
     * 경로 찾기 (AI들이 공유하는 Navmesh 시스템)
     * @param {Vector} start - 시작점
     * @param {Vector} goal - 목표점
     * @returns {Array<Vector>|null} 경로 (웨이포인트 배열)
     */
    findPath(start, goal) {
        return this.navmesh.findPath(start, goal);
    }

    /**
     * 모든 AI 업데이트
     *
     * @param {number} currentTime - 현재 시간
     * @param {Object} gameState - 게임 상태
     * @param {Function} fireProjectile - 발사 콜백
     */
    updateAll(currentTime, gameState, fireProjectile) {
        this.controllers.forEach(controller => {
            controller.update(currentTime, gameState, fireProjectile);
        });
    }

    /**
     * AI 제거
     *
     * @param {Tank} tank - 탱크
     */
    unregisterAI(tank) {
        const index = this.controllers.findIndex(c => c.tank === tank);
        if (index !== -1) {
            this.controllers.splice(index, 1);
            console.log(`[AIManager] Unregistered AI ${tank.id}`);
        }
    }

    /**
     * 모든 AI 상태 로그
     */
    debugLogAll() {
        console.log('=== AI Status ===');
        this.controllers.forEach(controller => {
            console.log(controller.getDebugInfo());
        });
    }

    /**
     * 등록된 AI 수
     */
    getCount() {
        return this.controllers.length;
    }
}
