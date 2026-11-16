import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-800/80 border border-red-500/30 rounded-xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
        <p className="text-sm text-slate-400">
          This area requires one of the following roles: <span className="font-semibold text-slate-300">[{allowedRoles.join(', ')}]</span>.
          Your current role is <span className="text-indigo-400 font-semibold">{user?.role}</span>.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return children;
}

