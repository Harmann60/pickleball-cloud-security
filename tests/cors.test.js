'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const cors = require('../src/middleware/cors');

function mock({ origin, method = 'GET' } = {}) {
  const req = {
    method,
    get(name) {
      return String(name).toLowerCase() === 'origin' ? origin : undefined;
    },
  };
  const res = {
    statusCode: 200,
    headers: {},
    ended: false,
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
  return { req, res, nextCalled: { value: false }, next() { this.nextCalled.value = true; } };
}

function run(options) {
  const { req, res } = mock(options);
  const ctx = { nextCalled: false, next() { ctx.nextCalled = true; } };
  cors(req, res, ctx.next);
  return { res, nextCalled: ctx.nextCalled };
}

test('passes through with no CORS headers when ALLOWED_ORIGIN is unset', () => {
  delete process.env.ALLOWED_ORIGIN;
  const { res, nextCalled } = run({ origin: 'https://example.com' });
  assert.equal(nextCalled, true);
  assert.equal(res.headers['Access-Control-Allow-Origin'], undefined);
});

test('sets CORS headers for the exact allowed origin', () => {
  process.env.ALLOWED_ORIGIN = 'https://courtly.example.com';
  try {
    const { res } = run({ origin: 'https://courtly.example.com' });
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://courtly.example.com');
    assert.equal(res.headers['Access-Control-Allow-Headers'], 'Content-Type, Authorization');
  } finally {
    delete process.env.ALLOWED_ORIGIN;
  }
});

test('answers a preflight request from the allowed origin with 204', () => {
  process.env.ALLOWED_ORIGIN = 'https://courtly.example.com';
  try {
    const { res, nextCalled } = run({
      origin: 'https://courtly.example.com',
      method: 'OPTIONS',
    });
    assert.equal(res.statusCode, 204);
    assert.equal(res.ended, true);
    assert.equal(nextCalled, false);
  } finally {
    delete process.env.ALLOWED_ORIGIN;
  }
});

test('rejects a preflight request from a disallowed origin', () => {
  process.env.ALLOWED_ORIGIN = 'https://courtly.example.com';
  try {
    const { res } = run({ origin: 'https://evil.example.com', method: 'OPTIONS' });
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.ok, false);
  } finally {
    delete process.env.ALLOWED_ORIGIN;
  }
});
