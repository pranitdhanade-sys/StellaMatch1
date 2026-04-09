const Match = require('../models/Match');
const User = require('../models/User');
const { calculateLevel, calculateBadges } = require('../services/xpEngine');
const { findMatches } = require('../services/matchmaker');

async function renderDashboard(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    const suggested = await findMatches(req.user.id);

    return res.render('dashboard', {
      user,
      levelFromXp: calculateLevel(user?.xp || 0),
      badges: calculateBadges(user?.xp || 0),
      suggested
    });
  } catch (error) {
    return next(error);
  }
}

async function renderProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    return res.render('profile', { user, levelFromXp: calculateLevel(user?.xp || 0) });
  } catch (error) {
    return next(error);
  }
}

async function renderMatches(req, res, next) {
  try {
    const matches = await Match.find({
      $or: [{ userA: req.user.id }, { userB: req.user.id }]
    })
      .populate('userA', 'name skills skillValue level')
      .populate('userB', 'name skills skillValue level')
      .sort({ createdAt: -1 })
      .lean();

    return res.render('matches', { matches, currentUserId: req.user.id });
  } catch (error) {
    return next(error);
  }
}

async function renderLeaderboard(req, res, next) {
  try {
    const users = await User.find({})
      .sort({ xp: -1 })
      .limit(50)
      .select('name githubUsername xp badges skillValue level')
      .lean();

    return res.render('leaderboard', { users });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  renderDashboard,
  renderProfile,
  renderMatches,
  renderLeaderboard
};
