const BADGES = [
  { name: 'Code Starter', minXp: 100 },
  { name: 'Fast Learner', minXp: 300 },
  { name: 'Skill Mentor', minXp: 600 },
  { name: 'Knowledge Trader', minXp: 1000 },
  { name: 'Master Engineer', minXp: 1600 }
];

const XP_RULES = {
  learningSessionCompleted: 50,
  teachingSessionCompleted: 80,
  dailyLogin: 5
};

function calculateLevel(xp = 0) {
  return Math.floor(xp / 100);
}

function calculateBadges(xp = 0) {
  return BADGES.filter((badge) => xp >= badge.minXp).map((badge) => badge.name);
}

function applyXp(currentXp = 0, eventType) {
  const delta = XP_RULES[eventType] || 0;
  const xp = Math.max(0, currentXp + delta);
  return {
    xp,
    gained: delta,
    level: calculateLevel(xp),
    badges: calculateBadges(xp)
  };
}

module.exports = {
  XP_RULES,
  BADGES,
  calculateLevel,
  calculateBadges,
  applyXp
};
