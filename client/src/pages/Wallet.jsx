import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyWallet, fetchMyTransactions } from '../api/tokens.js';
import { useAuth } from '../hooks/useAuth.js';
import useSocket from '../hooks/useSocket.js';

export default function Wallet() {
  const { user, updateCredits } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalTx, setTotalTx] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { socket, isConnected } = useSocket(Boolean(user?.role === 'student'));

  const loadWalletData = async () => {
    setLoading(true);
    setError('');
    try {
      const [walletRes, txRes] = await Promise.all([
        fetchMyWallet(),
        fetchMyTransactions({ type: filterType, page, limit: 12 }),
      ]);
      setWallet(walletRes.wallet);
      setTransactions(txRes.transactions || []);
      setTotalTx(txRes.total || 0);
      setTotalPages(txRes.totalPages || 1);

      // Silently update user credits in global store without triggering route reload
      const balance = walletRes.availableBalance ?? walletRes.credits ?? walletRes.wallet?.availableBalance ?? walletRes.wallet?.balance ?? walletRes.wallet?.currentBalance;
      if (typeof balance === 'number') {
        updateCredits(balance);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [page, filterType]);

  // Real-time synchronization for wallet updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleWalletUpdate = () => {
      loadWalletData();
    };
    socket.on('wallet:update', handleWalletUpdate);
    return () => {
      socket.off('wallet:update', handleWalletUpdate);
    };
  }, [socket, isConnected]);

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'REGISTRATION_BONUS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">Welcome Bonus</span>;
      case 'PURCHASE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">Purchased</span>;
      case 'CODING_CHALLENGE_REWARD':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">Challenge</span>;
      case 'ASSIGNMENT_REWARD':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-700 border border-cyan-500/20">Assignment</span>;
      case 'LEARNING_TASK_REWARD':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 border border-purple-500/20">Task</span>;
      case 'ACHIEVEMENT_REWARD':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">Milestone</span>;
      case 'SESSION_USAGE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">Bounty / Spent</span>;
      case 'ADMIN_CREDIT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">Admin Credit</span>;
      case 'ADMIN_DEBIT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">Admin Debit</span>;
      case 'REFUND':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">Refund</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{type}</span>;
    }
  };

  const isCreditTx = (tx) => {
    return [
      'REGISTRATION_BONUS',
      'PURCHASE',
      'CODING_CHALLENGE_REWARD',
      'ASSIGNMENT_REWARD',
      'LEARNING_TASK_REWARD',
      'ACHIEVEMENT_REWARD',
      'bounty_payout',
      'ADMIN_CREDIT',
      'reward_bonus',
      'REFUND',
    ].includes(tx.type);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>🪙</span>
            <span>Developer Token Economy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Token Wallet &amp; Treasury
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track token rewards, view verified earnings, and manage your compute credits balance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/earn"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <span>⚡</span>
            <span>Earn Free Tokens</span>
          </Link>
          <Link
            to="/marketplace"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <span>💳</span>
            <span>Buy Tokens</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance Card */}
        <div className="relative overflow-hidden bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Available Balance</span>
            <span className="text-xl">🪙</span>
          </div>
          <div className="text-4xl font-black text-amber-600">
            {wallet?.balance ?? user?.credits ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Ready to spend on review requests &amp; live mentoring sessions.
          </p>
        </div>

        {/* Total Earned Card */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Earned</span>
            <span className="text-xl">⚡</span>
          </div>
          <div className="text-4xl font-black text-emerald-600">
            {wallet?.totalEarned ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Earned from challenges, assignments, and onboarding milestones.
          </p>
        </div>

        {/* Total Purchased Card */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Purchased</span>
            <span className="text-xl">💳</span>
          </div>
          <div className="text-4xl font-black text-indigo-600">
            {wallet?.totalPurchased ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Purchased via secure payment packages in marketplace.
          </p>
        </div>

        {/* Total Spent Card */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Spent</span>
            <span className="text-xl">📊</span>
          </div>
          <div className="text-4xl font-black text-slate-300">
            {wallet?.totalSpent ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Allocated to code review bounties and mentor evaluations.
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Transaction History</span>
              <span className="text-xs font-normal text-slate-400">({totalTx} records)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete audit ledger of all token credits, rewards, purchases, and bounties.
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Transactions</option>
              <option value="REGISTRATION_BONUS">Registration Bonus</option>
              <option value="PURCHASE">Purchases</option>
              <option value="CODING_CHALLENGE_REWARD">Challenge Rewards</option>
              <option value="ASSIGNMENT_REWARD">Assignment Rewards</option>
              <option value="LEARNING_TASK_REWARD">Task Rewards</option>
              <option value="ACHIEVEMENT_REWARD">Achievements</option>
              <option value="SESSION_USAGE">Bounty / Usage</option>
              <option value="ADMIN_CREDIT">Admin Credits</option>
              <option value="ADMIN_DEBIT">Admin Debits</option>
              <option value="REFUND">Refunds</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Loading ledger records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-950 rounded-2xl border border-slate-800 p-8">
            <div className="text-3xl">📜</div>
            <h3 className="text-sm font-bold text-slate-200">No Transactions Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't made any transactions matching this category yet. Start solving challenges or claim tasks to earn tokens!
            </p>
            <Link
              to="/earn"
              className="inline-block mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              Start Earning Tokens &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Transaction / Reason</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
                {transactions.map((tx) => {
                  const credit = isCreditTx(tx);
                  return (
                    <tr key={tx._id} className="hover:bg-slate-950/60 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-200 max-w-xs truncate">
                        {tx.description || tx.type}
                      </td>
                      <td className="py-3.5 px-4">{getTransactionBadge(tx.type)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={credit ? 'text-emerald-600' : 'text-red-600'}>
                          {credit ? `+${tx.amount}` : `-${tx.amount}`} tokens
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {tx.newBalance !== undefined ? `${tx.newBalance} tokens` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Page <strong className="text-slate-100">{page}</strong> of{' '}
              <strong className="text-slate-100">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg transition cursor-pointer"
              >
                &larr; Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg transition cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
