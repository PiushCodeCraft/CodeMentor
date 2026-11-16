import { Router } from 'express';
import {
  getUsers,
  approveMentor,
  updateUserStatus,
  getPlatformStats,
} from '../controllers/adminController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// Protect all admin endpoints with auth and admin role
router.use(auth);
router.use(requireRole('admin'));

// GET /api/admin/users - List users with filters, search, pagination
router.get('/users', getUsers);

// GET /api/admin/stats - Platform metrics
router.get('/stats', getPlatformStats);

// PATCH /api/admin/mentors/:id/approve - Approve or suspend mentor
router.patch('/mentors/:id/approve', approveMentor);

// PATCH /api/admin/users/:id/status - Update general user status
router.patch('/users/:id/status', updateUserStatus);

export default router;

