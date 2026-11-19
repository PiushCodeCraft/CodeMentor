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
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-700 border border-red-500/30">
            Advanced
          </span>
        );
      case 'intermediate':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/30">
            Intermediate
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
            Beginner
          </span>
        );
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'open':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
            ● Open
          </span>
        );
      case 'accepted':
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-500/30">
            ● In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 border border-purple-500/30">
            ✓ Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            ✕ Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(status)}
            {getDifficultyBadge(difficulty)}
            {aiSummary && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-700 border border-cyan-500/25 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse"></span>
                <span>✦ AI Scanned</span>
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
            <span>🪙</span>
            <span>{price > 0 ? `${price} credits` : 'Free'}</span>
          </div>
        </div>

        <Link
          to={`/requests/${_id}`}
          className="block text-lg font-bold text-slate-100 hover:text-indigo-600 transition line-clamp-1"
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
              className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-indigo-700 text-[11px] rounded font-mono font-medium"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer: Student Info & View Button */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px]">
            {student?.name ? student.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <span className="font-medium text-slate-300">{student?.name || 'Anonymous'}</span>
          <span className="text-slate-400">&bull;</span>
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>

        <Link
          to={`/requests/${_id}`}
          className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline flex items-center gap-1"
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
}
