const Character = require('../models/Character');

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
      inventory: ['Starter Keyboard', 'Debug Potion']
    });
  }
  return character;
}

async function addProjectGrade({ user, title, difficulty, size }) {
  const character = await ensureCharacterForUser(user);
  const xpAwarded = calculateProjectXp({ difficulty, size });

  character.projectGrades.push({
    title,
    difficulty: Number(difficulty),
    size: Number(size),
    xpAwarded
  });

  character.totalProjectXp += xpAwarded;
  character.level = Math.max(1, Math.floor(character.totalProjectXp / 200) + 1);

  if (xpAwarded >= 130 && !character.inventory.includes('Epic Blueprint')) {
    character.inventory.push('Epic Blueprint');
  }

  await character.save();
  return { character, xpAwarded };
}

module.exports = {
  ensureCharacterForUser,
  calculateProjectXp,
  addProjectGrade
};
