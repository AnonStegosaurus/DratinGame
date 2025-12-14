import { GAME_CONSTANTS } from './constants.js';
export class MessageManager {
constructor(game) {
    this.game = game;
    this.messages = [];
    this.emoteImages = { good: [], bad: [] };
    this.loadEmotes();
}
reset() {
    this.messages = [];
}
loadEmotes() {
    const load = (files) => files.map(src => {
        const img = new Image(); img.src = `assets/${src}`; return img;
    });
    this.emoteImages = {
        good: load(["good1.png", "good2.png", "good3.png"]),
        bad: load(["bad1.png", "bad2.png", "bad3.png"])
    };
}
update(delta, cameraX, cameraY) { 
    const deltaSeconds = delta / 1000; 
    const pRadius = this.game.player.size / 2;
    const playerX = this.game.player.x;
    const playerY = this.game.player.y;
    for (let i = this.messages.length - 1; i >= 0; i--) {
        const m = this.messages[i];
        if (!m.good) {
            if (m.isHoming) {
                const dx = playerX - m.x;
                const dy = playerY - m.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const dirX = dx / dist;
                const dirY = dy / dist;
                m.dirX += dirX * m.homingAccel * deltaSeconds;
                m.dirY += dirY * m.homingAccel * deltaSeconds;
                const currentMag = Math.sqrt(m.dirX * m.dirX + m.dirY * m.dirY);
                if (currentMag > 0) {
                    m.dirX /= currentMag;
                    m.dirY /= currentMag;
                }
            }
            m.x += m.dirX * m.speed * deltaSeconds;
            m.y += m.dirY * m.speed * deltaSeconds;
        }
        const distSq = (playerX - m.x)**2 + (playerY - m.y)**2;
        if (distSq < pRadius**2) {
            this.handleCollision(m);
            this.messages.splice(i, 1);
            continue;
        }
        if (Math.abs(m.x - playerX) > 2000 || Math.abs(m.y - playerY) > 2000) {
            this.messages.splice(i, 1);
        }
    }
}
handleCollision(msg) {
    this.game.stats.totalMessages++;
    if (msg.good) {
        this.game.progression.addXP(50); 
        this.game.stats.goodMessages++; 
        this.game.audio.playSound("good");
        this.game.stats.badStreak = 0; 
    } else {
        this.game.stats.badMessages++;
        this.game.stats.badStreak++; 
        if (this.game.progression.isShieldActive) {
            this.game.progression.addXP(10); 
            this.game.audio.playSound("good"); 
        } else {
            this.game.progression.loseHype(10);
            this.game.stats.damageTaken++;
            this.game.audio.playSound("bad");
        }
    }
}
spawnFallingMessage() {
    const baseBadChance = 0.6 + (this.game.progression.playerLevel * 0.05);
    const isGood = Math.random() > Math.min(1.0, baseBadChance);
    const imgPool = isGood ? this.emoteImages.good : this.emoteImages.bad;
    const img = imgPool.length > 0 ? imgPool[Math.floor(Math.random() * imgPool.length)] : null;
    let x, y, dirX = 0, dirY = 0, speed = 0;
    let isHoming = false; 
    let homingAccel = 0;  
    let hp = 1; 
    if (isGood) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 500;
        x = this.game.player.x + Math.cos(angle) * dist;
        y = this.game.player.y + Math.sin(angle) * dist;
        hp = 1; 
    } else {
        const angle = Math.random() * Math.PI * 2;
        const dist = this.game.canvas.width / 2 + 100;
        x = this.game.player.x + Math.cos(angle) * dist;
        y = this.game.player.y + Math.sin(angle) * dist;
        const dx = this.game.player.x - x;
        const dy = this.game.player.y - y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        dirX = dx/mag;
        dirY = dy/mag;
        const scaledFactor = Math.sqrt(this.game.progression.gameTimeFactor || 1); 
        speed = (GAME_CONSTANTS.ACCELERATION_BASE + Math.random() * GAME_CONSTANTS.ACCELERATION_RANGE) * scaledFactor;
        const homingChance = 0.5 + (this.game.progression.playerLevel * 0.01); 
        if (Math.random() < homingChance) {
            isHoming = true;
            homingAccel = 5 * this.game.progression.gameTimeFactor; 
        }
        hp = GAME_CONSTANTS.BAD_EMOTE_BASE_HP + (this.game.progression.playerLevel * GAME_CONSTANTS.BAD_EMOTE_HP_SCALE);
    }
    this.messages.push({ 
        x, 
        y, 
        dirX, 
        dirY, 
        speed, 
        good: isGood, 
        image: img, 
        isHoming: isHoming,        
        homingAccel: homingAccel,    
        hp: hp 
    });
}
draw(ctx, zoom = 1.0) { 
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.messages.forEach(m => {
        const worldX = m.x;
        const worldY = m.y;
        const baseSize = 30;
        const drawSize = baseSize / zoom; 
        const halfDrawSize = drawSize / 2;
        ctx.save();
        if (m.image && m.image.complete) {
            ctx.drawImage(
                m.image, 
                worldX - halfDrawSize, 
                worldY - halfDrawSize, 
                drawSize,              
                drawSize               
            );
        } else {
            const baseFontSize = 30;
            ctx.font = `${baseFontSize / zoom}px Arial`;
            ctx.fillText(
                m.good ? "⭐" : "💀", 
                worldX, 
                worldY
            );
        }
        if (!m.good && m.hp > 0) {
            const barWidth = 30 / zoom; 
            const barHeight = 4 / zoom; 
            const barYOffset = 20 / zoom; 
            const maxHp = GAME_CONSTANTS.BAD_EMOTE_BASE_HP + (this.game.progression.playerLevel * GAME_CONSTANTS.BAD_EMOTE_HP_SCALE);
            const hpPercentage = m.hp / maxHp;
            ctx.fillStyle = 'red';
            ctx.fillRect(worldX - barWidth / 2, worldY + barYOffset, barWidth, barHeight);
            ctx.fillStyle = 'green';
            ctx.fillRect(worldX - barWidth / 2, worldY + barYOffset, barWidth * hpPercentage, barHeight);
        }
        ctx.restore();
    });
}
}