'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBooking, validateReport } = require('../src/services/validator');

const courts = ['C1', 'C2', 'C4'];

const validBody = {
  playerName: 'Jane O\'Neil',
  email: 'jane@example.com',
  courtId: 'C1',
  date: '2027-01-15',
  startTime: '18:30',
  durationMins: 60,
};

test('accepts a well-formed booking', () => {
  const r = validateBooking(validBody, courts);
  assert.equal(r.ok, true);
  assert.equal(r.value.playerName, "Jane O'Neil");
});

test('rejects missing fields', () => {
  const r = validateBooking({}, courts);
  assert.equal(r.ok, false);
  assert.ok(r.errors.length >= 5);
});

test('rejects script injection in playerName', () => {
  const r = validateBooking({ ...validBody, playerName: '<script>alert(1)</script>' }, courts);
  assert.equal(r.ok, false);
});

test('rejects malformed email', () => {
  const r = validateBooking({ ...validBody, email: 'not-an-email' }, courts);
  assert.equal(r.ok, false);
});

test('rejects unknown courtId', () => {
  const r = validateBooking({ ...validBody, courtId: 'C99' }, courts);
  assert.equal(r.ok, false);
});

test('rejects past dates', () => {
  const r = validateBooking({ ...validBody, date: '2020-01-01' }, courts);
  assert.equal(r.ok, false);
});

test('rejects invalid date format', () => {
  const r = validateBooking({ ...validBody, date: '15/01/2027' }, courts);
  assert.equal(r.ok, false);
});

test('rejects invalid time format', () => {
  const r = validateBooking({ ...validBody, startTime: '25:99' }, courts);
  assert.equal(r.ok, false);
});

test('rejects unexpected durations', () => {
  const r = validateBooking({ ...validBody, durationMins: 45 }, courts);
  assert.equal(r.ok, false);
});

test('rejects non-numeric duration', () => {
  const r = validateBooking({ ...validBody, durationMins: 'sixty' }, courts);
  assert.equal(r.ok, false);
});

test('report accepts valid content', () => {
  const r = validateReport({ title: 'Fall Open Results', content: 'Champion: Team A (fictional).' });
  assert.equal(r.ok, true);
});

test('report rejects private key material', () => {
  const r = validateReport({
    title: 'sneaky',
    content: '-----BEGIN RSA PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----',
  });
  assert.equal(r.ok, false);
});

test('report rejects short titles', () => {
  const r = validateReport({ title: 'ab', content: 'long enough content here' });
  assert.equal(r.ok, false);
});
