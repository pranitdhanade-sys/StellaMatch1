const Match = require('../models/Match');
const User = require('../models/User');
const Skill = require('../models/Skill');
const ActivityLog = require('../models/ActivityLog');
const FriendRequest = require('../models/FriendRequest');
const StellaPointTransaction = require('../models/StellaPointTransaction');
const FriendMessage = require('../models/FriendMessage');
const QuizBattle = require('../models/QuizBattle');
const { calculateLevel, calculateBadges } = require('../services/xpEngine');
const { findMatches } = require('../services/matchmaker');
const { resolveSkills } = require('../services/skillCatalog');
const { ensureCharacterForUser, addProjectGrade } = require('../services/characterEngine');
const { getArenaQuestions, scoreAnswers } = require('../services/skillArena');

async function renderDashboard(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
      .populate('character')
      .populate('skillTags')
      .populate('friends', 'name city skillValue xp stellaPoints')
      .lean();
    const suggested = await findMatches(req.user.id);
    const incomingFriendRequests = await FriendRequest.find({ toUser: req.user.id, status: 'pending' })
      .populate('fromUser', 'name city')
      .lean();
    const stellaTransactions = await StellaPointTransaction.find({
      $or: [{ fromUser: req.user.id }, { toUser: req.user.id }]
    })
      .populate('fromUser', 'name')
      .populate('toUser', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    const recentActivities = await ActivityLog.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10).lean();
    const user = await User.findById(req.user.id).populate('character').populate('skillTags').lean();
    const suggested = await findMatches(req.user.id);

    return res.render('dashboard', {
      user,
      levelFromXp: calculateLevel(user?.xp || 0),
      badges: calculateBadges(user?.xp || 0),
      suggested,
      incomingFriendRequests,
      stellaTransactions,
      recentActivities
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

    await ActivityLog.create({
      user: user._id,
      action: 'profile_updated',
      method: 'POST',
      path: '/profile',
      metadata: { skillCount: skillDocs.length }
    });

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

    await ActivityLog.create({
      user: user._id,
      action: 'project_graded',
      method: 'POST',
      path: '/character/project-grade',
      metadata: { title, difficulty, size, xpAwarded }
    });

    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
}

async function sendStellaPoints(req, res, next) {
  try {
    const { toUserId, points, note } = req.body;
    const amount = Number(points);
    if (!toUserId || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid transfer request' });
    }

    const fromUser = await User.findById(req.user.id);
    const toUser = await User.findById(toUserId);
    if (!fromUser || !toUser) return res.status(404).json({ message: 'User not found' });
    if (String(fromUser._id) === String(toUser._id)) return res.status(400).json({ message: 'Cannot transfer to self' });
    if (fromUser.stellaPoints < amount) return res.status(400).json({ message: 'Not enough Stella points' });

    fromUser.stellaPoints -= amount;
    toUser.stellaPoints += amount;
    await Promise.all([
      fromUser.save(),
      toUser.save(),
      StellaPointTransaction.create({ fromUser: fromUser._id, toUser: toUser._id, points: amount, note: note || '' }),
      ActivityLog.create({
        user: fromUser._id,
        action: 'stella_points_sent',
        method: 'POST',
        path: '/stella/send',
        metadata: { toUserId, points: amount, note: note || '' }
      })
    ]);

    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
}

async function sendFriendRequest(req, res, next) {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ message: 'toUserId is required' });
    if (String(toUserId) === String(req.user.id)) return res.status(400).json({ message: 'Cannot add yourself' });

    await FriendRequest.updateOne(
      { fromUser: req.user.id, toUser: toUserId },
      { $set: { status: 'pending' } },
      { upsert: true }
    );

    await ActivityLog.create({
      user: req.user.id,
      action: 'friend_request_sent',
      method: 'POST',
      path: '/friends/request',
      metadata: { toUserId }
    });

    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
}

async function acceptFriendRequest(req, res, next) {
  try {
    const { requestId } = req.body;
    const request = await FriendRequest.findById(requestId);
    if (!request || String(request.toUser) !== String(req.user.id)) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    request.status = 'accepted';
    await request.save();

    await User.updateOne({ _id: request.fromUser }, { $addToSet: { friends: request.toUser } });
    await User.updateOne({ _id: request.toUser }, { $addToSet: { friends: request.fromUser } });

    await ActivityLog.create({
      user: req.user.id,
      action: 'friend_request_accepted',
      method: 'POST',
      path: '/friends/accept',
      metadata: { requestId }
    });

    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
}

async function renderFriendsHub(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'name city stellaPoints xp').lean();
    const selectedFriendId = req.query.friend || user.friends?.[0]?._id?.toString() || null;

    let messages = [];
    let selectedFriend = null;
    if (selectedFriendId) {
      selectedFriend = user.friends.find((friend) => String(friend._id) === String(selectedFriendId)) || null;
      messages = await FriendMessage.find({
        $or: [
          { fromUser: req.user.id, toUser: selectedFriendId },
          { fromUser: selectedFriendId, toUser: req.user.id }
        ]
      })
        .populate('fromUser', 'name')
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();
    }

    const videoRoom = selectedFriend
      ? `StellaMatch-${[req.user.id, selectedFriendId].sort().join('-')}`
      : null;

    return res.render('friendsHub', { user, selectedFriendId, selectedFriend, messages, videoRoom });
  } catch (error) {
    return next(error);
  }
}

