const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const isDev = (process.env.NODE_ENV || 'development') !== 'production';

function safeHashInfo(hash) {
  if (typeof hash !== 'string' || !hash) {
    return { hashPrefix: null, hashLength: 0 };
  }
  // Only expose the bcrypt version + cost prefix (e.g. "$2b$10$"), never the salt or digest.
  return { hashPrefix: hash.slice(0, 7), hashLength: hash.length };
}

exports.login = async (req, res, next) => {
  try {
    const body = req.body || {};
    const identifier = String(body.login || body.email || '').trim();
    const password = body.password;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'login and password are required' });
    }

    // Match by email first, then by name. Two scoped queries instead of an OR
    // string to avoid any chance of filter-injection on the identifier value.
    let { data: user, error: e1 } = await supabase
      .from('users').select('*').eq('email', identifier).maybeSingle();
    if (e1) throw e1;
    if (!user) {
      const { data: user2, error: e2 } = await supabase
        .from('users').select('*').eq('name', identifier).maybeSingle();
      if (e2) throw e2;
      user = user2;
    }

    const userFound = !!user;
    const { hashPrefix, hashLength } = safeHashInfo(user && user.password_hash);

    let passwordOk = false;
    if (userFound) {
      try {
        passwordOk = await bcrypt.compare(password, user.password_hash);
      } catch (cmpErr) {
        // bcrypt.compare can throw if the hash is malformed. Treat as a mismatch
        // and surface the reason in dev logs so we can see what is wrong.
        if (isDev) {
          console.warn('[auth] bcrypt.compare threw:', cmpErr && cmpErr.message);
        }
        passwordOk = false;
      }
    }

    if (isDev) {
      // Safe diagnostic log. No plaintext password, no full hash, no Supabase keys.
      console.log('[auth] login attempt', {
        identifier,
        userFound,
        userEmail: user ? user.email : null,
        userName: user ? user.name : null,
        userRole: user ? user.role : null,
        hashPrefix,
        hashLength,
        passwordOk,
      });
    }

    if (!userFound || !passwordOk) {
      const payload = { error: 'Invalid credentials' };
      if (isDev) {
        payload.debug = {
          identifier,
          userFound,
          hashPrefix,
          hashLength,
          passwordOk,
        };
      }
      return res.status(401).json(payload);
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role || 'admin', name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return res.json({
      token,
      admin: { id: user.id, email: user.email, name: user.name, role: user.role || 'admin' },
    });
  } catch (e) {
    return next(e);
  }
};

exports.me = async (req, res) => {
  res.json({ admin: req.user });
};
