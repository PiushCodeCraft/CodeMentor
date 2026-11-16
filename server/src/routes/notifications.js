import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

// GET /api/notifications - List user's notifications
router.get('/', getNotifications);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', markAsRead);

export default router;

