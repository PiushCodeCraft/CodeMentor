import api from './axios.js';

// ==========================================
// Student Wallet & Transactions
// ==========================================

export const fetchMyWallet = async () => {
  const res = await api.get('/tokens/wallet');
  return res.data;
};

export const fetchMyTransactions = async (params = {}) => {
  const res = await api.get('/tokens/transactions', { params });
  return res.data;
};

// ==========================================
// Coding Challenges
// ==========================================

export const fetchChallenges = async (params = {}) => {
  const res = await api.get('/tokens/challenges', { params });
  return res.data;
};

export const fetchChallengeById = async (id) => {
  const res = await api.get(`/tokens/challenges/${id}`);
  return res.data;
};

export const submitChallenge = async (id, { code, language = 'javascript' }) => {
  const res = await api.post(`/tokens/challenges/${id}/submit`, { code, language });
  return res.data;
};

export const fetchMySubmissions = async () => {
  const res = await api.get('/tokens/submissions');
  return res.data;
};

// ==========================================
// Assignments
// ==========================================

export const fetchAssignments = async () => {
  const res = await api.get('/tokens/assignments');
  return res.data;
};

export const submitAssignment = async (id, { repoUrl, demoUrl, notes }) => {
  const res = await api.post(`/tokens/assignments/${id}/submit`, {
    repoUrl,
    demoUrl,
    notes,
  });
  return res.data;
};

// ==========================================
// Token Packages & Purchases
// ==========================================

export const fetchTokenPackages = async () => {
  const res = await api.get('/tokens/packages');
  return res.data;
};

export const fetchPaymentConfig = async () => {
  const res = await api.get('/tokens/payment/config');
  return res.data;
};

export const initiatePurchase = async (packageId, idempotencyKey = null) => {
  const res = await api.post('/tokens/purchase', { packageId, idempotencyKey });
  return res.data;
};

export const verifyPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const res = await api.post('/tokens/payment/verify', {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return res.data;
};

// ==========================================
// Admin Token Economy Management
// ==========================================

export const fetchAdminWallets = async (params = {}) => {
  const res = await api.get('/admin/tokens/wallets', { params });
  return res.data;
};

export const fetchAdminTransactions = async (params = {}) => {
  const res = await api.get('/admin/tokens/transactions', { params });
  return res.data;
};

export const adjustUserTokens = async ({ userId, amount, action, reason }) => {
  const res = await api.post('/admin/tokens/adjust', {
    userId,
    amount,
    action,
    reason,
  });
  return res.data;
};

export const fetchAdminChallenges = async () => {
  const res = await api.get('/admin/tokens/challenges');
  return res.data;
};

export const createAdminChallenge = async (data) => {
  const res = await api.post('/admin/tokens/challenges', data);
  return res.data;
};

export const updateAdminChallenge = async (id, data) => {
  const res = await api.put(`/admin/tokens/challenges/${id}`, data);
  return res.data;
};

export const deleteAdminChallenge = async (id) => {
  const res = await api.delete(`/admin/tokens/challenges/${id}`);
  return res.data;
};

export const fetchAdminAssignments = async () => {
  const res = await api.get('/admin/tokens/assignments');
  return res.data;
};

export const createAdminAssignment = async (data) => {
  const res = await api.post('/admin/tokens/assignments', data);
  return res.data;
};

export const updateAdminAssignment = async (id, data) => {
  const res = await api.put(`/admin/tokens/assignments/${id}`, data);
  return res.data;
};

export const deleteAdminAssignment = async (id) => {
  const res = await api.delete(`/admin/tokens/assignments/${id}`);
  return res.data;
};

export const fetchAdminAssignmentSubmissions = async (params = {}) => {
  const res = await api.get('/admin/tokens/assignments/submissions', { params });
  return res.data;
};

export const reviewAssignmentSubmission = async (id, { status, feedback }) => {
  const res = await api.patch(`/admin/tokens/assignments/submissions/${id}/review`, {
    status,
    feedback,
  });
  return res.data;
};

export const fetchAdminPackages = async () => {
  const res = await api.get('/admin/tokens/packages');
  return res.data;
};

export const createAdminPackage = async (data) => {
  const res = await api.post('/admin/tokens/packages', data);
  return res.data;
};

export const updateAdminPackage = async (id, data) => {
  const res = await api.put(`/admin/tokens/packages/${id}`, data);
  return res.data;
};

export const deleteAdminPackage = async (id) => {
  const res = await api.delete(`/admin/tokens/packages/${id}`);
  return res.data;
};

export const fetchAdminPayments = async (params = {}) => {
  const res = await api.get('/admin/tokens/payments', { params });
  return res.data;
};
