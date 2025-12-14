import { GAME_CONSTANTS } from './constants.js';

export class ChatManager {
    constructor(game) {
        this.game = game;
        this.chatBox = document.getElementById("chatBox");
        this.queuedMessages = [];
        this.isEventActive = false;
        this.processInterval = setInterval(this.processChatBatch.bind(this), 500);
    }
    
    clear() {
        if (this.chatBox) this.chatBox.innerHTML = "";
        this.isEventActive = false;
    }
    
    addChatMessage(username, text, color, good) {
        this.game.stats.totalMessages++;
        if (good) this.game.stats.goodMessages++;
        const div = document.createElement("div");
        div.classList.add("chatMessage");
        div.innerHTML = `<span class="username" style="color:${color}">${username}:</span> <span class="${good ? 'good' : 'bad'}">${text}</span>`;
        this.queuedMessages.push(div);
    }
    
    addSystemMessage(text) {
        const div = document.createElement("div");
        div.classList.add("chatMessage", "system");
        div.textContent = text;
        this.queuedMessages.push(div);
    }
    

injectCriticalHitFeedback(username) {
    if (!this.chatBox) return;
    const feedbackDiv = document.createElement('div');
    feedbackDiv.classList.add('chatFeedback', 'critical');
    const message = `<span class="username"> Dratin </span>: CRIT!`; 
    const iconSrc = "assets/crit.png";
    feedbackDiv.innerHTML = `
        <img src="${iconSrc}" class="feedback-icon" alt="Crit" />
        <span class="feedback-text">${message}</span>
    `;
    this.chatBox.appendChild(feedbackDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
    
}

    processChatBatch() {
        if (!this.queuedMessages.length || !this.chatBox) return;
        
        const frag = document.createDocumentFragment();
        this.queuedMessages.forEach(m => frag.appendChild(m));
        this.chatBox.appendChild(frag);
        
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
        this.queuedMessages = [];
        
        const msgs = this.chatBox.querySelectorAll('.chatMessage');
        if (msgs.length > 100) {
            for (let i = 0; i < msgs.length - 100; i++) msgs[i].remove();
        }
    }
    
    spawnRegularMessage() {
        const good = Math.random() > 0.4;
        const texts = good ? GAME_CONSTANTS.GOOD_TEXTS : GAME_CONSTANTS.BAD_TEXTS;
        const text = texts[Math.floor(Math.random() * texts.length)];
        const username = this.game.usernames[Math.floor(Math.random() * this.game.usernames.length)];
        const color = GAME_CONSTANTS.USER_COLORS[Math.floor(Math.random() * GAME_CONSTANTS.USER_COLORS.length)];
        this.addChatMessage(username, text, color, good);
    }
    
    spawnEvent() {
        if (this.isEventActive || !this.chatBox) return;
        this.isEventActive = true;
        
        const good = Math.random() > 0.4;
        const texts = good ? GAME_CONSTANTS.GOOD_TEXTS : GAME_CONSTANTS.BAD_TEXTS;
        const text = texts[Math.floor(Math.random() * texts.length)];
        const username = this.game.usernames[Math.floor(Math.random() * this.game.usernames.length)];
        const color = GAME_CONSTANTS.USER_COLORS[Math.floor(Math.random() * GAME_CONSTANTS.USER_COLORS.length)];
        
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("chatEvent", "fixed-top");
        msgDiv.innerHTML = `
            <div class="event-content">
                <span class="username" style="color:${color}">${username}:</span><span class="event-text"> ${text}</span>
            </div>
            <div class="actions">
                <button class="banBtn">🚫 Ban <span class="key-hint">(1)</span></button> 
                <button class="vipBtn">⭐ VIP <span class="key-hint">(2)</span></button>
            </div>
            <div class="timer-container"><div class="timer-bar" style="animation-duration: 5s;"></div></div>
        `;
        

        this.chatBox.prepend(msgDiv); 
        this.chatBox.scrollTop = 0;

        const resolve = (correctAction) => {
            clearTimeout(timer);
            if (msgDiv.parentNode) msgDiv.remove();
            this.isEventActive = false;
            
            if (correctAction) {
                this.game.gainHype(100); 
                this.game.audio.playSound("good");
                this.addSystemMessage("🎉 Right!");
 
                this.game.applyFeedbackGlow("rgba(0, 255, 0, 0.8)"); 
            } else {
                this.game.loseHype(10);
                this.game.audio.playSound("bad");
                this.addSystemMessage("❌ Wrong!");

                this.game.applyFeedbackGlow("rgba(255, 0, 0, 0.8)"); 
            }
        };

        msgDiv.querySelector(".banBtn").onclick = () => resolve(!good);
        msgDiv.querySelector(".vipBtn").onclick = () => resolve(good);

        const timer = setTimeout(() => {
            resolve(false); 
        }, 5000);
    }
    
    runAutoMod(level) {
        if (level <= 0) return;
        
        let cleared = 0;
        let xpGained = 0;
        

        for (let i = this.game.messages.messages.length - 1; i >= 0 && cleared < level; i--) {
            const msg = this.game.messages.messages[i];
            if (msg && !msg.good) {
                this.game.messages.messages.splice(i, 1);
                const xpAmount = 10 * this.game.progression.xpMultiplier; 
                this.game.progression.addXP(xpAmount); 
                xpGained += xpAmount;
                cleared++;
            }
        }
        
        if (cleared > 0) {
            this.game.audio.playSound("good");
            this.addSystemMessage(`🛡️ Moderator removed ${cleared} threats! +${Math.floor(xpGained)} XP`); 
        }
    }
}
