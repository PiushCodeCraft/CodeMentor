import { Router } from 'express';
import {
  createReview,
  getSessionReview,
  getMentorReviews,
} from '../controllers/reviewController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate, createReviewSchema } from '../middleware/validate.js';

const router = Router();

router.use(auth);

// POST /api/reviews - Rate mentor after session (Student or Admin)
router.post(
  '/',
  requireRole('student', 'admin'),
  validate(createReviewSchema),
  createReview
);

// GET /api/reviews/session/:sessionId - Get review for a session
router.get('/session/:sessionId', getSessionReview);

// GET /api/reviews/mentor/:mentorId - Get all reviews for a mentor
router.get('/mentor/:mentorId', getMentorReviews);

export default router;

