import api from './axios.js';

/**
 * Fetch platform stats for admin dashboard
 */
export const fetchAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

/**
 * Fetch users with filtering, search, and pagination
 */
export const fetchAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

/**
 * Approve or revoke approval for a mentor
 */
export const approveMentor = async (mentorId, isApproved = true) => {
  const response = await api.patch(`/admin/mentors/${mentorId}/approve`, {
    isApproved,
  });
  return response.data;
};

/**
 * Update general user status (approval, role, availability)
 */
export const updateUserStatus = async (userId, updateData) => {
  const response = await api.patch(`/admin/users/${userId}/status`, updateData);
  return response.data;
};
