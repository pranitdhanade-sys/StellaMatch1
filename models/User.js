const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    githubUsername: { type: String, default: '' },
    portfolioLink: { type: String, default: '' },
    resumePath: { type: String, default: '' },
    skills: { type: [String], default: [] },
    skillValue: { type: Number, default: 0, min: 0, max: 100 },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    },
    xp: { type: Number, default: 0, min: 0 },
    badges: { type: [String], default: [] },
    lastGithubActivityAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
