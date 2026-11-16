import React, { useState } from 'react';
import { triggerAiReview } from '../api/requests.js';

export default function AiPreReviewCard({
  requestId,
  aiSummary: initialAiSummary,
  onAiSummaryUpdated,
  isMentor = false,
}) {
  const [aiSummary, setAiSummary] = useState(initialAiSummary || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync with prop if it changes
  React.useEffect(() => {
    if (initialAiSummary) {
      setAiSummary(initialAiSummary);
    }
  }, [initialAiSummary]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await triggerAiReview(requestId);
      setAiSummary(data.aiSummary || '');
      if (onAiSummaryUpdated) {
        onAiSummaryUpdated(data.aiSummary);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to generate AI pre-review.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-base shadow-md shadow-indigo-500/30">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                AI Pre-Review Assistant
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Phase 8
              </span>
            </div>
            <p className="text-xs text-indigo-300/80">
              Automated first-pass scan of bugs, security risks, and optimization opportunities.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {aiSummary && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              title="Copy markdown to clipboard"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>{aiSummary ? 'Re-Analyze Code' : 'Generate AI Review'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Loading state skeleton */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin"></div>
          <p className="text-xs text-indigo-300 font-medium animate-pulse">
            Inspecting syntax tree, runtime anti-patterns, and security concerns...
          </p>
        </div>
      ) : aiSummary ? (
        /* Structured Markdown Display */
        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 font-sans whitespace-pre-wrap selection:bg-indigo-500/30">
          {aiSummary}
        </div>
      ) : (
        /* Empty callout */
        <div className="py-6 text-center space-y-2 bg-slate-950/40 rounded-xl border border-slate-800/60 p-4">
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No AI pre-review generated for this request yet. Mentors and students can click below to run an automated inspection.
          </p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <span>🤖</span>
            <span>Run First-Pass AI Code Review</span>
          </button>
        </div>
      )}

      {aiSummary && (
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Saves mentors time and gives students immediate guidance before the live session.</span>
          <span className="text-indigo-400 font-medium">Ready for live review</span>
        </div>
      )}
    </div>
  );
}

