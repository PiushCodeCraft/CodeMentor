import React, { useState } from 'react';
import { submitReview } from '../api/reviews';

const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good Mentorship',
  4: 'Very Helpful',
  5: 'Exceptional Mentor! 🌟',
};

export default function ReviewModal({
  isOpen,
  onClose,
  sessionId,
  mentor,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const data = await submitReview({
        sessionId,
        rating,
        comment,
      });

      setSuccess(true);
      setTimeout(() => {
        if (onReviewSubmitted) {
          onReviewSubmitted(data.review);
        }
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to submit review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeStar = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Close Button */}
        {!submitting && !success && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center text-3xl animate-bounce">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-slate-100">Thank You!</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Your review and rating have been recorded. The mentor's reputation and credits have been credited!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                Session Complete
              </span>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                Rate Your Mentorship
              </h2>
              {mentor && (
                <div className="flex items-center justify-center gap-2 pt-1 text-sm text-slate-400">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                    {mentor.avatar ? (
                      <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
                    ) : (
                      mentor.name?.charAt(0).toUpperCase() || 'M'
                    )}
                  </div>
                  <span>How was your experience with <strong className="text-slate-100">{mentor.name || 'your mentor'}</strong>?</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-125 duration-150"
                  >
                    <svg
                      className={`w-9 h-9 transition-colors ${
                        star <= activeStar
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300 fill-transparent'
                      }`}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-amber-700 h-5">
                {RATING_LABELS[activeStar] || ''}
              </p>
            </div>

            {/* Comment Area */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Review & Feedback (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="What went well? How clearly did the mentor explain the code and solutions?"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Helps mentors earn reputation badges</span>
                <span>{comment.length}/1000</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Later
              </button>
              <button
                type="submit"
                disabled={submitting || !rating}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

