import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import Message from '../src/models/Message.js';
import { getOnlineUsers, presenceMap } from '../src/sockets/sessionHandlers.js';

describe('Live Session Core Suite (Phase 5)', () => {
  it('Message model should instantiate with correct fields', () => {
    const msg = new Message({
      session: '507f191e810c19729de860e1',
      sender: '507f191e810c19729de860e2',
      text: 'Hello, let us look at line 14 of your code.',
    });

    assert.strictEqual(msg.text, 'Hello, let us look at line 14 of your code.');
    assert.strictEqual(msg.session.toString(), '507f191e810c19729de860e1');
    assert.strictEqual(msg.sender.toString(), '507f191e810c19729de860e2');
  });

  it('Presence map tracking should calculate online unique users', () => {
    const testSessionId = 'test_session_123';
    presenceMap.set(testSessionId, new Map());

    // User connects from first tab
    presenceMap.get(testSessionId).set('socket_1', {
      userId: 'user_student',
      name: 'Alice',
      role: 'student',
    });

    // Same user opens second tab
    presenceMap.get(testSessionId).set('socket_2', {
      userId: 'user_student',
      name: 'Alice',
      role: 'student',
    });

    // Mentor connects
    presenceMap.get(testSessionId).set('socket_3', {
      userId: 'user_mentor',
      name: 'Bob',
      role: 'mentor',
    });

    const online = getOnlineUsers(testSessionId);
    assert.strictEqual(online.length, 2, 'Should deduplicate user across multiple sockets');
    const student = online.find((u) => u.userId === 'user_student');
    const mentor = online.find((u) => u.userId === 'user_mentor');

    assert.ok(student);
    assert.strictEqual(student.name, 'Alice');
    assert.ok(mentor);
    assert.strictEqual(mentor.role, 'mentor');

    // Cleanup
    presenceMap.delete(testSessionId);
  });

  it('POST /api/sessions/:id/end should reject unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/sessions/507f191e810c19729de860e1/end');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/sessions/:id/messages should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/sessions/507f191e810c19729de860e1/messages');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});

