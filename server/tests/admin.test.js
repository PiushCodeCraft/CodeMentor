import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { generateTokens } from '../src/utils/jwt.js';

describe('Admin & Platform Management Suite (Phase 9)', () => {
  const { accessToken: studentToken } = generateTokens({
    _id: '507f191e810c19729de860e1',
    email: 'student@example.com',
    role: 'student',
  });

  const { accessToken: mentorToken } = generateTokens({
    _id: '507f191e810c19729de860e2',
    email: 'mentor@example.com',
    role: 'mentor',
  });

  const { accessToken: adminToken } = generateTokens({
    _id: '507f191e810c19729de860e3',
    email: 'admin@codementor.live',
    role: 'admin',
  });

  it('GET /api/admin/users should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/users');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/admin/users should reject student role with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', [`accessToken=${studentToken}`]);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/admin/users should reject mentor role with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', [`accessToken=${mentorToken}`]);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('PATCH /api/admin/mentors/:id/approve should reject unauthenticated requests with 401', async () => {
    const res = await request(app)
      .patch('/api/admin/mentors/507f191e810c19729de860e2/approve')
      .send({ isApproved: true });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('PATCH /api/admin/mentors/:id/approve should reject non-admin roles with 403 Forbidden', async () => {
    const res = await request(app)
      .patch('/api/admin/mentors/507f191e810c19729de860e2/approve')
      .set('Cookie', [`accessToken=${mentorToken}`])
      .send({ isApproved: true });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/admin/stats should reject non-admin roles with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', [`accessToken=${studentToken}`]);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });
});
