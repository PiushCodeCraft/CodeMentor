import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  fetchChallenges,
  fetchChallengeById,
  submitChallenge,
  fetchAssignments,
  submitAssignment,
} from '../api/tokens.js';
import { useAuth } from '../hooks/useAuth.js';

export default function EarnTokens() {
  const { user, fetchMe } = useAuth();
  const [activeTab, setActiveTab] = useState('challenges'); // 'challenges' | 'assignments'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab Data States
  const [challenges, setChallenges] = useState([]);
  const [challengeDifficulty, setChallengeDifficulty] = useState('all');

  const [assignments, setAssignments] = useState([]);

  // Active Challenge Solver Modal State
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengeCode, setChallengeCode] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Active Assignment Submission Modal State
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Load active tab data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'challenges') {
        const res = await fetchChallenges({
          difficulty: challengeDifficulty === 'all' ? undefined : challengeDifficulty,
        });
        setChallenges(res.challenges || []);
      } else if (activeTab === 'assignments') {
        const res = await fetchAssignments();
        setAssignments(res.assignments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rewards data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, challengeDifficulty]);

  // Open Challenge Solver Modal
  const handleOpenChallenge = async (ch) => {
    try {
      const res = await fetchChallengeById(ch._id);
      setSelectedChallenge(res.challenge);
      setChallengeCode(res.latestSubmission?.code || res.challenge.starterCode);
      setExecutionResult(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load challenge details.');
    }
  };

  // Submit Challenge Solution
  const handleRunChallenge = async () => {
    if (!selectedChallenge) return;
    setSubmittingCode(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await submitChallenge(selectedChallenge._id, {
        code: challengeCode,
        language: selectedChallenge.language || 'javascript',
      });
      setExecutionResult(res);
      if (res.passed) {
        if (res.tokensAwarded > 0) {
          setSuccessMsg(`🎉 Challenge Passed! +${res.tokensAwarded} tokens credited to your wallet.`);
        } else {
          setSuccessMsg('✓ All test cases passed! (Practice run)');
        }
        await fetchMe();
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit challenge solution.');
    } finally {
      setSubmittingCode(false);
    }
  };

  // Submit Assignment
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !repoUrl) return;
    setSubmittingAssignment(true);
    setError('');
    setSuccessMsg('');
    try {
      await submitAssignment(selectedAssignment._id, {
        repoUrl,
        demoUrl,
        notes: assignmentNotes,
      });
      setSuccessMsg('Assignment submitted successfully! A mentor or admin will review your deliverables.');
      setSelectedAssignment(null);
      setRepoUrl('');
      setDemoUrl('');
      setAssignmentNotes('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>⚡</span>
            <span>Free Learning Rewards System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Earn Free Tokens
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build real software skills, solve algorithmic challenges, and complete project assignments to earn platform tokens for free.
          </p>
        </div>

        {/* Live Wallet Balance Pill */}
        <Link
          to="/wallet"
          className="self-start sm:self-auto flex items-center gap-2.5 px-4 py-2 bg-slate-900 border border-amber-500/30 rounded-2xl text-xs shadow-sm hover:border-amber-500/60 transition group cursor-pointer"
        >
          <span className="text-amber-600 text-lg">🪙</span>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Your Wallet</span>
            <span className="text-slate-100 font-bold group-hover:text-amber-600 transition">
              {user?.credits ?? 0} tokens
            </span>
          </div>
          <span className="text-xs text-indigo-600 font-bold ml-1">&rarr;</span>
        </Link>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* 2 Tabs Selector: Coding Challenges & Assignments */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold max-w-lg mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'challenges'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <span>⚡</span>
          <span>Coding Challenges</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'assignments'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <span>📝</span>
          <span>Assignments</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: CODING CHALLENGES */}
      {/* ==================================================== */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Coding Practice &amp; Algorithmic Challenges</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pass all automated test cases in the sandbox editor to receive instant token credits.
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Difficulty:</span>
              <select
                value={challengeDifficulty}
                onChange={(e) => setChallengeDifficulty(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner (5 🪙)</option>
                <option value="intermediate">Intermediate (10 🪙)</option>
                <option value="advanced">Advanced (20 🪙)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-400">Loading challenges...</p>
            </div>
          ) : challenges.length === 0 ? (
            <div className="py-16 text-center space-y-2 bg-slate-900 rounded-2xl border border-slate-800 p-8">
              <span className="text-3xl">💻</span>
              <p className="text-sm font-bold text-slate-200">No Challenges Found</p>
              <p className="text-xs text-slate-400">No challenges matching this difficulty filter yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((ch) => (
                <div
                  key={ch._id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 uppercase font-semibold">
                        {ch.category || 'Algorithms'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          ch.difficulty === 'beginner'
                            ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                            : ch.difficulty === 'intermediate'
                            ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                            : 'bg-purple-500/10 text-purple-700 border border-purple-500/20'
                        }`}
                      >
                        {ch.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-600 transition">
                      {ch.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {ch.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-amber-600 text-xs">
                      <span>🪙</span>
                      <span>+{ch.reward} tokens</span>
                    </div>

                    <button
                      onClick={() => handleOpenChallenge(ch)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        ch.isPassed
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      {ch.isPassed ? (
                        <>
                          <span>✓</span>
                          <span>Solved</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Solve</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: ASSIGNMENTS */}
      {/* ==================================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Project-Based Learning Assignments</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit your GitHub repositories. Once approved by a mentor or admin, reward tokens are deposited into your wallet.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-400">Loading assignments...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((asg) => {
                const sub = asg.submission;
                return (
                  <div
                    key={asg._id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 uppercase font-semibold">
                          {asg.category}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-xs text-amber-600">
                          <span>🪙</span>
                          <span>+{asg.reward} tokens</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-100">{asg.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                        {asg.instructions}
                      </p>

                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                        <strong className="text-slate-300 block mb-0.5">Deliverables:</strong>
                        <span>{asg.deliverables}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      {sub ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Status:</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                                  : sub.status === 'REJECTED'
                                  ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                              }`}
                            >
                              {sub.status === 'APPROVED'
                                ? `✓ Approved (+${sub.tokensAwarded}🪙)`
                                : sub.status === 'REJECTED'
                                ? '✕ Rejected'
                                : '⏳ In Review'}
                            </span>
                          </div>

                          {sub.feedback && (
                            <p className="text-[11px] text-slate-300 italic bg-slate-950 p-2 rounded-lg border border-slate-800">
                              &ldquo;{sub.feedback}&rdquo;
                            </p>
                          )}

                          {sub.status === 'REJECTED' && (
                            <button
                              onClick={() => setSelectedAssignment(asg)}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                              Resubmit Assignment
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedAssignment(asg)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          Submit Assignment &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CHALLENGE CODE SOLVER */}
      {/* ==================================================== */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h2 className="text-xl font-black text-slate-100">{selectedChallenge.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="text-amber-600 font-bold">🪙 +{selectedChallenge.reward} tokens</span>
                    <span>&bull;</span>
                    <span className="capitalize text-slate-400">{selectedChallenge.difficulty}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-slate-500">{selectedChallenge.language}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Split Description & Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Problem Left Col */}
              <div className="lg:col-span-5 space-y-4 max-h-[500px] overflow-y-auto pr-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-200 mb-1">Problem Description</h4>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedChallenge.description}
                  </p>
                </div>

                {selectedChallenge.examples && selectedChallenge.examples.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-200">Examples</h4>
                    {selectedChallenge.examples.map((ex, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                        <div><strong className="text-slate-400">Input:</strong> <span className="text-slate-200">{ex.input}</span></div>
                        <div><strong className="text-slate-400">Output:</strong> <span className="text-emerald-600">{ex.output}</span></div>
                        {ex.explanation && <div className="text-slate-500 text-[10px]"># {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {selectedChallenge.constraints && selectedChallenge.constraints.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-200 mb-1">Constraints</h4>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5 font-mono text-[11px]">
                      {selectedChallenge.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Editor Right Col */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="h-[360px] rounded-xl overflow-hidden border border-slate-800">
                  <Editor
                    height="100%"
                    language={selectedChallenge.language || 'javascript'}
                    value={challengeCode}
                    onChange={(val) => setChallengeCode(val || '')}
                    theme="light"
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      automaticLayout: true,
                    }}
                  />
                </div>

                {/* Execution Results Feedback */}
                {executionResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      executionResult.passed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                        : 'bg-red-500/10 border-red-500/30 text-red-600'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{executionResult.passed ? '✓ All Test Cases Passed!' : '✕ Test Cases Failed'}</span>
                      <span className="font-mono text-[11px]">
                        {executionResult.execution?.passCount || 0} / {executionResult.execution?.totalTests || 0} passed
                        ({executionResult.execution?.executionTimeMs || 0}ms)
                      </span>
                    </div>

                    {executionResult.message && <p className="text-[11px]">{executionResult.message}</p>}

                    {/* Test cases details */}
                    <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                      {executionResult.execution?.testResults?.map((tr, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded font-mono text-[10px]"
                        >
                          <span>Test #{tr.testIndex} {tr.isHidden ? '(Hidden)' : ''}:</span>
                          <span className={tr.passed ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                            {tr.passed ? 'PASS' : `FAIL: expected ${tr.expected}, got ${tr.actual || tr.error}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300"
                  >
                    Close
                  </button>

                  <button
                    onClick={handleRunChallenge}
                    disabled={submittingCode}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    {submittingCode ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Executing in Sandbox...</span>
                      </>
                    ) : (
                      <>
                        <span>▶</span>
                        <span>Run &amp; Submit Solution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ASSIGNMENT SUBMISSION */}
      {/* ==================================================== */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Submit Assignment</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAssignment.title}</p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                  GitHub Repository URL *
                </label>
                <input
                  type="url"
                  required
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                  Live Demo / Deployment URL (optional)
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://myproject.vercel.app"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                  Notes &amp; Project Description
                </label>
                <textarea
                  rows={3}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Briefly describe what you built, architecture decisions, and any known edge cases..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition"
                >
                  {submittingAssignment ? 'Submitting...' : `Submit Deliverables (+${selectedAssignment.reward}🪙)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
