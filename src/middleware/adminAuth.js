'use strict';

const crypto = require('crypto');

// PROTOTYPE AUTHORIZATION — not a production authentication system.
//
// Single shared admin bearer token, supplied via the ADMIN_TOKEN environment
// variable on EC2. If unset, a random token is generated per process start.
// Documented as a prototype in docs/report and README.
//
// Why not a login system? A real one needs password hashing, sessions,
// account lockout and HTTPS — out of scope for this demonstration, and
// inventing a home-grown auth scheme would be a worse security decision than
// an explicitly-labelled token control.

const generatedToken = !process.env.ADMIN_TOKEN
  ? crypto.randomBytes(24).toString('hex')
  : null;

const activeToken = process.env.ADMIN_TOKEN || generatedToken;

function tokensEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still run a comparison to keep timing roughly constant.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token || !tokensEqual(token, activeToken)) {
    return res.status(403).json({
      ok: false,
      message: 'Admin authorization failed: valid Bearer token required.',
    });
  }
  return next();
}

module.exports = { requireAdmin, activeToken };
