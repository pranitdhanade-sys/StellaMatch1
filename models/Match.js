const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema(
  {
    userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillOffered: { type: String, required: true },
    skillRequested: { type: String, required: true },
    status: { type: String, enum: ['suggested', 'accepted', 'completed', 'cancelled'], default: 'suggested' },
    scheduledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

MatchSchema.index({ userA: 1, userB: 1, skillOffered: 1, skillRequested: 1 }, { unique: true });

module.exports = mongoose.model('Match', MatchSchema);
