import React, { useState, useMemo } from 'react';
import { triggerAiReview } from '../api/requests.js';

/**
 * Utility to parse AI markdown summary into structured sections
 */
function parseSummary(markdown = '') {
  if (!markdown) {
    return { bugs: [], risks: [], improvements: [], context: '', raw: '' };
  }

  const lines = markdown.split('\n');
  let currentSection = 'intro';
  const bugs = [];
  const risks = [];
  const improvements = [];
  let context = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes('Potential Bugs') || line.includes('Bugs & Issues')) {
      currentSection = 'bugs';
      continue;
    } else if (line.includes('Risks & Edge Cases') || line.includes('Risks')) {
      currentSection = 'risks';
      continue;
    } else if (line.includes('Recommended Improvements') || line.includes('Improvements')) {
      currentSection = 'improvements';
      continue;
    } else if (line.startsWith('**Context**:')) {
      context = line.replace('**Context**:', '').trim();
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const item = line.substring(2).trim();
      if (currentSection === 'bugs') bugs.push(item);
      else if (currentSection === 'risks') risks.push(item);
      else if (currentSection === 'improvements') improvements.push(item);
    }
  }

  return {
    context,
    bugs,
    risks,
    improvements,
    raw: markdown,
  };
}

/**
 * Render inline markdown code spans (`code`) as styled pills
 */
function FormattedItem({ text }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 bg-slate-800 text-indigo-600 rounded text-[11px] font-mono border border-slate-700 font-semibold"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'raw'

  // Sync with prop if it changes
  React.useEffect(() => {
    if (initialAiSummary) {
      setAiSummary(initialAiSummary);
    }
  }, [initialAiSummary]);

  const parsed = useMemo(() => parseSummary(aiSummary), [aiSummary]);

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

  const hasStructuredContent =
    parsed.bugs.length > 0 ||
    parsed.risks.length > 0 ||
    parsed.improvements.length > 0;

  return (
    <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 animate-fade-in">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-600 text-lg font-black shadow-sm">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-1.5">
                <span>AI Pre-Review Assistant</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-700 border border-cyan-500/25">
                NEURAL CODE SCAN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated first-pass scan of syntax bugs, edge case risks, and optimization opportunities.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {aiSummary && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'raw'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Markdown
              </button>
            </div>
          )}

          {aiSummary && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Copy markdown to clipboard"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
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
                <span>Analyzing Code...</span>
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
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-9 h-9 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs text-indigo-600 font-semibold animate-pulse">
            Analyzing abstract syntax tree, checking reactive closures &amp; security boundaries...
          </p>
        </div>
      ) : aiSummary ? (
        viewMode === 'cards' && hasStructuredContent ? (
          /* Structured Cards View */
          <div className="space-y-4">
            {/* Stat Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {parsed.bugs.length > 0 && (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-red-500/10 text-red-700 border border-red-500/20 flex items-center gap-1.5">
                  <span>🐛</span>
                  <span>{parsed.bugs.length} {parsed.bugs.length === 1 ? 'Potential Issue' : 'Potential Issues'}</span>
                </span>
              )}
              {parsed.risks.length > 0 && (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{parsed.risks.length} Risk Factors</span>
                </span>
              )}
              {parsed.improvements.length > 0 && (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>{parsed.improvements.length} Optimization Tips</span>
                </span>
              )}
            </div>

            {/* 1. Bugs Card */}
            {parsed.bugs.length > 0 && (
              <div className="bg-slate-950 border border-red-500/20 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  <span>Potential Bugs &amp; Syntax Issues</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                  {parsed.bugs.map((bug, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">
                        <FormattedItem text={bug} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 2. Risks Card */}
            {parsed.risks.length > 0 && (
              <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span>Risks &amp; Edge Cases</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                  {parsed.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">
                        <FormattedItem text={risk} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. Improvements Card */}
            {parsed.improvements.length > 0 && (
              <div className="bg-slate-950 border border-indigo-500/20 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>Recommended Improvements</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                  {parsed.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">
                        <FormattedItem text={imp} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* Raw Markdown View Fallback */
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800 font-sans whitespace-pre-wrap selection:bg-indigo-500/20">
            {aiSummary}
          </div>
        )
      ) : (
        /* Empty callout */
        <div className="py-8 text-center space-y-3 bg-slate-950 rounded-2xl border border-slate-800 p-6">
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No AI pre-review generated for this request yet. Mentors and students can run an automated inspection anytime.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <span>🤖</span>
            <span>Run First-Pass AI Code Review</span>
          </button>
        </div>
      )}

      {aiSummary && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800">
          <span>Saves mentors time and gives students immediate guidance before the live session.</span>
          <span className="text-indigo-600 font-semibold flex items-center gap-1">
            <span>✓</span> Ready for live session review
          </span>
        </div>
      )}
    </div>
  );
}
