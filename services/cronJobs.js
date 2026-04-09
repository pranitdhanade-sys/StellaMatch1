const cron = require('node-cron');
const User = require('../models/User');
const { analyzeGithub } = require('./githubAnalyzer');
const { findMatches } = require('./matchmaker');

function startAgenticMatchCron() {
  cron.schedule('0 */12 * * *', async () => {
    console.log('[cron] Starting skill recalculation + matchmaking run');
    const users = await User.find({ githubUsername: { $exists: true, $ne: '' } });

    for (const user of users) {
      try {
        const analysis = await analyzeGithub(user.githubUsername);
        user.skills = analysis.skills;
        user.skillValue = analysis.skillValue;
        user.level = analysis.level;
        user.lastGithubActivityAt = analysis.metadata.recentActivityDays >= 0
          ? new Date(Date.now() - analysis.metadata.recentActivityDays * 24 * 60 * 60 * 1000)
          : user.lastGithubActivityAt;
        await user.save();
      } catch (error) {
        console.warn(`[cron] analysis failed for ${user.githubUsername}:`, error.message);
      }
    }

    for (const user of users) {
      try {
        await findMatches(user._id);
      } catch (error) {
        console.warn(`[cron] matching failed for ${user._id}:`, error.message);
      }
    }

    console.log('[cron] completed');
  });
}

module.exports = {
  startAgenticMatchCron
};
