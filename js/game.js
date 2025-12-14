import { GAME_CONSTANTS, UPGRADES } from './constants.js';
import { ACHIEVEMENTS_LIST } from './achievements_data.js';
import { AudioManager } from './audio.js';
import { UIManager } from './ui.js';
import { Player } from './player.js';
import { ChatManager } from './chat.js';
import { MapManager } from './map.js';
import { ProgressionManager } from './progression.js';
import { MessageManager } from './messages.js';
import { AchievementManager } from './achievements.js';
import { FactManager } from './facts.js';

export class ChatDodgeGame {
constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.audio = new AudioManager();
        this.ui = new UIManager();
        this.player = new Player(this.canvas.width, this.canvas.height);
        this.chat = new ChatManager(this);
        this.map = new MapManager(this);
        this.progression = new ProgressionManager(this);
        this.messages = new MessageManager(this);
        this.facts = new FactManager(this);
        this.achievements = new AchievementManager(this);
        this.cameraZoom = 0.5;
        this.gameRunning = false;
        this.usernames = [...GAME_CONSTANTS.USERNAMES];
        this.paused = false;
        this.keys = {};
        this.timers = {};
        this.feedbackGlowColor = null;
        this.stats = {
                totalMessages: 0,
                goodMessages: 0,
                badMessages: 0,
                score: 0,
                damageTaken: 0,
                survivalTime: 0,
                speedrunTimer: 0,
                badStreak: 0
        };
        this.unpauseCooldown = 0;
        this.loop = this.loop.bind(this);
}
onMapLoaded() {
        this.player.x = this.map.mapWidth / 2;
        this.player.y = this.map.mapHeight / 2;
}
init() {
        this.canvas.width = window.innerWidth - 340;
        this.canvas.height = window.innerHeight;
        this.setupEventListeners();
        requestAnimationFrame(this.loop);
}
setupEventListeners() {
        document.addEventListener("keydown", (e) => {
                this.keys[e.key.toLowerCase()] = true;
                if (this.chat.isEventActive) {
                        const eventDiv = document.querySelector('.chatEvent');
                        if (eventDiv) {
                                if (e.key === '1') eventDiv.querySelector(".banBtn").click();
                                if (e.key === '2') eventDiv.querySelector(".vipBtn").click();
                        }
                }
                if (e.code === 'Space' && this.gameRunning && !this.chat.isEventActive) {
                        this.togglePause();
                }
        });
        document.addEventListener("keyup", (e) => this.keys[e.key.toLowerCase()] = false);
        window.addEventListener('resize', () => {
                this.canvas.width = window.innerWidth - 340;
                this.canvas.height = window.innerHeight;
        });
        if (this.ui.startBtn) this.ui.startBtn.addEventListener("click", () => this.startGame(false));
        if (this.ui.restartBtn) this.ui.restartBtn.addEventListener("click", () => this.startGame(true));
        if (this.ui.pauseBtn) this.ui.pauseBtn.addEventListener("click", () => this.togglePause());
}
startGame(fullReset = false) {
        this.gameRunning = true;
        this.paused = false;
        this.progression.resetStats();
        this.messages.reset();
        this.achievements.reset();
        this.stats = {
                totalMessages: 0, goodMessages: 0, badMessages: 0,
                score: 0, damageTaken: 0, survivalTime: 0,
                speedrunTimer: 0, badStreak: 0
        };
        if (fullReset) {
                Object.keys(this.progression.upgrades).forEach(key => this.progression.upgrades[key] = 0);
                this.progression.isHypeTrainActive = false;
        }
        this.player.reset();
        this.player.x = this.map.mapWidth / 2;
        this.player.y = this.map.mapHeight / 2;
        this.ui.setStartButtonState(true);
        this.ui.showGameOver(false);
        this.ui.togglePauseOverlay(false);
        this.chat.clear();
        this.audio.init();
        this.audio.playSound('starting');
        this.audio.playMusic();
        this.startTimers();
}
endGame() {
        this.gameRunning = false;
        this.audio.stopMusic();
        this.clearIntervals();
        const total = this.achievements.achievementsList.length;
        const earned = this.achievements.earnedAchievements.size;
        const finalSurvivalTime = this.stats.survivalTime;
        this.ui.renderAchievementList(this.achievements.achievementsList, this.achievements.earnedAchievements);
        this.ui.showGameOver(
                true,
                earned,
                total,
                finalSurvivalTime,
                this.progression.playerLevel
        );
        this.ui.setStartButtonState(false);
}
clearIntervals() {
        Object.values(this.timers).forEach(clearInterval);
        this.timers = {};
}
togglePause() {
        if (!this.gameRunning || this.chat.isEventActive) return;
        this.paused = !this.paused;
        this.ui.togglePauseOverlay(this.paused);
        if (this.unpauseCooldown > 0) return;
        this.audio.fadeMusic(this.paused ? 0 : 0.2, 0.4);
}
update(delta) {
        if (!this.gameRunning || this.paused) return;
        const deltaSeconds = delta / 1000;
        this.stats.survivalTime += deltaSeconds;
        this.progression.update(delta);
        if (this.unpauseCooldown > 0) {
                this.unpauseCooldown -= delta;
        }
        this.progression.update(delta);
        this.stats.survivalTime += deltaSeconds;
        this.player.update(delta, this.keys, this.progression.upgrades.stamina, this.canvas.width, this.canvas.height);
        this.player.updateSize(this.progression.hype);
        const canvasWidthUnscaled = this.canvas.width / this.cameraZoom;
        const canvasHeightUnscaled = this.canvas.height / this.cameraZoom;
        this.cameraX = this.player.x - canvasWidthUnscaled / 2;
        this.cameraY = this.player.y - canvasHeightUnscaled / 2;
        this.cameraX = Math.max(0, Math.min(this.cameraX, this.map.mapWidth - canvasWidthUnscaled));
        this.cameraY = Math.max(0, Math.min(this.cameraY, this.map.mapHeight - canvasHeightUnscaled));
        this.messages.update(delta, this.cameraX, this.cameraY);
        this.facts.update(delta);
        this.achievements.check();
        this.ui.updateHUD({
                hype: this.progression.hype,
                maxHype: this.progression.maxHype,
                playerXP: Math.floor(this.progression.playerXP),
                xpToNextLevel: this.progression.xpToNextLevel,
                playerLevel: this.progression.playerLevel,
                stamina: this.player.stamina,
                staminaLevel: this.progression.upgrades.stamina,
                gameTimeFactor: this.progression.gameTimeFactor.toFixed(1)
        });
}
addXP(amount) { this.progression.addXP(amount); }
gainHype(amount) { this.progression.gainHype(amount); }
loseHype(amount) { this.progression.loseHype(amount); }
runHypeTrainEvent() { this.progression.runHypeTrainEvent(); }
calculateCooldown(type) { return this.progression.calculateCooldown(type); }
applyUpgrade(id) {
        if (id === 'skip') {
                this.paused = false;
                this.audio.fadeMusic(this.audio.musicVolume, 0.4);
                this.unpauseCooldown = 500;
                return;
        }
        const cost = this.progression.getUpgradeCost(id);
        if (this.progression.playerLevel < cost) {
                this.paused = false;
                return;
        }
        try {
                this.progression.playerLevel -= cost;
                this.progression.applyUpgrade(id);
                this.achievements.check(0);
        } catch (error) {
        }
        this.paused = false;
        this.audio.fadeMusic(this.audio.musicVolume, 0.4);
        this.unpauseCooldown = 500;
}
pauseForUpgrade() {
        this.paused = true;
        this.audio.fadeMusic(0, 0.4);
        const hasOptions = this.ui.renderUpgradeScreen(
                this.progression.playerLevel,
                UPGRADES,
                this.progression.upgrades,
                (id) => this.applyUpgrade(id),
                (id) => this.progression.getUpgradeCost(id)
        );
        if (!hasOptions) {
                this.paused = false;
                this.audio.fadeMusic(this.audio.musicVolume, 0.4);
        }
}
startDynamicTimer(type) {
        if (this.timers[type]) {
                clearInterval(this.timers[type]);
                this.timers[type] = null;
        }
        const cooldownTime = this.progression.calculateCooldown(type);
        let action;
        switch (type) {
                case 'mod':
                        action = () => this.chat.runAutoMod(this.progression.upgrades.moderator);
                        break;
                case 'hype':
                        action = () => this.runHypeTrainEvent();
                        break;
                case 'events':
                        action = () => this.chat.spawnEvent();
                        break;
                default:
                        return;
        }
        if (this.gameRunning && cooldownTime > 0) {
                this.timers[type] = setInterval(() => {
                        if (this.gameRunning && !this.paused) {
                                action();
                        }
                }, cooldownTime);
        }
}
startTimers() {
        this.clearIntervals();
        this.timers.spawn = setInterval(() => {
                if (!this.gameRunning || this.paused) return;
                this.messages.spawnFallingMessage();
                this.chat.spawnRegularMessage();
        }, GAME_CONSTANTS.MESSAGE_SPAWN_RATE_MS);
        this.startDynamicTimer('events');
        this.startDynamicTimer('mod');
        this.startDynamicTimer('hype');
}
applyFeedbackGlow(color) {
        this.feedbackGlowColor = color;
        setTimeout(() => this.feedbackGlowColor = null, 500);
}
render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.scale(this.cameraZoom, this.cameraZoom);
        this.ctx.translate(-this.cameraX, -this.cameraY);
        this.map.draw(this.ctx);
        this.messages.draw(this.ctx, this.cameraZoom);
        this.facts.draw(this.ctx);
        this.player.draw(
                this.ctx,
                this.progression.isShieldActive,
                this.progression.isHypeTrainActive
        );
        this.ctx.restore();
        if (this.feedbackGlowColor || this.chat.isEventActive) {
                this.ctx.fillStyle = this.feedbackGlowColor || "rgba(0,0,0,0.4)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
}
loop(now) {
        if (!this.lastFrame) this.lastFrame = now;
        const delta = now - this.lastFrame;
        this.lastFrame = now;
        this.update(delta);
        this.render();
        requestAnimationFrame(this.loop);
}
}