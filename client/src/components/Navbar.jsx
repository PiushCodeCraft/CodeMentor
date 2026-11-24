
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import useSocket from '../hooks/useSocket.js';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout, updateCredits, syncWallet } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isStudent = user?.role === 'student';
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin';

  // Real-time socket connection for student wallet balance synchronization
  const { socket, isConnected } = useSocket(Boolean(isAuthenticated && isStudent));

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleWalletUpdate = (data) => {
      const balance = data?.availableBalance ?? data?.currentBalance ?? data?.balance ?? data?.credits;
      if (typeof balance === 'number') {
        updateCredits(balance);
      }
    };

    socket.on('wallet:update', handleWalletUpdate);
    return () => {
      socket.off('wallet:update', handleWalletUpdate);
    };
  }, [socket, isConnected, updateCredits]);

  // Re-sync wallet balance with backend on page navigation for students
  useEffect(() => {
    if (isAuthenticated && isStudent) {
      syncWallet();
    }
  }, [location.pathname, isAuthenticated, isStudent, syncWallet]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const navItems = [
    ...(isAuthenticated ? [{ path: '/dashboard', label: 'Dashboard' }] : []),
    { path: '/requests', label: 'Requests' },
    { path: '/mentors', label: 'Mentors' },
    { path: '/leaderboard', label: '🏆 Leaderboard' },
    ...(isStudent ? [
      { path: '/earn', label: '⚡ Earn Tokens' },
      { path: '/marketplace', label: '💳 Marketplace' },
      ...(isAuthenticated ? [{ path: '/wallet', label: '🪙 Wallet' }] : []),
    ] : []),
    // ...(isAuthenticated && isAdmin
    //   ? [{ path: '/admin', label: '🛡️ Admin Panel' }]
    //   : []),
  ];

  const getRoleBadge = (role) => {
    const styles = {
      mentor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      admin: 'bg-purple-50 text-purple-700 border-purple-200',
      student: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles[role] || styles.student}`}>
        {role === 'admin' ? '🛡️ ' : ''}
        {role || 'student'}
      </span>
    );
  };

  const navLinkClass = (path) =>
    `flex items-center whitespace-nowrap px-2.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
      isActive(path)
        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-700'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">

      {/* Main Navbar */}
      <div className="max-w-[1800px] mx-auto min-h-[72px] px-4 lg:px-6 flex items-center justify-between gap-3">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-sm group-hover:shadow-md group-hover:border-indigo-300 transition flex items-center justify-center p-1">
            <img src="/logo.png" alt="CodeMentor Logo" className="w-full h-full object-contain" />
          </div>

          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            CodeMentor
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={navLinkClass(item.path)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">

          {isAuthenticated ? (
            <>
              {/* Token Wallet - Only displayed for Students */}
              {isStudent && (
                <Link
                  to="/wallet"
                  title="Open Token Wallet"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 transition"
                >
                  <span className="text-amber-600">🪙</span>
                  <span className="text-xs font-bold text-amber-800">
                    {user?.credits ?? 0}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    tokens
                  </span>
                </Link>
              )}

              {/* Notifications */}
              <div className="flex items-center justify-center">
                <NotificationBell />
              </div>

              {/* Role */}
              <div className="hidden lg:block">
                {getRoleBadge(user?.role)}
              </div>

              {/* Profile */}
              <Link
                to="/profile"
                title="View Profile"
                className="flex items-center gap-2 px-1.5 py-1 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <span className="hidden 2xl:block text-xs font-semibold text-slate-700 max-w-[110px] truncate">
                  {user?.name}
                </span>
              </Link>

              {/* Desktop Logout */}
              <button
                onClick={handleLogout}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
              >
                <span>Logout</span>
                <span>↗</span>
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
              >
                Get Started ✦
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="xl:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Navigation */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white shadow-lg">
          <nav className="max-w-[1800px] mx-auto px-4 py-4 flex flex-col gap-1">

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive(item.path)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 mt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white font-bold flex items-center justify-center">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.role || 'Student'}
                      </p>
                    </div>
                  </div>
                  {getRoleBadge(user?.role)}
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-2 w-full text-left px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <Link
                  to="/login"
                  className="flex-1 text-center py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
