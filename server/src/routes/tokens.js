import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import {
  getMyWallet,
  getMyTransactions,
  getChallenges,
  getChallengeById,
  submitChallengeSolution,
  getMySubmissions,
  getAssignments,
  submitAssignment,
  getTokenPackages,
  getPaymentGatewayConfig,
  initiatePurchase,
  verifyPayment,
  handleRazorpayWebhook,
} from '../controllers/tokenController.js';

const router = express.Router();

// Public routes (or optionally authenticated for personalized status)
router.get('/packages', getTokenPackages);
router.get('/payment/config', getPaymentGatewayConfig);

// Public webhook endpoint for Razorpay (signature verified in controller)
router.post('/webhook', handleRazorpayWebhook);

// Protected student & user token routes
router.use(authenticate);

// Wallet & Transactions - Restricted to students and admins (mentors do not have token wallets)
router.get('/wallet', requireRole('student', 'admin'), getMyWallet);
router.get('/transactions', requireRole('student', 'admin'), getMyTransactions);

// Coding Challenges
router.get('/challenges', getChallenges);
router.get('/challenges/:id', getChallengeById);
router.post('/challenges/:id/submit', requireRole('student', 'admin'), submitChallengeSolution);
router.get('/submissions', getMySubmissions);

// Assignments
router.get('/assignments', getAssignments);
router.post('/assignments/:id/submit', requireRole('student', 'admin'), submitAssignment);

// Token Marketplace & Payments - Restricted to students and admins
router.post('/purchase', requireRole('student', 'admin'), initiatePurchase);
router.post('/payment/verify', requireRole('student', 'admin'), verifyPayment);

export default router;
