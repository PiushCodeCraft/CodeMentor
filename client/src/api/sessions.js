import api from './axios.js';

export const acceptReviewRequest = async (requestId) => {
  const response = await api.post(`/requests/${requestId}/accept`);
  return response.data;
};

export const fetchSessionById = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

export const fetchMySessions = async () => {
  const response = await api.get('/sessions');
  return response.data;
};

export const fetchNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export const runSessionCode = async (sessionId, { code, language, stdin = '' }) => {
  const response = await api.post(`/sessions/${sessionId}/run`, { code, language, stdin });
  return response.data;
};

export const stopSessionCode = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/stop-run`);
  return response.data;
};

