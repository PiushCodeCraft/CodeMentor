import React, { useState, useEffect } from 'react';
import { fetchMentors } from '../api/requests.js';

export default function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [skill, setSkill] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [search, setSearch] = useState('');

  const loadMentors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMentors({
        ...(skill && { skill }),
        ...(availableOnly && { available: 'true' }),
        ...(search && { search }),
      });
      setMentors(data.mentors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load mentors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentors();
  }, [availableOnly]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadMentors();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Mentor Directory</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore experienced developers available to review your code and share guidance.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-md space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mentors by name, bio, or skill..."
            className="flex-grow px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Skill Filter:</span>
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. React, Node, Python"
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-300 font-medium">Available Now Only</span>
          </label>
        </div>
      </div>

      {/* Mentor Cards Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading mentors...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-red-400 text-sm">
          {error}
        </div>
      ) : mentors.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8">
          <div className="text-4xl">🧑‍🏫</div>
          <h3 className="text-lg font-bold text-slate-200">No Mentors Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try adjusting your skill filters or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <div
              key={m._id}
              className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-6 shadow-lg flex flex-col justify-between space-y-4"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                      {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{m.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.isAvailable ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Available
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Offline</span>
                        )}
                        {m.isApproved && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-amber-400 font-bold text-sm">
                      ⭐ {m.ratingAvg ? m.ratingAvg.toFixed(1) : '5.0'}
                    </div>
                    <div className="text-[11px] text-slate-500">{m.ratingCount || 0} reviews</div>
                  </div>
                </div>

                {m.bio && (
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {m.bio}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-3 pt-2 border-t border-slate-700/50">
                {m.skills && m.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-indigo-300 text-[11px] rounded font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Reputation: <strong className="text-indigo-400">{m.reputation || 0} pts</strong></span>
                  <span>{m.badges?.length || 0} badges</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
