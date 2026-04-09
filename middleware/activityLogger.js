const ActivityLog = require('../models/ActivityLog');

function activityLogger(req, res, next) {
  const skip = req.path.startsWith('/public') || req.path.startsWith('/socket.io') || req.path.startsWith('/resumes');
  if (skip) return next();

  res.on('finish', async () => {
    try {
      if (res.statusCode >= 400) return;
      const userId = req.user?.id || null;
      const isAuthEvent = ['/login', '/register', '/logout'].includes(req.path);
      if (!userId && !isAuthEvent) return;

      await ActivityLog.create({
        user: userId,
        action: userId ? 'user_activity' : 'guest_activity',
        method: req.method,
        path: req.path,
        metadata: { statusCode: res.statusCode },
        ip: req.ip
      });
    } catch (error) {
      console.warn('activity log failed:', error.message);
    }
  });

  return next();
}

module.exports = activityLogger;
