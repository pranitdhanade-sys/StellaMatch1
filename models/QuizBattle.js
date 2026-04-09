const mongoose = require('mongoose');

const QuizBattleSchema = new mongoose.Schema(
  {
    challenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isRobot: { type: Boolean, default: false },
    isPractice: { type: Boolean, default: false },
    skill: { type: String, required: true },
    scoreChallenger: { type: Number, required: true, min: 0 },
    scoreOpponent: { type: Number, required: true, min: 0 },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    xpAwarded: { type: Number, required: true, min: 0 },
    stellaAwarded: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuizBattle', QuizBattleSchema);
