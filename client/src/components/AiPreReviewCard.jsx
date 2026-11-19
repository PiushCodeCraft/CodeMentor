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
    <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base font-black shadow-sm">
            ✦
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-1.5">
                <span>AI Pre-Review Assistant</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-700 border border-cyan-500/25">
                NEURAL SCAN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated first-pass scan of bugs, security risks, and optimization opportunities.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {aiSummary && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Copy markdown to clipboard"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
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
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Loading state skeleton */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs text-indigo-600 font-medium animate-pulse">
            Inspecting syntax tree, runtime anti-patterns, and security concerns...
          </p>
        </div>
      ) : aiSummary ? (
        /* Structured Markdown Display */
        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 bg-slate-950 p-5 rounded-xl border border-slate-800 font-sans whitespace-pre-wrap selection:bg-indigo-500/20">
          {aiSummary}
        </div>
      ) : (
        /* Empty callout */
        <div className="py-6 text-center space-y-2 bg-slate-950 rounded-xl border border-slate-800 p-4">
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No AI pre-review generated for this request yet. Mentors and students can click below to run an automated inspection.
          </p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <span>🤖</span>
            <span>Run First-Pass AI Code Review</span>
          </button>
        </div>
      )}

      {aiSummary && (
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Saves mentors time and gives students immediate guidance before the live session.</span>
          <span className="text-indigo-600 font-medium">Ready for live review</span>
        </div>
      )}
    </div>
  );
}

