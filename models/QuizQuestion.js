const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answerIndex: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
