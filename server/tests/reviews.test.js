import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import Review from '../src/models/Review.js';
import Transaction from '../src/models/Transaction.js';
import { createReviewSchema } from '../src/middleware/validate.js';
import { evaluateMentorRewards } from '../src/services/ratingService.js';

describe('Ratings & Reputation Suite (Phase 7)', () => {
  it('Review model should instantiate with correct fields and types', () => {
    const review = new Review({
      session: '507f191e810c19729de860e1',
      student: '507f191e810c19729de860e2',
      mentor: '507f191e810c19729de860e3',
      rating: 5,
      comment: 'Excellent mentor, super helpful with React state!',
    });

    assert.strictEqual(review.rating, 5);
    assert.strictEqual(review.comment, 'Excellent mentor, super helpful with React state!');
    assert.strictEqual(review.session.toString(), '507f191e810c19729de860e1');
    assert.strictEqual(review.student.toString(), '507f191e810c19729de860e2');
    assert.strictEqual(review.mentor.toString(), '507f191e810c19729de860e3');
  });

  it('Transaction model should instantiate correctly for bounty payout', () => {
    const tx = new Transaction({
      from: '507f191e810c19729de860e2',
      to: '507f191e810c19729de860e3',
      amount: 25,
      request: '507f191e810c19729de860e4',
      type: 'bounty_payout',
    });

    assert.strictEqual(tx.amount, 25);
    assert.strictEqual(tx.type, 'bounty_payout');
    assert.strictEqual(tx.to.toString(), '507f191e810c19729de860e3');
  });

  it('createReviewSchema should validate rating bounds between 1 and 5 and require sessionId', () => {
    // Valid 5 star review
    const valid = createReviewSchema.safeParse({
      sessionId: '507f191e810c19729de860e1',
      rating: 5,
      comment: 'Great explanation of async/await.',
    });
    assert.strictEqual(valid.success, true);
    assert.strictEqual(valid.data.rating, 5);

    // Invalid rating > 5
    const tooHigh = createReviewSchema.safeParse({
      sessionId: '507f191e810c19729de860e1',
      rating: 6,
    });
    assert.strictEqual(tooHigh.success, false);

    // Invalid rating < 1
    const tooLow = createReviewSchema.safeParse({
      sessionId: '507f191e810c19729de860e1',
      rating: 0,
    });
    assert.strictEqual(tooLow.success, false);

    // Missing sessionId
    const missingSession = createReviewSchema.safeParse({
      rating: 4,
    });
    assert.strictEqual(missingSession.success, false);
  });

  it('evaluateMentorRewards should compute reputation bonuses, bounty credits, and badges', () => {
    const initialMentor = {
      reputation: 35,
      credits: 50,
      badges: [],
    };

    const rewards = evaluateMentorRewards({
      mentor: initialMentor,
      rating: 5,
      price: 20,
      ratingCount: 1,
      ratingAvg: 5.0,
    });

    // 10 base + 5*2 quality bonus = 20 bonus => 35 + 20 = 55 reputation
    assert.strictEqual(rewards.newReputation, 55);
    // 50 + 20 bounty = 70 credits
    assert.strictEqual(rewards.newCredits, 70);
    // Badges: First Review awarded (count >= 1), Mentor Pro (rep >= 50)
    assert.ok(rewards.newBadges.includes('First Review'));
    assert.ok(rewards.newBadges.includes('Mentor Pro'));
  });

  it('evaluateMentorRewards should award Top Rated and 10 Reviews badges appropriately', () => {
    const veteranMentor = {
      reputation: 150,
      credits: 200,
      badges: ['First Review', 'Mentor Pro'],
    };

    const rewards = evaluateMentorRewards({
      mentor: veteranMentor,
      rating: 5,
      price: 15,
      ratingCount: 10,
      ratingAvg: 4.8,
    });

    assert.ok(rewards.newBadges.includes('Top Rated'));
    assert.ok(rewards.newBadges.includes('10 Reviews'));
    assert.ok(rewards.newBadges.includes('First Review'));
    assert.ok(rewards.newBadges.includes('Mentor Pro'));
  });

  it('POST /api/reviews should reject unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/reviews').send({
      sessionId: '507f191e810c19729de860e1',
      rating: 5,
      comment: 'Excellent!',
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/reviews/session/:sessionId should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/reviews/session/507f191e810c19729de860e1');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/reviews/mentor/:mentorId should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/reviews/mentor/507f191e810c19729de860e3');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/leaderboard should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/leaderboard');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});

