import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { validate, registerSchema, loginSchema } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', auth, logout);

export default router;

