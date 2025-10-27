// Scoring System
// Handles points and money calculation

class ScoringSystem {
    constructor() {
        console.log('🏆 Scoring System initialized');
    }
    
    awardHitPoints(shooter, damage) {
        const points = Math.min(damage, GAME_CONFIG.SCORING.MAX_DAMAGE_POINTS) * GAME_CONFIG.SCORING.DAMAGE_POINTS;
        const money = damage * GAME_CONFIG.SCORING.MONEY_PER_DAMAGE;
        
        // Update game state if available
        if (window.game && window.game.engine && window.game.engine.state) {
            window.game.engine.state.updatePlayerScore(shooter.id, points);
            window.game.engine.state.updatePlayerMoney(shooter.id, money);
        }
        
        console.log(`🎯 ${shooter.id} hit for ${damage} damage: +${points} points, +${money} credits`);
        
        return { points, money };
    }
    
    awardKillPoints(shooter) {
        const points = GAME_CONFIG.SCORING.KILL_POINTS;
        
        // Update game state if available
        if (window.game && window.game.engine && window.game.engine.state) {
            window.game.engine.state.updatePlayerScore(shooter.id, points);
        }
        
        console.log(`💀 ${shooter.id} scored a kill: +${points} points`);
        
        return points;
    }
    
    calculateTotalScore(player) {
        return player.score || 0;
    }
    
    calculateTotalMoney(player) {
        return player.money || 0;
    }
    
    getKillDeathRatio(player) {
        if (!player.deaths || player.deaths === 0) {
            return player.kills || 0;
        }
        return (player.kills || 0) / player.deaths;
    }
    
    getAccuracy(player) {
        if (!player.shotsFired || player.shotsFired === 0) {
            return 0;
        }
        return (player.shotsHit || 0) / player.shotsFired;
    }
    
    getDamageEfficiency(player) {
        if (!player.energyUsed || player.energyUsed === 0) {
            return 0;
        }
        return (player.damageDealt || 0) / player.energyUsed;
    }
}