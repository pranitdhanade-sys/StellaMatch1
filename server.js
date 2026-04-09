require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');
const { optionalAuth } = require('./middleware/auth');
const sessionSocket = require('./socket/sessionSocket');
const { startAgenticMatchCron } = require('./services/cronJobs');
const { seedSkillCatalog } = require('./services/skillCatalog');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(optionalAuth);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/resumes', express.static(path.join(__dirname, 'resumes')));

app.use(authRoutes);
app.use(viewRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ message: err.message || 'Server error' });
});

sessionSocket(io);

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  await seedSkillCatalog();
  startAgenticMatchCron();
  server.listen(PORT, () => {
    console.log(`StellaMatch running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to boot server:', error);
  process.exit(1);
});
