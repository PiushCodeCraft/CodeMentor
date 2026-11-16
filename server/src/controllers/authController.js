import User from '../models/User.js';
import {
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
  verifyRefreshToken,
} from '../utils/jwt.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role, skills, bio } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'student',
      skills: skills || [],
      bio: bio || '',
    });

    // Generate tokens & set cookies
    const { accessToken, refreshToken } = generateTokens(newUser);
    setTokenCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: newUser,
      accessToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create account.',
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user with passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate tokens & set cookies
    const { accessToken, refreshToken } = generateTokens(user);
    setTokenCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user,
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process login.',
      error: error.message,
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided.',
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearTokenCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please log in again.',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      clearTokenCookies(res);
      return res.status(401).json({
        success: false,
        message: 'User belonging to token no longer exists.',
      });
    }

    // Issue refreshed tokens
    const { accessToken, refreshToken } = generateTokens(user);
    setTokenCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      user,
      accessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh token.',
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  clearTokenCookies(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

