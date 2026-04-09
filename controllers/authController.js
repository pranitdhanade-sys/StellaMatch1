const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { analyzeGithub } = require('../services/githubAnalyzer');
const { calculateBadges } = require('../services/xpEngine');
const { resolveSkills } = require('../services/skillCatalog');
const { ensureCharacterForUser } = require('../services/characterEngine');

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function parseSkillInput(rawSkills) {
  if (!rawSkills) return [];
  if (Array.isArray(rawSkills)) return rawSkills;
  return String(rawSkills)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function register(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      githubUsername,
      portfolioLink,
      city,
      bio,
      skillTags
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required.' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered.' });

    const parsedSkills = parseSkillInput(skillTags);
    const { skillDocs, skillPoints, skillLabels } = await resolveSkills(parsedSkills);
    const hashed = await bcrypt.hash(password, 12);
    const resumePath = req.file ? `/resumes/${req.file.filename}` : '';

    const user = await User.create({
      name,
      email,
      password: hashed,
      githubUsername: githubUsername || '',
      portfolioLink: portfolioLink || '',
      city: city || '',
      bio: bio || '',
      resumePath,
      skills: skillLabels,
      skillTags: skillDocs.map((s) => s._id),
      skillPoints,
      xp: 5,
      badges: calculateBadges(5)
    });

    if (req.file) {
      const resume = await Resume.create({
        user: user._id,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        path: resumePath,
        mimeType: req.file.mimetype,
        size: req.file.size
      });
      user.resume = resume._id;
    }

    if (githubUsername) {
      try {
        const analysis = await analyzeGithub(githubUsername);
        user.skills = [...new Set([...user.skills, ...analysis.skills])];
        user.skillValue = analysis.skillValue;
        user.level = analysis.level;
        user.lastGithubActivityAt = analysis.metadata.recentActivityDays >= 0
          ? new Date(Date.now() - analysis.metadata.recentActivityDays * 24 * 60 * 60 * 1000)
          : null;
        await user.save();
      } catch (error) {
        console.warn('GitHub analysis failed on registration:', error.message);
      }
    }

    const character = await ensureCharacterForUser(user);
    user.character = character._id;
    await user.save();

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });

    return res.status(201).json({ message: 'Registered successfully', token });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    return next(error);
  }
}

function logout(req, res) {
  res.clearCookie('token');
  return res.redirect('/login');
}

module.exports = {
  register,
  login,
  logout
};
