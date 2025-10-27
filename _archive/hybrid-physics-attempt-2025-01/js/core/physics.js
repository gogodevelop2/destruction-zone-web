// Physics Engine - Matter.js v2 (With Brake System)
// 브레이크 시스템을 포함한 현실적인 탱크 물리

class Physics {
    constructor(canvasWidth, canvasHeight) {
        // Physics constants (for original physics - kept for reference)
        this.gravity = 0;
        this.friction = 0.95;
        this.restitution = 0.8;

        this.width = canvasWidth;
        this.height = canvasHeight;

        // ========================================
        // Matter.js v2: Engine Creation
        // ========================================
        if (typeof Matter !== 'undefined') {
            // Create Matter.js engine
            this.engine = Matter.Engine.create({
                gravity: { x: 0, y: 0 },  // 탑다운 뷰 (중력 없음)
                enableSleeping: false
            });
            this.world = this.engine.world;

            // 경계벽 생성
            if (canvasWidth && canvasHeight) {
                this.createBoundaries(canvasWidth, canvasHeight);
            }

            // 충돌 콜백 저장
            this.collisionCallbacks = {
                tankTank: null,
                projectileTank: null,
                projectileWall: null
            };

            // 충돌 이벤트 설정
            this.setupCollisionEvents();

            console.log('⚡ Physics engine initialized (Matter.js v2 with Brake System)');
        } else {
            console.warn('⚠️ Matter.js not loaded, falling back to custom physics');
        }
    }

    update(deltaTime) {
        // Matter.js 시뮬레이션 업데이트
        if (this.engine) {
            // deltaTime을 밀리초로 변환 (Matter.js는 ms 단위)
            Matter.Engine.update(this.engine, deltaTime * 1000);
        }
    }

    // ========================================
    // Matter.js v2: Body Management
    // ========================================
    addBody(body) {
        if (this.world && body) {
            Matter.World.add(this.world, body);
        }
    }

    removeBody(body) {
        if (this.world && body) {
            Matter.World.remove(this.world, body);
        }
    }

    // ========================================
    // Matter.js v2: Boundaries
    // ========================================
    createBoundaries(width, height) {
        const wallThickness = 50;
        const options = {
            isStatic: true,
            friction: 0.8,
            restitution: 0.1,
            label: 'wall'
        };

        const walls = [
            // 위
            Matter.Bodies.rectangle(
                width / 2, -wallThickness / 2,
                width, wallThickness, options
            ),
            // 아래
            Matter.Bodies.rectangle(
                width / 2, height + wallThickness / 2,
                width, wallThickness, options
            ),
            // 왼쪽
            Matter.Bodies.rectangle(
                -wallThickness / 2, height / 2,
                wallThickness, height, options
            ),
            // 오른쪽
            Matter.Bodies.rectangle(
                width + wallThickness / 2, height / 2,
                wallThickness, height, options
            )
        ];

        Matter.World.add(this.world, walls);
        console.log('🧱 Matter.js boundaries created');
    }

