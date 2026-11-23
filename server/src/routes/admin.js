import { Router } from 'express';
import {
  getUsers,
  approveMentor,
  updateUserStatus,
  getPlatformStats,
} from '../controllers/adminController.js';
import {
  getAdminWallets,
  getAdminTransactions,
  adjustUserTokens,
  getAdminChallenges,
  createAdminChallenge,
  updateAdminChallenge,
  deleteAdminChallenge,
  getAdminAssignments,
  createAdminAssignment,
  updateAdminAssignment,
  deleteAdminAssignment,
  getAdminAssignmentSubmissions,
  reviewAssignmentSubmission,
  getAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  deleteAdminPackage,
  getAdminPayments,
} from '../controllers/adminTokenController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// Protect all admin endpoints with auth and admin role
router.use(auth);
router.use(requireRole('admin'));

// Core platform management
router.get('/users', getUsers);
router.get('/stats', getPlatformStats);
router.patch('/mentors/:id/approve', approveMentor);
router.patch('/users/:id/status', updateUserStatus);

// ==========================================
// Token Economy & Wallets Administration
// ==========================================
router.get('/tokens/wallets', getAdminWallets);
router.get('/tokens/transactions', getAdminTransactions);
router.post('/tokens/adjust', adjustUserTokens);

// Challenges Management
router.get('/tokens/challenges', getAdminChallenges);
router.post('/tokens/challenges', createAdminChallenge);
router.put('/tokens/challenges/:id', updateAdminChallenge);
router.delete('/tokens/challenges/:id', deleteAdminChallenge);

// Assignments Management & Review
router.get('/tokens/assignments', getAdminAssignments);
router.post('/tokens/assignments', createAdminAssignment);
router.put('/tokens/assignments/:id', updateAdminAssignment);
router.delete('/tokens/assignments/:id', deleteAdminAssignment);
router.get('/tokens/assignments/submissions', getAdminAssignmentSubmissions);
router.patch('/tokens/assignments/submissions/:id/review', reviewAssignmentSubmission);

// Token Packages Management
router.get('/tokens/packages', getAdminPackages);
router.post('/tokens/packages', createAdminPackage);
router.put('/tokens/packages/:id', updateAdminPackage);
router.delete('/tokens/packages/:id', deleteAdminPackage);

// Payment Records
router.get('/tokens/payments', getAdminPayments);

export default router;
