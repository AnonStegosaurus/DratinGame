export const ACHIEVEMENTS_LIST = [
    { id: 'LEVEL_3', name: 'Apprentice', description: 'Reach Level 3.', check: (game) => game.progression.playerLevel >= 3 },
    { id: 'LEVEL_5', name: 'Junior Streamer', description: 'Reach Level 5.', check: (game) => game.progression.playerLevel >= 5 },
    { id: 'LEVEL_10', name: 'Chat Veteran', description: 'Reach Level 10.', check: (game) => game.progression.playerLevel >= 10 },
    { id: 'HYPETRAIN_1', name: 'First Train', description: 'Activate the Hype Train.', check: (game) => game.progression.isHypeTrainActive && game.progression.upgrades.hypetrain >= 1 },
    { id: 'HYPETRAIN_3', name: 'Legendary Train', description: 'Activate Hype Train Level 3.', check: (game) => game.progression.upgrades.hypetrain >= 3 },
    { id: 'MODERATOR_1', name: 'Self-Defense', description: 'Purchase the Moderator upgrade.', check: (game) => game.progression.upgrades.moderator >= 1 },
    { id: 'MODERATOR_3', name: 'Chat Guardians', description: 'Upgrade Moderator to level 3.', check: (game) => game.progression.upgrades.moderator >= 3 },
    { id: 'GOOD_100', name: 'Chat Favorite', description: 'Collect 100 good emotes.', check: (game) => game.stats.goodMessages >= 100 },
    { id: 'GOOD_500', name: 'Positivity Legend', description: 'Collect 500 good emotes.', check: (game) => game.stats.goodMessages >= 500 },
    { id: 'CHALLENGE_SURVIVOR', name: 'Survivor', description: 'Stay alive for 5 minutes without dying.', check: (game) => game.stats.survivalTime >= 300 },
    { id: 'CHALLENGE_SPEEDRUN', name: 'Speedrunner', description: 'Complete 3 levels in under 2 minutes.', check: (game) => game.stats.speedrunTimer <= 120 && game.progression.playerLevel >= 3 },
    { id: 'CHALLENGE_PERFECT', name: 'Total Perfection', description: 'Complete a level without taking damage.', check: (game) => game.stats.damageTaken === 0 && game.progression.playerLevel > 1 },
    { id: 'SECRET_SPINOR', name: 'Spinor Ascendant', description: 'Unravel the mystery of the Quantum Wave...', check: (game) => game.stats.score >= 10000 && game.progression.playerLevel >= 5 },
    { id: 'SECRET_DARKMODE', name: 'Dark Mode Engaged', description: 'Activate the hidden night mode.', check: (game) => game.ui?.theme === 'dark' },
    { id: 'SECRET_TROLL', name: 'Chat Troll', description: 'Send 10 bad messages in a row.', check: (game) => game.stats.badStreak >= 10 }
];