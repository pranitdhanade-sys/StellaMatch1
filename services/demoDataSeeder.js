const bcrypt = require('bcrypt');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Character = require('../models/Character');

const DEMO_USERS = [
  { name: 'Ava Circuit', email: 'ava@stellamatch.dev', city: 'San Francisco', skills: ['javascript', 'node.js', 'mongodb'] },
  { name: 'Noah Vector', email: 'noah@stellamatch.dev', city: 'San Francisco', skills: ['python', 'ui design'] },
  { name: 'Mia Pulse', email: 'mia@stellamatch.dev', city: 'New York', skills: ['flutter', 'javascript'] },
  { name: 'Liam Forge', email: 'liam@stellamatch.dev', city: 'Austin', skills: ['devops', 'node.js'] }
];

async function seedDemoData() {
  const existingCount = await User.countDocuments();
  if (existingCount > 2) return;

  const password = await bcrypt.hash('demo1234', 10);

  for (const demo of DEMO_USERS) {
    let user = await User.findOne({ email: demo.email });
    if (!user) {
      const skillDocs = await Skill.find({ name: { $in: demo.skills } });
      const skillPoints = skillDocs.reduce((sum, skill) => sum + skill.points, 0);

      user = await User.create({
        name: demo.name,
        email: demo.email,
        password,
        city: demo.city,
        skills: skillDocs.map((s) => s.displayName),
        skillTags: skillDocs.map((s) => s._id),
        skillPoints,
        skillValue: Math.min(100, skillPoints),
        xp: 120 + Math.floor(Math.random() * 280),
        stellaPoints: 80 + Math.floor(Math.random() * 120),
        badges: ['Code Starter']
      });
    }

    const hasCharacter = await Character.findOne({ user: user._id });
    if (!hasCharacter) {
      const character = await Character.create({
        user: user._id,
        alias: `${user.name.split(' ')[0]}-Hero`,
        classType: 'Guild Ranger',
        inventory: ['Starter Keyboard', 'Quest Map', 'Pixel Cape'],
        totalProjectXp: user.xp
      });
      user.character = character._id;
      await user.save();
    }
  }
}

module.exports = {
  seedDemoData
};
