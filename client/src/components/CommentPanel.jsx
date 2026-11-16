import React, { useState } from 'react';

export default function CommentPanel({
  sessionId,
  comments = [],
  currentUser,
  selectedLine,
  onSelectLine,
  onAddComment,
  onResolveComment,
  isCompleted = false,
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'resolved'
  const [lineInput, setLineInput] = useState(selectedLine || 1);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  // Update line input when user clicks on a line in editor
  React.useEffect(() => {
    if (selectedLine) {
      setLineInput(selectedLine);
    }
  }, [selectedLine]);

  const openCount = comments.filter((c) => c.status === 'open').length;
  const resolvedCount = comments.filter((c) => c.status === 'resolved').length;

  const filteredComments = comments.filter((c) => {
    if (filter === 'open') return c.status === 'open';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !lineInput) return;

    setSubmitting(true);
    try {
      await onAddComment({
        line: Number(lineInput),
        text: commentText.trim(),
      });
      setCommentText('');
    } catch (err) {
      console.error('Failed to post inline comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async (comment) => {
    setResolvingId(comment._id);
    const nextStatus = comment.status === 'open' ? 'resolved' : 'open';
    try {
      await onResolveComment(comment._id, nextStatus);
    } catch (err) {
      console.error('Failed to toggle comment resolution:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const isStudent = currentUser?.role === 'student';

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <h2 className="text-sm font-bold text-white">Inline Code Comments</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-amber-400 font-semibold">{openCount} open</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-emerald-400">{resolvedCount} resolved</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({comments.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              filter === 'open'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              filter === 'resolved'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {selectedLine && (
          <div className="flex items-center gap-1.5 text-[11px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono">
            <span>Line #{selectedLine}</span>
            <button
              onClick={() => onSelectLine(null)}
              className="text-slate-400 hover:text-white text-xs ml-1"
              title="Clear line filter"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3 max-h-[350px]">
        {filteredComments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <span className="text-2xl">📌</span>
            <p className="text-xs">No {filter !== 'all' ? filter : ''} inline comments yet.</p>
            <p className="text-[11px] text-slate-600">
              Select a line in the editor or enter a line number below to leave code feedback.
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => {
            const isResolved = comment.status === 'resolved';
            const isAuthor = comment.author?._id === currentUser?._id;
            const canResolve = isStudent || isAuthor || currentUser?.role === 'mentor' || currentUser?.role === 'admin';

            return (
              <div
                key={comment._id}
                className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                  isResolved
                    ? 'bg-slate-950/40 border-slate-800 opacity-75'
                    : 'bg-slate-800/70 border-slate-700/80 hover:border-amber-500/50'
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectLine(comment.line)}
                      className="px-2 py-0.5 bg-slate-950 border border-slate-700 hover:border-indigo-500 text-indigo-300 font-mono text-[11px] rounded font-bold transition cursor-pointer"
                      title="Jump to this line in editor"
                    >
                      Line {comment.line}
                    </button>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-slate-200">
                        {isAuthor ? 'You' : comment.author?.name || 'Reviewer'}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          comment.author?.role === 'mentor'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {comment.author?.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isResolved
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isResolved ? '✓ Resolved' : '● Open'}
                    </span>
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-1">
                  {comment.text}
                </p>

                {/* Comment Footer: Action buttons & timestamp */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {new Date(comment.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    &bull; {new Date(comment.createdAt).toLocaleDateString()}
                  </span>

                  {canResolve && !isCompleted && (
                    <button
                      onClick={() => handleToggleResolve(comment)}
                      disabled={resolvingId === comment._id}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        isResolved
                          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {resolvingId === comment._id ? (
                        'Updating...'
                      ) : isResolved ? (
                        '↺ Reopen'
                      ) : (
                        '✓ Resolve'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Inline Comment Form */}
      {!isCompleted && (
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-slate-950 border-t border-slate-800 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold text-slate-400">
              Leave Feedback on Line:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 font-mono">Line:</span>
              <input
                type="number"
                min={1}
                required
                value={lineInput}
                onChange={(e) => setLineInput(Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-indigo-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <textarea
              rows={2}
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Comment on line ${lineInput}... (e.g. Consider checking null values)`}
              className="flex-grow p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0"
            >
              {submitting ? 'Adding...' : 'Post'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

