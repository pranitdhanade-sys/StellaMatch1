const QuizQuestion = require('../models/QuizQuestion');

const DEFAULT_QUESTIONS = [
  {
    skill: 'javascript',
    question: 'Which keyword creates a block scoped variable?',
    options: ['var', 'let', 'define', 'constlet'],
    answerIndex: 1
  },
  {
    skill: 'python',
    question: 'Which structure stores key-value pairs in Python?',
    options: ['list', 'tuple', 'dict', 'set'],
    answerIndex: 2
  },
  {
    skill: 'node.js',
    question: 'Which module creates an HTTP server in Node.js core?',
    options: ['http', 'server', 'netapp', 'route'],
    answerIndex: 0
  },
  {
    skill: 'mongodb',
    question: 'Which operator matches a field in an array?',
    options: ['$in', '$arr', '$set', '$sum'],
    answerIndex: 0
  }
];

async function seedQuizArena() {
  for (const q of DEFAULT_QUESTIONS) {
    await QuizQuestion.updateOne(
      { skill: q.skill, question: q.question },
      { $set: q },
      { upsert: true }
    );
  }
}

async function getArenaQuestions(skill, limit = 5) {
  return QuizQuestion.find({ skill }).limit(limit).lean();
}

function scoreAnswers(questions, answers = []) {
  let score = 0;
  questions.forEach((question, idx) => {
    if (Number(answers[idx]) === question.answerIndex) score += 1;
  });
  return score;
}

module.exports = {
  seedQuizArena,
  getArenaQuestions,
  scoreAnswers
};
