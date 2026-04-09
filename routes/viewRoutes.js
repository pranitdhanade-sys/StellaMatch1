const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  renderDashboard,
  renderProfile,
  renderMatches,
  renderLeaderboard
} = require('../controllers/userController');

const router = express.Router();

router.get('/', (_req, res) => res.redirect('/login'));
router.get('/login', (_req, res) => res.render('login'));
router.get('/register', (_req, res) => res.render('register'));

router.get('/dashboard', requireAuth, renderDashboard);
router.get('/profile', requireAuth, renderProfile);
router.get('/matches', requireAuth, renderMatches);
router.get('/leaderboard', requireAuth, renderLeaderboard);

module.exports = router;
