import React from 'react';
import { Link } from 'react-router-dom';

export default function RequestCard({ request }) {
  const {
    _id,
    title,
    description,
    tech,
    difficulty,
    price,
    status,
    student,
    createdAt,
    aiSummary,
  } = request;

  const getDifficultyBadge = (level) => {
    switch (level) {
      case 'advanced':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
            Advanced
          </span>
        );
      case 'intermediate':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Intermediate
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Beginner
          </span>
        );
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'open':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ● Open
          </span>
        );
      case 'accepted':
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            ● In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            ✓ Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-700">
            ✕ Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700/70 hover:border-indigo-500/50 rounded-xl p-5 shadow-lg transition duration-200 flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(status)}
            {getDifficultyBadge(difficulty)}
            {aiSummary && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span>✨</span>
                <span>AI Ready</span>
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
            <span>🪙</span>
            <span>{price > 0 ? `${price} credits` : 'Free'}</span>
          </div>
        </div>

        <Link
          to={`/requests/${_id}`}
          className="block text-lg font-bold text-white hover:text-indigo-400 transition line-clamp-1"
        >
          {title}
        </Link>

        {description && (
          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Tech Tags */}
      {tech && tech.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tech.map((t, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-slate-900/90 border border-slate-700/80 text-indigo-300 text-[11px] rounded font-mono"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer: Student Info & View Button */}
      <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-[10px]">
            {student?.name ? student.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <span className="font-medium text-slate-300">{student?.name || 'Anonymous'}</span>
          <span className="text-slate-600">&bull;</span>
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>

        <Link
          to={`/requests/${_id}`}
          className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center gap-1"
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
}
