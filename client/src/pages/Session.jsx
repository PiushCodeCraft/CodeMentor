import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSessionById } from '../api/sessions.js';
import {
  fetchSessionComments,
  addInlineComment,
  resolveInlineComment,
} from '../api/comments.js';
import { useAuth } from '../hooks/useAuth.js';
import useSocket from '../hooks/useSocket.js';
import CodeEditor from '../components/CodeEditor.jsx';
import ChatBox from '../components/ChatBox.jsx';
import CommentPanel from '../components/CommentPanel.jsx';
import ReviewModal from '../components/ReviewModal.jsx';
import { fetchSessionReview } from '../api/reviews.js';
import api from '../api/axios.js';

export default function Session() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, isConnected, socketError } = useSocket();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [language, setLanguage] = useState('javascript');
  const [ending, setEnding] = useState(false);
  const [endedMessage, setEndedMessage] = useState('');

  // Phase 6 Comments state
  const [comments, setComments] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState('comments'); // 'comments' or 'chat'
  const [showSidebar, setShowSidebar] = useState(true);

  // Phase 7 Rating & Review state
  const [review, setReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Load session from API
  const loadSession = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSessionById(id);
      setSession(data.session);
      if (data.session.language) {
        setLanguage(data.session.language);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load session. You may not be an authorized participant.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load session comments from API
  const loadComments = async () => {
    try {
      const data = await fetchSessionComments(id);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load session comments:', err);
    }
  };

  // Phase 7: Load session review if exists
  const loadReview = async () => {
    try {
      const data = await fetchSessionReview(id);
      if (data?.review) {
        setReview(data.review);
      }
    } catch (err) {
      console.error('Failed to load review:', err);
    }
  };

  useEffect(() => {
    loadSession();
    loadComments();
    loadReview();
  }, [id]);

  // Handle Socket.io room joining, presence, and comments sync
  useEffect(() => {
    if (!socket || !isConnected || !id) return;

    // Join the session room
    socket.emit('session:join', { sessionId: id }, (response) => {
      if (response?.error) {
        console.error('Socket join error:', response.error);
      } else if (response?.onlineUsers) {
        setOnlineUsers(response.onlineUsers);
      }
    });

    // Listen for presence updates
    const handlePresenceUpdate = (data) => {
      if (data.sessionId === id) {
        setOnlineUsers(data.onlineUsers || []);
      }
    };

    // Listen for session completion broadcast
    const handleSessionEnded = (data) => {
      if (data.sessionId === id) {
        setSession((prev) => (prev ? { ...prev, status: 'completed' } : prev));
        setEndedMessage(`Session was concluded by ${data.endedBy}.`);
        loadReview();
      }
    };

    // Listen for real-time incoming inline comment
    const handleCommentAdded = (comment) => {
      if (comment.session === id) {
        setComments((prev) => {
          if (prev.some((c) => c._id === comment._id)) return prev;
          return [...prev, comment];
        });
      }
    };

    // Listen for real-time comment resolution change
    const handleCommentResolved = ({ commentId, status }) => {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, status } : c))
      );
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('session:end', handleSessionEnded);
    socket.on('comment:added', handleCommentAdded);
    socket.on('comment:resolved', handleCommentResolved);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('session:end', handleSessionEnded);
      socket.off('comment:added', handleCommentAdded);
      socket.off('comment:resolved', handleCommentResolved);
    };
  }, [socket, isConnected, id]);

  const handleEndSession = async () => {
    if (!window.confirm('Are you sure you want to end this review session?')) {
      return;
    }

    setEnding(true);
    try {
      await api.post(`/sessions/${id}/end`);
      setSession((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      setEndedMessage('Session concluded successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end session.');
    } finally {
      setEnding(false);
    }
  };

  const handleAddComment = async ({ line, text }) => {
    const res = await addInlineComment(id, { line, text });
    if (res.comment) {
      setComments((prev) => {
        if (prev.some((c) => c._id === res.comment._id)) return prev;
        return [...prev, res.comment];
      });
    }
  };

  const handleResolveComment = async (commentId, nextStatus) => {
    const res = await resolveInlineComment(commentId, nextStatus);
    if (res.comment) {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.comment : c))
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading live session workspace...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
          {error || 'Session not found.'}
        </div>
        <Link to="/dashboard" className="text-indigo-400 hover:underline text-sm inline-block">
          &larr; Return to Dashboard
        </Link>
      </div>
    );
  }

  const isStudentOnline = onlineUsers.some((u) => u.userId === session.student?._id);
  const isMentorOnline = onlineUsers.some((u) => u.userId === session.mentor?._id);
  const isCompleted = session.status === 'completed';
  const isStudent = user && (user._id === session.student?._id || user._id === session.student);
  const isMentor = user && (user._id === session.mentor?._id || user._id === session.mentor);
  const openCommentsCount = comments.filter((c) => c.status === 'open').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Top Session Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isCompleted
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5'
              }`}
            >
              {!isCompleted && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
              {session.status}
            </span>

            <h1 className="text-base sm:text-lg font-bold text-white line-clamp-1">
              {session.request?.title || 'Review Session'}
            </h1>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Room #{session._id?.slice(-6)}</span>
            <span>&bull;</span>
            <Link
              to={`/requests/${session.request?._id || session.request}`}
              className="text-indigo-400 hover:underline text-xs"
            >
              View Request &rarr;
            </Link>
          </p>
        </div>

        {/* Presence & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Presence Badges */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5" title={isStudentOnline ? 'Student Online' : 'Student Away'}>
              <span
                className={`w-2 h-2 rounded-full ${
                  isStudentOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'
                }`}
              ></span>
              <span className="text-slate-300 font-medium">{session.student?.name}</span>
              <span className="text-[10px] text-slate-500">(Student)</span>
            </div>

            <span className="text-slate-700">|</span>

            <div className="flex items-center gap-1.5" title={isMentorOnline ? 'Mentor Online' : 'Mentor Away'}>
              <span
                className={`w-2 h-2 rounded-full ${
                  isMentorOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'
                }`}
              ></span>
              <span className="text-slate-300 font-medium">{session.mentor?.name}</span>
              <span className="text-[10px] text-emerald-400 font-bold">(Mentor)</span>
            </div>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isCompleted}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          {/* Toggle Sidebar */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>

          {/* End Session Button */}
          {!isCompleted && (
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/30 transition cursor-pointer"
            >
              {ending ? 'Ending...' : 'End Session'}
            </button>
          )}
        </div>
      </div>

      {/* Completion & Review Banner */}
      {(endedMessage || isCompleted) && (
        <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-2xl text-purple-200 text-sm space-y-3 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏁</span>
              <div>
                <p className="font-bold text-white text-base">This review session has ended.</p>
                <p className="text-xs text-purple-300/80">
                  {endedMessage || 'The code snapshot and comments are now archived in read-only mode.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStudent && !review && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>⭐</span>
                  <span>Rate Mentor</span>
                </button>
              )}

              <Link
                to="/dashboard"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>

          {/* Review Details if already submitted */}
          {review ? (
            <div className="pt-3 border-t border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-purple-900/30 px-3.5 py-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400 text-sm">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
                <span className="text-white font-medium">({review.rating}/5 stars)</span>
                {review.comment && (
                  <span className="text-purple-200 italic line-clamp-1">
                    &ldquo;{review.comment}&rdquo;
                  </span>
                )}
              </div>
              <span className="text-purple-300/70 text-[11px]">
                Review Recorded &bull; Credits & Reputation Transferred
              </span>
            </div>
          ) : isMentor ? (
            <div className="pt-2 border-t border-purple-500/20 text-xs text-purple-300/70 flex items-center gap-1.5">
              <span>⏳</span>
              <span>Waiting for student review. Bounty credits and reputation bonus will be awarded upon rating submission.</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Main Real-Time Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left / Center: Shared Monaco Editor */}
        <div className={`${showSidebar ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} transition-all duration-300`}>
          <CodeEditor
            sessionId={id}
            initialCode={session.codeSnapshot || ''}
            language={language}
            isReadOnly={isCompleted}
            socket={socket}
            currentUserId={user?._id}
            comments={comments}
            highlightedLine={selectedLine}
            onSelectLine={(line) => setSelectedLine(line)}
          />
        </div>

        {/* Right Sidebar: Switcher for Inline Comments & Chat */}
        {showSidebar && (
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-2">
            {/* Sidebar Tabs */}
            <div className="grid grid-cols-3 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveSidebarTab('comments')}
                className={`py-2 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'comments'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📝 Comments</span>
                {openCommentsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                    {openCommentsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSidebarTab('chat')}
                className={`py-2 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'chat'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>💬 Chat</span>
              </button>

              <button
                onClick={() => setActiveSidebarTab('ai')}
                className={`py-2 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'ai'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🤖 AI</span>
              </button>
            </div>

            {/* Tab Panels */}
            <div className="flex-grow">
              {activeSidebarTab === 'comments' ? (
                <CommentPanel
                  sessionId={id}
                  comments={comments}
                  currentUser={user}
                  selectedLine={selectedLine}
                  onSelectLine={(line) => setSelectedLine(line)}
                  onAddComment={handleAddComment}
                  onResolveComment={handleResolveComment}
                  isCompleted={isCompleted}
                />
              ) : activeSidebarTab === 'chat' ? (
                <ChatBox sessionId={id} socket={socket} currentUser={user} />
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 h-[550px] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🤖</span> AI Pre-Review Insights
                    </span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      Phase 8
                    </span>
                  </div>
                  {session.request?.aiSummary ? (
                    <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                      {session.request.aiSummary}
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2 text-xs text-slate-400">
                      <p>No AI pre-review found for this request.</p>
                      <Link
                        to={`/requests/${session.request?._id || session.request}`}
                        className="text-indigo-400 hover:underline inline-block text-xs"
                      >
                        View Request Page &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Post-Session Review Modal */}
      {session && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          sessionId={id}
          mentor={session.mentor}
          onReviewSubmitted={(newReview) => {
            setReview(newReview);
            setIsReviewModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
