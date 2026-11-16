import { Router } from 'express';
import {
  getSessionById,
  getMySessions,
  endSession,
  getSessionMessages,
} from '../controllers/sessionController.js';
import {
  getSessionComments,
  addSessionComment,
} from '../controllers/commentController.js';
import { auth } from '../middleware/auth.js';
import { validate, createCommentSchema } from '../middleware/validate.js';

const router = Router();

router.use(auth);

// GET /api/sessions - User's sessions
router.get('/', getMySessions);

// GET /api/sessions/:id - Session details (Participant check)
router.get('/:id', getSessionById);

// POST /api/sessions/:id/end - End session (Participant check)
router.post('/:id/end', endSession);

// GET /api/sessions/:id/messages - Message history
router.get('/:id/messages', getSessionMessages);

// GET /api/sessions/:id/comments - List inline comments
router.get('/:id/comments', getSessionComments);

// POST /api/sessions/:id/comments - Add inline comment
router.post('/:id/comments', validate(createCommentSchema), addSessionComment);

export default router;
