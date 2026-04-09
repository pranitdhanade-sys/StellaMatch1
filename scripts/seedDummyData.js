require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const connectDB = require('../config/db');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Character = require('../models/Character');
const Match = require('../models/Match');
const FriendRequest = require('../models/FriendRequest');
const FriendMessage = require('../models/FriendMessage');
const QuizBattle = require('../models/QuizBattle');
const StellaPointTransaction = require('../models/StellaPointTransaction');
const ActivityLog = require('../models/ActivityLog');
const { seedSkillCatalog } = require('../services/skillCatalog');
const { seedQuizArena } = require('../services/skillArena');

const DEMO_PASSWORD = 'demo1234';

const PLAYERS = [
  { name: 'Ava Circuit', email: 'ava@stellamatch.dev', city: 'San Francisco', skills: ['javascript', 'node.js', 'mongodb'] },
  { name: 'Noah Vector', email: 'noah@stellamatch.dev', city: 'San Francisco', skills: ['python', 'ui design'] },
  { name: 'Mia Pulse', email: 'mia@stellamatch.dev', city: 'New York', skills: ['flutter', 'javascript'] },
  { name: 'Liam Forge', email: 'liam@stellamatch.dev', city: 'Austin', skills: ['devops', 'node.js'] },
  { name: 'Zoe Pixel', email: 'zoe@stellamatch.dev', city: 'Seattle', skills: ['mongodb', 'python'] }
];

async function upsertUser(player, hashedPassword) {
  const skillDocs = await Skill.find({ name: { $in: player.skills } });
  const skillPoints = skillDocs.reduce((sum, item) => sum + item.points, 0);

  let user = await User.findOne({ email: player.email });
  if (!user) {
    user = new User({ email: player.email });
  }

  user.name = player.name;
  user.password = hashedPassword;
  user.city = player.city;
  user.skills = skillDocs.map((s) => s.displayName);
  user.skillTags = skillDocs.map((s) => s._id);
  user.skillPoints = skillPoints;
  user.skillValue = Math.min(100, skillPoints + 20);
  user.xp = 180 + Math.floor(Math.random() * 220);
  user.stellaPoints = 90 + Math.floor(Math.random() * 140);
  user.badges = ['Code Starter', 'Fast Learner'];
  await user.save();

  let character = await Character.findOne({ user: user._id });
  if (!character) {
    character = new Character({ user: user._id });
  }
  character.alias = `${user.name.split(' ')[0]}-Champion`;
  character.classType = 'Guild Ranger';
  character.inventory = ['Starter Keyboard', 'Quest Map', 'Pixel Cape', 'Bug Blaster'];
  character.totalProjectXp = user.xp;
  character.level = Math.max(1, Math.floor(character.totalProjectXp / 200) + 1);
  character.projectGrades = [
    { title: 'Realtime Chat Arena', difficulty: 4, size: 4, xpAwarded: 140 },
    { title: 'Portfolio Analyzer', difficulty: 3, size: 3, xpAwarded: 105 }
  ];
  await character.save();

  user.character = character._id;
  await user.save();

  return user;
}

async function seedRelationships(users) {
  const [u1, u2, u3] = users;

  await FriendRequest.updateOne(
    { fromUser: u1._id, toUser: u2._id },
    { $set: { status: 'accepted' } },
    { upsert: true }
  );
  await User.updateOne({ _id: u1._id }, { $addToSet: { friends: u2._id } });
  await User.updateOne({ _id: u2._id }, { $addToSet: { friends: u1._id } });

  await FriendMessage.create([
    { fromUser: u1._id, toUser: u2._id, content: 'Ready for tonight\'s Node quest?' },
    { fromUser: u2._id, toUser: u1._id, content: 'Yes! I will bring Python spells.' }
  ]);

  await Match.updateOne(
    { userA: u1._id, userB: u3._id, skillOffered: 'Node.js', skillRequested: 'Flutter' },
    { $setOnInsert: { status: 'suggested', scheduledAt: null } },
    { upsert: true }
  );

  await StellaPointTransaction.create({ fromUser: u1._id, toUser: u2._id, points: 12, note: 'Mentorship bonus' });

  await QuizBattle.create({
    challenger: u1._id,
    opponent: u2._id,
    skill: 'javascript',
    scoreChallenger: 4,
    scoreOpponent: 3,
    winner: u1._id,
    xpAwarded: 60,
    stellaAwarded: 10
  });

  await ActivityLog.create([
    { user: u1._id, action: 'dummy_seed', method: 'SEED', path: '/scripts/seedDummyData', metadata: { scope: 'dashboard' } },
    { user: u2._id, action: 'dummy_seed', method: 'SEED', path: '/scripts/seedDummyData', metadata: { scope: 'friends-hub' } },
    { user: u3._id, action: 'dummy_seed', method: 'SEED', path: '/scripts/seedDummyData', metadata: { scope: 'skill-arena' } }
  ]);
}

async function run() {
  try {
    await connectDB();
    await seedSkillCatalog();
    await seedQuizArena();

    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
    const users = [];
    for (const player of PLAYERS) {
      users.push(await upsertUser(player, hashed));
    }

    await seedRelationships(users);

    console.log('Dummy data seeded successfully for all major pages.');
    console.log(`Demo login password: ${DEMO_PASSWORD}`);
  } catch (error) {
    console.error('Dummy data seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
