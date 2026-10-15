'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.ADMIN_TOKEN = 'test-admin-token-123';
process.env.STORAGE_MODE = 'local';

const app = require('../src/app');

let server;
let base;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

async function post(path, body, headers = {}) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function get(path, headers = {}) {
  const res = await fetch(base + path, { headers });
  return { status: res.status, data: await res.json() };
}

test('GET /api/dashboard returns fictional data', async () => {
  const { status, data } = await get('/api/dashboard');
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.ok(data.courts.length >= 3);
  assert.ok(data.tournaments.length >= 1);
});

test('POST /api/bookings creates a valid booking', async () => {
  const { status, data } = await post('/api/bookings', {
    playerName: 'Test Player',
    email: 'test.player@example.com',
    courtId: 'C2',
    date: '2027-03-01',
    startTime: '10:00',
    durationMins: 60,
  });
  assert.equal(status, 201);
  assert.equal(data.ok, true);
  assert.match(data.message, /Booking confirmed/);
});

test('POST /api/bookings rejects invalid input with 400', async () => {
  const { status, data } = await post('/api/bookings', {
    playerName: '',
    email: 'bad',
    courtId: 'ZZ',
    date: 'not-a-date',
    startTime: '99:99',
    durationMins: 15,
  });
  assert.equal(status, 400);
  assert.equal(data.ok, false);
  assert.ok(data.errors.length >= 4);
});

test('POST /api/bookings rejects double-booking of same slot', async () => {
  const payload = {
    playerName: 'Slot Holder',
    email: 'slot@example.com',
    courtId: 'C1',
    date: '2027-04-01',
    startTime: '19:00',
    durationMins: 60,
  };
  const first = await post('/api/bookings', payload);
  assert.equal(first.status, 201);
  const second = await post('/api/bookings', payload);
  assert.equal(second.status, 409);
});

test('admin endpoint denies missing token', async () => {
  const { status } = await get('/api/admin/bookings');
  assert.equal(status, 403);
});

test('admin endpoint denies wrong token', async () => {
  const { status } = await get('/api/admin/bookings', {
    Authorization: 'Bearer wrong-token',
  });
  assert.equal(status, 403);
});

test('admin endpoint allows correct token', async () => {
  const { status, data } = await get('/api/admin/bookings', {
    Authorization: 'Bearer test-admin-token-123',
  });
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.ok(Array.isArray(data.bookings));
});

test('admin report upload stores locally in test mode', async () => {
  const { status, data } = await post(
    '/api/admin/tournament-report',
    { title: 'Test Cup Results', content: 'Winner: Team Omega (fictional data).' },
    { Authorization: 'Bearer test-admin-token-123' }
  );
  assert.equal(status, 201);
  assert.equal(data.ok, true);
  assert.match(data.location, /local-storage/);
});

test('admin report upload denies unauthenticated request', async () => {
  const { status } = await post('/api/admin/tournament-report', {
    title: 'Test Cup Results',
    content: 'Winner: Team Omega (fictional data).',
  });
  assert.equal(status, 403);
});

test('unknown route returns JSON 404', async () => {
  const res = await fetch(base + '/api/nope');
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.ok, false);
});
