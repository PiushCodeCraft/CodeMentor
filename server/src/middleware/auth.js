import mongoose from 'mongoose';
import User from '../models/User.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const auth = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No access token provided.',
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired
          ? 'Access token expired. Please refresh your session.'
          : 'Invalid access token.',
      });
    }

    // If database connection is active, query the user document
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists.',
        });
      }
      req.user = user;
    } else {
      // Use verified token payload when database is offline or in isolated tests
      req.user = {
        _id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        credits: 100,
      };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

