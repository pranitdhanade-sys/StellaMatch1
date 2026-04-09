const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    githubUsername: { type: String, default: '' },
    portfolioLink: { type: String, default: '' },
    city: { type: String, default: '' },
    bio: { type: String, default: '' },
    resumePath: { type: String, default: '' },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    skills: { type: [String], default: [] },
    skillTags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    skillPoints: { type: Number, default: 0, min: 0 },
    skillValue: { type: Number, default: 0, min: 0, max: 100 },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    },
    xp: { type: Number, default: 0, min: 0 },
    stellaPoints: { type: Number, default: 100, min: 0 },
    badges: { type: [String], default: [] },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    character: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: null },
    lastGithubActivityAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
