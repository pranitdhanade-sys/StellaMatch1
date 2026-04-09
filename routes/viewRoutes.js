const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
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
  renderDeveloperActivity,
  renderLeaderboard
} = require('../controllers/userController');

const router = express.Router();

router.get('/', (_req, res) => res.redirect('/login'));
router.get('/login', (_req, res) => res.render('login'));
router.get('/register', (_req, res) => res.render('register'));

router.get('/dashboard', requireAuth, renderDashboard);
router.get('/profile', requireAuth, renderProfile);
router.post('/profile', requireAuth, updateProfile);
router.post('/character/project-grade', requireAuth, addProjectGradeToCharacter);
router.post('/stella/send', requireAuth, sendStellaPoints);
router.post('/friends/request', requireAuth, sendFriendRequest);
router.post('/friends/accept', requireAuth, acceptFriendRequest);
router.get('/friends-hub', requireAuth, renderFriendsHub);
router.post('/friends/message', requireAuth, sendFriendMessage);
router.get('/skill-arena', requireAuth, renderSkillArena);
router.post('/skill-arena/battle', requireAuth, battleInSkillArena);
router.get('/character-hub', requireAuth, renderCharacterHub);
router.get('/matches', requireAuth, renderMatches);
router.get('/developer/activity', requireAuth, renderDeveloperActivity);
router.get('/leaderboard', requireAuth, renderLeaderboard);

module.exports = router;
