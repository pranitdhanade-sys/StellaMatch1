const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    points: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'general' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', SkillSchema);
