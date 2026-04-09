const express = require('express');
const multer = require('multer');
const path = require('path');
const { register, login, logout } = require('../controllers/authController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), 'resumes')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

router.post('/register', upload.single('resume'), register);
router.post('/login', login);
router.get('/logout', logout);

module.exports = router;
