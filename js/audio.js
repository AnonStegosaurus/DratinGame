export class AudioManager {
    constructor() {
        this.musicVolume = 0.1;
        this.sfxVolume = 0.9;
        this.audioInitialized = false;
        this.currentMusic = null;
        this.sfx = {};
        this.musicPlaying = false;
    }
    
    init() {
        if (this.audioInitialized) return;
        this.audioInitialized = true;
        
        this.backgroundMusic = new Audio("assets/music/theme.mp3");
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.musicVolume;
        
        this.shieldMusic = new Audio("assets/music/shield_mode.mp3");
        this.shieldMusic.loop = true;
        this.shieldMusic.volume = this.musicVolume;
        
        this.sfx = {
            good: new Audio("assets/music/good.mp3"),
            bad: new Audio("assets/music/bad.mp3"),
            chatBan: new Audio("assets/music/chat_ban.mp3"),
            chatVip: new Audio("assets/music/chat_vip.mp3"),
            levelUp: new Audio("assets/music/level_up.mp3"),
            upgrade: new Audio("assets/music/upgrade.mp3"),
            starting: new Audio("assets/music/start.mp3"),
            pop: new Audio("assets/music/pop.mp3"),      
            criticalHit: new Audio("assets/music/crit.mp3"), 
        };
        
        Object.values(this.sfx).forEach(s => s.volume = this.sfxVolume);
    }
    
    playMusic() {
        if (this.musicPlaying || !this.backgroundMusic) return;
        this.musicPlaying = true;
        this.currentMusic = this.backgroundMusic;
        this.currentMusic.play()
    }
    
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.musicPlaying = false;
        }
    }
    
    playSound(type) {
        if (!this.sfx[type]) return;
        
        // Usa cloneNode(true) para permitir que múltiplos sons sejam tocados ao mesmo tempo (como acertos rápidos)
        const sound = this.sfx[type].cloneNode(true);
        sound.volume = this.sfxVolume;
        sound.play().catch(() => {});
    }
    
    fadeMusic(targetVolume, duration) {
        if (!this.currentMusic) return;
        
        const start = this.currentMusic.volume;
        const diff = targetVolume - start;
        const steps = 30;
        const stepTime = (duration * 1000) / steps;
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = start + diff * (currentStep / steps);
            
            if (this.currentMusic) {
                this.currentMusic.volume = Math.max(0, Math.min(1, newVolume));
            }
            
            if (currentStep >= steps) clearInterval(fadeInterval);
        }, stepTime);
    }
    
    switchMusic(mode) {
        // Lógica de switch de música para modo "shield"
        if (mode === "shield" && this.currentMusic !== this.shieldMusic) {
            this.fadeMusic(0, 0.5);
            setTimeout(() => {
                if (this.currentMusic) this.currentMusic.pause();
                this.currentMusic = this.shieldMusic;
                this.currentMusic.currentTime = 0;
                this.currentMusic.volume = 0;
                this.currentMusic.play().catch(() => {});
                this.fadeMusic(this.musicVolume, 1);
            }, 500);
        
        // Lógica de switch de música para modo "normal"
        } else if (mode === "normal" && this.currentMusic !== this.backgroundMusic) {
            this.fadeMusic(0, 0.5);
            setTimeout(() => {
                if (this.currentMusic) this.currentMusic.pause();
                this.currentMusic = this.backgroundMusic;
                this.currentMusic.currentTime = 0;
                this.currentMusic.volume = 0;
                this.currentMusic.play().catch(() => {});
                this.fadeMusic(this.musicVolume, 1);
            }, 500);
        }
    }
}