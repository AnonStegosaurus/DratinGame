import { GAME_CONSTANTS } from './constants.js';
/**
 * * @param {Array} array 
 * @returns {Array} 
 */
function shuffleArray(array) {
    const newArray = [...array]; 
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
export class UIManager {
    constructor() {
        this.startBtn = document.getElementById("startBtn");
        this.restartBtn = document.getElementById("restartBtn");
        this.pauseBtn = document.getElementById("pauseBtn");
        this.gameOverScreen = document.getElementById("game-over");
        this.pausedOverlay = document.getElementById("pausedOverlay");
        this.upgradeScreen = document.getElementById("upgradeScreen");
        this.achievementStatsElement = document.getElementById('achievementStats');
        this.hypeBar = document.getElementById("hypeBar");
        this.hypeValue = document.getElementById("hypeValue");
        this.xpBar = document.getElementById("xpBar");
        this.xpValue = document.getElementById("xpValue");
        this.levelValue = document.getElementById("levelValue");
        this.staminaBar = document.getElementById("staminaBar");
        this.staminaValue = document.getElementById("staminaValue");
        this.showAchievementsBtn = document.getElementById('showAchievementsBtn'); 
        this.achievementListDetail = document.getElementById('achievementListDetail'); 
        this.finalTimeElement = document.getElementById("finalTime"); 
        this.finalLevelElement = document.getElementById("finalLevel"); 
        if (this.showAchievementsBtn) {
            this.showAchievementsBtn.addEventListener('click', () => this.toggleAchievementStats());
        }
    }
    toggleAchievementStats() {
        this.achievementStatsElement.classList.toggle('active');
        if (this.achievementStatsElement.classList.contains('active')) {
            this.showAchievementsBtn.textContent = "Hide Achievements";
        } else {
            this.showAchievementsBtn.textContent = "Show Achievements";
        }
    }
    formatTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `${minutes}:${formattedSeconds}`;
    }
    renderAchievementList(achievementsList, earnedSet) {
        if (!this.achievementListDetail) {
            return;
        }
        const achievementItemsHtml = achievementsList.map(a => {
            const isUnlocked = earnedSet.has(a.id);
            const statusClass = isUnlocked ? 'unlocked' : 'locked';
            const statusIcon = isUnlocked ? '✅' : '🔒';
            return `
            <li class="achievement-item ${statusClass}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${a.name}</strong> <span class="status-icon">${statusIcon}</span>
                </div>
                <div class="description">${a.description}</div> </li>
            `;
        }).join('');
        this.achievementListDetail.innerHTML = achievementItemsHtml;
        this.achievementStatsElement.classList.remove('active'); 
        this.showAchievementsBtn.textContent = "Show Achievements";
    }
    updateHUD(gameState) {
        const { hype, maxHype, playerXP, xpToNextLevel, playerLevel, stamina, staminaLevel } = gameState;
        const hypePercent = (hype / maxHype) * 100;
        if (this.hypeBar) {
            this.hypeBar.style.width = `${Math.min(hypePercent, 100)}%`;
            this.hypeBar.style.background = hypePercent > 100 
                ? "linear-gradient(90deg, #ffd700, #ff8800)" 
                : GAME_CONSTANTS.TWITCH_PURPLE;
        }
        if (this.hypeValue) this.hypeValue.textContent = `${Math.floor(hype)}/${maxHype}`;
        const xpPercent = Math.min(100, (playerXP / xpToNextLevel) * 20);
        if (this.xpBar) this.xpBar.style.width = xpPercent + "%";
        if (this.xpValue) this.xpValue.textContent = `${playerXP}/${xpToNextLevel}`;
        if (this.levelValue) this.levelValue.textContent = playerLevel;
        if (this.staminaBar) {
            const staminaBox = this.staminaBar.closest('.stamina-box');
            if (staminaLevel > 0) {
                if (staminaBox) staminaBox.classList.remove('hidden');
                const s = Math.floor(stamina);
                this.staminaBar.style.width = s + "%";
                if (this.staminaValue) this.staminaValue.textContent = s + "%";
            } else {
                if (staminaBox) staminaBox.classList.add('hidden');
            }
        }
    }
    showGameOver(show, earnedCount, totalCount, finalSurvivalTime, finalLevel) { 
        const earned = earnedCount || 0;
        const total = totalCount || 0;
        if (show) {
            this.gameOverScreen.classList.remove("hidden");
            if (this.finalTimeElement) {
                this.finalTimeElement.textContent = this.formatTime(finalSurvivalTime);
            }
            if (this.finalLevelElement) {
                this.finalLevelElement.textContent = finalLevel;
            }
            const counter = document.getElementById('achievementStatsCount');
            if (counter) counter.textContent = `${earned}/${total}`;        
        } else {
            this.gameOverScreen.classList.add("hidden");
        }
    }
    togglePauseOverlay(isPaused) {
        if (isPaused) this.pausedOverlay.classList.add("visible");
        else this.pausedOverlay.classList.remove("visible");
        if (this.pauseBtn) {
            this.pauseBtn.textContent = isPaused ? "▶️ Resume" : "⏸️ Pause";
        }
    }
    setStartButtonState(running) {
        if (this.startBtn) {
            this.startBtn.disabled = running;
            this.startBtn.textContent = running ? "Stream Running" : "Start Stream";
        }
    }

    renderUpgradeScreen(playerLevel, upgrades, currentLevels, onSelect, getCostFn) { 
        const availableUpgrades = upgrades.filter(upg => {
            const currentLevel = currentLevels[upg.id] || 0;
            const maxLevelReached = upg.maxLevel !== undefined && currentLevel >= upg.maxLevel;
            return !maxLevelReached; 
        });
        if (availableUpgrades.length === 0) {
            return false; 
        }
        const maxOptions = 3;
        const shuffledUpgrades = shuffleArray(availableUpgrades); 
        const selectedUpgrades = shuffledUpgrades.slice(0, maxOptions);
        const optionsHtml = selectedUpgrades.map((upg) => {
            const currentLevel = currentLevels[upg.id] || 0;
            const nextLevel = currentLevel + 1;
            const cost = getCostFn(upg.id); 
            const isAffordable = playerLevel >= cost;
            const costClass = isAffordable ? 'affordable' : 'unaffordable';
            return `
                <div class="upgrade-option ${costClass}" data-id="${upg.id}" data-cost="${cost}">
                    <div style="font-weight: 600; margin-bottom: 4px;">${upg.name}</div>
                    <div style="font-size: 14px; color: #adadb8;">Nv. ${currentLevel} -> Nv. ${nextLevel}</div>
                    <div style="font-size: 12px; color: #adadb8;">${upg.description}</div>
                    <div class="upgrade-cost">Cost: ${cost} Levels</div>
                </div>`;
        }).join('');
        const skipButton = '<button id="skipUpgradeBtn" style="margin-top: 15px; padding: 10px 20px; cursor: pointer; background-color: #333; color: white; border: 1px solid #555;">Skip</button>';
        this.upgradeScreen.innerHTML = `
            <h2>Level ${playerLevel}!</h2>
            <p>Choose a bonus:</p>
            <div class="upgrade-options">${optionsHtml}</div>
            ${skipButton}
        `;
        this.upgradeScreen.classList.remove("hidden");
        this.upgradeScreen.querySelectorAll('.upgrade-option').forEach(opt => {
            const cost = parseInt(opt.getAttribute('data-cost'));
            if (playerLevel >= cost) {
                opt.addEventListener('click', () => {
                    const id = opt.getAttribute('data-id');
                    onSelect(id);
                    this.upgradeScreen.classList.add("hidden");
                });
            } else {
                opt.style.opacity = '0.5';
                opt.style.cursor = 'not-allowed';
            }
        });
        document.getElementById('skipUpgradeBtn').addEventListener('click', () => {
            onSelect('skip'); 
            this.upgradeScreen.classList.add("hidden");
        });
        return true;
    }
}
