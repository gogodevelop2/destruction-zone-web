// Game State Manager
// Manages overall game state and progression

class GameState {
    constructor() {
        this.phase = 'menu'; // menu, playing, paused, shop, game-over
        this.gameTime = 0;
        this.round = 1;
        this.maxRounds = 15;
        this.roundTime = 0; // Current round elapsed time
        this.roundTimeLimit = GAME_CONFIG.TIMING.ROUND_TIME; // 300 seconds (5 minutes)
        
        // Player data
        this.players = new Map();
        this.currentPlayer = null;
        
        // Game settings
        this.gameMode = 'hostile'; // hostile, teams
        this.shopInterval = 3; // rounds between shop visits
        
        // Statistics
        this.stats = {
            totalKills: 0,
            totalDamage: 0,
            roundsPlayed: 0,
            timeElapsed: 0
        };
        
        console.log('📊 Game State initialized');
    }
    
    init() {
        this.phase = 'playing';
        this.gameTime = 0;
        this.round = 1;
        this.roundTime = 0;
        this.shouldEndRound = null;
        
        // Initialize default player if none exists
        if (this.players.size === 0) {
            this.addPlayer({
                id: 'player1',
                name: 'Player 1',
                score: 0,
                money: 1000,
                isHuman: true
            });
        }
        
        console.log('🎯 Game state initialized for new game');
    }
    
    update(deltaTime) {
        if (this.phase === 'playing') {
            this.gameTime += deltaTime;
            this.roundTime += deltaTime;
            this.stats.timeElapsed += deltaTime;
            
            // Check if round time limit exceeded
            if (this.roundTime >= this.roundTimeLimit) {
                this.onRoundTimeUp();
            }
        }
    }
    
    onRoundTimeUp() {
        console.log('⏰ Round time limit reached!');
        // Mark that round should end, but let engine handle it
        this.shouldEndRound = { reason: 'timeout', winner: null };
    }
    
    endRound(reason, winner = null) {
        console.log(`🏁 Round ${this.round} ended - Reason: ${reason}`, winner ? `Winner: ${winner.id}` : '');
        
        // Award points based on reason
        if (reason === 'kill' && winner) {
            if (this.players.has(winner.id)) {
                this.updatePlayerScore(winner.id, GAME_CONFIG.SCORING.KILL_POINTS);
                this.updatePlayerMoney(winner.id, 50); // Bonus money for winning
            }
        } else if (reason === 'timeout' && winner) {
            // Award points to player with most health remaining
            if (this.players.has(winner.id)) {
                this.updatePlayerScore(winner.id, 1); // Smaller bonus for surviving
                console.log(`🎖️ ${winner.name} survives the round`);
            }
        }
        
        // Reset round end flag
        this.shouldEndRound = null;
        
        // Move to next round
        const nextPhase = this.nextRound();
        return nextPhase;
    }
    
    getRoundTimeRemaining() {
        return Math.max(0, this.roundTimeLimit - this.roundTime);
    }
    
    getRoundProgress() {
        return Math.min(1, this.roundTime / this.roundTimeLimit);
    }
    
    isRoundTimeUp() {
        return this.roundTime >= this.roundTimeLimit;
    }
    
    addPlayer(playerData) {
        const player = {
            id: playerData.id,
            name: playerData.name || `Player ${this.players.size + 1}`,
            score: playerData.score || 0,
            money: playerData.money || 1000,
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            isHuman: playerData.isHuman || false,
            tankType: 'STANDARD',
            weapons: this.getDefaultWeapons(),
            ownedWeapons: {
                port1: [0], // Start with MISSILE (index 0 in Port 1)
                port2: [],
                port3: [],
                port4: [],
                port5: [],
                port6: [],
                port7: []
            },
            upgrades: {
                speed: 0,
                rotation: 0,
                armor: 0,
                energy: 0
            }
        };
        
        this.players.set(player.id, player);
        
        if (!this.currentPlayer && player.isHuman) {
            this.currentPlayer = player.id;
        }
        
        console.log(`👤 Player added: ${player.name}`);
        return player;
    }
    
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    getCurrentPlayer() {
        return this.currentPlayer ? this.players.get(this.currentPlayer) : null;
    }
    
