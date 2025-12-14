import { GAME_CONSTANTS } from './constants.js';
export class Player {
    constructor(canvasWidth, canvasHeight) {
        this.defaultX = canvasWidth / 2;
        this.defaultY = canvasHeight / 2;
        this.reset();
        this.images = {
            normal: new Image(),
            shield: new Image(),
            hype: new Image()
        };
        this.images.normal.src = 'assets/player.png';
        this.images.shield.src = 'assets/shield.png';
        this.images.hype.src = 'assets/hype.png';
    }
    reset() {
        this.x = this.defaultX;
        this.y = this.defaultY;
        this.size = GAME_CONSTANTS.PLAYER_DEFAULT_SIZE;
        this.baseSpeed = GAME_CONSTANTS.PLAYER_DEFAULT_SPEED;
        this.stamina = 100;
        this.lastDirX = 1;
        this.lastDirY = 0;
    }
update(delta, keys, staminaLevel, canvasWidth, canvasHeight) {
    let speedMultiplier = 1;
    let moveX = 0;
    let moveY = 0;
    if (staminaLevel > 0) {
        const deltaSeconds = delta / 1000;
        const BASE_DRAIN_RATE = 40; 
        const BASE_RECOVERY_RATE = 30; 
        const efficiencyMultiplier = 1 - (staminaLevel * 0.15); 
        const finalDrainRate = BASE_DRAIN_RATE * efficiencyMultiplier;
        const finalRecoveryRate = BASE_RECOVERY_RATE / efficiencyMultiplier; 
        const drain = finalDrainRate * deltaSeconds;
        const recovery = finalRecoveryRate * deltaSeconds;
        const dashSpeedIncrease = 1.0 + (staminaLevel * 0.25); 
        if (keys["shift"] && this.stamina > 0) {
            speedMultiplier = dashSpeedIncrease;
            this.stamina = Math.max(0, this.stamina - drain);
        } else {
            this.stamina = Math.min(100, this.stamina + recovery);
        }
    }
        let dx = 0;
        let dy = 0;
        if (keys["w"] || keys["arrowup"]) dy -= 1;
        if (keys["s"] || keys["arrowdown"]) dy += 1;
        if (keys["a"] || keys["arrowleft"]) dx -= 1;
        if (keys["d"] || keys["arrowright"]) dx += 1;
        if (dx !== 0 || dy !== 0) {
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag > 0) {
                dx /= mag;
                dy /= mag;
            }
            this.lastDirX = dx;
            this.lastDirY = dy;
        }
        const moveDist = (this.baseSpeed * speedMultiplier * delta) / 1000;
        this.x += dx * moveDist;
        this.y += dy * moveDist;
    }
    updateSize(hype) {
        const MIN_SIZE = 40;
        const MAX_SIZE = 500;
        const clampedHype = Math.max(0, Math.min(100, hype));
        this.size = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * (clampedHype / 100);
    }
    /**
     * @param {boolean} isShieldActive 
     * @param {boolean} isHypeTrainActive 
     */
    draw(ctx, isShieldActive, isHypeTrainActive) { 
        const screenX = this.x; 
        const screenY = this.y; 
        const halfSize = this.size / 2;
        let sprite = this.images.normal;
        if ((isShieldActive || isHypeTrainActive) && this.images.hype.complete) {
            sprite = this.images.hype;
            if (isHypeTrainActive) {
            }
        }
        ctx.save();
        if (sprite.complete) {
            ctx.drawImage(sprite, screenX - halfSize, screenY - halfSize, this.size, this.size);
        } else {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(screenX, screenY, halfSize, 0, Math.PI * 2);
            ctx.fill();
        }
        if (isShieldActive && this.images.shield.complete) {
            const shieldScale = 1.3;
            const shieldSize = this.size * shieldScale;
            const offset = (shieldSize - this.size);
            ctx.drawImage(
                this.images.shield,
                screenX - halfSize - offset / 2,
                screenY - halfSize - offset / 2,
                shieldSize,
                shieldSize
            );
        }
        ctx.restore();
    }
}