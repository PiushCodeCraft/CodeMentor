import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import Session from '../src/models/Session.js';
import Notification from '../src/models/Notification.js';
import { generateTokens } from '../src/utils/jwt.js';

describe('Accept Flow & Sessions Suite (Phase 4)', () => {
  it('Session model should instantiate with correct default values', () => {
    const session = new Session({
      request: '507f191e810c19729de860e1',
      student: '507f191e810c19729de860e2',
      mentor: '507f191e810c19729de860e3',
      codeSnapshot: 'const hello = "world";',
    });

    assert.strictEqual(session.status, 'active');
    assert.strictEqual(session.language, 'javascript');
    assert.strictEqual(session.endedAt, null);
    assert.ok(session.startedAt);
  });

  it('Notification model should instantiate with correct default values', () => {
    const notif = new Notification({
      user: '507f191e810c19729de860e2',
      message: 'Your request was accepted!',
    });

    assert.strictEqual(notif.isRead, false);
    assert.strictEqual(notif.type, 'system');
    assert.strictEqual(notif.link, '');
  });

  it('POST /api/requests/:id/accept should reject student role with 403 Forbidden', async () => {
    const studentUser = {
      _id: '507f191e810c19729de860e2',
      email: 'student@codementor.live',
      role: 'student',
    };
    const { accessToken } = generateTokens(studentUser);

    const res = await request(app)
      .post('/api/requests/507f191e810c19729de860e1/accept')
      .set('Cookie', [`accessToken=${accessToken}`]);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Access denied'));
  });

  it('GET /api/notifications should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/notifications');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/sessions/:id should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/sessions/507f191e810c19729de860e1');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});

