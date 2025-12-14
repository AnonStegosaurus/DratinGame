import { GAME_CONSTANTS } from './constants.js';
import { UPGRADES } from './constants.js'; 
export class ProgressionManager {
constructor(game) {
    this.game = game;
    this.upgrades = { moderator: 0, hypetrain: 0, stamina: 0, federal_police: 0, critical_thinking: 0, studies: 0 };
    this.resetStats();
    this.timers = {};
}
resetStats() {
    this.hype = 20;
    this.maxHype = 100;
    this.playerXP = 0;
    this.playerLevel = 1;
    this.xpToNextLevel = 100;
    this.xpMultiplier = 1;
    this.tempXPMultiplier = 1; 
    this.isShieldActive = false;
    this.isHypeTrainActive = false;
    this.gameTimeFactor = 1.0; 
    this.gameTime = 0;
}
update(delta) {
    this.gameTime += delta;
    this.gameTimeFactor = 1.0 + (this.gameTime / 60000) * 0.5; 
    this.gameTimeFactor = Math.min(2.5, this.gameTimeFactor); 
    if (this.hype >= this.maxHype && !this.isShieldActive) {
        this.activateShield();
    }
    if (this.hype <= 0) this.game.endGame();
}
checkLevelUp() {
    if (this.playerXP >= this.xpToNextLevel) {
        this.playerXP -= this.xpToNextLevel;
        this.playerLevel++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        this.game.pauseForUpgrade();
        this.game.audio.playSound("levelUp");
        this.game.startDynamicTimer('events'); 
        this.game.startDynamicTimer('mod');
        this.game.startDynamicTimer('hype');
        this.checkLevelUp();
    }
}
addXP(amount) {
    const finalAmount = amount * this.xpMultiplier * this.tempXPMultiplier; 
    this.playerXP += finalAmount;
    this.checkLevelUp();
}
gainHype(amount) {
    this.hype = Math.min(this.maxHype, this.hype + amount);
}
loseHype(amount) {
    this.hype = Math.max(0, this.hype - amount);
}
activateShield() {
    this.isShieldActive = true;
    this.game.audio.switchMusic("shield");
    this.game.chat.addSystemMessage("🛡️ SHIELD ACTIVE! 10 seconds of invincibility!");
    setTimeout(() => {
        this.isShieldActive = false;
        this.game.audio.switchMusic("normal");
        this.hype = 20;
    }, 10000);
}
runHypeTrainEvent() {
    const level = this.upgrades.hypetrain;
    if (level === 0 || this.isHypeTrainActive) return;
    const baseDuration = 5000;
    const duration = baseDuration + (level * 1000);
    const temporaryBoost = 1.5 + (level * 0.5);
    this.isHypeTrainActive = true;
    this.tempXPMultiplier = temporaryBoost;
    this.game.chat.addSystemMessage(`🚄 HYPE TRAIN Lv. ${level} ARRIVED! Multiplier x${temporaryBoost.toFixed(1)} active for ${duration / 1000}s!`);
    this.game.audio.playSound("levelUp");
    setTimeout(() => {
        this.isHypeTrainActive = false;
        this.tempXPMultiplier = 1;
        this.game.chat.addSystemMessage("🛑 Hype Train has departed. Normal XP.");
    }, duration);
}
getUpgradeCost(id) {
    const currentLevel = this.upgrades[id];
    const baseCost = 1; 
    const costMultiplier = 1.25; 
    const cost = baseCost * (costMultiplier ** currentLevel);
    return Math.max(1, Math.ceil(cost)); 
}
applyUpgrade(id) {
    this.upgrades[id]++;
    this.game.audio.playSound("upgrade");
    if (id === "stamina") {
        this.game.player.baseSpeed *= 1.2;
        this.game.chat.addSystemMessage(`⚡ Speed increased! Lv. ${this.upgrades.stamina}`);
    } else if (id === "hypetrain") {
        this.xpMultiplier += 0.5;
        this.maxHype += 40;
        this.game.startDynamicTimer('hype');
        this.game.chat.addSystemMessage(`🚂 Hype Train! Base XP x${this.xpMultiplier.toFixed(1)} and Max Hype +40`);
    } else if (id === "moderator") {
        this.game.startDynamicTimer('mod');
        this.game.chat.addSystemMessage(`🛡️ Moderator Lv. ${this.upgrades.moderator} hired! AutoMod is now faster!`);
    } else if (id === "studies" || id === "federal_police" || id === "critical_thinking") {
        this.game.chat.addSystemMessage(`⚔️ Fact Upgrade: ${id.replace('_', ' ')} Lv. ${this.upgrades[id]}`);
    }
}
calculateCooldown(type) {
    let level, base, reduction, min;
    switch (type) {
        case 'mod':
            level = this.upgrades.moderator;
            if (level === 0) return 0; 
            base = 5000; 
            reduction = 500; 
            min = 1000; 
            break;
        case 'hype':
            level = this.upgrades.hypetrain;
            if (level === 0) return 0; 
            base = 30000; 
            reduction = 5000; 
            min = 5000; 
            break;
        case 'events':
            level = this.playerLevel; 
            base = 15000; 
            reduction = 200; 
            min = 3000; 
            break;
        default:
            return 0; 
    }
    let cooldown = base - (level * reduction);
    return Math.max(min, cooldown);
}
}