import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'mentor':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Mentor</span>
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-700 border border-purple-500/30 flex items-center gap-1 shadow-sm">
            <span>🛡️</span>
            <span>Admin</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            Student
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 p-[1px] shadow-sm group-hover:shadow-md transition">
            <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center text-indigo-600 font-black text-sm">
              ✦
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 bg-clip-text text-transparent tracking-tight">
              CodeMentor
            </span>
            {/* <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-600 border border-cyan-500/25">
              AI LIVE
            </span> */}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-1 md:gap-2 text-xs font-semibold uppercase tracking-wider">
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`transition px-3 py-1.5 rounded-xl ${
                isActive('/dashboard')
                  ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/25 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </Link>
          )}
          <Link
            to="/requests"
            className={`transition px-3 py-1.5 rounded-xl ${
              isActive('/requests')
                ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/25 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            Requests
          </Link>
          <Link
            to="/mentors"
            className={`transition px-3 py-1.5 rounded-xl ${
              isActive('/mentors')
                ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/25 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            Mentors
          </Link>
          <Link
            to="/leaderboard"
            className={`transition px-3 py-1.5 rounded-xl flex items-center gap-1 ${
              isActive('/leaderboard')
                ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/25 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <span>🏆</span>
            <span>Leaderboard</span>
          </Link>
          {isAuthenticated && (
            <Link
              to="/profile"
              className={`transition px-3 py-1.5 rounded-xl ${
                isActive('/profile')
                  ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/25 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              Profile
            </Link>
          )}

          {/* Admin Command Link for Admins */}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`transition px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                isActive('/admin')
                  ? 'bg-purple-500/15 text-purple-700 border border-purple-500/30 font-bold shadow-sm'
                  : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-500/20'
              }`}
            >
              <span>🛡️</span>
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Right side navigation & user status */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* AI Compute Credits Wallet */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-700 shadow-sm">
              <span className="text-amber-600">⚡</span>
              <span>{user?.credits ?? 0}</span>
              <span className="text-slate-400 text-[10px]">credits</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Role Badge */}
            {getRoleBadge(user?.role)}

            {/* User Avatar */}
            <Link
              to="/profile"
              className="flex items-center gap-2 hover:opacity-85 transition"
              title="Edit Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white font-bold flex items-center justify-center text-xs shadow-sm border border-indigo-400/40">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                {user?.name}
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 px-3 py-1.5 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20 transition"
            >
              Get Started ✦
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
