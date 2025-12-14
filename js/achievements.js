import { ACHIEVEMENTS_LIST } from './achievements_data.js'; 
export class AchievementManager {
    constructor(game) {
        this.game = game;
        this.achievementsList = ACHIEVEMENTS_LIST;
        this.earnedAchievements = new Set(); 
        this.lastAchievementCheck = 0;
    }
    reset() {
        this.earnedAchievements.clear();
        this.achievementsList.forEach(a => a.earned = false); 
        this.lastAchievementCheck = 0;
    }
    check(deltaTime) {
        this.lastAchievementCheck += deltaTime;
        if (this.lastAchievementCheck < 500) return; 
        this.lastAchievementCheck = 0;
        for (const a of this.achievementsList) {
            if (!this.earnedAchievements.has(a.id) && a.check(this.game)) {
                this.unlock(a);
            }
        }
    }
    unlock(a) {
        this.earnedAchievements.add(a.id);
        console.log(`🏆 Achievement desbloqueado: ${a.name}`);
        this.showPopup(a);
    }
    showPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `<strong>🏆 ${achievement.name}</strong><br>${achievement.description}`;
        Object.assign(popup.style, {
            position: 'fixed',
            top: '20px',
            right: '-300px',
            background: 'rgba(0,0,0,0.85)',
            color: '#FFD700',
            padding: '12px 18px',
            borderRadius: '10px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            zIndex: 9999,
            transition: 'right 0.6s ease'
        });
        document.body.appendChild(popup);
        setTimeout(() => popup.style.right = '20px', 50);
        setTimeout(() => popup.remove(), 4000);
    }
}