const Character = require('../models/Character');
const { analyzeGithub } = require('./githubAnalyzer');

function calculateProjectXp({ difficulty, size }) {
  const difficultyWeight = Math.max(1, Math.min(5, Number(difficulty))) * 20;
  const sizeWeight = Math.max(1, Math.min(5, Number(size))) * 15;
  return difficultyWeight + sizeWeight;
}

async function ensureCharacterForUser(user) {
  let character = await Character.findOne({ user: user._id });
  if (!character) {
    character = await Character.create({
      user: user._id,
      alias: `${user.name.split(' ')[0]}-Ranger`,
      classType: 'Builder',
      sprite: 'sprite-engineer',
      inventory: ['Starter Keyboard', 'Debug Potion'],
      level: 1,
      totalProjectXp: 0,
      projectGrades: []
    });
  }
  return character;
}

async function addProjectGrade({ user, title, difficulty, size }) {
  const character = await ensureCharacterForUser(user);
  let xpAwarded = calculateProjectXp({ difficulty, size });

  // GitHub bonus
  let githubBonus = 0;
  if (user.githubUsername) {
    try {
      const githubData = await analyzeGithub(user.githubUsername);
      const totalCommits = githubData.totalCommits || 0;
      const totalPRs = githubData.totalPRs || 0;
      const totalStars = githubData.totalStars || 0;
      // Bonus based on commits, PRs, stars
      githubBonus = Math.min(50, Math.floor(totalCommits / 10) + totalPRs * 5 + totalStars * 2);
      xpAwarded += githubBonus;
    } catch (error) {
      console.error('GitHub analysis failed:', error.message);
      // No bonus if error
    }
  }

  character.projectGrades.push({
    title,
    difficulty: Number(difficulty),
    size: Number(size),
    xpAwarded,
    githubBonus
  });

  character.totalProjectXp += xpAwarded;
  character.level = Math.max(1, Math.floor(character.totalProjectXp / 200) + 1);

  if (xpAwarded >= 130 && !character.inventory.includes('Epic Blueprint')) {
    character.inventory.push('Epic Blueprint');
  }

  await character.save();
  return { character, xpAwarded, githubBonus };
}

module.exports = {
  ensureCharacterForUser,
  calculateProjectXp,
  addProjectGrade
};
