import { Router } from 'express';
import { resolveComment } from '../controllers/commentController.js';
import { auth } from '../middleware/auth.js';
import { validate, resolveCommentSchema } from '../middleware/validate.js';

const router = Router();

router.use(auth);

// PATCH /api/comments/:id/resolve - Resolve or reopen comment
router.patch('/:id/resolve', validate(resolveCommentSchema), resolveComment);

export default router;

