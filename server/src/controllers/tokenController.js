import Challenge from '../models/Challenge.js';
import ChallengeSubmission from '../models/ChallengeSubmission.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import TokenPackage from '../models/TokenPackage.js';
import PaymentOrder from '../models/PaymentOrder.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import {
  getWalletStats,
  creditTokens,
  debitTokens,
} from '../services/walletService.js';
import { executeAndTestCode } from '../services/codeExecutionService.js';
import {
  createPaymentOrder,
  processVerifiedPayment,
  verifyWebhookSignature,
  getPaymentConfig,
} from '../services/paymentService.js';

// ==========================================
// 1. WALLET & TRANSACTIONS
// ==========================================

/**
 * Get current user's wallet statistics
 * GET /api/tokens/wallet
 */
export const getMyWallet = async (req, res) => {
  try {
    const stats = await getWalletStats(req.user._id);
    return res.status(200).json({
      success: true,
      wallet: stats,
      credits: stats.balance,
      availableBalance: stats.balance,
    });
  } catch (error) {
    console.error('getMyWallet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallet statistics.',
      error: error.message,
    });
  }
};

/**
 * Get current user's transaction history (paginated)
 * GET /api/tokens/transactions
 */
export const getMyTransactions = async (req, res) => {
  try {
    const { type, page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query = {
      $or: [{ user: req.user._id }, { to: req.user._id }, { from: req.user._id }],
    };

    if (type && type !== 'all') {
      query.type = type;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('from', 'name email avatar')
        .populate('to', 'name email avatar')
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      transactions,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (error) {
    console.error('getMyTransactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction history.',
      error: error.message,
    });
  }
};

// ==========================================
// 2. CODING CHALLENGES
// ==========================================

/**
 * List coding challenges with difficulty filter and completion status
 * GET /api/tokens/challenges
 */
export const getChallenges = async (req, res) => {
  try {
    const { difficulty, category } = req.query;
    const query = { isActive: true };

    if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      query.difficulty = difficulty;
    }
    if (category) {
      query.category = category;
    }

    const challenges = await Challenge.find(query)
      .select('-testCases')
      .sort({ difficulty: 1, createdAt: -1 })
      .lean();

    // Check which challenges the student has already passed
    let passedChallengeIds = new Set();
    if (req.user) {
      const passedSubmissions = await ChallengeSubmission.find({
        user: req.user._id,
        status: 'passed',
      }).select('challenge');
      passedChallengeIds = new Set(passedSubmissions.map((s) => s.challenge.toString()));
    }

    const enrichedChallenges = challenges.map((c) => ({
      ...c,
      isPassed: passedChallengeIds.has(c._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      challenges: enrichedChallenges,
    });
  } catch (error) {
    console.error('getChallenges error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve coding challenges.',
      error: error.message,
    });
  }
};

/**
 * Get detailed coding challenge by ID
 * GET /api/tokens/challenges/:id
 */
export const getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id).lean();

    if (!challenge || !challenge.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Coding challenge not found or inactive.',
      });
    }

    // Sanitize test cases: hide internal test cases from the student
    const publicTestCases = (challenge.testCases || [])
      .filter((tc) => !tc.isHidden)
      .map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }));

    let isPassed = false;
    let latestSubmission = null;

    if (req.user) {
      latestSubmission = await ChallengeSubmission.findOne({
        user: req.user._id,
        challenge: id,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (latestSubmission && latestSubmission.status === 'passed') {
        isPassed = true;
      }
    }

    return res.status(200).json({
      success: true,
      challenge: {
        ...challenge,
        testCases: publicTestCases,
        totalTestCount: challenge.testCases?.length || 0,
      },
      isPassed,
      latestSubmission,
    });
  } catch (error) {
    console.error('getChallengeById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve coding challenge details.',
      error: error.message,
    });
  }
};

/**
 * Submit and verify coding challenge solution in isolated sandbox
 * POST /api/tokens/challenges/:id/submit
 */
