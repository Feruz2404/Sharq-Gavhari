const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

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
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role || 'admin', name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({
      token,
      admin: { id: user.id, email: user.email, name: user.name, role: user.role || 'admin' },
    });
  } catch (e) { next(e); }
};

exports.me = async (req, res) => {
  res.json({ admin: req.user });
};
