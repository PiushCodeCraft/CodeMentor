import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setSkillsInput(user.skills ? user.skills.join(', ') : '');
      setAvatar(user.avatar || '');
      setIsAvailable(user.isAvailable !== undefined ? user.isAvailable : true);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setSaving(true);

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const result = await updateProfile({
      name,
      bio,
      skills,
      avatar,
      isAvailable,
    });
    setSaving(false);

    if (result.success) {
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal details, expertise, and account preferences.
        </p>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Account Info Readonly Card */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-500">Email Address</span>
          <p className="text-sm font-medium text-slate-200 mt-1">{user?.email}</p>
        </div>
        <div>
          <span className="text-xs uppercase font-semibold text-slate-500">Role</span>
          <p className="text-sm font-medium text-indigo-400 capitalize mt-1">{user?.role}</p>
        </div>
        <div>
          <span className="text-xs uppercase font-semibold text-slate-500">Wallet Balance</span>
          <p className="text-sm font-medium text-amber-400 mt-1">🪙 {user?.credits ?? 0} credits</p>
        </div>
      </div>

      {/* Mentor Reputation & Badges Card */}
      {user?.role === 'mentor' && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🏆</span>
              <span>Mentor Reputation & Achievements</span>
            </h3>
            <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              Phase 7 Live
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">Reputation Points</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{user?.reputation ?? 0} pts</p>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">Average Rating</span>
              <p className="text-2xl font-black text-white mt-1">
                ★ {user?.ratingAvg ? user.ratingAvg.toFixed(1) : '0.0'}
              </p>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">Completed Reviews</span>
              <p className="text-2xl font-black text-slate-200 mt-1">{user?.ratingCount ?? 0}</p>
            </div>
          </div>

          {user?.badges?.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Unlocked Badges
              </span>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                  >
                    <span>🎖️</span>
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl backdrop-blur"
      >
        <h2 className="text-lg font-semibold text-white border-b border-slate-700/60 pb-3">
          Edit Profile Information
        </h2>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Bio / About You
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other students and mentors about your background and interests..."
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Technical Skills (comma-separated)
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="React, Node.js, Express, MongoDB, Tailwind, Python"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Mentors with relevant skills are notified when students post matching review requests.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Avatar URL (optional)
          </label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {user?.role === 'mentor' && (
          <div className="p-4 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-white">Mentor Availability Status</span>
              <span className="text-xs text-slate-400">
                When active, your profile is marked available for review sessions.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition text-sm cursor-pointer"
          >
            {saving ? 'Saving changes...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

