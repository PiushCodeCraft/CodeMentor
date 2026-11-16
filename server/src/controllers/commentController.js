import Comment from '../models/Comment.js';
import Session from '../models/Session.js';
import Notification from '../models/Notification.js';

/**
 * Get all inline comments for a session
 * GET /api/sessions/:id/comments
 */
export const getSessionComments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.',
      });
    }

    const isStudent = session.student.toString() === userId;
    const isMentor = session.mentor.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isMentor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a participant in this session.',
      });
    }

    const comments = await Comment.find({ session: id })
      .populate('author', 'name avatar role')
      .sort({ line: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments.',
      error: error.message,
    });
  }
};

/**
 * Add a new inline comment to a session line
 * POST /api/sessions/:id/comments
 */
export const addSessionComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { line, text } = req.body;
    const userId = req.user._id.toString();

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.',
      });
    }

    const isStudent = session.student.toString() === userId;
    const isMentor = session.mentor.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isMentor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a participant in this session.',
      });
    }

    // Create the inline comment
    const newComment = await Comment.create({
      session: id,
      author: req.user._id,
      line: Number(line),
      text: text.trim(),
      status: 'open',
    });

    const populatedComment = await Comment.findById(newComment._id).populate(
      'author',
      'name avatar role'
    );

    // Create Notification for the other participant
    const recipientId = isStudent ? session.mentor : session.student;
    await Notification.create({
      user: recipientId,
      type: 'new_comment',
      message: `${req.user.name} added a comment on line ${line}`,
      link: `/sessions/${session._id}`,
    });

    // Broadcast comment:added to room via Socket.io if attached
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${session._id}`).emit('comment:added', populatedComment);
    }

    return res.status(201).json({
      success: true,
      message: 'Inline comment added successfully.',
      comment: populatedComment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add comment.',
      error: error.message,
    });
  }
};

/**
 * Resolve or reopen an inline comment (Student or Author)
 * PATCH /api/comments/:id/resolve
 */
export const resolveComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;
    const userId = req.user._id.toString();

    const comment = await Comment.findById(id).populate('session');
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    const session = comment.session;
    const isStudent = session?.student?.toString() === userId;
    const isAuthor = comment.author.toString() === userId;
    const isMentor = session?.mentor?.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isAuthor && !isMentor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot resolve comments in this session.',
      });
    }

    // Toggle or set status
    if (targetStatus && ['open', 'resolved'].includes(targetStatus)) {
      comment.status = targetStatus;
    } else {
      comment.status = comment.status === 'open' ? 'resolved' : 'open';
    }

    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name avatar role'
    );

    // Broadcast comment:resolved to room via Socket.io
    const io = req.app.get('io');
    if (io && session?._id) {
      io.to(`session:${session._id}`).emit('comment:resolved', {
        commentId: comment._id,
        status: comment.status,
        resolvedBy: req.user.name,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Comment marked as ${comment.status}.`,
      comment: populatedComment,
    });
  } catch (error) {
    console.error('Resolve comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update comment resolution status.',
      error: error.message,
    });
  }
};

