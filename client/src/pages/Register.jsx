import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function Register() {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [bio, setBio] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
    clearError();
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!name || !email || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setSubmitting(true);
    const result = await register({
      name,
      email,
      password,
      role,
      skills,
      bio,
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link to="/" className="w-14 h-14 rounded-2xl bg-white p-2 shadow-md hover:scale-105 transition flex items-center justify-center" title="CodeMentor Home">
              <img src="/logo.png" alt="CodeMentor Logo" className="w-full h-full object-contain" />
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Join CodeMentor Live as a Student seeking reviews or a Mentor helping others.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-3 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition cursor-pointer flex flex-col items-center gap-0.5 ${
              role === 'student'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <span>👨‍🎓 Student</span>
            <span className="text-[11px] font-normal opacity-90">Get code reviews</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('mentor')}
            className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition cursor-pointer flex flex-col items-center gap-0.5 ${
              role === 'mentor'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <span>🧑‍🏫 Mentor</span>
            <span className="text-[11px] font-normal opacity-90">Review & earn reputation</span>
          </button>
        </div>

        {(localError || error) && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-sm">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password (min. 6 characters) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Mentor specific fields */}
          {role === 'mentor' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1.5">
                  Technical Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, Node.js, TypeScript, Python, Docker"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1.5">
                  Short Bio / Experience
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Senior software engineer with 5 years experience building scalable web applications."
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-700">
                ℹ️ Mentor profiles undergo admin approval before appearing in public listings.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 font-semibold rounded-xl text-white shadow-md transition text-sm flex items-center justify-center gap-2 cursor-pointer mt-4 ${
              role === 'mentor'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              `Register as ${role === 'mentor' ? 'Mentor' : 'Student'}`
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400 border-t border-slate-800 pt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

