import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createReviewRequest } from '../api/requests.js';
import { useAuth } from '../hooks/useAuth.js';

export default function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [techInput, setTechInput] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [price, setPrice] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !code) {
      setError('Title and Code snippet are required.');
      return;
    }

    if (price > (user?.credits || 0)) {
      setError(`You do not have enough credits. Current balance: ${user?.credits || 0} credits.`);
      return;
    }

    const tech = techInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSubmitting(true);
    try {
      const res = await createReviewRequest({
        title,
        description,
        code,
        repoUrl,
        tech,
        difficulty,
        price: Number(price),
      });

      if (res.request?._id) {
        navigate(`/requests/${res.request._id}`);
      } else {
        navigate('/requests');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <Link to="/requests" className="text-xs text-indigo-400 hover:underline mb-1 inline-block">
            &larr; Back to Requests
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Post Code for Review
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Describe the issue, paste your code snippet, and invite experienced mentors to review it.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs">
          <span className="text-slate-400">Your Wallet:</span>
          <span className="font-bold text-amber-400">🪙 {user?.credits ?? 0}</span>
          <span className="text-slate-500">credits</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Request Title *
          </label>
          <input
            type="text"
            required
            minLength={5}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Memory leak in React custom hook with WebSocket listener"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Tech Stack & Difficulty Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Tech Stack Tags (comma-separated)
            </label>
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="React, TypeScript, WebSocket, Node.js"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Price in Credits & GitHub Repo URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Bounty Offer (Credits)
            </label>
            <input
              type="number"
              min={0}
              max={user?.credits || 100}
              value={price}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value || '0', 10)))}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Offer 0 for free community review or offer credits to attract top mentors faster.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              GitHub Repo Link (optional)
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/project"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Detailed Problem Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what behavior you are observing, what you expected, and what steps you have already tried..."
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-sans"
          />
        </div>

        {/* Code Snippet Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Code Snippet for Review *
            </label>
            <span className="text-xs text-slate-500 font-mono">Monospace syntax viewer</span>
          </div>
          <textarea
            rows={12}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`// Paste your code here...\nfunction handleData(input) {\n  return input.map(item => item.value);\n}`}
            className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            spellCheck="false"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <Link
            to="/requests"
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition text-sm cursor-pointer flex items-center gap-2"
          >
            {submitting ? 'Submitting Request...' : 'Publish Review Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
