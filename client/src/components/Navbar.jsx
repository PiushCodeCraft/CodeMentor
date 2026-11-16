import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'mentor':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Mentor
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            Admin
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            Student
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl font-black bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            CodeMentor
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 md:gap-3 text-sm font-medium">
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="text-slate-300 hover:text-white transition px-2.5 py-1 rounded-md hover:bg-slate-800/50"
            >
              Dashboard
            </Link>
          )}
          <Link
            to="/requests"
            className="text-slate-300 hover:text-white transition px-2.5 py-1 rounded-md hover:bg-slate-800/50"
          >
            Requests
          </Link>
          <Link
            to="/mentors"
            className="text-slate-300 hover:text-white transition px-2.5 py-1 rounded-md hover:bg-slate-800/50"
          >
            Mentors
          </Link>
          <Link
            to="/leaderboard"
            className="text-slate-300 hover:text-white transition px-2.5 py-1 rounded-md hover:bg-slate-800/50"
          >
            Leaderboard
          </Link>
          {isAuthenticated && (
            <Link
              to="/profile"
              className="text-slate-300 hover:text-white transition px-2.5 py-1 rounded-md hover:bg-slate-800/50"
            >
              Profile
            </Link>
          )}
        </nav>
      </div>

      {/* Right side navigation & user status */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            {/* Wallet Credits */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-full text-xs font-medium text-slate-300">
              <span className="text-amber-400">🪙</span>
              <span>{user?.credits ?? 0}</span>
              <span className="text-slate-500">credits</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Role Badge */}
            {getRoleBadge(user?.role)}

            {/* User Info */}
            <Link
              to="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition"
              title="Edit Profile"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-sm font-medium text-slate-200">
                {user?.name}
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

