// ============================================
// Navigation Mesh (Navmesh) System
// ============================================
// Delaunay 삼각분할을 사용한 경로 찾기
// 벽을 피해서 안전한 경로를 생성
//
// Reference:
// - Delaunator: https://github.com/mapbox/delaunator
// - Navmesh pathfinding in games

/**
 * Navmesh - Navigation Mesh System
 *
 * 책임:
 * - 맵을 삼각형으로 분할 (Delaunay triangulation)
 * - 벽이 있는 삼각형 제거
 * - A* 알고리즘으로 경로 찾기
 */
export class Navmesh {
    /**
     * @param {number} mapWidth - 맵 너비
     * @param {number} mapHeight - 맵 높이
     * @param {Matter} Matter - Matter.js 라이브러리
     */
    constructor(mapWidth, mapHeight, Matter) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.Matter = Matter;

        // Navmesh 데이터
        this.triangles = [];        // 걸을 수 있는 삼각형 배열
        this.triangleGraph = [];    // 삼각형 간 인접 관계
        this.walls = [];            // 벽 배열

        // console.log('[Navmesh] Initialized');
    }

    /**
     * 맵에 벽을 추가하고 Navmesh 재생성
     * @param {Array<Body>} walls - Matter.js 벽 배열
     */
    build(walls) {
        // Building mesh - no log needed
        this.walls = walls;

        // 1. 샘플링 포인트 생성 (맵 전체를 균등하게)
        const points = this.generateSamplePoints();

        // 2. Delaunay 삼각분할
        const delaunay = Delaunator.from(points);

        // 3. 삼각형 추출
        this.triangles = this.extractTriangles(delaunay, points);

        // 4. 벽과 겹치는 삼각형 제거
        this.triangles = this.removeBlockedTriangles(this.triangles);

        // 5. 삼각형 인접 그래프 생성
        this.triangleGraph = this.buildGraph(this.triangles);

        // console.log('[Navmesh] Built:', this.triangles.length, 'walkable triangles');
    }

    /**
     * 샘플링 포인트 생성 (균등 그리드)
     * @returns {Array<[x, y]>} 포인트 배열
     */
    generateSamplePoints() {
        const points = [];
        const spacing = 20;  // 20px 간격
        const margin = 10;

        // 경계 포인트 - 테두리를 따라 균일하게 배치
        // 위쪽 테두리
        for (let x = margin; x <= this.mapWidth - margin; x += spacing) {
            points.push([x, margin]);
        }

        // 아래쪽 테두리
        for (let x = margin; x <= this.mapWidth - margin; x += spacing) {
            points.push([x, this.mapHeight - margin]);
        }

        // 왼쪽 테두리 (모서리 제외)
        for (let y = margin + spacing; y < this.mapHeight - margin; y += spacing) {
            points.push([margin, y]);
        }

        // 오른쪽 테두리 (모서리 제외)
        for (let y = margin + spacing; y < this.mapHeight - margin; y += spacing) {
            points.push([this.mapWidth - margin, y]);
        }

        // 내부 그리드 포인트
        for (let x = spacing; x < this.mapWidth; x += spacing) {
            for (let y = spacing; y < this.mapHeight; y += spacing) {
                points.push([x, y]);
            }
        }

        // 랜덤 포인트 추가 (더 자연스러운 메시)
        const randomPoints = 150;
        for (let i = 0; i < randomPoints; i++) {
            points.push([
                Math.random() * this.mapWidth,
                Math.random() * this.mapHeight
            ]);
        }

        return points;
    }

    /**
     * Delaunay 결과에서 삼각형 추출
     * @param {Delaunator} delaunay - Delaunator 결과
     * @param {Array<[x, y]>} points - 포인트 배열
     * @returns {Array<Triangle>} 삼각형 배열
     */
    extractTriangles(delaunay, points) {
        const triangles = [];
        const { triangles: indices } = delaunay;

        // 3개씩 묶어서 삼각형 생성
        for (let i = 0; i < indices.length; i += 3) {
            const p1 = points[indices[i]];
            const p2 = points[indices[i + 1]];
            const p3 = points[indices[i + 2]];

            const triangle = {
                id: triangles.length,
                vertices: [
                    { x: p1[0], y: p1[1] },
                    { x: p2[0], y: p2[1] },
                    { x: p3[0], y: p3[1] }
                ],
                center: this.triangleCenter(p1, p2, p3),
                neighbors: []  // 나중에 채움
            };

            triangles.push(triangle);
        }

        return triangles;
    }

    /**
     * 삼각형 중심점 계산
     */
    triangleCenter(p1, p2, p3) {
        return {
            x: (p1[0] + p2[0] + p3[0]) / 3,
            y: (p1[1] + p2[1] + p3[1]) / 3
        };
    }

    /**
     * 벽과 겹치는 삼각형 제거
     * @param {Array<Triangle>} triangles - 삼각형 배열
     * @returns {Array<Triangle>} 걸을 수 있는 삼각형만
     */
    removeBlockedTriangles(triangles) {
        const walkable = triangles.filter(triangle => {
            const center = triangle.center;

            // 1. 삼각형 중심이 벽 안에 있는지 체크
            for (const wall of this.walls) {
                if (this.Matter.Query.point([wall], center).length > 0) {
                    return false;
                }
            }

            // 2. 삼각형의 모든 꼭짓점이 벽 안에 있는지 체크
            for (const vertex of triangle.vertices) {
                for (const wall of this.walls) {
                    if (this.Matter.Query.point([wall], vertex).length > 0) {
                        return false;
                    }
                }
            }

            // 3. 반대로: 벽의 꼭짓점이 삼각형 안에 있는지 체크
            for (const wall of this.walls) {
                const wallVertices = wall.vertices;
                for (const wallVertex of wallVertices) {
                    if (this.pointInTriangle(wallVertex, triangle.vertices)) {
                        return false;
                    }
                }
            }

            return true;
        });

        // ID 재배열 (중요!)
        walkable.forEach((tri, index) => {
            tri.id = index;
        });

        return walkable;
    }

    /**
     * 삼각형 인접 그래프 생성
     * @param {Array<Triangle>} triangles - 삼각형 배열
     * @returns {Array<Array<number>>} 인접 리스트
     */
    buildGraph(triangles) {
        const graph = triangles.map(() => []);

        // 모든 삼각형 쌍을 비교
        for (let i = 0; i < triangles.length; i++) {
            for (let j = i + 1; j < triangles.length; j++) {
                if (this.areNeighbors(triangles[i], triangles[j])) {
                    graph[i].push(j);
                    graph[j].push(i);
                }
            }
        }

        return graph;
    }

    /**
     * 두 삼각형이 이웃인지 확인 (변을 공유하는지)
     */
    areNeighbors(tri1, tri2) {
        // 공유하는 꼭짓점 개수 세기
        let sharedVertices = 0;

        for (const v1 of tri1.vertices) {
            for (const v2 of tri2.vertices) {
                const dist = Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
                if (dist < 1) {  // 같은 점
                    sharedVertices++;
                }
            }
        }

        // 2개 꼭짓점 공유 = 변 공유 = 이웃
        return sharedVertices >= 2;
    }

    /**
     * A* 경로 찾기
     * @param {Vector} start - 시작 위치
     * @param {Vector} goal - 목표 위치
     * @returns {Array<Vector>|null} 웨이포인트 배열 (삼각형 중심점들)
     */
    findPath(start, goal) {
        // 1. 시작/끝 삼각형 찾기
        const startTriangle = this.findTriangle(start);
        const goalTriangle = this.findTriangle(goal);

        if (!startTriangle || !goalTriangle) {
            // console.warn('[Navmesh] Start or goal not in walkable area');
            return null;
        }

        if (startTriangle.id === goalTriangle.id) {
            // 같은 삼각형 내 → 직선 이동
            return [goal];
        }

        // 2. A* 알고리즘
        const path = this.aStar(startTriangle.id, goalTriangle.id);

        if (!path) {
            // console.warn('[Navmesh] No path found');
            return null;
        }

        // 3. 삼각형 ID → 중심점으로 변환
        const waypoints = path.map(id => this.triangles[id].center);

        // 마지막 삼각형 중심 → goal 사이에 벽이 있는지 체크
        const lastCenter = waypoints[waypoints.length - 1];
        const collisions = this.Matter.Query.ray(this.walls, lastCenter, goal);

        // 추가: goal이 벽에 너무 가까운지 체크
        const SAFE_DISTANCE = 60; // 탱크 크기(30) * 2
        let tooCloseToWall = false;

        for (const wall of this.walls) {
            const pointCheck = this.Matter.Query.point([wall], goal);
            if (pointCheck.length > 0) {
                // goal이 벽 안에 있음!
                tooCloseToWall = true;
                break;
            }

            // goal 주변 SAFE_DISTANCE 내에 벽이 있는지
            const nearbyCheck = this.Matter.Query.region(
                [wall],
                {
                    min: { x: goal.x - SAFE_DISTANCE, y: goal.y - SAFE_DISTANCE },
                    max: { x: goal.x + SAFE_DISTANCE, y: goal.y + SAFE_DISTANCE }
                }
            );

            if (nearbyCheck.length > 0) {
                tooCloseToWall = true;
                break;
            }
        }

        if (collisions.length === 0 && !tooCloseToWall) {
            // 벽 없음 + 안전한 거리 → goal 추가
            waypoints.push(goal);
            // console.log(`[Navmesh] Goal is safe - added to path`);
        } else {
            // 벽 있음 또는 너무 가까움 → goal 추가 안 함
            // if (collisions.length > 0) {
            //     console.log(`[Navmesh] Goal blocked by wall - stopping at last triangle`);
            // } else {
            //     console.log(`[Navmesh] Goal too close to wall - stopping at last triangle`);
            // }
        }

        return waypoints;
    }

    /**
     * 위치가 속한 삼각형 찾기
     * @param {Vector} pos - 위치
     * @returns {Triangle|null}
     */
    findTriangle(pos) {
        for (const triangle of this.triangles) {
            if (this.pointInTriangle(pos, triangle.vertices)) {
                return triangle;
            }
        }
        return null;
    }

    /**
     * 점이 삼각형 내부에 있는지 (Barycentric coordinates)
     */
    pointInTriangle(p, vertices) {
        const [v1, v2, v3] = vertices;

        const dX = p.x - v3.x;
        const dY = p.y - v3.y;
        const dX21 = v3.x - v2.x;
        const dY12 = v2.y - v3.y;
        const D = dY12 * (v1.x - v3.x) + dX21 * (v1.y - v3.y);
        const s = dY12 * dX + dX21 * dY;
        const t = (v3.y - v1.y) * dX + (v1.x - v3.x) * dY;

        if (D < 0) return s <= 0 && t <= 0 && s + t >= D;
        return s >= 0 && t >= 0 && s + t <= D;
    }

    /**
     * A* 알고리즘 (삼각형 그래프에서)
     * @param {number} startId - 시작 삼각형 ID
     * @param {number} goalId - 목표 삼각형 ID
     * @returns {Array<number>|null} 삼각형 ID 경로
     */
    aStar(startId, goalId) {
        const openSet = [startId];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(startId, 0);
        fScore.set(startId, this.heuristic(startId, goalId));

        while (openSet.length > 0) {
            // fScore가 가장 낮은 노드 선택
            let current = openSet[0];
            let currentFScore = fScore.get(current);
            for (let i = 1; i < openSet.length; i++) {
                const score = fScore.get(openSet[i]);
                if (score < currentFScore) {
                    current = openSet[i];
                    currentFScore = score;
                }
            }

            // 목표 도달
            if (current === goalId) {
                return this.reconstructPath(cameFrom, current);
            }

            // openSet에서 제거
            openSet.splice(openSet.indexOf(current), 1);

            // 이웃 탐색
            for (const neighbor of this.triangleGraph[current]) {
                const tentativeGScore = gScore.get(current) + this.distance(current, neighbor);

                if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeGScore);
                    fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, goalId));

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return null;  // 경로 없음
    }

    /**
     * 휴리스틱 (유클리드 거리)
     */
    heuristic(fromId, toId) {
        const from = this.triangles[fromId].center;
        const to = this.triangles[toId].center;
        return Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
    }

    /**
     * 두 삼각형 간 거리
     */
    distance(fromId, toId) {
        return this.heuristic(fromId, toId);
    }

    /**
     * A* 경로 재구성
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(current);
        }
        return path;
    }

    /**
     * 디버그: 메시 그리기 (캔버스에)
     */
    debugDraw(ctx) {
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';  // 옅은 붉은색
        ctx.lineWidth = 1;

        for (const triangle of this.triangles) {
            const [v1, v2, v3] = triangle.vertices;
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
            ctx.lineTo(v3.x, v3.y);
            ctx.closePath();
            ctx.stroke();
        }
    }
}
