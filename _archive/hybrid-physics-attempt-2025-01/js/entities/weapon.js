// Weapon System
// Handles weapon creation and firing

class Weapon {
    static fire(weaponData, tank) {
        if (!weaponData || !tank) {
            return null;
        }
        
        const firePos = tank.getFirePosition();
        const weaponType = weaponData.type;
        
        switch (weaponType) {
            case 'MISSILE':
                return this.createMissile(firePos, tank);
            case 'LASER':
                return this.createLaser(firePos, tank);
            case 'BLASTER':
                return this.createBlaster(firePos, tank);
            case 'GUIDE_BLASTER':
                return this.createGuideBlaster(firePos, tank);
            case 'BLAST_GUIDER':
                return this.createBlastGuider(firePos, tank);
            case 'NUKE_BLASTER':
                return this.createNukeBlaster(firePos, tank);
            case 'DOUBLE_MISSILE':
                return this.createDoubleMissile(firePos, tank);
            case 'TRIPLE_MISSILE':
                return this.createTripleMissile(firePos, tank);
            case 'POWER_LASER':
                return this.createPowerLaser(firePos, tank);
            case 'TRI_STRIKER':
                return this.createTriStriker(firePos, tank);
            default:
                return this.createGenericProjectile(weaponType, firePos, tank);
        }
    }
    
    static createMissile(firePos, tank) {
        const speed = GAME_CONFIG.WEAPONS.SPEEDS.MISSILE;
        const velocity = Physics.fromAngle(tank.angle, speed);
        
        return new Projectile({
            ownerId: tank.id,
            type: 'MISSILE',
            x: firePos.x,
            y: firePos.y,
            velocity: velocity,
            angle: tank.angle,
            damage: GAME_CONFIG.WEAPONS.DAMAGE_VALUES.MISSILE,
            color: GAME_CONFIG.COLORS.MISSILE,
            lifetime: 3.0
        });
    }
    
    static createLaser(firePos, tank) {
        const speed = GAME_CONFIG.WEAPONS.SPEEDS.LASER;
        const velocity = Physics.fromAngle(tank.angle, speed);
        
        return new Projectile({
            ownerId: tank.id,
            type: 'LASER',
            x: firePos.x,
            y: firePos.y,
            velocity: velocity,
            angle: tank.angle,
            damage: GAME_CONFIG.WEAPONS.DAMAGE_VALUES.LASER,
            color: GAME_CONFIG.COLORS.LASER,
            lifetime: 2.0,
            radius: 1
        });
    }
    
    static createBlaster(firePos, tank) {
        const speed = GAME_CONFIG.WEAPONS.SPEEDS.BLASTER;
        const velocity = Physics.fromAngle(tank.angle, speed);
        
        return new Projectile({
            ownerId: tank.id,
            type: 'BLASTER',
            x: firePos.x,
            y: firePos.y,
            velocity: velocity,
            angle: tank.angle,
            damage: GAME_CONFIG.WEAPONS.DAMAGE_VALUES.BLASTER,
            color: GAME_CONFIG.COLORS.BLASTER,
            lifetime: 4.0,
            explosionRadius: 25,
            radius: 4
        });
    }
    
    static createGuideBlaster(firePos, tank) {
        const speed = 120;
        const velocity = Physics.fromAngle(tank.angle, speed);
        
        return new Projectile({
            ownerId: tank.id,
            type: 'GUIDE_BLASTER',
            x: firePos.x,
            y: firePos.y,
            velocity: velocity,
            angle: tank.angle,
            damage: 40,
            color: '#00ff88',
            lifetime: 5.0,
            explosionRadius: 30,
            radius: 5
        });
    }
    
    static createBlastGuider(firePos, tank) {
        const speed = 100;
        const velocity = Physics.fromAngle(tank.angle, speed);
        
        return new Projectile({
            ownerId: tank.id,
            type: 'BLAST_GUIDER',
            x: firePos.x,
            y: firePos.y,
            velocity: velocity,
            angle: tank.angle,
            damage: 35,
            color: '#88ff00',
            lifetime: 6.0,
            explosionRadius: 35,
            radius: 6
        });
    }
    
    static createNukeBlaster(firePos, tank) {
        const speed = 80;
        const velocity = Physics.fromAngle(tank.angle, speed);
        
        return new Projectile({
            ownerId: tank.id,
            type: 'NUKE_BLASTER',
            x: firePos.x,
            y: firePos.y,
            velocity: velocity,
            angle: tank.angle,
            damage: 60,
            color: '#ffff88',
            lifetime: 7.0,
            explosionRadius: 40,
            radius: 8
        });
    }
    
