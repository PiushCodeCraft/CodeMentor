import Request from '../models/Request.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Notification from '../models/Notification.js';
import { generateCodeReview } from '../services/aiService.js';
import { debitTokens, creditTokens, InsufficientTokensError } from '../services/walletService.js';

/**
 * Create a new review request (Student only)
 * POST /api/requests
 */
export const createRequest = async (req, res) => {
  try {
    const { title, description, code, repoUrl, tech, difficulty, price } = req.body;
    const student = req.user;

    // Check credits wallet balance if price is specified
    const requestPrice = price || 0;
    if (requestPrice > 0) {
      try {
        await debitTokens({
          userId: student._id,
          amount: requestPrice,
          type: 'SESSION_USAGE',
          description: `Bounty reserved for review request: "${title}"`,
          relatedActivityType: 'Request',
        });
      } catch (debitErr) {
        if (debitErr instanceof InsufficientTokensError || debitErr.code === 'INSUFFICIENT_TOKENS') {
          return res.status(400).json({
            success: false,
            code: 'INSUFFICIENT_TOKENS',
            message: debitErr.message,
            currentBalance: debitErr.currentBalance || student.credits || 0,
            requiredAmount: requestPrice,
          });
        }
        throw debitErr;
      }
    }

    // Phase 8: Generate AI Pre-Review Summary (gracefully fallback if fails)
    let aiSummary = '';
    try {
      aiSummary = await generateCodeReview({
        title,
        description: description || '',
        code,
        tech: tech || [],
      });
    } catch (aiErr) {
      console.warn('AI pre-review generation failed, proceeding without it:', aiErr.message);
    }

    // Create the review request
    const newRequest = await Request.create({
      student: student._id,
      title,
      description: description || '',
      code,
      repoUrl: repoUrl || '',
      tech: tech || [],
      difficulty: difficulty || 'beginner',
      price: requestPrice,
      status: 'open',
      aiSummary,
    });

    const populatedRequest = await Request.findById(newRequest._id).populate(
      'student',
      'name email avatar credits'
    );

    return res.status(201).json({
      success: true,
      message: 'Review request created successfully.',
      request: populatedRequest,
      credits: populatedRequest.student?.credits,
      availableBalance: populatedRequest.student?.credits,
    });
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create review request.',
      error: error.message,
    });
  }
};

/**
 * List review requests with filtering, searching, and pagination
 * GET /api/requests
 */
export const getRequests = async (req, res) => {
  try {
    const {
      tech,
      difficulty,
      status,
      search,
      student,
      mentor,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Filter by status (default to open if not specified, or allow 'all')
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by tech tag
    if (tech) {
      query.tech = { $in: [new RegExp(tech, 'i')] };
    }

    // Filter by difficulty
    if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    // Filter by student
    if (student === 'me') {
      query.student = req.user._id;
    } else if (student) {
      query.student = student;
    }

    // Filter by mentor
    if (mentor === 'me') {
      query.mentor = req.user._id;
    } else if (mentor) {
      query.mentor = mentor;
    }

    // Search query on title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      Request.find(query)
        .populate('student', 'name email avatar credits ratingAvg')
        .populate('mentor', 'name email avatar ratingAvg reputation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Request.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      requests,
    });
  } catch (error) {
    console.error('Get requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review requests.',
      error: error.message,
    });
  }
};

