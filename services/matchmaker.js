const Match = require('../models/Match');
const User = require('../models/User');

function calculateComplementaryScore(sourceUser, candidate) {
  const sourceSkills = new Set(sourceUser.skills || []);
  const targetSkills = new Set(candidate.skills || []);

  const sourceNeeds = [...targetSkills].filter((s) => !sourceSkills.has(s));
  const candidateNeeds = [...sourceSkills].filter((s) => !targetSkills.has(s));

  if (!sourceNeeds.length || !candidateNeeds.length) {
    return null;
  }

  const skillGap = Math.abs((sourceUser.skillValue || 0) - (candidate.skillValue || 0));
  const balanceScore = Math.max(0, 1 - skillGap / 100);
  const reciprocityScore = Math.min(sourceNeeds.length, candidateNeeds.length) / Math.max(sourceNeeds.length, candidateNeeds.length);
  const score = balanceScore * 0.55 + reciprocityScore * 0.45;

  return {
    score,
    skillOffered: candidateNeeds[0],
    skillRequested: sourceNeeds[0]
  };
}

async function findMatches(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return [];

  const candidates = await User.find({ _id: { $ne: userId } }).lean();
  const ranked = candidates
    .map((candidate) => {
      const match = calculateComplementaryScore(user, candidate);
      if (!match) return null;
      return {
        userA: user._id,
        userB: candidate._id,
        skillOffered: match.skillOffered,
        skillRequested: match.skillRequested,
        score: match.score
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  for (const match of ranked) {
    await Match.updateOne(
      {
        userA: match.userA,
        userB: match.userB,
        skillOffered: match.skillOffered,
        skillRequested: match.skillRequested
      },
      {
        $setOnInsert: {
          status: 'suggested',
          scheduledAt: null
        }
      },
      { upsert: true }
    );
  }

  return ranked;
}

module.exports = {
  findMatches
};