    static createDoubleMissile(firePos, tank) {
        const speed = GAME_CONFIG.WEAPONS.SPEEDS.MISSILE;
        const spreadAngle = Math.PI / 16; // 11.25 degrees spread
        
        const projectiles = [];
        
        // Left missile
        const leftAngle = tank.angle - spreadAngle;
        const leftVel = Physics.fromAngle(leftAngle, speed);
        projectiles.push(new Projectile({
            ownerId: tank.id,
            type: 'DOUBLE_MISSILE',
            x: firePos.x,
            y: firePos.y,
            velocity: leftVel,
            angle: leftAngle,
            damage: GAME_CONFIG.WEAPONS.DAMAGE_VALUES.MISSILE,
            color: GAME_CONFIG.COLORS.MISSILE,
            lifetime: 3.0
        }));
        
        // Right missile
        const rightAngle = tank.angle + spreadAngle;
        const rightVel = Physics.fromAngle(rightAngle, speed);
        projectiles.push(new Projectile({
            ownerId: tank.id,
            type: 'DOUBLE_MISSILE',
            x: firePos.x,
            y: firePos.y,
            velocity: rightVel,
            angle: rightAngle,
            damage: GAME_CONFIG.WEAPONS.DAMAGE_VALUES.MISSILE,
            color: GAME_CONFIG.COLORS.MISSILE,
            lifetime: 3.0
        }));
        
        return projectiles;
    }
    
    static createTripleMissile(firePos, tank) {
        const speed = GAME_CONFIG.WEAPONS.SPEEDS.MISSILE;
        const spreadAngle = Math.PI / 12; // 15 degrees spread
        
        const projectiles = [];
        
        // Center missile
        const centerVel = Physics.fromAngle(tank.angle, speed);
        projectiles.push(new Projectile({
            ownerId: tank.id,
            type: 'TRIPLE_MISSILE',
            x: firePos.x,
            y: firePos.y,
            velocity: centerVel,
            angle: tank.angle,
            damage: GAME_CONFIG.WEAPONS.DAMAGE_VALUES.MISSILE,
            color: GAME_CONFIG.COLORS.MISSILE,
            lifetime: 3.0
        }));
        
        // Left missile
        const leftAngle = tank.angle - spreadAngle;
        const leftVel = Physics.fromAngle(leftAngle, speed);
        projectiles.push(new Projectile({
            ownerId: tank.id,
            type: 'TRIPLE_MISSILE',
            x: firePos.x,
            y: firePos.y,
            velocity: leftVel,
            angle: leftAngle,
            damage: GAME_CONFIG.WEAPONS.DAMAGE_VALUES.MISSILE,
            color: GAME_CONFIG.COLORS.MISSILE,
            lifetime: 3.0
        }));
        
        // Right missile
        const rightAngle = tank.angle + spreadAngle;
        const rightVel = Physics.fromAngle(rightAngle, speed);
        projectiles.push(new Projectile({
            ownerId: tank.id,
            type: 'TRIPLE_MISSILE',
            x: firePos.x,
            y: firePos.y,
            velocity: rightVel,
            angle: rightAngle,
            damage: GAME_CONFIG.WEAPONS.DAMAGE_VALUES.MISSILE,
            color: GAME_CONFIG.COLORS.MISSILE,
            lifetime: 3.0
        }));
        
        return projectiles;
    }
    
    static createPowerLaser(firePos, tank) {
        const speed = GAME_CONFIG.WEAPONS.SPEEDS.LASER;
        const velocity = Physics.fromAngle(tank.angle, speed);
        
        return new Projectile({
            ownerId: tank.id,
            type: 'POWER_LASER',
            x: firePos.x,
            y: firePos.y,
            velocity: velocity,
            angle: tank.angle,
            damage: 12, // Double laser damage
            color: '#ff4444',
            lifetime: 2.5,
            radius: 2 // Slightly bigger than regular laser
        });
    }
    
    static createTriStriker(firePos, tank) {
        const speed = 250;
        const spreadAngle = Math.PI / 24; // 7.5 degrees spread - tighter formation
        
        const projectiles = [];
        
        // Center projectile
        const centerVel = Physics.fromAngle(tank.angle, speed);
        projectiles.push(new Projectile({
            ownerId: tank.id,
            type: 'TRI_STRIKER',
            x: firePos.x,
            y: firePos.y,
            velocity: centerVel,
            angle: tank.angle,
            damage: 4,
            color: '#ff8800',
            lifetime: 3.5,
            radius: 2
        }));
        
        // Left projectile
        const leftAngle = tank.angle - spreadAngle;
        const leftVel = Physics.fromAngle(leftAngle, speed);
        projectiles.push(new Projectile({
            ownerId: tank.id,
            type: 'TRI_STRIKER',
            x: firePos.x,
            y: firePos.y,
            velocity: leftVel,
            angle: leftAngle,
            damage: 4,
            color: '#ff8800',
            lifetime: 3.5,
            radius: 2
        }));
        
        // Right projectile
        const rightAngle = tank.angle + spreadAngle;
        const rightVel = Physics.fromAngle(rightAngle, speed);
        projectiles.push(new Projectile({
            ownerId: tank.id,
            type: 'TRI_STRIKER',
            x: firePos.x,
            y: firePos.y,
            velocity: rightVel,
            angle: rightAngle,
            damage: 4,
            color: '#ff8800',
            lifetime: 3.5,
            radius: 2
        }));
        
        return projectiles;
    }
    
    static createGenericProjectile(weaponType, firePos, tank) {
        const speed = 200; // Default speed
        const velocity = Physics.fromAngle(tank.angle, speed);
        
        return new Projectile({
            ownerId: tank.id,
            type: weaponType,
            x: firePos.x,
            y: firePos.y,
            velocity: velocity,
            angle: tank.angle,
            damage: 3,
            lifetime: 3.0
        });
    }
}