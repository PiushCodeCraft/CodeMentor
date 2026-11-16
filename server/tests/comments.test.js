import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import Comment from '../src/models/Comment.js';
import { createCommentSchema, resolveCommentSchema } from '../src/middleware/validate.js';

describe('Inline Comments Suite (Phase 6)', () => {
  it('Comment model should instantiate with correct default values and fields', () => {
    const comment = new Comment({
      session: '507f191e810c19729de860e1',
      author: '507f191e810c19729de860e2',
      line: 14,
      text: 'Consider memoizing this expensive computation with useMemo.',
    });

    assert.strictEqual(comment.line, 14);
    assert.strictEqual(comment.status, 'open');
    assert.strictEqual(comment.text, 'Consider memoizing this expensive computation with useMemo.');
    assert.strictEqual(comment.session.toString(), '507f191e810c19729de860e1');
    assert.strictEqual(comment.author.toString(), '507f191e810c19729de860e2');
  });

  it('createCommentSchema should validate line number and comment text', () => {
    // Valid
    const valid = createCommentSchema.safeParse({
      line: 42,
      text: 'This variable might be undefined if API returns null.',
    });
    assert.strictEqual(valid.success, true);
    assert.strictEqual(valid.data.line, 42);

    // Invalid: line <= 0
    const invalidLine = createCommentSchema.safeParse({
      line: 0,
      text: 'Bad line number',
    });
    assert.strictEqual(invalidLine.success, false);

    // Invalid: missing text
    const missingText = createCommentSchema.safeParse({
      line: 5,
      text: '',
    });
    assert.strictEqual(missingText.success, false);
  });

  it('resolveCommentSchema should accept valid status and reject invalid', () => {
    const validResolved = resolveCommentSchema.safeParse({ status: 'resolved' });
    assert.strictEqual(validResolved.success, true);

    const validOpen = resolveCommentSchema.safeParse({ status: 'open' });
    assert.strictEqual(validOpen.success, true);

    const validEmpty = resolveCommentSchema.safeParse({});
    assert.strictEqual(validEmpty.success, true);

    const invalidStatus = resolveCommentSchema.safeParse({ status: 'pending' });
    assert.strictEqual(invalidStatus.success, false);
  });

  it('GET /api/sessions/:id/comments should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/sessions/507f191e810c19729de860e1/comments');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/sessions/:id/comments should reject unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/sessions/507f191e810c19729de860e1/comments').send({
      line: 10,
      text: 'Add error handling here',
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('PATCH /api/comments/:id/resolve should reject unauthenticated requests with 401', async () => {
    const res = await request(app).patch('/api/comments/507f191e810c19729de860e1/resolve').send({
      status: 'resolved',
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});