/**
 * Get single request details
 * GET /api/requests/:id
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id)
      .populate('student', 'name email avatar credits ratingAvg createdAt')
      .populate('mentor', 'name email avatar ratingAvg ratingCount reputation skills bio isApproved');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Review request not found.',
      });
    }

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error('Get request by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review request.',
      error: error.message,
    });
  }
};

/**
 * Cancel a review request (Owner student only)
 * PATCH /api/requests/:id/cancel
 */
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Review request not found.',
      });
    }

    // Ensure only the owner student (or admin) can cancel
    const isOwner = request.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this request.',
      });
    }

    // Only open requests can be cancelled
    if (request.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request that is currently in '${request.status}' status.`,
      });
    }

    // Refund credits to student wallet if price was paid
    let refundedBalance = req.user.credits;
    if (request.price > 0) {
      const refundResult = await creditTokens({
        userId: request.student,
        amount: request.price,
        type: 'REFUND',
        description: `Refund bounty for cancelled review request: "${request.title}"`,
        relatedActivityId: request._id,
        relatedActivityType: 'Request',
      });
      refundedBalance = refundResult.newBalance;
    }

    request.status = 'cancelled';
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Review request cancelled successfully. Any allocated credits have been refunded.',
      request,
      credits: refundedBalance,
      availableBalance: refundedBalance,
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel review request.',
      error: error.message,
    });
  }
};

/**
 * Accept a review request (Mentor only)
 * POST /api/requests/:id/accept
 * Atomic findOneAndUpdate with status = open condition prevents race conditions / double accept
 */
export const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const mentorId = req.user._id;

    // Check mentor approval
    if (!req.user.isApproved && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Your mentor account is pending admin approval before accepting review requests.',
      });
    }

    // Atomic findOneAndUpdate ensuring status is strictly 'open'
    const updatedRequest = await Request.findOneAndUpdate(
      { _id: id, status: 'open' },
      { status: 'accepted', mentor: mentorId },
      { new: true }
    ).populate('student', 'name email avatar credits');

    if (!updatedRequest) {
      const existing = await Request.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Review request not found.',
        });
      }
      return res.status(409).json({
        success: false,
        message: `This review request is no longer open (status: '${existing.status}'). It may have already been accepted by another mentor.`,
      });
    }

    // Prevent mentor from accepting their own request
    if (updatedRequest.student._id.toString() === mentorId.toString()) {
      await Request.findByIdAndUpdate(id, { status: 'open', mentor: null });
      return res.status(400).json({
        success: false,
        message: 'You cannot accept your own review request.',
      });
    }

    // Infer language from tech tags
    let language = 'javascript';
    if (updatedRequest.tech && updatedRequest.tech.length > 0) {
      const firstTech = updatedRequest.tech[0].toLowerCase();
      if (firstTech.includes('python')) language = 'python';
      else if (firstTech.includes('typescript') || firstTech.includes('ts')) language = 'typescript';
      else if (firstTech.includes('html')) language = 'html';
      else if (firstTech.includes('css')) language = 'css';
      else if (firstTech.includes('json')) language = 'json';
      else if (firstTech.includes('java')) language = 'java';
      else if (firstTech.includes('c++') || firstTech.includes('cpp')) language = 'cpp';
    }

    // Create 1-to-1 Session
    const session = await Session.create({
      request: updatedRequest._id,
      student: updatedRequest.student._id,
      mentor: mentorId,
      codeSnapshot: updatedRequest.code,
      language,
      status: 'active',
    });
    // Save the actual MongoDB Session ID in the Request.
updatedRequest.sessionId = session._id;
await updatedRequest.save();

    // Create Notification for the student
    await Notification.create({
      user: updatedRequest.student._id,
      type: 'request_accepted',
      message: `Mentor ${req.user.name} accepted your review request: "${updatedRequest.title}"`,
      link: `/sessions/${session._id}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Review request accepted successfully. Collaboration session created.',
      session,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept review request.',
      error: error.message,
    });
  }
};

/**
 * Trigger or re-generate AI Pre-Review Summary for a Request (Phase 8)
 * POST /api/requests/:id/ai-review
 */
export const triggerAiReview = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    const aiSummary = await generateCodeReview({
      title: request.title,
      description: request.description,
      code: request.code,
      tech: request.tech,
    });

    request.aiSummary = aiSummary;
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'AI Pre-Review generated successfully.',
      aiSummary,
    });
  } catch (error) {
    console.error('Trigger AI review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI pre-review.',
      error: error.message,
    });
  }
};


