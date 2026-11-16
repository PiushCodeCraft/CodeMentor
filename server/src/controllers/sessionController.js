import Session from '../models/Session.js';
import Request from '../models/Request.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

/**
 * Get session details by ID (Participant check: Student or Mentor)
 * GET /api/sessions/:id
 */
export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const session = await Session.findById(id)
      .populate('request', 'title description tech difficulty price status repoUrl code')
      .populate('student', 'name email avatar credits')
      .populate('mentor', 'name email avatar ratingAvg ratingCount reputation badges skills bio');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found.',
      });
    }

    // Verify user is either student or mentor of this session, or admin
    const isStudent = session.student?._id.toString() === userId;
    const isMentor = session.mentor?._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isMentor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not an authorized participant in this session.',
      });
    }

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve session.',
      error: error.message,
    });
  }
};

/**
 * Get all sessions for the authenticated user
 * GET /api/sessions
 */
export const getMySessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const query = {
      $or: [{ student: userId }, { mentor: userId }],
    };

    const sessions = await Session.find(query)
      .populate('request', 'title difficulty tech status price')
      .populate('student', 'name avatar')
      .populate('mentor', 'name avatar ratingAvg')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('Get my sessions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your sessions.',
      error: error.message,
    });
  }
};

/**
 * End a session (Participant: Student or Mentor)
 * POST /api/sessions/:id/end
 */
export const endSession = async (req, res) => {
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

    // Check participant authorization
    const isStudent = session.student.toString() === userId;
    const isMentor = session.mentor.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isMentor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot end a session you are not participating in.',
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Session is already marked as completed.',
      });
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    // Also update associated Request status to completed
    await Request.findByIdAndUpdate(session.request, { status: 'completed' });

    // Notify other participant
    const notifyUserId = isStudent ? session.mentor : session.student;
    await Notification.create({
      user: notifyUserId,
      type: 'session_ended',
      message: `${req.user.name} has concluded the live review session.`,
      link: `/sessions/${session._id}`,
    });

    // Broadcast session:end via Socket.io if available on app
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${session._id}`).emit('session:end', {
        sessionId: session._id,
        endedBy: req.user.name,
        endedAt: session.endedAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Session ended successfully. Rating prompt ready.',
      session,
    });
  } catch (error) {
    console.error('End session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end session.',
      error: error.message,
    });
  }
};

/**
 * Get message history for a session
 * GET /api/sessions/:id/messages
 */
export const getSessionMessages = async (req, res) => {
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
        message: 'Access denied to session messages.',
      });
    }

    const messages = await Message.find({ session: id })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve session messages.',
      error: error.message,
    });
  }
};
