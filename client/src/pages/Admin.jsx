import React, { useState, useEffect } from 'react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  approveMentor,
  updateUserStatus,
} from '../api/admin.js';
import {
  fetchAdminWallets,
  fetchAdminTransactions,
  adjustUserTokens,
  fetchAdminChallenges,
  createAdminChallenge,
  deleteAdminChallenge,
  fetchAdminAssignments,
  createAdminAssignment,
  deleteAdminAssignment,
  fetchAdminAssignmentSubmissions,
  reviewAssignmentSubmission,
  fetchAdminPackages,
  createAdminPackage,
  deleteAdminPackage,
  fetchAdminPayments,
} from '../api/tokens.js';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'tokens' | 'challenges' | 'assignments' | 'packages' | 'payments'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filters & Pagination for Users
  const [roleFilter, setRoleFilter] = useState('all');
  const [approvedFilter, setApprovedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Pending Mentors shortcut list
  const [pendingMentors, setPendingMentors] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  // Token Economy Admin States
  const [adminWallets, setAdminWallets] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [adminChallenges, setAdminChallenges] = useState([]);
  const [adminAssignments, setAdminAssignments] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [adminPackages, setAdminPackages] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);

  // Modals States
  const [adjustModalUser, setAdjustModalUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(50);
  const [adjustAction, setAdjustAction] = useState('credit');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Create Challenge Modal State
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    reward: 5,
    category: 'Algorithms',
    language: 'javascript',
    starterCode: 'function solution(input) {\n  // Your code here\n}',
    testCasesInput: '[[1, 2], 3]\n[[2, 4], 6]',
    testCasesOutput: '3\n6',
  });

  // Create Assignment Modal State
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    instructions: '',
    reward: 15,
    difficulty: 'intermediate',
    category: 'Full Stack',
  });

  // Review Submission Modal State
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Create Package Modal State
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    tokens: 100,
    price: 199,
    currency: 'INR',
    badge: '',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'overview' || activeTab === 'users') {
        const [statsData, usersData, pendingData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminUsers({
            role: roleFilter,
            approved: approvedFilter,
            search: search.trim(),
            page,
            limit: 15,
          }),
          fetchAdminUsers({
            role: 'mentor',
            approved: 'false',
            limit: 10,
          }),
        ]);

        setStats(statsData.stats);
        setUsers(usersData.users || []);
        setTotalPages(usersData.totalPages || 1);
        setTotalUsersCount(usersData.total || 0);
        setPendingMentors(pendingData.users || []);
      } else if (activeTab === 'tokens') {
        const [walletsRes, txRes] = await Promise.all([
          fetchAdminWallets({ search: search.trim(), page, limit: 15 }),
          fetchAdminTransactions({ limit: 20 }),
        ]);
        setAdminWallets(walletsRes.users || []);
        setAdminTransactions(txRes.transactions || []);
      } else if (activeTab === 'challenges') {
        const res = await fetchAdminChallenges();
        setAdminChallenges(res.challenges || []);
      } else if (activeTab === 'assignments') {
        const [asgRes, subRes] = await Promise.all([
          fetchAdminAssignments(),
          fetchAdminAssignmentSubmissions({ limit: 30 }),
        ]);
        setAdminAssignments(asgRes.assignments || []);
        setAssignmentSubmissions(subRes.submissions || []);
      } else if (activeTab === 'packages') {
        const res = await fetchAdminPackages();
        setAdminPackages(res.packages || []);
      } else if (activeTab === 'payments') {
        const res = await fetchAdminPayments({ limit: 30 });
        setAdminPayments(res.orders || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load telemetry or token management records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, roleFilter, approvedFilter, page]);

  const handleApprove = async (mentorId, isApproved) => {
    setProcessingId(mentorId);
    setActionSuccess('');
    setError('');
    try {
      const res = await approveMentor(mentorId, isApproved);
      setActionSuccess(res.message || 'Mentor approval status updated.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update mentor approval.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    setProcessingId(userId);
    try {
      await updateUserStatus(userId, { role: newRole });
      setActionSuccess('User role updated successfully.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setProcessingId(null);
    }
  };

  // Manual Token Adjustment submit
  const handleAdjustTokensSubmit = async (e) => {
    e.preventDefault();
    if (!adjustModalUser || !adjustReason || adjustReason.trim().length < 5) {
      setError('A mandatory audit reason (minimum 5 characters) is required.');
      return;
    }
    setSubmittingAdjust(true);
    setError('');
    setActionSuccess('');
    try {
      const res = await adjustUserTokens({
        userId: adjustModalUser._id,
        amount: Number(adjustAmount),
        action: adjustAction,
        reason: adjustReason.trim(),
      });
      setActionSuccess(res.message);
      setAdjustModalUser(null);
      setAdjustReason('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adjust tokens.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Create Challenge submit
  const handleCreateChallengeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setActionSuccess('');
    try {
      const inputs = newChallenge.testCasesInput.split('\n').filter(Boolean);
      const outputs = newChallenge.testCasesOutput.split('\n').filter(Boolean);
      const testCases = inputs.map((inp, idx) => ({
        input: inp.trim(),
        expectedOutput: outputs[idx] ? outputs[idx].trim() : 'true',
        isHidden: idx >= 2,
      }));

      await createAdminChallenge({
        title: newChallenge.title,
        description: newChallenge.description,
        difficulty: newChallenge.difficulty,
        reward: Number(newChallenge.reward),
        category: newChallenge.category,
        language: newChallenge.language,
        starterCode: newChallenge.starterCode,
        testCases,
      });

      setActionSuccess('Coding challenge created successfully.');
      setShowCreateChallenge(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create challenge.');
    }
  };

  // Delete Challenge
  const handleDeleteChallenge = async (id) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) return;
    try {
      await deleteAdminChallenge(id);
      setActionSuccess('Challenge deleted successfully.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete challenge.');
    }
  };

  // Create Assignment submit
  const handleCreateAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdminAssignment(newAssignment);
      setActionSuccess('Assignment created successfully.');
      setShowCreateAssignment(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment.');
    }
  };

  // Review Assignment Submission
  const handleReviewSubmission = async (status) => {
    if (!reviewingSubmission) return;
    try {
      const res = await reviewAssignmentSubmission(reviewingSubmission._id, {
        status,
        feedback: reviewFeedback,
      });
      setActionSuccess(res.message);
      setReviewingSubmission(null);
      setReviewFeedback('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review submission.');
    }
  };

  // Create Package submit
  const handleCreatePackageSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdminPackage(newPackage);
      setActionSuccess('Token package created.');
      setShowCreatePackage(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create package.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>✦ Platform Telemetry &amp; Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <span>Admin Command Center</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-700 font-mono font-bold">
              ROOT ACCESS
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor real-time telemetry, govern token economies, audit student wallets, and manage challenges.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold">
        {[
          { id: 'overview', label: '📊 Telemetry Overview' },
          { id: 'users', label: '👥 User Directory' },
          { id: 'tokens', label: '🪙 Token Wallets & Audit' },
          { id: 'challenges', label: '⚡ Coding Challenges' },
          { id: 'assignments', label: '📝 Assignments & Reviews' },
          { id: 'packages', label: '📦 Token Packages' },
          { id: 'payments', label: '💳 Payment Records' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`py-2 px-3.5 rounded-xl transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-slate-400">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 text-sm flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-slate-400">✕</button>
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. OVERVIEW TAB */}
      {/* ==================================================== */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Developers</span>
              <div className="text-3xl font-black text-slate-100 mt-2">{stats.users.total}</div>
              <p className="text-xs text-slate-400 mt-1">{stats.users.students} Students &bull; {stats.users.mentors} Mentors</p>
            </div>
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 uppercase font-semibold">Pending Mentors</span>
              <div className="text-3xl font-black text-amber-600 mt-2">{stats.users.pendingMentors}</div>
              <p className="text-xs text-slate-400 mt-1">Require administrator verification</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 uppercase font-semibold">Review Requests</span>
              <div className="text-3xl font-black text-slate-100 mt-2">{stats.requests.total}</div>
              <p className="text-xs text-slate-400 mt-1">{stats.requests.open} Open &bull; {stats.requests.completed} Completed</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 uppercase font-semibold">Live Sessions</span>
              <div className="text-3xl font-black text-slate-100 mt-2">{stats.sessions.total}</div>
              <p className="text-xs text-slate-400 mt-1">{stats.sessions.completed} Finished</p>
            </div>
          </div>

          {/* Pending Mentors Shortcut Queue */}
          {pendingMentors.length > 0 && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>⏳ Pending Mentor Approvals</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700">
                  {pendingMentors.length} Action Needed
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingMentors.map((m) => (
                  <div key={m._id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-200">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100 text-xs">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApprove(m._id, true)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(m._id, false)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. USER DIRECTORY TAB */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">User Directory</h2>
              <p className="text-xs text-slate-400 mt-0.5">{totalUsersCount} registered accounts</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
              <button onClick={() => { setPage(1); loadData(); }} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Tokens</th>
                  <th className="py-3 px-4">Approved</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-950/60 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-100">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-300">{u.role}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">{u.credits ?? 0}🪙</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isApproved ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
                        {u.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setAdjustModalUser(u)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-semibold rounded-lg text-[11px] border border-amber-500/30"
                      >
                        Adjust Tokens
                      </button>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300"
                      >
                        <option value="student">Student</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. TOKEN WALLETS & AUDIT TAB */}
      {/* ==================================================== */}
      {activeTab === 'tokens' && (
        <div className="space-y-8">
          {/* Wallets Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Student &amp; Mentor Wallet Balances</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live token balances and manual governance adjustments</p>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search wallet by email/name..."
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Current Balance</th>
                    <th className="py-3 px-4">Reputation</th>
                    <th className="py-3 px-4 text-right">Manual Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adminWallets.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-950/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-100">{w.name}</p>
                        <p className="text-[11px] text-slate-400">{w.email}</p>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-300 font-semibold">{w.role}</td>
                      <td className="py-3 px-4 font-mono font-black text-amber-600 text-sm">{w.credits ?? 0} tokens</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{w.reputation ?? 0} pts</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setAdjustModalUser(w)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          Manual Adjustment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Audit Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Global Transaction Audit Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Audit Description</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-sans">
                  {adminTransactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-950/60 transition">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {t.user?.name || t.to?.name || 'System / Anonymous'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600">{t.amount} tokens</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-sm truncate">{t.description}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[10px]">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. CODING CHALLENGES TAB */}
      {/* ==================================================== */}
      {activeTab === 'challenges' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Coding Challenges Management</h2>
              <p className="text-xs text-slate-400 mt-0.5">Create and configure algorithmic challenges and reward amounts</p>
            </div>
            <button
              onClick={() => setShowCreateChallenge(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Create New Challenge</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminChallenges.map((ch) => (
              <div key={ch._id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {ch.difficulty} &bull; +{ch.reward}🪙
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{ch.testCases?.length || 0} tests</span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">{ch.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3">{ch.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleDeleteChallenge(ch._id)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Delete Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. ASSIGNMENTS & REVIEWS TAB */}
      {/* ==================================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Active Assignments</h2>
                <p className="text-xs text-slate-400 mt-0.5">Project assignments students can complete for token bounties</p>
              </div>
              <button
                onClick={() => setShowCreateAssignment(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Create Assignment</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {adminAssignments.map((a) => (
                <div key={a._id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-600">+{a.reward} tokens</span>
                    <span className="text-[10px] text-slate-400">{a.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">{a.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{a.instructions}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submissions Review Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Student Assignment Submissions Queue</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Assignment</th>
                    <th className="py-3 px-4">Repo URL</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {assignmentSubmissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-950/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-200">{sub.student?.name}</td>
                      <td className="py-3 px-4 text-slate-300">{sub.assignment?.title}</td>
                      <td className="py-3 px-4 font-mono text-indigo-600">
                        <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          View Code &rarr;
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700' : sub.status === 'REJECTED' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-700'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {sub.status === 'PENDING' ? (
                          <button
                            onClick={() => { setReviewingSubmission(sub); setReviewFeedback(''); }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                          >
                            Review &bull; Approve
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. TOKEN PACKAGES TAB */}
      {/* ==================================================== */}
      {activeTab === 'packages' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Marketplace Token Packages</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configure prices, token quantities, and featured badges</p>
            </div>
            <button
              onClick={() => setShowCreatePackage(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Add Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adminPackages.map((p) => (
              <div key={p._id} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">{p.badge || 'Standard'}</span>
                    <span className="text-xl font-black text-amber-600">{p.tokens} 🪙</span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-base">{p.name}</h3>
                  <p className="text-xs text-slate-400">{p.description}</p>
                  <p className="text-2xl font-black text-slate-200 mt-2">₹{p.price} {p.currency}</p>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button onClick={() => deleteAdminPackage(p._id).then(loadData)} className="text-xs text-red-600 font-semibold cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. PAYMENTS TAB */}
      {/* ==================================================== */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Payment Orders &amp; Gateways Audit</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Tokens</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Razorpay Order ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
                {adminPayments.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-950/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-200">{o.user?.name}</td>
                    <td className="py-3 px-4">{o.package?.name || 'Custom Pack'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">+{o.tokens}🪙</td>
                    <td className="py-3 px-4 font-bold text-slate-100">₹{o.amount} {o.currency}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{o.razorpayOrderId}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'paid' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[10px]">{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: MANUAL TOKEN ADJUSTMENT */}
      {/* ==================================================== */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Manual Wallet Adjustment</h3>
                <p className="text-xs text-slate-400 mt-0.5">Adjusting balance for: {adjustModalUser.name}</p>
              </div>
              <button onClick={() => setAdjustModalUser(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleAdjustTokensSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustAction('credit')}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    adjustAction === 'credit' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  + Credit Tokens
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction('debit')}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    adjustAction === 'debit' ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  - Debit Tokens
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">Token Amount *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Mandatory Audit Reason * (Min 5 chars)
                </label>
                <textarea
                  required
                  rows="3"
                  minLength="5"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Compensation for platform maintenance downtime or bug report reward"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setAdjustModalUser(null)} className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
                >
                  {submittingAdjust ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE CODING CHALLENGE */}
      {/* ==================================================== */}
      {showCreateChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Create Coding Challenge</h3>
              <button onClick={() => setShowCreateChallenge(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleCreateChallengeSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  placeholder="e.g. Binary Search Algorithm"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={newChallenge.difficulty}
                    onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Reward (Tokens)</label>
                  <input
                    type="number"
                    value={newChallenge.reward}
                    onChange={(e) => setNewChallenge({ ...newChallenge, reward: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={newChallenge.category}
                    onChange={(e) => setNewChallenge({ ...newChallenge, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Description *</label>
                <textarea
                  rows="3"
                  required
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                ></textarea>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Starter Code *</label>
                <textarea
                  rows="4"
                  required
                  value={newChallenge.starterCode}
                  onChange={(e) => setNewChallenge({ ...newChallenge, starterCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-[11px]"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateChallenge(false)} className="px-4 py-2 border border-slate-800 rounded-xl text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
                  Publish Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE ASSIGNMENT */}
      {/* ==================================================== */}
      {showCreateAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Create Assignment</h3>
              <button onClick={() => setShowCreateAssignment(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Reward (Tokens)</label>
                  <input
                    type="number"
                    value={newAssignment.reward}
                    onChange={(e) => setNewAssignment({ ...newAssignment, reward: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={newAssignment.category}
                    onChange={(e) => setNewAssignment({ ...newAssignment, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Instructions *</label>
                <textarea
                  rows="4"
                  required
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateAssignment(false)} className="px-4 py-2 border border-slate-800 rounded-xl text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: REVIEW ASSIGNMENT SUBMISSION */}
      {/* ==================================================== */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Review Student Submission</h3>
                <p className="text-slate-400">{reviewingSubmission.student?.name} &bull; {reviewingSubmission.assignment?.title}</p>
              </div>
              <button onClick={() => setReviewingSubmission(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div><strong className="text-slate-400">Repository:</strong> <a href={reviewingSubmission.repoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{reviewingSubmission.repoUrl}</a></div>
              {reviewingSubmission.demoUrl && <div><strong className="text-slate-400">Demo:</strong> <a href={reviewingSubmission.demoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{reviewingSubmission.demoUrl}</a></div>}
              {reviewingSubmission.notes && <div><strong className="text-slate-400">Notes:</strong> <p className="text-slate-300 mt-0.5">{reviewingSubmission.notes}</p></div>}
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Feedback to Student</label>
              <textarea
                rows="3"
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Great clean code structure! Or: Please fix the error handling before approval..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleReviewSubmission('REJECTED')}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl cursor-pointer"
              >
                ✕ Reject Submission
              </button>
              <button
                type="button"
                onClick={() => handleReviewSubmission('APPROVED')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                ✓ Approve &amp; Award +{reviewingSubmission.assignment?.reward || 15}🪙
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE TOKEN PACKAGE */}
      {/* ==================================================== */}
      {showCreatePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Add Token Package</h3>
              <button onClick={() => setShowCreatePackage(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreatePackageSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  placeholder="e.g. Master Developer Bundle"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tokens *</label>
                  <input
                    type="number"
                    required
                    value={newPackage.tokens}
                    onChange={(e) => setNewPackage({ ...newPackage, tokens: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Badge (optional)</label>
                <input
                  type="text"
                  value={newPackage.badge}
                  onChange={(e) => setNewPackage({ ...newPackage, badge: e.target.value })}
                  placeholder="e.g. Most Popular"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreatePackage(false)} className="px-4 py-2 border border-slate-800 rounded-xl text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
