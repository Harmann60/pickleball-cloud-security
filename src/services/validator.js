'use strict';

// Server-side input validation. Every value received from the client is
// untrusted until it passes these checks.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_DURATIONS = [30, 60, 90];

function validateBooking(body, courtIds) {
  const errors = [];

  const playerName = typeof body.playerName === 'string' ? body.playerName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const courtId = typeof body.courtId === 'string' ? body.courtId.trim() : '';
  const date = typeof body.date === 'string' ? body.date.trim() : '';
  const startTime = typeof body.startTime === 'string' ? body.startTime.trim() : '';
  const rawDuration = body.durationMins;
  const durationMins = Number(rawDuration);

  if (!NAME_RE.test(playerName)) {
    errors.push('playerName must be 2-60 letters and may include spaces, hyphens, apostrophes.');
  }
  if (!EMAIL_RE.test(email) || email.length > 120) {
    errors.push('email must be a valid address (max 120 characters).');
  }
  if (!courtIds.includes(courtId)) {
    errors.push('courtId must reference one of the listed courts.');
  }
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    errors.push('date must be a valid calendar date in YYYY-MM-DD format.');
  } else if (date < new Date().toISOString().slice(0, 10)) {
    errors.push('date cannot be in the past.');
  }
  if (!TIME_RE.test(startTime)) {
    errors.push('startTime must be HH:MM in 24-hour format.');
  }
  if (!ALLOWED_DURATIONS.includes(durationMins)) {
    errors.push('durationMins must be one of 30, 60 or 90.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: { playerName, email, courtId, date, startTime, durationMins },
  };
}

function validateReport(body) {
  const errors = [];
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content : '';

  if (title.length < 3 || title.length > 80) {
    errors.push('title must be 3-80 characters.');
  }
  if (content.length < 10 || content.length > 20000) {
    errors.push('content must be 10-20000 characters.');
  }
  // Refuse anything that looks like a credential — defence in depth for a demo
  // that stores files in a shared bucket.
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content) ||
      /aws_secret_access_key/i.test(content)) {
    errors.push('content appears to contain private key or credential material and was rejected.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { title, content } };
}

module.exports = { validateBooking, validateReport };
