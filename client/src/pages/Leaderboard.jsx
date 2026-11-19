import React, { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../api/reviews.js';

const BADGE_CONFIG = {
  'First Review': { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/30', icon: '🌱' },
  'Top Rated': { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/30', icon: '⭐' },
  '10 Reviews': { bg: 'bg-indigo-500/10', text: 'text-indigo-700', border: 'border-indigo-500/30', icon: '🔥' },
  'Mentor Pro': { bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-500/30', icon: '💎' },
  'Master Reviewer': { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/30', icon: '👑' },
};

export default function Leaderboard() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const loadLeaderboard = async (skill = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchLeaderboard({ skill });
      setMentors(data.leaderboard || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(activeFilter);
  }, [activeFilter]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setActiveFilter(skillFilter.trim());
  };

  const clearFilter = () => {
    setSkillFilter('');
    setActiveFilter('');
  };

  const topThree = mentors.slice(0, 3);
  const restMentors = mentors.slice(3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-semibold uppercase tracking-wider">
          <span>🏆</span>
          <span>Community Hall of Fame</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Mentor Leaderboard
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Celebrating our highest-rated code mentors. Earn reputation points, unlock badges, and climb the ranks by delivering exceptional code reviews.
        </p>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:w-72">
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Filter by skill (e.g. React, Node)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          >
            Filter
          </button>
          {activeFilter && (
            <button
              type="button"
              onClick={clearFilter}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl text-sm transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center gap-6 text-xs text-slate-400 self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <span>Reputation Points</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Star Ratings</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Calculating mentor standings...</p>
        </div>
      ) : mentors.length === 0 ? (
        <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3">
          <div className="text-5xl">🎖️</div>
          <h3 className="text-lg font-bold text-slate-100">No Mentors Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            {activeFilter
              ? `No mentors matched the skill "${activeFilter}". Try clearing your filter.`
              : 'Complete live review sessions to see top mentors on the leaderboard!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Rank 2 (Silver) */}
              {topThree[1] && (
                <div className="order-2 md:order-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center relative shadow-sm hover:border-slate-700 transition-all duration-200">
                  <div className="absolute -top-4 w-9 h-9 rounded-full bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center shadow-md">
                    2
                  </div>
                  <div className="w-16 h-16 rounded-full bg-indigo-600 border-2 border-slate-400 overflow-hidden flex items-center justify-center font-bold text-xl text-white mb-3">
                    {topThree[1].avatar ? (
                      <img src={topThree[1].avatar} alt={topThree[1].name} className="w-full h-full object-cover" />
                    ) : (
                      topThree[1].name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{topThree[1].name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{topThree[1].bio || 'Dedicated Code Mentor'}</p>

                  <div className="flex items-center gap-2 my-3">
                    <span className="text-amber-700 font-semibold text-sm">★ {topThree[1].ratingAvg?.toFixed(1) || '0.0'}</span>
                    <span className="text-slate-400 text-xs">({topThree[1].ratingCount || 0} reviews)</span>
                  </div>

                  <div className="w-full pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Reputation</span>
                    <span className="font-bold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg">
                      {topThree[1].reputation || 0} pts
                    </span>
                  </div>

                  {topThree[1].badges?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 justify-center">
                      {topThree[1].badges.slice(0, 3).map((badge) => {
                        const conf = BADGE_CONFIG[badge] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', icon: '🎖️' };
                        return (
                          <span key={badge} className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${conf.bg} ${conf.text} ${conf.border}`}>
                            <span>{conf.icon}</span>
                            <span>{badge}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Rank 1 (Gold Crown) */}
              {topThree[0] && (
                <div className="order-1 md:order-2 bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-7 flex flex-col items-center text-center relative shadow-md -translate-y-2 hover:border-amber-500 transition-all duration-200">
                  <div className="absolute -top-5 w-11 h-11 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-base flex items-center justify-center shadow-md">
                    👑 1
                  </div>
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 border-4 border-amber-400 overflow-hidden flex items-center justify-center font-bold text-2xl text-amber-700 mb-3 shadow-inner">
                    {topThree[0].avatar ? (
                      <img src={topThree[0].avatar} alt={topThree[0].name} className="w-full h-full object-cover" />
                    ) : (
                      topThree[0].name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="inline-block px-2.5 py-0.5 bg-amber-500/10 text-amber-700 font-bold text-xs uppercase tracking-wider rounded-full mb-1">
                    Grand Champion
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-100">{topThree[0].name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{topThree[0].bio || 'Top CodeMentor Veteran'}</p>

                  <div className="flex items-center gap-2 my-3">
                    <span className="text-amber-700 font-bold text-base">★ {topThree[0].ratingAvg?.toFixed(1) || '0.0'}</span>
                    <span className="text-slate-400 text-xs">({topThree[0].ratingCount || 0} reviews)</span>
                  </div>

                  <div className="w-full pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Reputation</span>
                    <span className="font-extrabold text-amber-700 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-xl shadow-sm">
                      {topThree[0].reputation || 0} pts
                    </span>
                  </div>

                  {topThree[0].badges?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                      {topThree[0].badges.map((badge) => {
                        const conf = BADGE_CONFIG[badge] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', icon: '🎖️' };
                        return (
                          <span key={badge} className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${conf.bg} ${conf.text} ${conf.border} font-medium`}>
                            <span>{conf.icon}</span>
                            <span>{badge}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {topThree[2] && (
                <div className="order-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center relative shadow-sm hover:border-slate-700 transition-all duration-200">
                  <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-md">
                    3
                  </div>
                  <div className="w-16 h-16 rounded-full bg-indigo-600 border-2 border-amber-700 overflow-hidden flex items-center justify-center font-bold text-xl text-white mb-3">
                    {topThree[2].avatar ? (
                      <img src={topThree[2].avatar} alt={topThree[2].name} className="w-full h-full object-cover" />
                    ) : (
                      topThree[2].name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{topThree[2].name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{topThree[2].bio || 'Expert Code Mentor'}</p>

                  <div className="flex items-center gap-2 my-3">
                    <span className="text-amber-700 font-semibold text-sm">★ {topThree[2].ratingAvg?.toFixed(1) || '0.0'}</span>
                    <span className="text-slate-400 text-xs">({topThree[2].ratingCount || 0} reviews)</span>
                  </div>

                  <div className="w-full pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Reputation</span>
                    <span className="font-bold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg">
                      {topThree[2].reputation || 0} pts
                    </span>
                  </div>

                  {topThree[2].badges?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 justify-center">
                      {topThree[2].badges.slice(0, 3).map((badge) => {
                        const conf = BADGE_CONFIG[badge] || { bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-600', icon: '🎖️' };
                        return (
                          <span key={badge} className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${conf.bg} ${conf.text} ${conf.border}`}>
                            <span>{conf.icon}</span>
                            <span>{badge}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full Leaderboard Table (Ranks 4+) */}
          {restMentors.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-900 border-b border-slate-800 font-semibold text-slate-300 text-sm">
                Mentors Ranking (Positions 4+)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 w-16">Rank</th>
                      <th className="py-3.5 px-4">Mentor</th>
                      <th className="py-3.5 px-4">Rating</th>
                      <th className="py-3.5 px-4">Reputation</th>
                      <th className="py-3.5 px-4">Badges</th>
                      <th className="py-3.5 px-4">Skills</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {restMentors.map((mentor) => (
                      <tr key={mentor._id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                          #{mentor.rank}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 overflow-hidden flex items-center justify-center font-bold text-xs text-white">
                              {mentor.avatar ? (
                                <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
                              ) : (
                                mentor.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-100">{mentor.name}</p>
                              {mentor.bio && <p className="text-xs text-slate-400 line-clamp-1">{mentor.bio}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-700 font-bold">★ {mentor.ratingAvg?.toFixed(1) || '0.0'}</span>
                            <span className="text-xs text-slate-400">({mentor.ratingCount || 0})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-200 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
                            {mentor.reputation || 0} pts
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {mentor.badges?.map((b) => (
                              <span key={b} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                                {b}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {mentor.skills?.slice(0, 3).map((s) => (
                              <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

