import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Requests from './pages/Requests.jsx';
import NewRequest from './pages/NewRequest.jsx';
import RequestDetail from './pages/RequestDetail.jsx';
import Mentors from './pages/Mentors.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Session from './pages/Session.jsx';
import Admin from './pages/Admin.jsx';
import Wallet from './pages/Wallet.jsx';
import EarnTokens from './pages/EarnTokens.jsx';
import TokenMarketplace from './pages/TokenMarketplace.jsx';
import { useAuth } from './hooks/useAuth.js';

function Home() {
  const { isAuthenticated, user } = useAuth();
  const [healthData, setHealthData] = React.useState(null);
  const [loadingHealth, setLoadingHealth] = React.useState(false);

  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const primaryUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      let res;
      try {
        res = await fetch(`${primaryUrl}/api/health`);
      } catch {
        res = await fetch('http://localhost:5001/api/health');
      }
      const data = await res.json();
      setHealthData(data);
    } catch (e) {
      setHealthData({ status: 'offline', error: e.message });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 space-y-16 animate-fade-in">
      {/* AI Hero Banner */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-lg shadow-indigo-500/10 border border-slate-700/50 flex items-center justify-center">
            <img src="/logo.png" alt="CodeMentor Live" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-bold uppercase tracking-wider shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          <span>✦ AI-Powered Developer Mentorship Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-100 leading-tight">
          Supercharge your code with{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 bg-clip-text text-transparent">
            AI & Live Mentors.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
          Instant neural pre-reviews that pinpoint bugs and security risks in seconds, paired with live collaborative Monaco editor sessions and senior developer guidance.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition text-sm flex items-center gap-2 cursor-pointer hover:scale-105 duration-200"
            >
              <span>Launch Workspace</span>
              <span>&rarr;</span>
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition text-sm flex items-center gap-2 cursor-pointer hover:scale-105 duration-200"
              >
                <span>Get Started Free</span>
                <span>✦</span>
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold rounded-2xl transition text-sm shadow-sm"
              >
                Sign In
              </Link>
            </>
          )}

          <Link
            to="/requests"
            className="px-6 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-2xl text-sm font-medium transition shadow-sm"
          >
            Explore Requests
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: AI Code Intelligence */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 space-y-3 shadow-sm hover:shadow-md transition group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl text-cyan-600 shadow-sm group-hover:scale-110 transition">
            🤖
          </div>
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-1.5">
            <span>AI Pre-Review</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 border border-cyan-500/25">Phase 8</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automated first-pass scan detecting logic flaws, memory leaks, unhandled promises, and security risks.
          </p>
        </div>

        {/* Card 2: Monaco Editor Sync */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 space-y-3 shadow-sm hover:shadow-md transition group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl text-indigo-600 shadow-sm group-hover:scale-110 transition">
            ⚡
          </div>
          <h3 className="font-bold text-slate-100 text-base">Live Monaco Sync</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            VS Code editor synchronization powered by WebSockets, real-time presence indicators, and live chat.
          </p>
        </div>

        {/* Card 3: Inline Code Feedback */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-6 space-y-3 shadow-sm hover:shadow-md transition group">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl text-purple-600 shadow-sm group-hover:scale-110 transition">
            📝
          </div>
          <h3 className="font-bold text-slate-100 text-base">Inline Comments</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Line-anchored review comments with editor highlights, instant resolution toggles, and live broadcast.
          </p>
        </div>

        {/* Card 4: Reputation & Leaderboard */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 space-y-3 shadow-sm hover:shadow-md transition group">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl text-amber-600 shadow-sm group-hover:scale-110 transition">
            🏆
          </div>
          <h3 className="font-bold text-slate-100 text-base">Reputation & Badges</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automated merit recalculation, bounty credit transfers, milestone badges, and live mentor standings.
          </p>
        </div>
      </div>

      {/* API Health & Telemetry Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs font-mono shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 font-sans font-semibold text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>API Telemetry & Services Status</span>
          </span>
          <button
            onClick={checkHealth}
            disabled={loadingHealth}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition cursor-pointer"
          >
            {loadingHealth ? 'Checking...' : 'Check Status'}
          </button>
        </div>
        <pre className="text-indigo-600 overflow-x-auto p-3 bg-slate-950 rounded-xl border border-slate-800">
          {healthData ? JSON.stringify(healthData, null, 2) : 'Loading status...'}
        </pre>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <Link to="/" className="text-sm text-indigo-600 hover:underline">
        &larr; Back to Home
      </Link>
      <h1 className="text-3xl font-bold text-slate-100">About CodeMentor Live</h1>
      <p className="text-slate-400 leading-relaxed">
        CodeMentor Live connects students who are stuck on code with experienced mentors in real-time. Built on the MERN stack with JWT authentication (access & refresh tokens), role-based permissions, and WebSockets.
      </p>
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-200">Phase 2 Scope Completed</h2>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
          <li>User registration with role selection (Student vs. Mentor)</li>
          <li>Login with bcrypt password verification and JWT generation</li>
          <li>Secure httpOnly cookies for access (15m) and refresh (7d) tokens</li>
          <li>Silent token refresh with Axios response interceptors</li>
          <li>Role middleware (student, mentor, admin) and React ProtectedRoute</li>
          <li>Zustand global auth state store with persistent session check</li>
          <li>User profile viewing and updating (/api/users/me)</li>
        </ul>
      </div>
    </div>
  );
}

export default function App() {
  const { fetchMe } = useAuth();

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/requests" element={<Requests />} />
          <Route
            path="/requests/new"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <NewRequest />
              </ProtectedRoute>
            }
          />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/earn"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <EarnTokens />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <TokenMarketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:id"
            element={
              <ProtectedRoute>
                <Session />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <img src="/logo.png" alt="CodeMentor Live" className="w-5 h-5 object-contain" />
        <span>CodeMentor Live &bull; Event: MERNova &bull; Built with MongoDB, Express, React, Node.js</span>
      </footer>
    </div>
  );
}
