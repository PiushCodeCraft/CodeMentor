import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../src/utils/jwt.js';
import { requireRole } from '../src/middleware/role.js';

describe('Auth & Roles Suite (Phase 2)', () => {
  it('JWT generation and verification should encode and decode payload', () => {
    const mockUser = {
      _id: '507f191e810c19729de860ea',
      email: 'test@codementor.live',
      role: 'student',
    };

    const { accessToken, refreshToken } = generateTokens(mockUser);
    assert.ok(accessToken, 'Access token should be generated');
    assert.ok(refreshToken, 'Refresh token should be generated');

    const decodedAccess = verifyAccessToken(accessToken);
    assert.strictEqual(decodedAccess.userId, mockUser._id);
    assert.strictEqual(decodedAccess.email, mockUser.email);
    assert.strictEqual(decodedAccess.role, 'student');

    const decodedRefresh = verifyRefreshToken(refreshToken);
    assert.strictEqual(decodedRefresh.userId, mockUser._id);
  });

  it('Password hashing and comparison should be secure and accurate', async () => {
    const plain = 'secretPass123';
    const hash = await User.hashPassword(plain);

    assert.notStrictEqual(hash, plain);
    assert.ok(hash.startsWith('$2'));

    const userInstance = new User({
      name: 'Test Student',
      email: 'student@example.com',
      passwordHash: hash,
      role: 'student',
    });

    const isCorrect = await userInstance.comparePassword(plain);
    const isWrong = await userInstance.comparePassword('wrongpassword');

    assert.strictEqual(isCorrect, true);
    assert.strictEqual(isWrong, false);
  });

  it('POST /api/auth/register should fail when validation criteria not met', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'A', // too short (< 2)
      email: 'invalid-email',
      password: '123', // too short (< 6)
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors && res.body.errors.length > 0);
  });

  it('POST /api/auth/login should fail when validation criteria not met', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'invalid-email',
      password: '',
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/users/me without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/users/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('requireRole middleware should allow permitted roles and forbid others', () => {
    const studentUser = { role: 'student' };
    const mentorUser = { role: 'mentor' };

    let studentPassed = false;
    const reqStudent = { user: studentUser };
    const resMock = {
      status: (code) => ({
        json: (data) => ({ code, data }),
      }),
    };

    // Test student accessing mentor-only route
    const mentorOnly = requireRole('mentor');
    mentorOnly(
      reqStudent,
      {
        status: (code) => {
          assert.strictEqual(code, 403);
          return {
            json: (payload) => {
              assert.strictEqual(payload.success, false);
            },
          };
        },
      },
      () => {
        assert.fail('Should not call next for forbidden role');
      }
    );

    // Test mentor accessing mentor-only route
    const reqMentor = { user: mentorUser };
    mentorOnly(reqMentor, resMock, () => {
      studentPassed = true;
    });
    assert.strictEqual(studentPassed, true);
  });
});

