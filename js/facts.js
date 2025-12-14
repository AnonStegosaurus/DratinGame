import { GAME_CONSTANTS } from './constants.js';
import { calculateFactDamage } from './damage_calculator.js';
export class FactManager {
        constructor(game) {
                this.game = game;
                this.facts = [];
                this.cooldown = GAME_CONSTANTS.FACTS_COOLDOWN_MS;
                this.cooldownTimer = 0;
                this.factImage = new Image();
                this.factImage.src = 'assets/bullet.png';
                this.factImageLoaded = false;
                this.critAudioCooldownMs = 300;
                this.lastCritAudioTime = 0;
                this.factImage.onload = () => {
                        this.factImageLoaded = true;
                };
        }
        reset() {
                this.facts = [];
                this.cooldownTimer = 0;
        }
        findNearestBadEmote() {
                let nearestEmote = null;
                let minDistanceSq = Infinity;
                const playerX = this.game.player.x;
                const playerY = this.game.player.y;
                for (const emote of this.game.messages.messages) {
                        if (!emote.good) {
                                const distSq = (emote.x - playerX) ** 2 + (emote.y - playerY) ** 2;
                                if (distSq < minDistanceSq) {
                                        minDistanceSq = distSq;
                                        nearestEmote = emote;
                                }
                        }
                }
                return nearestEmote;
        }
        fireFact() {
                const targetEmote = this.findNearestBadEmote();
                if (!targetEmote) {
                        this.cooldownTimer = this.cooldown;
                        return;
                }
                const studiesLevel = this.game.progression.upgrades.studies || 0;
                const attackSpeedMultiplier = 1 + (studiesLevel * 0.5);
                const currentCooldown = this.cooldown / attackSpeedMultiplier;
                this.cooldownTimer = currentCooldown;
                const dirX = targetEmote.x - this.game.player.x;
                const dirY = targetEmote.y - this.game.player.y;
                const mag = Math.sqrt(dirX * dirX + dirY * dirY);
                const speed = GAME_CONSTANTS.FACTS_DEFAULT_SPEED;
                this.game.audio.playSound("pop");
                this.facts.push({
                        x: this.game.player.x,
                        y: this.game.player.y,
                        dirX: dirX / mag,
                        dirY: dirY / mag,
                        speed: speed,
                        damage: GAME_CONSTANTS.FACTS_DEFAULT_DAMAGE,
                        critMult: GAME_CONSTANTS.FACTS_CRIT_MULTIPLIER,
                        critChance: GAME_CONSTANTS.FACTS_CRIT_CHANCE,
                        size: GAME_CONSTANTS.FACTS_SIZE,
                        isCrit: false
                });
        }
        update(delta) {
                if (this.game.gameRunning && !this.game.paused) {
                        this.cooldownTimer -= delta;
                        if (this.cooldownTimer <= 0) {
                                this.fireFact();
                        }
                }
                const deltaSeconds = delta / 1000;
                for (let i = this.facts.length - 1; i >= 0; i--) {
                        const fact = this.facts[i];
                        fact.x += fact.dirX * fact.speed * deltaSeconds;
                        fact.y += fact.dirY * fact.speed * deltaSeconds;
                        for (let j = this.game.messages.messages.length - 1; j >= 0; j--) {
                                const emote = this.game.messages.messages[j];
                                if (!emote.good) {
                                        const distSq = (fact.x - emote.x) ** 2 + (fact.y - emote.y) ** 2;
                                        const collisionDistSq = (fact.size / 2 + 15) ** 2;
                                        if (distSq < collisionDistSq) {
                                                this.hitEmote(fact, emote, j);
                                                this.facts.splice(i, 1);
                                                i--;
                                                break;
                                        }
                                }
                        }
                        if (Math.abs(fact.x - this.game.player.x) > 1500 || Math.abs(fact.y - this.game.player.y) > 1500) {
                                this.facts.splice(i, 1);
                        }
                }
        }
        hitEmote(fact, emote, emoteIndex) {
                const result = calculateFactDamage(fact, this.game.progression);
                let damage = result.finalDamage;
                fact.isCrit = result.isCrit;
                const policeLevel = this.game.progression.upgrades.federal_police || 0;
                const critLevel = this.game.progression.upgrades.critical_thinking || 0;
                const finalCritChance = Math.min(0.95, fact.critChance + (critLevel * 0.10));
                const finalCritMult = fact.critMult * (1 + critLevel * 0.20);
                if (fact.isCrit) {
                        this.game.chat.injectCriticalHitFeedback(fact.username);
                        this.game.audio.playSound('criticalHit');
                } else {
                }
                emote.hp -= damage;
                if (emote.hp <= 0) {
                        this.game.messages.messages.splice(emoteIndex, 1);
                        this.game.progression.addXP(10);
                }
        }
        draw(ctx, zoom = 1.0) {
                if (!this.factImageLoaded) {
                }
                this.facts.forEach(f => {
                        const worldX = f.x;
                        const worldY = f.y;
                        const baseSize = f.size;
                        const drawSize = baseSize / zoom;
                        const halfDrawSize = drawSize / 2;
                        ctx.save();
                        if (this.factImageLoaded) {
                                if (f.isCrit) {
                                        ctx.shadowColor = 'yellow';
                                        ctx.shadowBlur = 15 / zoom;
                                }
                                ctx.drawImage(
                                        this.factImage,
                                        worldX - halfDrawSize,
                                        worldY - halfDrawSize,
                                        drawSize,
                                        drawSize
                                );
                        } else {
                                ctx.fillStyle = f.isCrit ? 'yellow' : 'white';
                                ctx.beginPath();
                                ctx.arc(worldX, worldY, baseSize / 2 / zoom, 0, Math.PI * 2);
                                ctx.fill();
                        }
                        ctx.restore();
                });
        }
}