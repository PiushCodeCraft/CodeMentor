import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

describe('Health Check Endpoint', () => {
  it('GET /api/health should return 200 and valid status JSON', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.service, 'CodeMentor Live API');
    assert.ok(res.body.timestamp);
    assert.ok(res.body.database);
    assert.ok(typeof res.body.database.status === 'string');
  });

  it('GET / should return welcome JSON with health link', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.healthCheck, '/api/health');
  });

  it('GET /api/nonexistent should return 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });
});