async function sendFriendMessage(req, res, next) {
  try {
    const { toUserId, content } = req.body;
    const user = await User.findById(req.user.id).lean();
    const isFriend = (user.friends || []).some((friendId) => String(friendId) === String(toUserId));
    if (!isFriend) return res.status(403).json({ message: 'You can only chat with accepted friends' });

    await FriendMessage.create({ fromUser: req.user.id, toUser: toUserId, content });
    await ActivityLog.create({
      user: req.user.id,
      action: 'friend_message_sent',
      method: 'POST',
      path: '/friends/message',
      metadata: { toUserId }
    });

    return res.redirect(`/friends-hub?friend=${toUserId}`);
  } catch (error) {
    return next(error);
  }
}

async function renderSkillArena(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'name').lean();
    const skill = (req.query.skill || 'javascript').toLowerCase();
    const questions = await getArenaQuestions(skill, 5);
    const recentBattles = await QuizBattle.find({
      $or: [{ challenger: req.user.id }, { opponent: req.user.id }]
    })
      .populate('challenger', 'name')
      .populate('opponent', 'name')
      .populate('winner', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.render('skillArena', {
      user,
      skill,
      questions,
      recentBattles
    });
  } catch (error) {
    return next(error);
  }
}

async function battleInSkillArena(req, res, next) {
  try {
    const { opponentId, skill } = req.body;
    const rawAnswers = req.body.answers || {};
    const answers = Array.isArray(rawAnswers)
      ? rawAnswers
      : Object.keys(rawAnswers).sort((a, b) => Number(a) - Number(b)).map((k) => rawAnswers[k]);

    const user = await User.findById(req.user.id);
    const opponent = await User.findById(opponentId);
    if (!user || !opponent) return res.status(404).json({ message: 'Player not found' });

    const questions = await getArenaQuestions(String(skill || 'javascript').toLowerCase(), 5);
    const challengerScore = scoreAnswers(questions, answers);
    const opponentScore = Math.floor(Math.random() * (questions.length + 1));
    const winner = challengerScore >= opponentScore ? user : opponent;
    const xpAwarded = challengerScore * 15;
    const stellaAwarded = challengerScore >= opponentScore ? 10 : 3;

    user.xp += xpAwarded;
    user.stellaPoints += stellaAwarded;
    user.badges = calculateBadges(user.xp);
    await user.save();

    await QuizBattle.create({
      challenger: user._id,
      opponent: opponent._id,
      skill,
      scoreChallenger: challengerScore,
      scoreOpponent: opponentScore,
      winner: winner._id,
      xpAwarded,
      stellaAwarded
    });

    await ActivityLog.create({
      user: user._id,
      action: 'skill_arena_battle',
      method: 'POST',
      path: '/skill-arena/battle',
      metadata: { opponentId, skill, challengerScore, opponentScore, xpAwarded, stellaAwarded }
    });

    return res.redirect(`/skill-arena?skill=${encodeURIComponent(skill)}`);
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
    const sortKey = ['xp', 'skillPoints', 'stellaPoints'].includes(req.query.sortBy) ? req.query.sortBy : 'xp';
    const city = req.query.city?.trim();

    const query = {};
    if (city) query.city = city;

    const users = await User.find(query)
      .sort({ [sortKey]: -1 })
      .limit(50)
      .select('name githubUsername xp badges skillValue level city skillPoints stellaPoints friends')
      .lean();

    const allCities = await User.distinct('city', { city: { $ne: '' } });

    return res.render('leaderboard', { users, sortBy: sortKey, city: city || '', allCities });
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
  updateProfile,
  addProjectGradeToCharacter,
  sendStellaPoints,
  sendFriendRequest,
  acceptFriendRequest,
  renderFriendsHub,
  sendFriendMessage,
  renderSkillArena,
  battleInSkillArena,
  renderCharacterHub,
  renderMatches,
  renderLeaderboard
};