export const submitChallengeSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Source code is required.',
      });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found or inactive.',
      });
    }

    // 1. Execute code securely in isolated VM sandbox
    const execution = await executeAndTestCode({
      code,
      functionName: challenge.functionName || 'solution',
      testCases: challenge.testCases || [],
      timeoutMs: 1500,
    });

    // 2. Check if user already earned reward for this challenge previously
    const previouslyPassed = await ChallengeSubmission.findOne({
      user: req.user._id,
      challenge: challenge._id,
      status: 'passed',
    });

    let tokensAwarded = 0;
    let rewardGranted = false;

    if (execution.status === 'passed') {
      if (!previouslyPassed) {
        // Award reward tokens once
        tokensAwarded = challenge.reward;
        rewardGranted = true;

        await creditTokens({
          userId: req.user._id,
          amount: tokensAwarded,
          type: 'CODING_CHALLENGE_REWARD',
          description: `Solved Coding Challenge: "${challenge.title}" (${challenge.difficulty})`,
          relatedActivityId: challenge._id,
          relatedActivityType: 'Challenge',
        });

        // Send in-app notification
        await Notification.create({
          user: req.user._id,
          type: 'credit_transfer',
          message: `🎉 Challenge Solved! You earned +${tokensAwarded} tokens for solving "${challenge.title}".`,
          link: '/wallet',
        });
      }
    }

    // 3. Save submission record for history
    const submission = await ChallengeSubmission.create({
      user: req.user._id,
      challenge: challenge._id,
      code,
      language,
      status: execution.status,
      passCount: execution.passCount,
      totalTests: execution.totalTests,
      testResults: execution.testResults,
      tokensAwarded,
      executionTimeMs: execution.executionTimeMs,
    });

    return res.status(200).json({
      success: true,
      passed: execution.status === 'passed',
      execution,
      tokensAwarded,
      alreadyAwarded: Boolean(previouslyPassed),
      submissionId: submission._id,
      message:
        execution.status === 'passed'
          ? rewardGranted
            ? `All test cases passed! +${tokensAwarded} tokens added to your wallet.`
            : 'All test cases passed! (Practice submission - reward was previously claimed).'
          : execution.error || 'Some test cases failed. Keep trying!',
    });
  } catch (error) {
    console.error('submitChallengeSolution error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process challenge submission.',
      error: error.message,
    });
  }
};

/**
 * Get current user's challenge submissions
 * GET /api/tokens/submissions
 */
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await ChallengeSubmission.find({ user: req.user._id })
      .populate('challenge', 'title difficulty reward category')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error('getMySubmissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve challenge submissions.',
      error: error.message,
    });
  }
};

// ==========================================
// 3. ASSIGNMENTS
// ==========================================

/**
 * List assignments with user's submission state
 * GET /api/tokens/assignments
 */
export const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Attach student submission state
    let submissionMap = new Map();
    if (req.user) {
      const mySubmissions = await AssignmentSubmission.find({ student: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

      for (const s of mySubmissions) {
        if (!submissionMap.has(s.assignment.toString())) {
          submissionMap.set(s.assignment.toString(), s);
        }
      }
    }

    const enrichedAssignments = assignments.map((a) => ({
      ...a,
      submission: submissionMap.get(a._id.toString()) || null,
    }));

    return res.status(200).json({
      success: true,
      assignments: enrichedAssignments,
    });
  } catch (error) {
    console.error('getAssignments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignments.',
      error: error.message,
    });
  }
};

/**
 * Submit work for an assignment
 * POST /api/tokens/assignments/:id/submit
 */
