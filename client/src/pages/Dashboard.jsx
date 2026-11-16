import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { fetchMySessions } from '../api/sessions.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      setLoadingSessions(true);
      try {
        const data = await fetchMySessions();
        setSessions(data.sessions || []);
      } catch {
        // Ignore session loading error in background
      } finally {
        setLoadingSessions(false);
      }
    };
    loadSessions();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.name}!
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                user?.role === 'mentor'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : user?.role === 'admin'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {user?.role === 'mentor'
              ? 'Browse open code review requests from students and share your expertise.'
              : 'Post your code, get live feedback from experienced mentors, and resolve comments in real-time.'}
          </p>
        </div>

        {/* Quick Profile Snapshot */}
        <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 px-4 py-3 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-200">{user?.email}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Member since:</span>
              <span className="font-mono text-slate-300">
                {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {user?.role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Credits Balance</span>
              <span className="text-amber-400 text-xl">🪙</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{user?.credits ?? 0}</div>
            <p className="text-xs text-slate-400 mt-2">
              Use credits to post code review requests.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Reviews Completed</span>
              <span className="text-indigo-400 text-xl">📝</span>
            </div>
            <div className="text-3xl font-extrabold text-white">0</div>
            <p className="text-xs text-slate-400 mt-2">
              Saved reviews will be accessible in Phase 3.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Account Status</span>
              <span className="text-emerald-400 text-xl">✅</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">Active Student</div>
            <p className="text-xs text-slate-400 mt-2">
              Ready to create requests and join live sessions.
            </p>
          </div>
        </div>
      )}

      {user?.role === 'mentor' && (
        <div className="space-y-6">
          {/* Mentor Approval Banner */}
          {!user?.isApproved ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <h3 className="font-semibold text-amber-300 text-sm">
                    Profile Pending Admin Approval
                  </h3>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    Your profile is currently under review by our administrators. You will be able to accept student requests as soon as your profile is approved.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
              <span className="text-xl text-emerald-400">✅</span>
              <div>
                <h3 className="font-semibold text-emerald-300 text-sm">Verified Mentor</h3>
                <p className="text-xs text-emerald-200/80">
                  Your profile is active and visible to students.
                </p>
              </div>
            </div>
          )}

          {/* Mentor Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <span className="text-slate-400 text-sm font-medium">Rating</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                ⭐ {user?.ratingAvg ? user.ratingAvg.toFixed(1) : '5.0'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Based on {user?.ratingCount || 0} reviews
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <span className="text-slate-400 text-sm font-medium">Reputation</span>
              <div className="text-3xl font-extrabold text-indigo-400 mt-1">
                {user?.reputation ?? 0} <span className="text-sm font-normal text-slate-400">pts</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Earned through quality reviews</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <span className="text-slate-400 text-sm font-medium">Credits Earned</span>
              <div className="text-3xl font-extrabold text-amber-400 mt-1">
                {user?.credits ?? 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total reward credits</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <span className="text-slate-400 text-sm font-medium">Badges</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                {user?.badges?.length || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Achievements unlocked</p>
            </div>
          </div>

          {/* Skills section */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-3">Your Tech Skills</h3>
            {user?.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-900 border border-slate-700 text-indigo-300 text-xs rounded-lg font-mono font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No skills listed yet.{' '}
                <Link to="/profile" className="text-indigo-400 underline">
                  Add your skills in your profile
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active Sessions Section */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <h2 className="text-lg font-bold text-white">Your Collaboration Sessions</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingSessions ? (
          <p className="text-sm text-slate-400 py-4">Checking active sessions...</p>
        ) : sessions.length === 0 ? (
          <div className="p-6 bg-slate-900/60 rounded-xl border border-slate-800 text-center space-y-2">
            <p className="text-sm text-slate-300">No active collaboration sessions right now.</p>
            <p className="text-xs text-slate-500">
              {user?.role === 'mentor'
                ? 'Browse open student requests and accept one to start reviewing!'
                : 'Post a review request and a mentor will accept it to start a live session.'}
            </p>
            <div className="pt-2">
              <Link
                to="/requests"
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
              >
                Browse Requests Directory &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <div
                key={s._id}
                className="bg-slate-900/80 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl p-4 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      ● {s.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">
                    {s.request?.title || 'Review Session'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Partner:{' '}
                    <span className="text-slate-200 font-medium">
                      {user?.role === 'mentor' ? s.student?.name : s.mentor?.name}
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">ID: #{s._id.slice(-6)}</span>
                  <Link
                    to={`/sessions/${s._id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                  >
                    Open Session &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase Roadmap Card */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-200 mb-2">Phase 4 Accept Flow Completed</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Mentors can accept open student requests via atomic updates that prevent double-acceptance. Sessions and in-app notifications are created automatically, allowing both student and mentor to view their collaboration session.
        </p>
      </div>
    </div>
  );
}

