// js/main.js
import { ChatDodgeGame } from './game.js';
document.addEventListener('DOMContentLoaded', () => {
    const game = new ChatDodgeGame();
    game.init();
});