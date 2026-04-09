const pageCache = new Map();

function sessionHintCookie(req, res, next) {
  if (!req.cookies?.stellamatch_hint) {
    res.cookie('stellamatch_hint', 'ready', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }
  next();
}

function cacheHeaders(_req, res, next) {
  res.setHeader('X-StellaMatch-Scale', 'edge-cache-ready');
  next();
}

function pageCacheMiddleware(ttlMs = 20000) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (!['/leaderboard', '/skill-arena'].includes(req.path)) return next();

    const key = `${req.originalUrl}|${req.user?.id || 'guest'}`;
    const cached = pageCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return res.send(cached.body);
    }

    const originalSend = res.send.bind(res);
    res.send = (body) => {
      pageCache.set(key, { body, expiresAt: Date.now() + ttlMs });
      return originalSend(body);
    };

    return next();
  };
}

module.exports = {
  sessionHintCookie,
  cacheHeaders,
  pageCacheMiddleware
};
