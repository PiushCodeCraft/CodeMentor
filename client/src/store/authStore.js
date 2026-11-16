import { create } from 'zustand';
import api from '../api/axios.js';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  /**
   * Verify session and load authenticated user
   */
  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/users/me');
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Log in user
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Register a new user (student or mentor)
   */
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', userData);
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Log out user
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  /**
   * Update profile information
   */
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put('/users/me', profileData);
      set({
        user: res.data.user,
        isLoading: false,
      });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile.';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },
}));

