import api from './axios.js';

export const fetchSessionComments = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/comments`);
  return response.data;
};

export const addInlineComment = async (sessionId, { line, text }) => {
  const response = await api.post(`/sessions/${sessionId}/comments`, {
    line: Number(line),
    text,
  });
  return response.data;
};

export const resolveInlineComment = async (commentId, status) => {
  const response = await api.patch(`/comments/${commentId}/resolve`, {
    status,
  });
  return response.data;
};

