// Verifies a Bearer JWT and ensures the caller has the 'admin' role.
const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    req.user = payload;
    return next();
  } catch (_e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

module.exports = { requireAdmin };
