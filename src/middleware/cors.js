'use strict';

// Opt-in CORS for a separately hosted frontend (for example Vercel).
//
// Disabled unless ALLOWED_ORIGIN is set to exactly one trusted origin, e.g.
//   ALLOWED_ORIGIN=https://courtly.example.com
//
// No wildcard is ever used. The setting is read per request so tests and
// configuration changes do not need a module reload.

function cors(req, res, next) {
  const allowed = process.env.ALLOWED_ORIGIN;
  if (!allowed) return next();

  const origin = req.get('origin');
  res.setHeader('Vary', 'Origin');

  if (origin && origin === allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
    if (req.method === 'OPTIONS') return res.status(204).end();
  } else if (req.method === 'OPTIONS') {
    return res.status(403).json({ ok: false, message: 'CORS origin not allowed.' });
  }

  return next();
}

module.exports = cors;
