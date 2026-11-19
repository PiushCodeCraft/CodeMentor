import React, { useState, useEffect } from 'react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  approveMentor,
  updateUserStatus,
} from '../api/admin.js';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filters & Pagination
  const [roleFilter, setRoleFilter] = useState('all');
  const [approvedFilter, setApprovedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Pending Mentors shortcut list
  const [pendingMentors, setPendingMentors] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, approvedFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleApprove = async (mentorId, isApproved) => {
    setProcessingId(mentorId);
    setActionSuccess('');
    setError('');
    try {
      const res = await approveMentor(mentorId, isApproved);
      setActionSuccess(res.message || 'Mentor approval status updated.');
      // Refresh current data
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>✦ Platform Telemetry & Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <span>Admin Command Center</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-700 font-mono font-bold">
              ROOT ACCESS
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor real-time platform telemetry, approve developer mentors, and manage permissions across CodeMentor Live.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 text-sm flex items-center gap-2">
          <span>✓</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Telemetry Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Total Developers</span>
              <span className="text-lg">👥</span>
            </div>
            <div className="text-3xl font-black text-slate-100 group-hover:text-indigo-600 transition">
              {stats.users.total}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex gap-3">
              <span>{stats.users.students} Students</span>
              <span>&bull;</span>
              <span className="text-indigo-600 font-semibold">{stats.users.mentors} Mentors</span>
            </div>
          </div>

          {/* Pending Mentor Approvals */}
          <div className={`relative overflow-hidden bg-slate-900 border rounded-2xl p-5 shadow-sm transition group ${
            stats.users.pendingMentors > 0
              ? 'border-amber-500/50'
              : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Pending Mentors</span>
              <span className="text-lg">⏳</span>
            </div>
            <div className={`text-3xl font-black ${
              stats.users.pendingMentors > 0 ? 'text-amber-700 animate-pulse' : 'text-slate-200'
            }`}>
              {stats.users.pendingMentors}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {stats.users.pendingMentors > 0
                ? 'Requires admin verification below'
                : 'All mentor applicants reviewed'}
            </div>
          </div>

          {/* Review Requests */}
          <div className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Review Requests</span>
              <span className="text-lg">⚡</span>
            </div>
            <div className="text-3xl font-black text-slate-100 group-hover:text-indigo-600 transition">
              {stats.requests.total}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex gap-3">
              <span className="text-emerald-700 font-semibold">{stats.requests.open} Open</span>
              <span>&bull;</span>
              <span>{stats.requests.completed} Completed</span>
            </div>
          </div>

          {/* Live Sessions & Reviews */}
          <div className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Collaborations</span>
              <span className="text-lg">🚀</span>
            </div>
            <div className="text-3xl font-black text-slate-100 group-hover:text-indigo-600 transition">
              {stats.sessions.total}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex gap-3">
              <span>{stats.sessions.completed} Finished</span>
              <span>&bull;</span>
              <span className="text-amber-700 font-semibold">{stats.reviews.total} Reviews</span>
            </div>
          </div>
        </div>
      )}

      {/* Pending Mentor Applications Queue */}
      {pendingMentors.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-sm border border-amber-500/30">
                !
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Pending Mentor Approvals Queue</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-700 border border-amber-500/30">
                    {pendingMentors.length} Action Needed
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Review applicant profiles, skills, and bios before granting authorization to accept student requests.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingMentors.map((mentor) => (
              <div
                key={mentor._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-sm">
                      {mentor.avatar ? (
                        <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        mentor.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-100 text-sm">{mentor.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{mentor.email}</p>
                    </div>
                  </div>

                  {mentor.bio && (
                    <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 line-clamp-3">
                      &ldquo;{mentor.bio}&rdquo;
                    </p>
                  )}

                  {mentor.skills && mentor.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mentor.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 font-mono font-medium"
                        >
                          #{s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(mentor._id, true)}
                    disabled={processingId === mentor._id}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Approve Mentor</span>
                  </button>
                  <button
                    onClick={() => handleApprove(mentor._id, false)}
                    disabled={processingId === mentor._id}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Directory & Permissions Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-4 p-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>User Directory</span>
              <span className="text-xs font-normal text-slate-400">
                ({totalUsersCount} accounts total)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Filter by authorization role, approval state, or search by name and email.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-grow sm:flex-grow-0 sm:w-64 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
            </form>

            {/* Role Filter Tabs */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="mentor">Mentors</option>
              <option value="admin">Admins</option>
            </select>

            {/* Approval Filter */}
            <select
              value={approvedFilter}
              onChange={(e) => {
                setApprovedFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="true">Approved</option>
              <option value="false">Pending Approval</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Reputation / Rating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs overflow-hidden">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100 text-xs sm:text-sm">{u.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-700 border border-purple-500/30'
                          : u.role === 'mentor'
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {u.role === 'mentor' ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.isApproved
                            ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-700 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isApproved ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                        <span>{u.isApproved ? 'Approved' : 'Pending Approval'}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Auto-Authorized</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                      <span>🪙</span>
                      <span>{u.credits ?? 0}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {u.role === 'mentor' ? (
                      <div className="text-xs space-y-0.5">
                        <span className="text-slate-200 font-bold">{u.reputation ?? 0} pts</span>
                        <span className="text-slate-400 block">
                          ★ {u.ratingAvg?.toFixed(1) || '0.0'} ({u.ratingCount || 0} reviews)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.role === 'mentor' && (
                        <button
                          onClick={() => handleApprove(u._id, !u.isApproved)}
                          disabled={processingId === u._id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            u.isApproved
                              ? 'bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-600 border border-slate-700 hover:border-red-500/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                          }`}
                        >
                          {processingId === u._id
                            ? 'Updating...'
                            : u.isApproved
                            ? 'Revoke'
                            : 'Approve'}
                        </button>
                      )}

                      {/* Role Dropdown */}
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={processingId === u._id}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="student">student</option>
                        <option value="mentor">mentor</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
