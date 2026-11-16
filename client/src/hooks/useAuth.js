import { useAuthStore } from '../store/authStore.js';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchMe,
    updateProfile,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isStudent: user?.role === 'student',
    isMentor: user?.role === 'mentor',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    fetchMe,
    updateProfile,
    clearError,
  };
};

export default useAuth;

