import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// GET /api/leaderboard - Top mentors (Auth)
router.get('/', auth, getLeaderboard);

export default router;

