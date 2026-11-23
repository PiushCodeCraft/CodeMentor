import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Challenge from '../models/Challenge.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import TokenPackage from '../models/TokenPackage.js';
import PaymentOrder from '../models/PaymentOrder.js';
import Notification from '../models/Notification.js';
import { creditTokens, debitTokens } from '../services/walletService.js';

// ==========================================
// 1. WALLET MONITORING & ADJUSTMENTS
// ==========================================

/**
 * List all user wallets with balance & total stats
 * GET /api/admin/tokens/wallets
 */
export const getAdminWallets = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email role credits reputation ratingAvg ratingCount createdAt')
        .sort({ credits: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('getAdminWallets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallets.',
      error: error.message,
    });
  }
};

/**
 * Audit transaction logs across the platform
 * GET /api/admin/tokens/transactions
 */
export const getAdminTransactions = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (type && type !== 'all') query.type = type;

    if (search) {
      // Find matching user IDs first
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchedUsers.map((u) => u._id);
      query.$or = [{ user: { $in: userIds } }, { to: { $in: userIds } }, { from: { $in: userIds } }];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email role')
        .populate('from', 'name email')
        .populate('to', 'name email')
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      transactions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('getAdminTransactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions.',
      error: error.message,
    });
  }
};

/**
 * Manually credit or debit tokens from a user wallet with mandatory audit reason
 * POST /api/admin/tokens/adjust
 */
