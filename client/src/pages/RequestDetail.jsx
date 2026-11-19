import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchRequestById, cancelReviewRequest } from '../api/requests.js';
import { acceptReviewRequest } from '../api/sessions.js';
import { useAuth } from '../hooks/useAuth.js';
import AiPreReviewCard from '../components/AiPreReviewCard.jsx';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRequestById(id);
      setRequest(data.request);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      const res = await acceptReviewRequest(id);
      if (res.session?._id) {
        navigate(`/sessions/${res.session._id}`);
      } else {
        setActionMessage('Request accepted successfully!');
        loadRequest();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept review request.');
    } finally {
      setAccepting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this review request? Any credits offered will be refunded.')) {
      return;
    }

    setCancelling(true);
    setActionMessage('');
    try {
      const res = await cancelReviewRequest(id);
      setActionMessage(res.message || 'Request cancelled successfully.');
      loadRequest();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading request details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
          {error || 'Request not found.'}
        </div>
        <Link to="/requests" className="text-indigo-400 hover:underline text-sm inline-block">
          &larr; Return to Requests Directory
        </Link>
      </div>
    );
  }

  const isOwner = user && request.student && (user._id === request.student._id || user._id === request.student);
  const isMentor = user?.role === 'mentor';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/requests" className="text-sm text-indigo-400 hover:underline flex items-center gap-1">
          &larr; All Review Requests
        </Link>
        <span className="text-xs text-slate-500 font-mono">ID: {request._id}</span>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
          {actionMessage}
        </div>
      )}

      {/* Main Request Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                request.status === 'open'
                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                  : request.status === 'completed'
                  ? 'bg-purple-500/10 text-purple-700 border border-purple-500/30'
                  : request.status === 'cancelled'
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/30'
              }`}
            >
              ● {request.status}
            </span>

            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300 capitalize">
              {request.difficulty} Level
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 font-semibold text-sm">
            <span>🪙</span>
            <span>{request.price > 0 ? `${request.price} credits bounty` : 'Free community review'}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-tight">
          {request.title}
        </h1>

        {/* Tech Tags */}
        {request.tech && request.tech.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {request.tech.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-indigo-300 text-xs rounded-lg font-mono"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Repo Link */}
        {request.repoUrl && (
          <div className="pt-2 text-xs">
            <span className="text-slate-400">GitHub Repository: </span>
            <a
              href={request.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline font-mono"
            >
              {request.repoUrl}
            </a>
          </div>
        )}
      </div>

      {/* Grid: Description & Author info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Description Column */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-100">Problem Description</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {request.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Student / Author Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-100">Submitted By</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {request.student?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-sm">{request.student?.name || 'Student'}</p>
              <p className="text-xs text-slate-400">
                Posted {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {isOwner && request.status === 'open' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Request & Refund Bounty'}
              </button>
            )}

            {isMentor && request.status === 'open' && (
              <div>
                {user?.isApproved ? (
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {accepting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Accepting Request...
                      </>
                    ) : (
                      'Accept Request & Start Session'
                    )}
                  </button>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                    <span className="font-semibold">Pending Approval:</span> Your mentor profile must be approved by an admin before accepting requests.
                  </div>
                )}
              </div>
            )}

            {request.mentor && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-2 text-xs">
                <span className="text-slate-400 font-medium">Assigned Mentor:</span>
                <p className="font-bold text-slate-100 text-sm">{request.mentor.name}</p>
                <p className="text-slate-400">
                  Rating: ⭐ {request.mentor.ratingAvg?.toFixed(1) || '5.0'} &bull; {request.mentor.reputation || 0} pts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400">Submitted Code Snippet</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {request.code ? `${request.code.split('\n').length} lines` : '0 lines'}
          </span>
        </div>
        <div className="p-6 font-mono text-xs overflow-x-auto leading-relaxed text-emerald-300 bg-slate-950/70">
          <pre>{request.code}</pre>
        </div>
      </div>

      {/* AI Pre-Review Assistant Card (Phase 8) */}
      <AiPreReviewCard
        requestId={request._id}
        aiSummary={request.aiSummary}
        onAiSummaryUpdated={(summary) =>
          setRequest((prev) => (prev ? { ...prev, aiSummary: summary } : prev))
        }
        isMentor={isMentor}
      />
    </div>
  );
}