    updatePlayerScore(playerId, points) {
        const player = this.players.get(playerId);
        if (player) {
            player.score += points;
            console.log(`📈 ${player.name} scored ${points} points (Total: ${player.score})`);
        }
    }
    
    updatePlayerMoney(playerId, amount) {
        const player = this.players.get(playerId);
        if (player) {
            player.money += amount;
            console.log(`💰 ${player.name} ${amount > 0 ? 'earned' : 'spent'} ${Math.abs(amount)} credits (Total: ${player.money})`);
        }
    }
    
    canPlayerAfford(playerId, cost) {
        const player = this.players.get(playerId);
        return player && player.money >= cost;
    }
    
    getDefaultWeapons() {
        return {
            port1: { type: 'MISSILE', ammo: Infinity },
            port2: null,
            port3: null,
            port4: null,
            port5: null,
            port6: null,
            port7: null
        };
    }
    
    nextRound() {
        this.round++;
        this.gameTime = 0;
        this.roundTime = 0; // Reset round timer
        this.stats.roundsPlayed++;
        
        console.log(`🔄 Round ${this.round} started`);
        
        // Check if it's time for shop
        if (this.round % this.shopInterval === 1 && this.round > 1) {
            this.phase = 'shop';
            console.log('🛒 Shop time!');
            return 'shop';
        }
        
        // Check if game is over
        if (this.round > this.maxRounds) {
            this.phase = 'game-over';
            console.log('🏁 Game Over!');
            return 'game-over';
        }
        
        return 'playing';
    }
    
    setPhase(phase) {
        const previousPhase = this.phase;
        this.phase = phase;
        console.log(`🎮 Game phase changed: ${previousPhase} → ${phase}`);
    }
    
    isShopRound() {
        return this.round % this.shopInterval === 1 && this.round > 1;
    }
    
    isGameOver() {
        return this.round > this.maxRounds || this.phase === 'game-over';
    }
    
    getLeaderboard() {
        const players = Array.from(this.players.values());
        return players.sort((a, b) => b.score - a.score);
    }
    
    getGameProgress() {
        return {
            round: this.round,
            maxRounds: this.maxRounds,
            progress: this.round / this.maxRounds,
            timeElapsed: this.stats.timeElapsed,
            phase: this.phase
        };
    }
    
    getStatistics() {
        return {
            ...this.stats,
            players: this.players.size,
            leaderboard: this.getLeaderboard().slice(0, 5)
        };
    }
    
    saveGame() {
        const saveData = {
            version: '1.0',
            timestamp: Date.now(),
            round: this.round,
            gameTime: this.gameTime,
            players: Array.from(this.players.entries()),
            stats: this.stats,
            gameMode: this.gameMode
        };
        
        try {
            localStorage.setItem('destruction-zone-save', JSON.stringify(saveData));
            console.log('💾 Game saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to save game:', error);
            return false;
        }
    }
    
    loadGame() {
        try {
            const saveData = JSON.parse(localStorage.getItem('destruction-zone-save'));
            if (!saveData) return false;
            
            this.round = saveData.round;
            this.gameTime = saveData.gameTime;
            this.stats = saveData.stats;
            this.gameMode = saveData.gameMode;
            
            // Restore players
            this.players.clear();
            for (const [id, playerData] of saveData.players) {
                this.players.set(id, playerData);
            }
            
            console.log('📁 Game loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load game:', error);
            return false;
        }
    }
    
    reset() {
        this.phase = 'menu';
        this.gameTime = 0;
        this.round = 1;
        this.roundTime = 0;
        this.shouldEndRound = null;
        this.players.clear();
        this.currentPlayer = null;
        this.stats = {
            totalKills: 0,
            totalDamage: 0,
            roundsPlayed: 0,
            timeElapsed: 0
        };
        
        console.log('🔄 Game state reset');
    }
}