const Match = require('../models/Match');
const User = require('../models/User');
const Skill = require('../models/Skill');
const { calculateLevel, calculateBadges } = require('../services/xpEngine');
const { findMatches } = require('../services/matchmaker');
const { resolveSkills } = require('../services/skillCatalog');
const { ensureCharacterForUser, addProjectGrade } = require('../services/characterEngine');

async function renderDashboard(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate('character').populate('skillTags').lean();
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
    const user = await User.findById(req.user.id).populate('character').populate('skillTags').lean();
    const allSkills = await Skill.find({}).sort({ points: -1 }).lean();
    return res.render('profile', { user, allSkills, levelFromXp: calculateLevel(user?.xp || 0) });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { portfolioLink, city, bio, skillTags } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skillInput = Array.isArray(skillTags) ? skillTags : String(skillTags || '').split(',');
    const { skillDocs, skillPoints, skillLabels } = await resolveSkills(skillInput);

    user.portfolioLink = portfolioLink || user.portfolioLink;
    user.city = city || user.city;
    user.bio = bio || user.bio;
    user.skills = skillLabels;
    user.skillTags = skillDocs.map((s) => s._id);
    user.skillPoints = skillPoints;
    await user.save();

    return res.redirect('/profile');
  } catch (error) {
    return next(error);
  }
}

async function addProjectGradeToCharacter(req, res, next) {
  try {
    const { title, difficulty, size } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { character, xpAwarded } = await addProjectGrade({ user, title, difficulty, size });

    user.xp += xpAwarded;
    user.badges = calculateBadges(user.xp);
    user.character = character._id;
    await user.save();

    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
}

async function renderCharacterHub(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    const character = await ensureCharacterForUser(user);
    return res.render('characterHub', { user, character });
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
      .select('name githubUsername xp badges skillValue level city')
      .lean();

    return res.render('leaderboard', { users });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  renderDashboard,
  renderProfile,
  updateProfile,
  addProjectGradeToCharacter,
  renderCharacterHub,
  renderMatches,
  renderLeaderboard
};
