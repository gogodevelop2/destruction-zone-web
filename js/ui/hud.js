// ============================================
// HUD (Heads-Up Display) System
// ============================================

/**
 * Update all tank stat panels in the UI
 * @param {Array<Tank>} tanks - Array of all tanks
 * @param {Object} WEAPON_DATA - Weapon data registry
 */
export function updateUI(tanks, WEAPON_DATA) {
    tanks.forEach((tank, index) => {
        const statPanel = document.getElementById(`tank${index + 1}-stat`);
        if (!statPanel) return;

        if (tank && tank.alive) {
            // Update tank name
            const nameEl = statPanel.querySelector('.tank-name');
            nameEl.textContent = tank.id;
            nameEl.style.color = tank.config.color;

            // Update health gauge
            const healthPercent = (tank.health / tank.config.maxHealth) * 100;
            const healthFill = statPanel.querySelector('.gauge-fill.health');
            healthFill.style.height = `${healthPercent}%`;

            // Update weapon energy gauge
            const energyPercent = (tank.weaponEnergy / tank.maxWeaponEnergy) * 100;
            const weaponFill = statPanel.querySelector('.gauge-fill.weapon');
            weaponFill.style.height = `${energyPercent}%`;

            // Update weapon info
            const weaponInfo = statPanel.querySelector('.weapon-info');
            weaponInfo.textContent = WEAPON_DATA[tank.currentWeapon]?.name.substring(0, 6) || 'N/A';

            // Update score
            const scoreEl = statPanel.querySelector('.score');
            scoreEl.textContent = `$${tank.score}`;
        } else {
            // Empty slot or dead tank
            const nameEl = statPanel.querySelector('.tank-name');
            nameEl.textContent = `-`;
            nameEl.style.color = '#444444';

            const healthFill = statPanel.querySelector('.gauge-fill.health');
            healthFill.style.height = '0%';

            const weaponFill = statPanel.querySelector('.gauge-fill.weapon');
            weaponFill.style.height = '0%';

            const weaponInfo = statPanel.querySelector('.weapon-info');
            weaponInfo.textContent = '-';

            const scoreEl = statPanel.querySelector('.score');
            scoreEl.textContent = '-';
        }
    });
}
