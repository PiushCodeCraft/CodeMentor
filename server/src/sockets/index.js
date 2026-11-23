import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { registerSessionHandlers } from './sessionHandlers.js';

let io = null;

/**
 * Parse cookie string to retrieve a specific cookie value
 */
const parseCookie = (cookieString, cookieName) => {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Initialize Socket.io server attached to the Node HTTP server
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      // 1. Check socket.handshake.auth.token
      let token = socket.handshake.auth?.token;

      // 2. Check query param
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      // 3. Check authorization header
      if (!token && socket.handshake.headers?.authorization?.startsWith('Bearer ')) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      }

      // 4. Check cookies header
      if (!token && socket.handshake.headers?.cookie) {
        token = parseCookie(socket.handshake.headers.cookie, 'accessToken');
      }

      if (!token) {
        return next(new Error('Authentication required for WebSocket connection'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name || '',
      };

      next();
    } catch (err) {
      console.warn('Socket authentication failed:', err.message);
      next(new Error('Invalid or expired socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user?.userId})`);

    // Automatically join user's private room for real-time wallet & notification updates
    if (socket.user?.userId) {
      socket.join(`user:${socket.user.userId}`);
      console.log(`👤 User joined private room: user:${socket.user.userId}`);
    }

    registerSessionHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

/**
 * Get initialized Socket.io instance
 */
export const getIO = () => {
  return io;
};

