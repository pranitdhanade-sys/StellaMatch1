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
  { name: 'Zoe Pixel', email: 'zoe@stellamatch.dev', city: 'Seattle', skills: ['mongodb', 'python'] },
  { name: 'Ethan Code', email: 'ethan@stellamatch.dev', city: 'Los Angeles', skills: ['react', 'typescript'] },
  { name: 'Sophia Byte', email: 'sophia@stellamatch.dev', city: 'Chicago', skills: ['java', 'spring'] },
  { name: 'Mason Data', email: 'mason@stellamatch.dev', city: 'Boston', skills: ['sql', 'python'] },
  { name: 'Isabella Cloud', email: 'isabella@stellamatch.dev', city: 'Seattle', skills: ['aws', 'docker'] },
  { name: 'Lucas AI', email: 'lucas@stellamatch.dev', city: 'San Francisco', skills: ['machine learning', 'python'] },
  { name: 'Emma Web', email: 'emma@stellamatch.dev', city: 'New York', skills: ['html', 'css', 'javascript'] },
  { name: 'Jackson Dev', email: 'jackson@stellamatch.dev', city: 'Austin', skills: ['golang', 'kubernetes'] },
  { name: 'Avery Mobile', email: 'avery@stellamatch.dev', city: 'Los Angeles', skills: ['swift', 'ios'] },
  { name: 'Harper Game', email: 'harper@stellamatch.dev', city: 'Seattle', skills: ['unity', 'c#'] },
  { name: 'Evelyn Crypto', email: 'evelyn@stellamatch.dev', city: 'Miami', skills: ['blockchain', 'solidity'] },
  { name: 'Logan VR', email: 'logan@stellamatch.dev', city: 'San Francisco', skills: ['unity', 'vr'] },
  { name: 'Abigail IoT', email: 'abigail@stellamatch.dev', city: 'Austin', skills: ['arduino', 'raspberry pi'] },
  { name: 'Benjamin QA', email: 'benjamin@stellamatch.dev', city: 'Chicago', skills: ['selenium', 'testing'] },
  { name: 'Ella UX', email: 'ella@stellamatch.dev', city: 'New York', skills: ['figma', 'user research'] },
  { name: 'Alexander Sec', email: 'alexander@stellamatch.dev', city: 'Boston', skills: ['cybersecurity', 'penetration testing'] },
  { name: 'Sofia DataSci', email: 'sofia@stellamatch.dev', city: 'San Francisco', skills: ['pandas', 'tensorflow'] },
  { name: 'Michael FullStack', email: 'michael@stellamatch.dev', city: 'Seattle', skills: ['mern', 'graphql'] },
  { name: 'Olivia Backend', email: 'olivia@stellamatch.dev', city: 'Austin', skills: ['django', 'postgresql'] },
  { name: 'Daniel Frontend', email: 'daniel@stellamatch.dev', city: 'Los Angeles', skills: ['vue.js', 'sass'] },
  { name: 'Charlotte Embedded', email: 'charlotte@stellamatch.dev', city: 'Chicago', skills: ['c++', 'embedded systems'] },
  { name: 'Henry CloudArch', email: 'henry@stellamatch.dev', city: 'New York', skills: ['azure', 'terraform'] },
  { name: 'Amelia DevOps', email: 'amelia@stellamatch.dev', city: 'Boston', skills: ['jenkins', 'ansible'] },
  { name: 'Sebastian MobileDev', email: 'sebastian@stellamatch.dev', city: 'San Francisco', skills: ['kotlin', 'android'] },
  { name: 'Emily Analyst', email: 'emily@stellamatch.dev', city: 'Seattle', skills: ['tableau', 'sql'] },
  { name: 'Jack Engineer', email: 'jack@stellamatch.dev', city: 'Austin', skills: ['matlab', 'simulink'] },
  { name: 'Madison Designer', email: 'madison@stellamatch.dev', city: 'Los Angeles', skills: ['photoshop', 'illustrator'] },
  { name: 'Aiden Blockchain', email: 'aiden@stellamatch.dev', city: 'Miami', skills: ['ethereum', 'smart contracts'] },
  { name: 'Chloe AI', email: 'chloe@stellamatch.dev', city: 'Chicago', skills: ['nlp', 'huggingface'] },
  { name: 'Matthew SRE', email: 'matthew@stellamatch.dev', city: 'New York', skills: ['prometheus', 'grafana'] },
  { name: 'Harper TechLead', email: 'harper2@stellamatch.dev', city: 'Boston', skills: ['leadership', 'agile'] },
  { name: 'Luna OpenSource', email: 'luna@stellamatch.dev', city: 'San Francisco', skills: ['linux', 'git'] },
  { name: 'Carter Startup', email: 'carter@stellamatch.dev', city: 'Seattle', skills: ['entrepreneurship', 'pitch'] },
  { name: 'Grace Mentor', email: 'grace@stellamatch.dev', city: 'Austin', skills: ['teaching', 'coaching'] },
  { name: 'Jayden Hacker', email: 'jayden@stellamatch.dev', city: 'Los Angeles', skills: ['ctf', 'reverse engineering'] },
  { name: 'Zoey Product', email: 'zoey@stellamatch.dev', city: 'Chicago', skills: ['product management', 'roadmapping'] },
  { name: 'Levi Consultant', email: 'levi@stellamatch.dev', city: 'New York', skills: ['strategy', 'analysis'] },
  { name: 'Nora Researcher', email: 'nora@stellamatch.dev', city: 'Boston', skills: ['academic research', 'publishing'] },
  { name: 'Wyatt Freelancer', email: 'wyatt@stellamatch.dev', city: 'San Francisco', skills: ['upwork', 'client management'] },
  { name: 'Hannah Intern', email: 'hannah@stellamatch.dev', city: 'Seattle', skills: ['internship', 'learning'] },
  { name: 'Dylan Remote', email: 'dylan@stellamatch.dev', city: 'Austin', skills: ['remote work', 'time management'] },
  { name: 'Lillian Speaker', email: 'lillian@stellamatch.dev', city: 'Los Angeles', skills: ['public speaking', 'presentation'] },
  { name: 'Grayson Volunteer', email: 'grayson@stellamatch.dev', city: 'Chicago', skills: ['community service', 'volunteering'] },
  { name: 'Victoria Innovator', email: 'victoria@stellamatch.dev', city: 'New York', skills: ['innovation', 'creativity'] },
  { name: 'Julian Contributor', email: 'julian@stellamatch.dev', city: 'Boston', skills: ['open source', 'collaboration'] },
  { name: 'Lily Coder', email: 'lily@stellamatch.dev', city: 'San Francisco', skills: ['coding challenges', 'algorithms'] },
  { name: 'Ryan Gamer', email: 'ryan@stellamatch.dev', city: 'Seattle', skills: ['game development', 'unity'] },
  { name: 'Savannah Artist', email: 'savannah@stellamatch.dev', city: 'Austin', skills: ['digital art', 'animation'] },
  { name: 'Nathan Streamer', email: 'nathan@stellamatch.dev', city: 'Los Angeles', skills: ['streaming', 'content creation'] },
  { name: 'Audrey Blogger', email: 'audrey@stellamatch.dev', city: 'Chicago', skills: ['blogging', 'seo'] },
  { name: 'Eli Podcaster', email: 'eli@stellamatch.dev', city: 'New York', skills: ['podcasting', 'audio editing'] },
  { name: 'Stella Youtuber', email: 'stella@stellamatch.dev', city: 'Boston', skills: ['video editing', 'youtube'] }
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
