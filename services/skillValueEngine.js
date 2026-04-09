function normalize(n, max) {
  if (max <= 0) return 0;
  return Math.min(1, n / max);
}

function mapLevel(skillValue) {
  if (skillValue <= 30) return 'Beginner';
  if (skillValue <= 60) return 'Intermediate';
  if (skillValue <= 85) return 'Advanced';
  return 'Expert';
}

function computeSkillValue({ repoCount = 0, totalStars = 0, languageCount = 0, recentActivityDays = 365 }) {
  const repoScore = normalize(repoCount, 30) * 30;
  const starScore = normalize(totalStars, 200) * 30;
  const diversityScore = normalize(languageCount, 10) * 20;
  const activityScore = Math.max(0, 1 - Math.min(recentActivityDays, 365) / 365) * 20;

  const skillValue = Math.round(Math.min(100, repoScore + starScore + diversityScore + activityScore));
  const level = mapLevel(skillValue);

  return { skillValue, level };
}

module.exports = {
  computeSkillValue,
  mapLevel
};