export const adjustUserTokens = async (req, res) => {
  try {
    const { userId, amount, action, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }
    if (!action || !['credit', 'debit'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'credit' or 'debit'." });
    }
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory audit reason (minimum 5 characters) is required for manual wallet adjustments.',
      });
    }

    const numericAmount = Number(amount);
    let result;

    if (action === 'credit') {
      result = await creditTokens({
        userId,
        amount: numericAmount,
        type: 'ADMIN_CREDIT',
        description: `Admin Manual Credit by ${req.user.name}: "${reason.trim()}"`,
        relatedActivityType: 'AdminAction',
      });

      await Notification.create({
        user: userId,
        type: 'credit_transfer',
        message: `An administrator credited +${numericAmount} tokens to your wallet: "${reason.trim()}"`,
        link: '/wallet',
      });
    } else {
      result = await debitTokens({
        userId,
        amount: numericAmount,
        type: 'ADMIN_DEBIT',
        description: `Admin Manual Debit by ${req.user.name}: "${reason.trim()}"`,
        relatedActivityType: 'AdminAction',
      });

      await Notification.create({
        user: userId,
        type: 'credit_transfer',
        message: `An administrator debited -${numericAmount} tokens from your wallet: "${reason.trim()}"`,
        link: '/wallet',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully ${action === 'credit' ? 'credited' : 'debited'} ${numericAmount} tokens.`,
      newBalance: result.newBalance,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('adjustUserTokens error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to adjust user tokens.',
    });
  }
};

// ==========================================
// 2. CODING CHALLENGES MANAGEMENT
// ==========================================

export const getAdminChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, challenges });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createAdminChallenge = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      reward,
      category,
      language = 'javascript',
      functionName = 'solution',
      starterCode,
      examples = [],
      constraints = [],
      testCases = [],
    } = req.body;

    if (!title || !description || !starterCode) {
      return res.status(400).json({ success: false, message: 'Title, description and starterCode are required.' });
    }

    const challenge = await Challenge.create({
      title: title.trim(),
      description,
      difficulty: difficulty || 'beginner',
      reward: Number(reward) || (difficulty === 'advanced' ? 20 : difficulty === 'intermediate' ? 10 : 5),
      category: category || 'Algorithms',
      language,
      functionName,
      starterCode,
      examples,
      constraints,
      testCases,
    });

    return res.status(201).json({ success: true, challenge });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAdminChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findByIdAndUpdate(id, req.body, { new: true });
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }
    return res.status(200).json({ success: true, challenge });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAdminChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    await Challenge.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Challenge deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 3. ASSIGNMENTS MANAGEMENT & REVIEW
// ==========================================

export const getAdminAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, assignments });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createAdminAssignment = async (req, res) => {
  try {
    const { title, instructions, reward = 15, difficulty, category, deliverables, deadline } = req.body;
    if (!title || !instructions) {
      return res.status(400).json({ success: false, message: 'Title and instructions are required.' });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      instructions,
      reward: Number(reward) || 15,
      difficulty: difficulty || 'intermediate',
      category: category || 'Full Stack',
      deliverables: deliverables || 'GitHub repository link and project write-up',
      deadline: deadline || null,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, assignment });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAdminAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndUpdate(id, req.body, { new: true });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }
    return res.status(200).json({ success: true, assignment });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAdminAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAdminAssignmentSubmissions = async (req, res) => {
  try {
    const { status, assignmentId, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (assignmentId) query.assignment = assignmentId;

    const [submissions, total] = await Promise.all([
      AssignmentSubmission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('assignment', 'title reward difficulty')
        .populate('student', 'name email avatar credits')
        .populate('reviewedBy', 'name email role')
        .lean(),
      AssignmentSubmission.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      submissions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Approve or Reject assignment submission (Mentor or Admin)
 * Awards reward tokens atomically when approved!
 * PATCH /api/admin/tokens/assignments/submissions/:id/review
 */
export const reviewAssignmentSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'APPROVED' or 'REJECTED'." });
    }

    const submission = await AssignmentSubmission.findById(id).populate('assignment');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    // Prevent self-review (student cannot approve their own submission)
    if (submission.student.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: You cannot review your own assignment submission.',
      });
    }

    // If already approved, prevent duplicate rewards
    if (submission.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'This assignment submission has already been approved and rewarded.',
      });
    }

    submission.status = status;
    submission.feedback = feedback || '';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    let tokensAwarded = 0;

    if (status === 'APPROVED') {
      tokensAwarded = submission.assignment.reward || 15;
      submission.tokensAwarded = tokensAwarded;

      // Credit tokens atomically
      await creditTokens({
        userId: submission.student,
        amount: tokensAwarded,
        type: 'ASSIGNMENT_REWARD',
        description: `Assignment Approved: "${submission.assignment.title}" (+${tokensAwarded} tokens)`,
        relatedActivityId: submission.assignment._id,
        relatedActivityType: 'Assignment',
      });

      // Send in-app notification
      await Notification.create({
        user: submission.student,
        type: 'credit_transfer',
        message: `🎉 Assignment Approved! Your submission for "${submission.assignment.title}" was approved by ${req.user.name}. You received +${tokensAwarded} tokens!`,
        link: '/wallet',
      });
    } else {
      await Notification.create({
        user: submission.student,
        type: 'request_accepted',
        message: `Your assignment submission for "${submission.assignment.title}" was rejected. Feedback: "${feedback || 'Please review instructions and resubmit.'}"`,
        link: '/earn',
      });
    }

    await submission.save();

    return res.status(200).json({
      success: true,
      message: `Assignment submission ${status.toLowerCase()} successfully.`,
      submission,
      tokensAwarded,
    });
  } catch (error) {
    console.error('reviewAssignmentSubmission error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 4. TOKEN PACKAGES & PAYMENTS MANAGEMENT
// ==========================================

export const getAdminPackages = async (req, res) => {
  try {
    const packages = await TokenPackage.find().sort({ sortOrder: 1, price: 1 });
    return res.status(200).json({ success: true, packages });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createAdminPackage = async (req, res) => {
  try {
    const { name, tokens, price, currency = 'INR', badge, description, sortOrder } = req.body;
    if (!name || !tokens || !price) {
      return res.status(400).json({ success: false, message: 'Name, tokens, and price are required.' });
    }

    const pkg = await TokenPackage.create({
      name: name.trim(),
      tokens: Number(tokens),
      price: Number(price),
      currency,
      badge: badge || '',
      description: description || '',
      sortOrder: Number(sortOrder) || 0,
    });

    return res.status(201).json({ success: true, package: pkg });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAdminPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await TokenPackage.findByIdAndUpdate(id, req.body, { new: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found.' });
    return res.status(200).json({ success: true, package: pkg });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAdminPackage = async (req, res) => {
  try {
    const { id } = req.params;
    await TokenPackage.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Package deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAdminPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'all') query.status = status;

    const [orders, total] = await Promise.all([
      PaymentOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email role')
        .populate('package', 'name tokens price currency')
        .lean(),
      PaymentOrder.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
