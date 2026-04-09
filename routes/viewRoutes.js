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
  renderCharacterHub,
  renderMatches,
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
router.get('/character-hub', requireAuth, renderCharacterHub);
router.get('/matches', requireAuth, renderMatches);
router.get('/leaderboard', requireAuth, renderLeaderboard);

module.exports = router;
