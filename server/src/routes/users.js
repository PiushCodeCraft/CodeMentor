import { Router } from 'express';
import { getMe, updateMe, getMentors, getMentorById } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
import { validate, updateProfileSchema } from '../middleware/validate.js';

const router = Router();

router.get('/me', auth, getMe);
router.put('/me', auth, validate(updateProfileSchema), updateMe);
router.get('/mentors', auth, getMentors);
router.get('/mentors/:id', auth, getMentorById);

export default router;
