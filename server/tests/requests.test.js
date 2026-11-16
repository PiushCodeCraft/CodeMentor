import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import Request from '../src/models/Request.js';
import { createRequestSchema } from '../src/middleware/validate.js';
import { generateTokens } from '../src/utils/jwt.js';

describe('Review Requests Suite (Phase 3)', () => {
  it('createRequestSchema should validate request payload', () => {
    // Valid input
    const valid = createRequestSchema.safeParse({
      title: 'Fix React useEffect infinite re-render loop',
      description: 'Component keeps re-rendering when setting state inside effect.',
      code: 'useEffect(() => { setCount(count + 1); }, [count]);',
      tech: ['React', 'JavaScript'],
      difficulty: 'intermediate',
      price: 20,
    });
    assert.strictEqual(valid.success, true);
    assert.strictEqual(valid.data.difficulty, 'intermediate');
    assert.strictEqual(valid.data.price, 20);

    // Invalid input: title too short
    const invalidTitle = createRequestSchema.safeParse({
      title: 'Fix',
      code: 'console.log("hello");',
    });
    assert.strictEqual(invalidTitle.success, false);

    // Invalid input: missing code
    const missingCode = createRequestSchema.safeParse({
      title: 'How to setup Tailwind in Vite',
      code: '',
    });
    assert.strictEqual(missingCode.success, false);
  });

  it('POST /api/requests should reject unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/requests').send({
      title: 'How to resolve CORS error in Express',
      code: 'app.use(cors());',
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/requests should forbid mentors from creating review requests (role protection)', async () => {
    const mentorUser = {
      _id: '507f191e810c19729de860ea',
      email: 'mentor@codementor.live',
      role: 'mentor',
    };
    const { accessToken } = generateTokens(mentorUser);

    const res = await request(app)
      .post('/api/requests')
      .set('Cookie', [`accessToken=${accessToken}`])
      .send({
        title: 'Mentor trying to create request',
        code: 'const x = 1;',
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Access denied'));
  });

  it('Request model should instantiate with correct default values', () => {
    const reqInstance = new Request({
      student: '507f191e810c19729de860eb',
      title: 'Debug Mongoose Aggregation Pipeline',
      code: 'User.aggregate([{ $match: { role: "mentor" } }])',
    });

    assert.strictEqual(reqInstance.status, 'open');
    assert.strictEqual(reqInstance.difficulty, 'beginner');
    assert.strictEqual(reqInstance.price, 0);
    assert.strictEqual(reqInstance.aiSummary, '');
    assert.deepStrictEqual(reqInstance.tech, []);
  });
});
