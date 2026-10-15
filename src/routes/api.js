'use strict';

const express = require('express');
const { getCourts, getTournaments, getBookings, addBooking, isCourtBooked } =
  require('../services/dataStore');
const { validateBooking, validateReport } = require('../services/validator');
const { requireAdmin } = require('../middleware/adminAuth');
const { saveReport } = require('../services/storage');

const router = express.Router();

// Public: dashboard data
router.get('/dashboard', (req, res) => {
  res.json({
    ok: true,
    courts: getCourts(),
    tournaments: getTournaments(),
    bookings: getBookings(),
  });
});

// Public: create a booking (server-side validated)
router.post('/bookings', (req, res) => {
  const result = validateBooking(req.body || {}, getCourts().map((c) => c.id));
  if (!result.ok) {
    return res.status(400).json({ ok: false, message: 'Validation failed.', errors: result.errors });
  }

  const { value } = result;
  const court = getCourts().find((c) => c.id === value.courtId);
  if (court.status !== 'open') {
    return res.status(409).json({ ok: false, message: `${court.name} is not available for booking.` });
  }
  if (isCourtBooked(value.courtId, value.date, value.startTime, value.durationMins)) {
    return res.status(409).json({ ok: false, message: 'That time slot is already booked.' });
  }

  const booking = addBooking(value);
  return res.status(201).json({
    ok: true,
    message: `Booking confirmed for ${booking.playerName} on ${booking.date} at ${booking.startTime}.`,
    booking,
  });
});

// Admin: list bookings (server-side authorization)
router.get('/admin/bookings', requireAdmin, (req, res) => {
  res.json({ ok: true, bookings: getBookings() });
});

// Admin: store a tournament report (S3 on EC2, local file otherwise)
router.post('/admin/tournament-report', requireAdmin, async (req, res, next) => {
  try {
    const result = validateReport(req.body || {});
    if (!result.ok) {
      return res
        .status(400)
        .json({ ok: false, message: 'Validation failed.', errors: result.errors });
    }

    const { title, content } = result.value;
    const safeSlug =
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) ||
      'report';
    const key = `tournament-reports/${Date.now()}-${safeSlug}.txt`;

    const stored = await saveReport(key, `${title}\n\n${content}\n`);
    return res.status(201).json({
      ok: true,
      message: `Tournament report stored successfully (${stored.mode}).`,
      location: stored.location,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
