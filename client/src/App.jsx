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
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Phase 2: Auth & Role Architecture Live
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
          Code reviews,{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            live in real-time.
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Stuck on bugs or code design? CodeMentor Live connects students with senior developers for live code reviews with shared editor sessions and inline comments.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition text-sm"
            >
              Go to Dashboard ({user?.role}) &rarr;
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition text-sm"
              >
                Get Started &rarr;
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-xl transition text-sm"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 space-y-2">
          <div className="text-2xl">👨‍🎓</div>
          <h3 className="font-bold text-white text-base">Students</h3>
          <p className="text-sm text-slate-400">
            Submit code snippets, get AI pre-review insights, and collaborate live with experienced mentors.
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 space-y-2">
          <div className="text-2xl">🧑‍🏫</div>
          <h3 className="font-bold text-white text-base">Mentors</h3>
          <p className="text-sm text-slate-400">
            Review code, leave line-by-line comments, earn reputation points, and unlock achievements.
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 space-y-2">
          <div className="text-2xl">⚡</div>
          <h3 className="font-bold text-white text-base">Real-Time Core</h3>
          <p className="text-sm text-slate-400">
            Socket.io rooms, Monaco editor synchronization, live chat, and instant notifications.
          </p>
        </div>
      </div>

      {/* Health Monitor */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 text-xs font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-sans font-medium text-sm flex items-center gap-2">
            <span>🩺</span> API Health Check
          </span>
          <button
            onClick={checkHealth}
            disabled={loadingHealth}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition cursor-pointer"
          >
            {loadingHealth ? 'Checking...' : 'Refresh'}
          </button>
        </div>
        <pre className="text-emerald-400 overflow-x-auto p-2 bg-slate-950 rounded">
          {healthData ? JSON.stringify(healthData, null, 2) : 'Loading status...'}
        </pre>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <Link to="/" className="text-sm text-indigo-400 hover:underline">
        &larr; Back to Home
      </Link>
      <h1 className="text-3xl font-bold text-white">About CodeMentor Live</h1>
      <p className="text-slate-300 leading-relaxed">
        CodeMentor Live connects students who are stuck on code with experienced mentors in real-time. Built on the MERN stack with JWT authentication (access & refresh tokens), role-based permissions, and WebSockets.
      </p>
      <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/60 space-y-3">
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
  }, [fetchMe]);

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
        </Routes>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        CodeMentor Live &bull; Event: MERNova &bull; Built with MongoDB, Express, React, Node.js
      </footer>
    </div>
  );
}
