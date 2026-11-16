import { Router } from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  cancelRequest,
  acceptRequest,
  triggerAiReview,
} from '../controllers/requestController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate, createRequestSchema } from '../middleware/validate.js';

const router = Router();

// Apply auth to all request routes
router.use(auth);

// POST /api/requests - Create review request (Students only)
router.post('/', requireRole('student', 'admin'), validate(createRequestSchema), createRequest);

// GET /api/requests - List with filters & search
router.get('/', getRequests);

// GET /api/requests/:id - Get request details
router.get('/:id', getRequestById);

// PATCH /api/requests/:id/cancel - Cancel request (Student owner only)
router.patch('/:id/cancel', requireRole('student', 'admin'), cancelRequest);

// POST /api/requests/:id/accept - Accept request (Mentor only)
router.post('/:id/accept', requireRole('mentor', 'admin'), acceptRequest);

// POST /api/requests/:id/ai-review - Trigger or regenerate AI Pre-Review (Phase 8)
router.post('/:id/ai-review', triggerAiReview);

export default router;

