'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { saveReport, validateStorageConfiguration } = require('../src/services/storage');

const originalEnv = { ...process.env };

test.afterEach(() => {
  for (const name of Object.keys(process.env)) {
    if (!(name in originalEnv)) delete process.env[name];
  }
  Object.assign(process.env, originalEnv);
});

test('rejects local storage on Vercel', () => {
  process.env.VERCEL = '1';
  process.env.STORAGE_MODE = 'local';

  assert.throws(() => validateStorageConfiguration(), {
    message: /Vercel deployments must set STORAGE_MODE=s3/,
  });
});

test('requires Vercel S3 configuration without exposing credential values', () => {
  process.env.VERCEL = '1';
  process.env.STORAGE_MODE = 's3';
  process.env.AWS_S3_BUCKET = 'private-report-bucket';
  delete process.env.AWS_REGION;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;

  assert.throws(() => validateStorageConfiguration(), {
    message: /AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY/,
  });
});

test('selects S3 and preserves AES-256 encryption', async () => {
  process.env.STORAGE_MODE = 's3';
  process.env.AWS_S3_BUCKET = 'private-report-bucket';
  process.env.AWS_REGION = 'ap-south-1';

  const calls = [];
  const s3Client = {
    async send(command) {
      calls.push(command.input);
      return {};
    },
  };

  const result = await saveReport('tournament-reports/report.txt', 'report body', { s3Client });
  assert.deepEqual(result, {
    location: 's3://private-report-bucket/tournament-reports/report.txt',
    mode: 's3',
  });
  assert.equal(calls[0].ServerSideEncryption, 'AES256');
  assert.equal(calls[0].Body, 'report body');
});

test('propagates S3 upload failures', async () => {
  process.env.STORAGE_MODE = 's3';
  process.env.AWS_S3_BUCKET = 'private-report-bucket';
  process.env.AWS_REGION = 'ap-south-1';
  const uploadError = new Error('S3 unavailable');
  const s3Client = { send: async () => { throw uploadError; } };

  await assert.rejects(
    saveReport('tournament-reports/report.txt', 'report body', { s3Client }),
    (err) => err === uploadError
  );
});
