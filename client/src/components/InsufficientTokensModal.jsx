import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function InsufficientTokensModal({
  isOpen,
  onClose,
  currentBalance = 0,
  requiredAmount = 0,
  featureName = 'post this code review request',
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const deficit = Math.max(0, requiredAmount - currentBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl text-amber-600 shadow-sm">
            🪙
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-100 tracking-tight">
            Insufficient Token Balance
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You need <strong className="text-amber-600 font-bold">{requiredAmount} tokens</strong> to {featureName}, but your wallet currently holds <strong className="text-slate-200 font-bold">{currentBalance} tokens</strong>.
          </p>
        </div>

        {/* Balance Metric Breakdown */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Your Wallet</span>
            <span className="text-lg font-black text-slate-200 mt-0.5 block">
              {currentBalance} <span className="text-xs font-normal text-slate-500">tokens</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Shortfall</span>
            <span className="text-lg font-black text-red-600 mt-0.5 block">
              +{deficit} <span className="text-xs font-normal text-slate-500">needed</span>
            </span>
          </div>
        </div>

        {/* Free Learning Assurance */}
        <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-[11px] text-slate-300 flex items-center gap-2">
          <span className="text-indigo-600 text-base">✦</span>
          <span>
            You never have to stop learning! Earn free tokens anytime by solving coding challenges and submitting assignments.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={() => {
              onClose();
              navigate('/earn');
            }}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>⚡</span>
            <span>Earn Free Tokens (Challenges & Tasks)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              navigate('/marketplace');
            }}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>💳</span>
            <span>Purchase Token Packages</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition cursor-pointer"
          >
            Continue with Free Review (0 Bounty)
          </button>
        </div>
      </div>
    </div>
  );
}
