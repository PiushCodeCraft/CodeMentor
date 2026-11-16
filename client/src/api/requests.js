import api from './axios.js';

export const fetchRequests = async (params = {}) => {
  const response = await api.get('/requests', { params });
  return response.data;
};

export const fetchRequestById = async (id) => {
  const response = await api.get(`/requests/${id}`);
  return response.data;
};

export const createReviewRequest = async (requestData) => {
  const response = await api.post('/requests', requestData);
  return response.data;
};

export const cancelReviewRequest = async (id) => {
  const response = await api.patch(`/requests/${id}/cancel`);
  return response.data;
};

export const fetchMentors = async (params = {}) => {
  const response = await api.get('/mentors', { params });
  return response.data;
};

export const fetchMentorById = async (id) => {
  const response = await api.get(`/users/mentors/${id}`);
  return response.data;
};

export const triggerAiReview = async (id) => {
  const response = await api.post(`/requests/${id}/ai-review`);
  return response.data;
};
