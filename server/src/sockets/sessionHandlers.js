import Session from '../models/Session.js';
import Message from '../models/Message.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';

// Map: sessionId -> Map<socketId, { userId, name, role, email }>
export const presenceMap = new Map();

// Map: sessionId -> timeoutId for debounced code saving
const saveDebounceMap = new Map();

/**
 * Get list of unique users online in a session room
 */
export const getOnlineUsers = (sessionId) => {
  const sessionPresence = presenceMap.get(sessionId);
  if (!sessionPresence) return [];

  const uniqueUsers = new Map();
  for (const user of sessionPresence.values()) {
    uniqueUsers.set(user.userId, user);
  }
  return Array.from(uniqueUsers.values());
};

/**
 * Register all live session socket event handlers
 */
export const registerSessionHandlers = (io, socket) => {
  const currentUser = socket.user;

  /**
   * session:join - Client joins the session room
   */
  socket.on('session:join', async ({ sessionId }, callback) => {
    try {
      if (!sessionId) {
        if (callback) callback({ error: 'sessionId is required' });
        return;
      }

      // Check authorization: user must be student or mentor of session (or admin)
      const session = await Session.findById(sessionId);
      if (!session) {
        if (callback) callback({ error: 'Session not found' });
        return;
      }

      const isStudent = session.student.toString() === currentUser.userId;
      const isMentor = session.mentor.toString() === currentUser.userId;
      const isAdmin = currentUser.role === 'admin';

      if (!isStudent && !isMentor && !isAdmin) {
        if (callback) callback({ error: 'Unauthorized to join this session room' });
        return;
      }

      const roomName = `session:${sessionId}`;
      socket.join(roomName);

      // Track presence
      if (!presenceMap.has(sessionId)) {
        presenceMap.set(sessionId, new Map());
      }
      presenceMap.get(sessionId).set(socket.id, {
        userId: currentUser.userId,
        name: currentUser.name || (isMentor ? 'Mentor' : 'Student'),
        role: currentUser.role,
        email: currentUser.email,
      });

      // Broadcast updated presence to room
      const onlineUsers = getOnlineUsers(sessionId);
      io.to(roomName).emit('presence:update', {
        sessionId,
        onlineUsers,
      });

      if (callback) {
        callback({
          success: true,
          codeSnapshot: session.codeSnapshot,
          language: session.language,
          onlineUsers,
        });
      }
    } catch (err) {
      console.error('Socket session:join error:', err);
      if (callback) callback({ error: 'Internal server error joining session' });
    }
  });

  /**
   * code:change - Client sends updated editor content
   * Broadcasts with last-write-wins and debounced DB snapshot saving
   */
  socket.on('code:change', ({ sessionId, content }) => {
    if (!sessionId || typeof content !== 'string') return;

    const roomName = `session:${sessionId}`;

    // Broadcast change to other users in room
    socket.to(roomName).emit('code:change', {
      sessionId,
      content,
      updatedBy: currentUser.userId,
      timestamp: Date.now(),
    });

    // Debounced database save (saves 1.5s after last keystroke)
    if (saveDebounceMap.has(sessionId)) {
      clearTimeout(saveDebounceMap.get(sessionId));
    }

    const timeoutId = setTimeout(async () => {
      try {
        await Session.findByIdAndUpdate(sessionId, { codeSnapshot: content });
        saveDebounceMap.delete(sessionId);
      } catch (err) {
        console.error(`Failed to save code snapshot for session ${sessionId}:`, err);
      }
    }, 1500);

    saveDebounceMap.set(sessionId, timeoutId);
  });

  /**
   * chat:send - Client sends real-time chat message
   */
  socket.on('chat:send', async ({ sessionId, text }, callback) => {
    try {
      if (!sessionId || !text || !text.trim()) {
        if (callback) callback({ error: 'Message text cannot be empty' });
        return;
      }

      const roomName = `session:${sessionId}`;

      // Fetch user profile for populated message response
      let senderInfo = {
        _id: currentUser.userId,
        name: currentUser.name || 'User',
        role: currentUser.role,
        avatar: '',
      };

      try {
        const dbUser = await User.findById(currentUser.userId).select('name avatar role');
        if (dbUser) {
          senderInfo = dbUser;
        }
      } catch {
        // Fallback to token payload
      }

      // Persist message to database
      const newMessage = await Message.create({
        session: sessionId,
        sender: currentUser.userId,
        text: text.trim(),
      });

      const messagePayload = {
        _id: newMessage._id,
        session: sessionId,
        text: newMessage.text,
        sender: senderInfo,
        createdAt: newMessage.createdAt,
      };

      // Broadcast message to everyone in room (including sender)
      io.to(roomName).emit('chat:message', messagePayload);

      if (callback) callback({ success: true, message: messagePayload });
    } catch (err) {
      console.error('Socket chat:send error:', err);
      if (callback) callback({ error: 'Failed to send chat message' });
    }
  });

  /**
   * comment:add - Client adds an inline code comment
   */
  socket.on('comment:add', async ({ sessionId, line, text }, callback) => {
    try {
      if (!sessionId || !line || !text || !text.trim()) {
        if (callback) callback({ error: 'sessionId, line number, and comment text are required' });
        return;
      }

      const roomName = `session:${sessionId}`;

      // Save comment to database
      const newComment = await Comment.create({
        session: sessionId,
        author: currentUser.userId,
        line: Number(line),
        text: text.trim(),
        status: 'open',
      });

      // Populate author
      let authorInfo = {
        _id: currentUser.userId,
        name: currentUser.name || 'User',
        role: currentUser.role,
        avatar: '',
      };

      try {
        const dbUser = await User.findById(currentUser.userId).select('name avatar role');
        if (dbUser) authorInfo = dbUser;
      } catch {
        // Fallback to token payload
      }

      const commentPayload = {
        _id: newComment._id,
        session: sessionId,
        line: newComment.line,
        text: newComment.text,
        status: newComment.status,
        author: authorInfo,
        createdAt: newComment.createdAt,
      };

      // Broadcast comment:added to room
      io.to(roomName).emit('comment:added', commentPayload);

      if (callback) callback({ success: true, comment: commentPayload });
    } catch (err) {
      console.error('Socket comment:add error:', err);
      if (callback) callback({ error: 'Failed to add inline comment' });
    }
  });

  /**
   * comment:resolve - Client resolves or reopens an inline comment
   */
  socket.on('comment:resolve', async ({ sessionId, commentId, status: targetStatus }, callback) => {
    try {
      if (!sessionId || !commentId) {
        if (callback) callback({ error: 'sessionId and commentId are required' });
        return;
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        if (callback) callback({ error: 'Comment not found' });
        return;
      }

      if (targetStatus && ['open', 'resolved'].includes(targetStatus)) {
        comment.status = targetStatus;
      } else {
        comment.status = comment.status === 'open' ? 'resolved' : 'open';
      }

      await comment.save();

      const roomName = `session:${sessionId}`;
      io.to(roomName).emit('comment:resolved', {
        commentId: comment._id,
        status: comment.status,
        resolvedBy: currentUser.name || 'Participant',
      });

      if (callback) callback({ success: true, status: comment.status });
    } catch (err) {
      console.error('Socket comment:resolve error:', err);
      if (callback) callback({ error: 'Failed to update comment resolution status' });
    }
  });

  /**
   * session:end - Either side ends the session
   */
  socket.on('session:end', async ({ sessionId }, callback) => {
    try {
      if (!sessionId) return;

      const roomName = `session:${sessionId}`;

      await Session.findByIdAndUpdate(sessionId, {
        status: 'completed',
        endedAt: new Date(),
      });

      io.to(roomName).emit('session:end', {
        sessionId,
        endedBy: currentUser.name || 'Participant',
        endedAt: new Date().toISOString(),
      });

      if (callback) callback({ success: true });
    } catch (err) {
      console.error('Socket session:end error:', err);
      if (callback) callback({ error: 'Failed to end session via socket' });
    }
  });

  /**
   * disconnect - Socket disconnects, cleanup presence
   */
  socket.on('disconnect', () => {
    for (const [sessionId, sessionPresence] of presenceMap.entries()) {
      if (sessionPresence.has(socket.id)) {
        sessionPresence.delete(socket.id);

        if (sessionPresence.size === 0) {
          presenceMap.delete(sessionId);
        }

        const roomName = `session:${sessionId}`;
        const onlineUsers = getOnlineUsers(sessionId);

        io.to(roomName).emit('presence:update', {
          sessionId,
          onlineUsers,
        });
      }
    }
  });
};

