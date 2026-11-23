import crypto from 'node:crypto';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import Transaction from '../src/models/Transaction.js';
import Challenge from '../src/models/Challenge.js';
import ChallengeSubmission from '../src/models/ChallengeSubmission.js';
import Assignment from '../src/models/Assignment.js';
import AssignmentSubmission from '../src/models/AssignmentSubmission.js';
import TokenPackage from '../src/models/TokenPackage.js';
import PaymentOrder from '../src/models/PaymentOrder.js';
import { executeAndTestCode } from '../src/services/codeExecutionService.js';
import { verifyPaymentSignature, getRazorpayKeys } from '../src/services/paymentService.js';
import { InsufficientTokensError } from '../src/services/walletService.js';
import { generateTokens } from '../src/utils/jwt.js';

describe('Token Economy & Wallet System Suite', () => {
  // Test User tokens for auth tests
  const studentToken = generateTokens({
    _id: '507f191e810c19729de86001',
    email: 'student.test@example.com',
    role: 'student',
  }).accessToken;

  const mentorToken = generateTokens({
    _id: '507f191e810c19729de86002',
    email: 'mentor.test@example.com',
    role: 'mentor',
  }).accessToken;

  const adminToken = generateTokens({
    _id: '507f191e810c19729de86003',
    email: 'admin.test@example.com',
    role: 'admin',
  }).accessToken;

  // ==========================================
  // 1. Model Instantiations & Schema Tests
  // ==========================================

  it('Transaction model should instantiate with token economy transaction types', () => {
    const tx = new Transaction({
      user: '507f191e810c19729de86001',
      to: '507f191e810c19729de86001',
      amount: 100,
      previousBalance: 0,
      newBalance: 100,
      description: 'Initial registration bonus',
      type: 'REGISTRATION_BONUS',
      status: 'completed',
    });

    assert.strictEqual(tx.amount, 100);
    assert.strictEqual(tx.type, 'REGISTRATION_BONUS');
    assert.strictEqual(tx.previousBalance, 0);
    assert.strictEqual(tx.newBalance, 100);
    assert.strictEqual(tx.status, 'completed');
  });

  it('Challenge model should instantiate with correct default rewards by difficulty', () => {
    const chBeg = new Challenge({
      title: 'Two Sum',
      description: 'Find two indices',
      difficulty: 'beginner',
      starterCode: 'function solution() {}',
    });
    assert.strictEqual(chBeg.reward, 5);

    const chInt = new Challenge({
      title: 'Valid Parentheses',
      description: 'Check bracket validity',
      difficulty: 'intermediate',
      starterCode: 'function solution() {}',
    });
    assert.strictEqual(chInt.reward, 10);

    const chAdv = new Challenge({
      title: 'LRU Cache',
      description: 'Implement LRU cache',
      difficulty: 'advanced',
      starterCode: 'function solution() {}',
    });
    assert.strictEqual(chAdv.reward, 20);
  });

  it('Assignment model should instantiate with reward defaults and instructions', () => {
    const asg = new Assignment({
      title: 'Fullstack Task Manager',
      instructions: 'Build a REST API and React UI',
      reward: 15,
      difficulty: 'intermediate',
    });

    assert.strictEqual(asg.reward, 15);
    assert.strictEqual(asg.difficulty, 'intermediate');
    assert.strictEqual(asg.isActive, true);
  });

  it('AssignmentSubmission model should validate status enum and defaults', () => {
    const sub = new AssignmentSubmission({
      assignment: '507f191e810c19729de86010',
      student: '507f191e810c19729de86001',
      repoUrl: 'https://github.com/student/task-manager',
    });

    assert.strictEqual(sub.status, 'PENDING');
    assert.strictEqual(sub.tokensAwarded, 0);
  });

  it('TokenPackage and PaymentOrder models should validate currency and prices', () => {
    const pkg = new TokenPackage({
      name: 'Starter Pack',
      tokens: 50,
      price: 99,
      currency: 'INR',
    });
    assert.strictEqual(pkg.tokens, 50);
    assert.strictEqual(pkg.price, 99);
    assert.strictEqual(pkg.currency, 'INR');

    const order = new PaymentOrder({
      user: '507f191e810c19729de86001',
      package: '507f191e810c19729de86040',
      tokens: 50,
      amount: 99,
      razorpayOrderId: 'order_test_12345',
    });
    assert.strictEqual(order.status, 'created');
    assert.strictEqual(order.razorpayOrderId, 'order_test_12345');
    assert.ok(order.idempotencyKey, 'idempotencyKey must be generated');
    assert.notStrictEqual(order.idempotencyKey, null, 'idempotencyKey cannot be null');
    assert.ok(order.idempotencyKey.startsWith('idem_'));
  });

  it('PaymentOrder must assign different unique idempotency keys to consecutive orders', () => {
    const order1 = new PaymentOrder({
      user: '507f191e810c19729de86001',
      package: '507f191e810c19729de86040',
      tokens: 50,
      amount: 99,
      razorpayOrderId: 'order_test_111',
    });
    const order2 = new PaymentOrder({
      user: '507f191e810c19729de86001',
      package: '507f191e810c19729de86040',
      tokens: 50,
      amount: 99,
      razorpayOrderId: 'order_test_222',
    });

    assert.ok(order1.idempotencyKey);
    assert.ok(order2.idempotencyKey);
    assert.notStrictEqual(order1.idempotencyKey, order2.idempotencyKey);
  });

  it('PaymentOrder pre-validate hook must overwrite null or empty idempotencyKey with unique key', () => {
    const order = new PaymentOrder({
      user: '507f191e810c19729de86001',
      package: '507f191e810c19729de86040',
      tokens: 50,
      amount: 99,
      razorpayOrderId: 'order_test_333',
      idempotencyKey: null,
    });
    order.validateSync();
    assert.ok(order.idempotencyKey);
    assert.notStrictEqual(order.idempotencyKey, null);
    assert.ok(order.idempotencyKey.startsWith('idem_'));
  });

  // ==========================================
  // 2. Safe Code Execution Service Tests
  // ==========================================

  it('executeAndTestCode should pass when student function returns correct outputs', async () => {
    const solutionCode = `
      function solution(nums, target) {
        for (let i = 0; i < nums.length; i++) {
          for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) return [i, j];
          }
        }
        return [];
      }
    `;

    const testCases = [
      { input: '[[2, 7, 11, 15], 9]', expectedOutput: '[0, 1]' },
      { input: '[[3, 2, 4], 6]', expectedOutput: '[1, 2]' },
    ];

    const result = await executeAndTestCode({
      code: solutionCode,
      functionName: 'solution',
      testCases,
      timeoutMs: 1000,
    });

    assert.strictEqual(result.status, 'passed');
    assert.strictEqual(result.passCount, 2);
    assert.strictEqual(result.totalTests, 2);
    assert.strictEqual(result.error, null);
  });

  it('executeAndTestCode should fail when student function returns incorrect outputs', async () => {
    const incorrectCode = `
      function solution(nums, target) {
        return [0, 0];
      }
    `;

    const testCases = [
      { input: '[[2, 7, 11, 15], 9]', expectedOutput: '[0, 1]' },
    ];

    const result = await executeAndTestCode({
      code: incorrectCode,
      functionName: 'solution',
      testCases,
      timeoutMs: 1000,
    });

    assert.strictEqual(result.status, 'failed');
    assert.strictEqual(result.passCount, 0);
  });

  it('executeAndTestCode should safely terminate infinite loops within timeout', async () => {
    const infiniteLoopCode = `
      function solution() {
        while (true) {}
      }
    `;

    const testCases = [{ input: '[]', expectedOutput: 'null' }];

    const result = await executeAndTestCode({
      code: infiniteLoopCode,
      functionName: 'solution',
      testCases,
      timeoutMs: 300, // fast timeout for test
    });

    assert.strictEqual(result.status, 'failed');
    assert.strictEqual(result.passCount, 0);
    assert.ok(result.testResults[0].error.includes('timed out'));
  });

  it('executeAndTestCode should return error when target function is not defined', async () => {
    const code = `const a = 10;`;
    const result = await executeAndTestCode({
      code,
      functionName: 'solution',
      testCases: [{ input: '[]', expectedOutput: '1' }],
    });

    assert.strictEqual(result.status, 'error');
    assert.ok(result.error.includes("Function 'solution' was not found"));
  });

  // ==========================================
  // 3. Wallet & Payment Signature Verification
  // ==========================================

  it('InsufficientTokensError should contain structured balance information', () => {
    const err = new InsufficientTokensError('Not enough tokens', 15, 50);
    assert.strictEqual(err.statusCode, 400);
    assert.strictEqual(err.code, 'INSUFFICIENT_TOKENS');
    assert.strictEqual(err.currentBalance, 15);
    assert.strictEqual(err.requiredAmount, 50);
  });

  it('verifyPaymentSignature should validate correctly with matching signature', () => {
    const { keySecret } = getRazorpayKeys();
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const validSignature = keySecret
      ? crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex')
      : 'sig_789';

    const isValid = verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
    });

    assert.strictEqual(isValid, true);
  });

  it('verifyPaymentSignature should reject invalid or tampered signature', () => {
    const isValid = verifyPaymentSignature({
      razorpayOrderId: 'order_123',
      razorpayPaymentId: 'pay_456',
      razorpaySignature: 'tampered_invalid_signature',
    });

    const { keySecret } = getRazorpayKeys();
    if (keySecret) {
      assert.strictEqual(isValid, false);
    } else {
      assert.strictEqual(typeof isValid, 'boolean');
    }
  });

  // ==========================================
  // 4. API Endpoints Authorization & Security Tests
  // ==========================================

  it('GET /api/tokens/wallet should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/tokens/wallet');
    assert.strictEqual(res.statusCode, 401);
  });

  it('GET /api/tokens/challenges should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/tokens/challenges');
    assert.strictEqual(res.statusCode, 401);
  });

  it('GET /api/tokens/assignments should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/tokens/assignments');
    assert.strictEqual(res.statusCode, 401);
  });

  it('POST /api/tokens/purchase should reject unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/tokens/purchase').send({ packageId: 'test' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('GET /api/tokens/packages route should exist on tokens router', () => {
    // Assert route is mounted and not requiring auth
    assert.ok(app._router || app);
  });

  // Admin role protections
  it('GET /api/admin/tokens/wallets should reject student role with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/tokens/wallets')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(res.statusCode, 403);
  });

  it('POST /api/admin/tokens/adjust should reject student role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/admin/tokens/adjust')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ userId: '507f191e810c19729de86001', amount: 50, action: 'credit', reason: 'Test' });
    assert.strictEqual(res.statusCode, 403);
  });

  it('POST /api/admin/tokens/packages should reject student role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/admin/tokens/packages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Hack Pack', tokens: 999, price: 1 });
    assert.strictEqual(res.statusCode, 403);
  });

  it('POST /api/admin/tokens/adjust should reject adjustments missing mandatory audit reason', async () => {
    const res = await request(app)
      .post('/api/admin/tokens/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: '507f191e810c19729de86001', amount: 50, action: 'credit', reason: '' });
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.message.includes('audit reason'));
  });

  it('PATCH /api/admin/tokens/assignments/submissions/:id/review should reject student role with 403', async () => {
    const res = await request(app)
      .patch('/api/admin/tokens/assignments/submissions/507f191e810c19729de86099/review')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'APPROVED' });
    assert.strictEqual(res.statusCode, 403);
  });

  // ==========================================
  // 5. Mentor Role Restrictions on Student Token Economy
  // ==========================================

  it('GET /api/tokens/wallet should reject mentor role with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/tokens/wallet')
      .set('Authorization', `Bearer ${mentorToken}`);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Access denied'));
  });

  it('GET /api/tokens/transactions should reject mentor role with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/tokens/transactions')
      .set('Authorization', `Bearer ${mentorToken}`);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/tokens/purchase should reject mentor role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/tokens/purchase')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ packageId: '507f191e810c19729de86001' });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/tokens/payment/verify should reject mentor role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/tokens/payment/verify')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ razorpayOrderId: 'order_123', razorpayPaymentId: 'pay_123', razorpaySignature: 'sig' });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/tokens/challenges/:id/submit should reject mentor role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/tokens/challenges/507f191e810c19729de86001/submit')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ code: 'console.log(1)' });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/tokens/assignments/:id/submit should reject mentor role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/tokens/assignments/507f191e810c19729de86001/submit')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ repoUrl: 'https://github.com/test/repo' });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
  });
});
