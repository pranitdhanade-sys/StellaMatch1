const jwt = require('jsonwebtoken');

function getToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.cookies?.token || null;
}

function requireAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/login');
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    res.locals.currentUser = payload;
    return next();
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/login');
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function optionalAuth(req, _res, next) {
  try {
    const token = getToken(req);
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
  } catch (_error) {
    // no-op
  }
  return next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
