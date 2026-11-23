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
    refreshUser,
    updateCredits,
    syncWallet,
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
    refreshUser,
    updateCredits,
    syncWallet,
    updateProfile,
    clearError,
  };
};

export default useAuth;

