import Review from '../models/Review.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import {
  recomputeMentorRating,
  evaluateMentorRewards,
} from '../services/ratingService.js';

/**
 * Submit post-session rating and review (Student only)
 * POST /api/reviews
 */
export const createReview = async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;
    const studentId = req.user._id.toString();

    // 1. Fetch Session and verify completion and ownership
    const session = await Session.findById(sessionId).populate('request');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.',
      });
    }

    if (session.student.toString() !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the student who participated in this session can submit a review.',
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot review a session that is not yet completed.',
      });
    }

    // 2. Check if already reviewed
    const existingReview = await Review.findOne({ session: sessionId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'This session has already been reviewed.',
        review: existingReview,
      });
    }

    // 3. Create Review
    const newReview = await Review.create({
      session: sessionId,
      student: session.student,
      mentor: session.mentor,
      rating: Number(rating),
      comment: (comment || '').trim(),
    });

    // 4. Recompute mentor rating via MongoDB Aggregation
    const { ratingAvg, ratingCount } = await recomputeMentorRating(session.mentor);

    // 5. Update mentor wallet, reputation points, and badges
    const mentor = await User.findById(session.mentor);
    if (mentor) {
      const { newReputation, newCredits, newBadges } = evaluateMentorRewards({
        mentor,
        rating: Number(rating),
        price: session.request?.price || 0,
        ratingCount,
        ratingAvg,
      });

      mentor.ratingAvg = ratingAvg;
      mentor.ratingCount = ratingCount;
      mentor.reputation = newReputation;
      mentor.credits = newCredits;
      mentor.badges = newBadges;
      await mentor.save();

      // Record transaction if there is a bounty
      if (session.request?.price > 0) {
        await Transaction.create({
          from: session.student,
          to: mentor._id,
          amount: session.request.price,
          request: session.request._id,
          type: 'bounty_payout',
        });
      }

      // 6. Notify mentor about review and bounty transfer
      const bountyText = session.request?.price > 0 ? ` + ${session.request.price} credits` : '';
      await Notification.create({
        user: mentor._id,
        type: 'credit_transfer',
        message: `${req.user.name} rated your session ${rating}★${bountyText}!`,
        link: '/profile',
      });
    }

    const populatedReview = await Review.findById(newReview._id)
      .populate('student', 'name avatar')
      .populate('mentor', 'name avatar ratingAvg reputation badges');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Mentor reputation and credits updated.',
      review: populatedReview,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review.',
      error: error.message,
    });
  }
};

/**
 * Get review for a specific session
 * GET /api/reviews/session/:sessionId
 */
export const getSessionReview = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const review = await Review.findOne({ session: sessionId })
      .populate('student', 'name avatar')
      .populate('mentor', 'name avatar ratingAvg reputation');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'No review found for this session.',
      });
    }

    return res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('Get session review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve review.',
      error: error.message,
    });
  }
};

/**
 * Get all reviews for a mentor
 * GET /api/reviews/mentor/:mentorId
 */
export const getMentorReviews = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const reviews = await Review.find({ mentor: mentorId })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Get mentor reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mentor reviews.',
      error: error.message,
    });
  }
};
