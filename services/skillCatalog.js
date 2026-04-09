const Skill = require('../models/Skill');

const DEFAULT_SKILLS = [
  { name: 'python', displayName: 'Python', points: 30, category: 'backend' },
  { name: 'javascript', displayName: 'JavaScript', points: 25, category: 'frontend' },
  { name: 'node.js', displayName: 'Node.js', points: 28, category: 'backend' },
  { name: 'flutter', displayName: 'Flutter', points: 27, category: 'mobile' },
  { name: 'mongodb', displayName: 'MongoDB', points: 24, category: 'database' },
  { name: 'ui design', displayName: 'UI Design', points: 20, category: 'design' },
  { name: 'devops', displayName: 'DevOps', points: 22, category: 'ops' },
  { name: 'vibe coding', displayName: 'Vibe Coding', points: 18, category: 'creative' }
];

async function seedSkillCatalog() {
  for (const skill of DEFAULT_SKILLS) {
    await Skill.updateOne({ name: skill.name }, { $set: skill }, { upsert: true });
  }
}

async function resolveSkills(skillNames = []) {
  const normalized = [...new Set(skillNames.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  if (!normalized.length) return { skillDocs: [], skillPoints: 0, skillLabels: [] };

  const existing = await Skill.find({ name: { $in: normalized } });
  const existingNames = new Set(existing.map((s) => s.name));

  const missing = normalized.filter((name) => !existingNames.has(name));
  for (const name of missing) {
    const displayName = name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const created = await Skill.create({
      name,
      displayName,
      points: 10,
      category: 'custom'
    });
    existing.push(created);
  }

  const skillPoints = existing.reduce((sum, skill) => sum + skill.points, 0);
  return {
    skillDocs: existing,
    skillPoints,
    skillLabels: existing.map((skill) => skill.displayName)
  };
}

module.exports = {
  DEFAULT_SKILLS,
  seedSkillCatalog,
  resolveSkills
};
