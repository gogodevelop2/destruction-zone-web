// Shop System - Complete implementation
class ShopSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.isOpen = false;
        this.selectedCategory = 'weapons';
        this.selectedItem = null;
        this.priceMultiplier = 1.0; // Increases with player score

        console.log('🛒 Shop System initialized');
    }

    open(playerId) {
        this.isOpen = true;
        this.currentPlayerId = playerId;
        this.selectedCategory = 'weapons';
        this.selectedItem = null;
        this.updatePriceMultiplier();
        this.render();

        console.log(`🛒 Shop opened for ${playerId}`);
    }

    close() {
        this.isOpen = false;
        this.selectedItem = null;

        // Hide shop screen
        document.getElementById('shop-screen').classList.remove('active');

        console.log('🛒 Shop closed');
    }

    updatePriceMultiplier() {
        const player = this.gameState.getPlayer(this.currentPlayerId);
        if (!player) return;

        // Price increases by 5% for every 10 points scored
        const scoreMultiplier = 1 + (Math.floor(player.score / 10) * 0.05);
        this.priceMultiplier = scoreMultiplier;

        console.log(`💰 Price multiplier: ${this.priceMultiplier.toFixed(2)}x`);
    }

    getAdjustedPrice(basePrice) {
        return Math.floor(basePrice * this.priceMultiplier);
    }

    canAfford(price) {
        const player = this.gameState.getPlayer(this.currentPlayerId);
        return player && player.money >= this.getAdjustedPrice(price);
    }

    purchaseWeapon(portNumber, weaponIndex) {
        const player = this.gameState.getPlayer(this.currentPlayerId);
        if (!player) return false;

        const weapon = WeaponData.getWeapon(portNumber, weaponIndex);
        if (!weapon) {
            console.log('❌ Invalid weapon');
            return false;
        }

        const price = this.getAdjustedPrice(weapon.price);

        if (!this.canAfford(weapon.price)) {
            console.log('❌ Not enough money');
            this.showMessage('Not enough credits!', 'error');
            return false;
        }

        // Check if already owned
        if (this.hasWeapon(player, portNumber, weaponIndex)) {
            console.log('❌ Already owned');
            this.showMessage('You already own this weapon!', 'error');
            return false;
        }

        // Deduct money
        this.gameState.updatePlayerMoney(this.currentPlayerId, -price);

        // Add weapon to player's inventory
        const portKey = `port${portNumber}`;
        if (!player.ownedWeapons) {
            player.ownedWeapons = {};
        }
        if (!player.ownedWeapons[portKey]) {
            player.ownedWeapons[portKey] = [];
        }
        player.ownedWeapons[portKey].push(weaponIndex);

        console.log(`✅ Purchased ${weapon.name} for ${price} credits`);
        this.showMessage(`Purchased ${weapon.name}!`, 'success');
        this.render(); // Refresh display

        return true;
    }

    purchaseTank(tankType) {
        const player = this.gameState.getPlayer(this.currentPlayerId);
        if (!player) return false;

        const tank = TankData.getTankType(tankType);
        if (!tank) {
            console.log('❌ Invalid tank type');
            return false;
        }

        const price = this.getAdjustedPrice(tank.price);

        if (!this.canAfford(tank.price)) {
            console.log('❌ Not enough money');
            this.showMessage('Not enough credits!', 'error');
            return false;
        }

        if (player.tankType === tankType) {
            console.log('❌ Already using this tank');
            this.showMessage('You already have this tank!', 'error');
            return false;
        }

        // Deduct money
        this.gameState.updatePlayerMoney(this.currentPlayerId, -price);

        // Change tank type
        player.tankType = tankType;

        console.log(`✅ Purchased ${tank.name} for ${price} credits`);
        this.showMessage(`Purchased ${tank.name}!`, 'success');
        this.render();

        return true;
    }

    purchaseUpgrade(upgradeType) {
        const player = this.gameState.getPlayer(this.currentPlayerId);
        if (!player) return false;

        const currentLevel = player.upgrades[upgradeType.toLowerCase()] || 0;
        const upgrade = TankData.getUpgrade(upgradeType);

        if (!upgrade) {
            console.log('❌ Invalid upgrade type');
            return false;
        }

        if (currentLevel >= upgrade.maxLevel) {
            console.log('❌ Max level reached');
            this.showMessage('Maximum upgrade level reached!', 'error');
            return false;
        }

        const nextLevel = currentLevel + 1;
        const levelData = TankData.getUpgradeLevel(upgradeType, nextLevel);

        if (!levelData) {
            console.log('❌ Invalid upgrade level');
            return false;
        }

        const price = this.getAdjustedPrice(levelData.price);

        if (!this.canAfford(levelData.price)) {
            console.log('❌ Not enough money');
            this.showMessage('Not enough credits!', 'error');
            return false;
        }

        // Deduct money
        this.gameState.updatePlayerMoney(this.currentPlayerId, -price);

        // Apply upgrade
        player.upgrades[upgradeType.toLowerCase()] = nextLevel;

        console.log(`✅ Purchased ${upgrade.name} Level ${nextLevel} for ${price} credits`);
        this.showMessage(`Upgraded ${upgrade.name} to Level ${nextLevel}!`, 'success');
        this.render();

        return true;
    }

    hasWeapon(player, portNumber, weaponIndex) {
        if (!player.ownedWeapons) return false;
        const portKey = `port${portNumber}`;
        const ownedWeapons = player.ownedWeapons[portKey];
        return ownedWeapons && ownedWeapons.includes(weaponIndex);
    }

    showMessage(text, type = 'info') {
        // Create temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `shop-message ${type}`;
        messageEl.textContent = text;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? '#660000' : '#006600'};
            color: ${type === 'error' ? '#ff4444' : '#00ff00'};
            border: 2px solid ${type === 'error' ? '#aa0000' : '#00aa00'};
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 1.5rem;
            z-index: 10000;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 2000);
    }

    render() {
        const shopScreen = document.getElementById('shop-screen');
        const shopContainer = document.getElementById('shop-container');

        if (!shopScreen || !shopContainer) return;

        // Show shop screen
        shopScreen.classList.add('active');
        document.getElementById('game-screen').classList.remove('active');

        const player = this.gameState.getPlayer(this.currentPlayerId);
        if (!player) return;

        // Build shop HTML
        shopContainer.innerHTML = `
            <div class="shop-player-status">
                <h3>Player Status</h3>
                <div class="status-item">
                    <span class="status-label">Name:</span>
                    <span class="status-value">${player.name}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Credits:</span>
                    <span class="status-value money">${player.money}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Score:</span>
                    <span class="status-value score">${player.score}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Tank:</span>
                    <span class="status-value">${player.tankType}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Price Multiplier:</span>
                    <span class="status-value">${this.priceMultiplier.toFixed(2)}x</span>
                </div>
            </div>

            <div class="shop-details">
                <div class="shop-tabs">
                    <button class="shop-tab ${this.selectedCategory === 'weapons' ? 'active' : ''}" data-category="weapons">Weapons</button>
                    <button class="shop-tab ${this.selectedCategory === 'tanks' ? 'active' : ''}" data-category="tanks">Tanks</button>
                    <button class="shop-tab ${this.selectedCategory === 'upgrades' ? 'active' : ''}" data-category="upgrades">Upgrades</button>
                </div>
                <div class="shop-items-grid">
                    ${this.renderCategory(player)}
                </div>
            </div>

            <div class="shop-category">
                <h3>Quick Actions</h3>
                <button class="shop-btn exit" id="shop-exit-btn">Exit Shop & Continue</button>
                <div style="margin-top: 20px; color: #888; font-size: 0.9rem;">
                    <p>Round ${this.gameState.round} of ${this.gameState.maxRounds}</p>
                    <p>Next shop in ${this.gameState.shopInterval - (this.gameState.round % this.gameState.shopInterval)} rounds</p>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEventListeners();
    }

    renderCategory(player) {
        switch (this.selectedCategory) {
            case 'weapons':
                return this.renderWeapons(player);
            case 'tanks':
                return this.renderTanks(player);
            case 'upgrades':
                return this.renderUpgrades(player);
            default:
                return '<p>Select a category</p>';
        }
    }

    renderWeapons(player) {
        let html = '<div class="shop-weapons-list">';

        // Port 1 weapons
        html += '<div class="port-section"><h4 style="color: #ffff00;">Port 1 Weapons</h4>';
        const port1Weapons = WeaponData.getAvailableWeapons(1);
        port1Weapons.forEach((weapon, index) => {
            const owned = this.hasWeapon(player, 1, index);
            const price = this.getAdjustedPrice(weapon.price);
            const canAfford = this.canAfford(weapon.price);

            html += `
                <div class="shop-item ${owned ? 'owned' : ''}" data-type="weapon" data-port="1" data-index="${index}">
                    <div class="shop-item-name">${weapon.name}</div>
                    <div class="shop-item-desc">${weapon.description}</div>
                    <div class="shop-item-stats">DMG: ${weapon.damage} | Energy: ${weapon.energyCost}</div>
                    <div class="shop-item-price">${owned ? 'OWNED' : `${price} CR ${!canAfford ? '(Not enough)' : ''}`}</div>
                    ${!owned && canAfford ? `<button class="shop-btn buy" data-action="buy-weapon" data-port="1" data-index="${index}">Buy</button>` : ''}
                </div>
            `;
        });
        html += '</div>';

        // Port 2 weapons
        html += '<div class="port-section"><h4 style="color: #00ff00;">Port 2 Weapons</h4>';
        const port2Weapons = WeaponData.getAvailableWeapons(2);
        port2Weapons.forEach((weapon, index) => {
            const owned = this.hasWeapon(player, 2, index);
            const price = this.getAdjustedPrice(weapon.price);
            const canAfford = this.canAfford(weapon.price);

            html += `
                <div class="shop-item ${owned ? 'owned' : ''}" data-type="weapon" data-port="2" data-index="${index}">
                    <div class="shop-item-name">${weapon.name}</div>
                    <div class="shop-item-desc">${weapon.description}</div>
                    <div class="shop-item-stats">DMG: ${weapon.damage} | Energy: ${weapon.energyCost} | Explosion: ${weapon.explosionRadius || 0}</div>
                    <div class="shop-item-price">${owned ? 'OWNED' : `${price} CR ${!canAfford ? '(Not enough)' : ''}`}</div>
                    ${!owned && canAfford ? `<button class="shop-btn buy" data-action="buy-weapon" data-port="2" data-index="${index}">Buy</button>` : ''}
                </div>
            `;
        });
        html += '</div>';

        html += '</div>';
        return html;
    }

    renderTanks(player) {
        let html = '<div class="shop-tanks-list">';

        TankData.getAllTankTypes().forEach(tank => {
            const owned = player.tankType === tank.name;
            const price = this.getAdjustedPrice(tank.price);
            const canAfford = this.canAfford(tank.price);

            html += `
                <div class="shop-item ${owned ? 'owned' : ''}" data-type="tank" data-tank="${tank.name}">
                    <div class="shop-item-name">${tank.name}</div>
                    <div class="shop-item-desc">${tank.description}</div>
                    <div class="shop-item-stats">
                        Shield: ${tank.stats.maxShield} | Energy: ${tank.stats.maxWeaponEnergy}<br>
                        Speed: ${tank.stats.maxSpeed} | Rotation: ${tank.stats.rotationSpeed}
                    </div>
                    <div class="shop-item-price">${owned ? 'CURRENT' : tank.price === 0 ? 'FREE' : `${price} CR ${!canAfford ? '(Not enough)' : ''}`}</div>
                    ${!owned && canAfford && tank.price > 0 ? `<button class="shop-btn buy" data-action="buy-tank" data-tank="${tank.name}">Buy</button>` : ''}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    renderUpgrades(player) {
        let html = '<div class="shop-upgrades-list">';

        ['SPEED', 'ROTATION', 'ARMOR', 'ENERGY'].forEach(upgradeType => {
            const upgrade = TankData.getUpgrade(upgradeType);
            const currentLevel = player.upgrades[upgradeType.toLowerCase()] || 0;
            const nextLevel = currentLevel + 1;
            const levelData = TankData.getUpgradeLevel(upgradeType, nextLevel);
            const maxed = currentLevel >= upgrade.maxLevel;

            html += `
                <div class="shop-item ${maxed ? 'owned' : ''}" data-type="upgrade" data-upgrade="${upgradeType}">
                    <div class="shop-item-name">${upgrade.name}</div>
                    <div class="shop-item-desc">${upgrade.description}</div>
                    <div class="shop-item-stats">
                        Current Level: ${currentLevel}/${upgrade.maxLevel}
                        ${levelData ? `<br>Next: +${Math.round((levelData.boost - 1) * 100)}% boost` : ''}
                    </div>
                    <div class="shop-item-price">
                        ${maxed ? 'MAX LEVEL' : `${this.getAdjustedPrice(levelData.price)} CR ${!this.canAfford(levelData.price) ? '(Not enough)' : ''}`}
                    </div>
                    ${!maxed && levelData && this.canAfford(levelData.price) ?
                        `<button class="shop-btn buy" data-action="buy-upgrade" data-upgrade="${upgradeType}">Upgrade</button>` : ''}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.selectedCategory = e.target.dataset.category;
                this.render();
            });
        });

        // Buy weapon
        document.querySelectorAll('[data-action="buy-weapon"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const port = parseInt(e.target.dataset.port);
                const index = parseInt(e.target.dataset.index);
                this.purchaseWeapon(port, index);
            });
        });

        // Buy tank
        document.querySelectorAll('[data-action="buy-tank"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tankType = e.target.dataset.tank;
                this.purchaseTank(tankType);
            });
        });

        // Buy upgrade
        document.querySelectorAll('[data-action="buy-upgrade"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeType = e.target.dataset.upgrade;
                this.purchaseUpgrade(upgradeType);
            });
        });

        // Exit shop
        const exitBtn = document.getElementById('shop-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.close();
                // Signal to game engine to continue
                if (window.game && window.game.engine) {
                    window.game.engine.continueFromShop();
                    window.game.showScreen('game-screen');
                }
            });
        }
    }
}