    // ========================================
    // Matter.js v2: Collision Events
    // ========================================
    setupCollisionEvents() {
        if (!this.engine) return;

        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                this.handleCollision(pair.bodyA, pair.bodyB, pair);
            });
        });
    }

    handleCollision(bodyA, bodyB, pair) {
        const labelA = bodyA.label;
        const labelB = bodyB.label;

        // Tank ↔ Tank 충돌
        if (labelA.startsWith('tank_') && labelB.startsWith('tank_')) {
            if (this.collisionCallbacks.tankTank) {
                const impactVelocity = pair.collision.depth;
                if (impactVelocity > 2) {
                    const damage = Math.floor(impactVelocity * 0.5);
                    this.collisionCallbacks.tankTank(bodyA, bodyB, damage);
                }
            }
        }

        // Projectile ↔ Tank 충돌
        if (labelA.startsWith('projectile_') && labelB.startsWith('tank_')) {
            if (this.collisionCallbacks.projectileTank) {
                this.collisionCallbacks.projectileTank(bodyA, bodyB);
            }
        }
        if (labelA.startsWith('tank_') && labelB.startsWith('projectile_')) {
            if (this.collisionCallbacks.projectileTank) {
                this.collisionCallbacks.projectileTank(bodyB, bodyA);
            }
        }

        // Projectile ↔ Wall 충돌
        if (labelA.startsWith('projectile_') && labelB === 'wall') {
            if (this.collisionCallbacks.projectileWall) {
                this.collisionCallbacks.projectileWall(bodyA);
            }
        }
        if (labelA === 'wall' && labelB.startsWith('projectile_')) {
            if (this.collisionCallbacks.projectileWall) {
                this.collisionCallbacks.projectileWall(bodyB);
            }
        }
    }

    onTankTankCollision(callback) {
        this.collisionCallbacks.tankTank = callback;
    }

    onProjectileTankCollision(callback) {
        this.collisionCallbacks.projectileTank = callback;
    }

    onProjectileWallCollision(callback) {
        this.collisionCallbacks.projectileWall = callback;
    }

    // Matter.js methods commented out for future use
    /*
    setupCollisionEvents() { ... }
    handleCollision(bodyA, bodyB) { ... }
    onTankTankCollision(callback) { ... }
    onProjectileTankCollision(callback) { ... }
    onProjectileWallCollision(callback) { ... }
    createBoundaries(width, height) { ... }
    createCircleBody(entity, radius, options) { ... }
    createPolygonBody(entity, vertices, options) { ... }
    removeBody(entity) { ... }
    syncEntityToBody(entity) { ... }
    syncBodyToEntity(entity) { ... }
    */
    
    // Vector operations
    static createVector(x, y) {
        return { x: x || 0, y: y || 0 };
    }
    
    static addVectors(v1, v2) {
        return {
            x: v1.x + v2.x,
            y: v1.y + v2.y
        };
    }
    
    static subtractVectors(v1, v2) {
        return {
            x: v1.x - v2.x,
            y: v1.y - v2.y
        };
    }
    
    static multiplyVector(v, scalar) {
        return {
            x: v.x * scalar,
            y: v.y * scalar
        };
    }
    
    static dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
    
    static magnitude(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }
    
    static normalize(v) {
        const mag = this.magnitude(v);
        if (mag === 0) return { x: 0, y: 0 };
        return {
            x: v.x / mag,
            y: v.y / mag
        };
    }
    
    static distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    static angle(v) {
        return Math.atan2(v.y, v.x);
    }
    
    static fromAngle(angle, magnitude = 1) {
        return {
            x: Math.cos(angle) * magnitude,
            y: Math.sin(angle) * magnitude
        };
    }
    
    // Rotation operations
    static rotateVector(v, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: v.x * cos - v.y * sin,
            y: v.x * sin + v.y * cos
        };
    }
    
    static rotatePoint(point, center, angle) {
        const translated = this.subtractVectors(point, center);
        const rotated = this.rotateVector(translated, angle);
        return this.addVectors(rotated, center);
    }
    
    // Collision detection
    static circleCollision(circle1, circle2) {
        const distance = this.distance(circle1, circle2);
        return distance < (circle1.radius + circle2.radius);
    }
    
    static pointInCircle(point, circle) {
        const distance = this.distance(point, circle);
        return distance < circle.radius;
    }
    
    static lineIntersectsCircle(lineStart, lineEnd, circle) {
        const lineVec = this.subtractVectors(lineEnd, lineStart);
        const circleVec = this.subtractVectors(circle, lineStart);
        
        const lineLengthSq = this.dotProduct(lineVec, lineVec);
        if (lineLengthSq === 0) {
            return this.distance(lineStart, circle) <= circle.radius;
        }
        
        const t = Math.max(0, Math.min(1, this.dotProduct(circleVec, lineVec) / lineLengthSq));
        const closestPoint = this.addVectors(lineStart, this.multiplyVector(lineVec, t));
        
        return this.distance(closestPoint, circle) <= circle.radius;
    }
    
    // AABB (Axis-Aligned Bounding Box) collision
    static aabbCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // Polygon collision (for triangular tanks)
    static pointInPolygon(point, polygon) {
        let inside = false;
        const { x, y } = point;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    static polygonCollision(poly1, poly2) {
        // Simplified SAT (Separating Axis Theorem) for triangles
        const axes = this.getPolygonAxes(poly1).concat(this.getPolygonAxes(poly2));
        
        for (const axis of axes) {
            const proj1 = this.projectPolygon(poly1, axis);
            const proj2 = this.projectPolygon(poly2, axis);
            
            if (!this.projectionOverlap(proj1, proj2)) {
                return false; // Separating axis found
            }
        }
        
        return true; // No separating axis found
    }
    
    static getPolygonAxes(polygon) {
        const axes = [];
        for (let i = 0; i < polygon.length; i++) {
            const current = polygon[i];
            const next = polygon[(i + 1) % polygon.length];
            const edge = this.subtractVectors(next, current);
            
            // Perpendicular to edge (normal)
            const normal = { x: -edge.y, y: edge.x };
            axes.push(this.normalize(normal));
        }
        return axes;
    }
    
    static projectPolygon(polygon, axis) {
        let min = this.dotProduct(polygon[0], axis);
        let max = min;
        
        for (let i = 1; i < polygon.length; i++) {
            const projection = this.dotProduct(polygon[i], axis);
            min = Math.min(min, projection);
            max = Math.max(max, projection);
        }
        
        return { min, max };
    }
    
    static projectionOverlap(proj1, proj2) {
        return proj1.max >= proj2.min && proj2.max >= proj1.min;
    }
    
    // Boundary constraints
    static constrainToBounds(entity, width, height, margin = 0) {
        entity.x = Math.max(margin, Math.min(width - margin, entity.x));
        entity.y = Math.max(margin, Math.min(height - margin, entity.y));
    }
    
    static wrapToBounds(entity, width, height) {
        if (entity.x < 0) entity.x = width;
        if (entity.x > width) entity.x = 0;
        if (entity.y < 0) entity.y = height;
        if (entity.y > height) entity.y = 0;
    }
    
    // Tank-specific physics
    static updateTankMovement(tank, deltaTime) {
        // Apply thrust
        if (tank.thrustPower !== 0) {
            const thrustForce = Physics.fromAngle(tank.angle, tank.thrustPower * tank.stats.speed * 200);
            tank.velocity = Physics.addVectors(tank.velocity, Physics.multiplyVector(thrustForce, deltaTime));
        }
        
        // Apply rotation
        if (tank.rotationPower !== 0) {
            tank.angularVelocity += tank.rotationPower * tank.stats.rotationSpeed * 3 * deltaTime;
        }
        
        // Apply friction
        tank.velocity = Physics.multiplyVector(tank.velocity, Math.pow(0.95, deltaTime * 60));
        tank.angularVelocity *= Math.pow(0.9, deltaTime * 60);
        
        // Limit velocities
        const maxSpeed = tank.stats.speed * 100; // pixels per second
        const speed = Physics.magnitude(tank.velocity);
        if (speed > maxSpeed) {
            tank.velocity = Physics.multiplyVector(Physics.normalize(tank.velocity), maxSpeed);
        }
        
        const maxAngularSpeed = tank.stats.rotationSpeed * 5; // radians per second
        tank.angularVelocity = Math.max(-maxAngularSpeed, Math.min(maxAngularSpeed, tank.angularVelocity));
        
        // Update position and rotation
        tank.x += tank.velocity.x * deltaTime;
        tank.y += tank.velocity.y * deltaTime;
        tank.angle += tank.angularVelocity * deltaTime;
        
        // Normalize angle
        tank.angle = tank.angle % (Math.PI * 2);
        if (tank.angle < 0) tank.angle += Math.PI * 2;
    }
    
    static updateProjectileMovement(projectile, deltaTime) {
        // Update position
        projectile.x += projectile.velocity.x * deltaTime;
        projectile.y += projectile.velocity.y * deltaTime;
        
        // Update lifetime
        projectile.lifetime -= deltaTime;
        
        // Handle guided projectiles
        if (projectile.isGuided && projectile.target) {
            const toTarget = Physics.subtractVectors(projectile.target, projectile);
            const targetDir = Physics.normalize(toTarget);
            const currentDir = Physics.normalize(projectile.velocity);
            
            // Gradually turn towards target
            const turnRate = projectile.guidanceStrength || 0.1;
            const newDir = Physics.normalize(Physics.addVectors(
                Physics.multiplyVector(currentDir, 1 - turnRate),
                Physics.multiplyVector(targetDir, turnRate)
            ));
            
            const speed = Physics.magnitude(projectile.velocity);
            projectile.velocity = Physics.multiplyVector(newDir, speed);
        }
    }
}