import api from './axios.js';

/**
 * Submit post-session review and rating
 */
export const submitReview = async ({ sessionId, rating, comment }) => {
  const response = await api.post('/reviews', {
    sessionId,
    rating: Number(rating),
    comment,
  });
  return response.data;
};

/**
 * Fetch review for a specific session
 */
export const fetchSessionReview = async (sessionId) => {
  try {
    const response = await api.get(`/reviews/session/${sessionId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: true, review: null };
    }
    throw error;
  }
};

/**
 * Fetch reviews for a specific mentor
 */
export const fetchMentorReviews = async (mentorId) => {
  const response = await api.get(`/reviews/mentor/${mentorId}`);
  return response.data;
};

/**
 * Fetch top mentor leaderboard
 */
export const fetchLeaderboard = async (params = {}) => {
  const response = await api.get('/leaderboard', { params });
  return response.data;
};