export const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { repoUrl, demoUrl, notes } = req.body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Repository URL is required.',
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment || !assignment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or inactive.',
      });
    }

    // Check if student already has a PENDING or APPROVED submission
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignment._id,
      student: req.user._id,
      status: { $in: ['PENDING', 'APPROVED'] },
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message:
          existingSubmission.status === 'APPROVED'
            ? 'You have already completed and received tokens for this assignment.'
            : 'You already have a pending submission under mentor review.',
        submission: existingSubmission,
      });
    }

    const submission = await AssignmentSubmission.create({
      assignment: assignment._id,
      student: req.user._id,
      repoUrl: repoUrl.trim(),
      demoUrl: (demoUrl || '').trim(),
      notes: (notes || '').trim(),
      status: 'PENDING',
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully. A mentor or admin will review your work.',
      submission,
    });
  } catch (error) {
    console.error('submitAssignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit assignment.',
      error: error.message,
    });
  }
};

// ==========================================
// 4. TOKEN PACKAGES & PAYMENTS
// ==========================================

/**
 * List available token purchase packages
 * GET /api/tokens/packages
 */
export const getTokenPackages = async (req, res) => {
  try {
    // Seed default packages if none exist
    const count = await TokenPackage.countDocuments();
    if (count === 0) {
      await TokenPackage.create([
        {
          name: 'Starter Pack',
          tokens: 50,
          price: 99,
          currency: 'INR',
          badge: 'Popular for Beginners',
          description: 'Perfect for getting started with your first code reviews and bounties.',
          sortOrder: 1,
        },
        {
          name: 'Standard Pack',
          tokens: 150,
          price: 249,
          currency: 'INR',
          badge: 'Most Popular',
          description: 'Great value for students actively collaborating on multiple assignments.',
          sortOrder: 2,
        },
        {
          name: 'Premium Pro Pack',
          tokens: 500,
          price: 699,
          currency: 'INR',
          badge: 'Best Value',
          description: 'Maximum tokens for deep technical mentoring sessions and bounty rewards.',
          sortOrder: 3,
        },
      ]);
    }

    const packages = await TokenPackage.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
    const gateway = getPaymentConfig();

    return res.status(200).json({
      success: true,
      packages,
      gateway,
    });
  } catch (error) {
    console.error('getTokenPackages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve token packages.',
      error: error.message,
    });
  }
};

/**
 * Get public payment gateway status
 * GET /api/tokens/payment/config
 */
export const getPaymentGatewayConfig = async (req, res) => {
  try {
    const config = getPaymentConfig();
    return res.status(200).json({
      success: true,
      ...config,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment configuration.',
      error: error.message,
    });
  }
};

/**
 * Initiate token purchase order
 * POST /api/tokens/purchase
 */
export const initiatePurchase = async (req, res) => {
  try {
    const { packageId, idempotencyKey } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'packageId is required.',
      });
    }

    const orderData = await createPaymentOrder({
      userId: req.user._id,
      packageId,
      idempotencyKey,
    });

    return res.status(201).json({
      success: true,
      order: orderData.order,
      package: orderData.package,
      keyId: orderData.keyId,
      isSandboxMode: orderData.isSandboxMode,
      currency: orderData.package.currency,
      amount: orderData.order.amount,
      tokens: orderData.order.tokens,
    });
  } catch (error) {
    console.error('initiatePurchase error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate token purchase.',
    });
  }
};

/**
 * Verify Razorpay payment signature and credit tokens
 * POST /api/tokens/payment/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'razorpayOrderId and razorpayPaymentId are required.',
      });
    }

    const result = await processVerifiedPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || '',
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyProcessed
        ? 'Payment already verified and tokens credited.'
        : `Payment successful! +${result.tokens} tokens credited to your wallet.`,
      newBalance: result.newBalance,
      tokens: result.tokens,
      order: result.order,
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Payment signature verification failed.',
    });
  }
};

/**
 * Razorpay Webhook handler (Duplicate protection & signature verified)
 * POST /api/tokens/webhook
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = JSON.stringify(req.body);

    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature({ rawBody, signature });
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        await processVerifiedPayment({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature || 'webhook_verified',
        });
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('handleRazorpayWebhook error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
