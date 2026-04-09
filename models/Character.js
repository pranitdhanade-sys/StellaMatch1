const mongoose = require('mongoose');

const ProjectGradeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    size: { type: Number, required: true, min: 1, max: 5 },
    xpAwarded: { type: Number, required: true, min: 0 },
    gradedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const CharacterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    alias: { type: String, required: true },
    classType: { type: String, default: 'Builder' },
    sprite: { type: String, default: 'sprite-engineer' },
    level: { type: Number, default: 1, min: 1 },
    inventory: { type: [String], default: ['Laptop', 'Energy Drink'] },
    projectGrades: { type: [ProjectGradeSchema], default: [] },
    totalProjectXp: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Character', CharacterSchema);
