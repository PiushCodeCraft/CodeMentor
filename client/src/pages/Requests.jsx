import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchRequests } from '../api/requests.js';
import RequestCard from '../components/RequestCard.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Requests() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [tech, setTech] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('open');
  const [onlyMine, setOnlyMine] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 9,
        status,
        ...(search && { search }),
        ...(tech && { tech }),
        ...(difficulty && { difficulty }),
        ...(onlyMine && { student: 'me' }),
      };

      const data = await fetchRequests(params);
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [page, status, difficulty, tech, onlyMine]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadRequests();
  };

  const handleClearFilters = () => {
    setSearch('');
    setTech('');
    setDifficulty('');
    setStatus('open');
    setOnlyMine(false);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Review Requests
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse requests submitted by students or post your own code snippet for review.
          </p>
        </div>

        {user?.role === 'student' && (
          <Link
            to="/requests/new"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
          >
            <span>+</span> Post New Request
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description..."
            className="flex-grow px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="open">Open</option>
              <option value="all">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Difficulty filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Difficulty:</span>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Tech stack filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Tech:</span>
            <input
              type="text"
              value={tech}
              onChange={(e) => {
                setTech(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. React, Node, Python"
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36"
            />
          </div>

          {/* Student "My requests only" toggle */}
          {user?.role === 'student' && (
            <label className="flex items-center gap-2 cursor-pointer ml-auto bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => {
                  setOnlyMine(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-300 font-medium">My Requests Only</span>
            </label>
          )}

          {(search || tech || difficulty || status !== 'open' || onlyMine) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline ml-2 cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading review requests...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-red-400 text-sm">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="text-4xl">📂</div>
          <h3 className="text-lg font-bold text-slate-100">No Review Requests Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {onlyMine
              ? "You haven't posted any review requests yet. Create your first request to get feedback from mentors!"
              : 'There are currently no requests matching your active filter criteria.'}
          </p>
          {user?.role === 'student' && (
            <Link
              to="/requests/new"
              className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              Create Review Request
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <RequestCard key={req._id} request={req} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-800 text-sm text-slate-400">
          <span>
            Showing page <strong className="text-slate-100">{page}</strong> of{' '}
            <strong className="text-slate-100">{totalPages}</strong> ({total} total requests)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              &larr; Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
