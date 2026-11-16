import User from '../models/User.js';
import Request from '../models/Request.js';
import Session from '../models/Session.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';

/**
 * List all users with pagination, role filtering, and search (Admin only)
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const {
      role,
      approved,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }

    // Filter by approval status
    if (approved !== undefined && approved !== 'all') {
      query.isApproved = approved === 'true';
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      users,
    });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.',
      error: error.message,
    });
  }
};

/**
 * Approve or suspend a mentor (Admin only)
 * PATCH /api/admin/mentors/:id/approve
 */
export const approveMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved = true } = req.body;

    const mentor = await User.findById(id);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found.',
      });
    }

    if (mentor.role !== 'mentor') {
      return res.status(400).json({
        success: false,
        message: `User is a '${mentor.role}', not a mentor. Approval only applies to mentors.`,
      });
    }

    mentor.isApproved = Boolean(isApproved);
    await mentor.save();

    // Send in-app notification to the mentor
    if (mentor.isApproved) {
      await Notification.create({
        user: mentor._id,
        type: 'mentor_approved',
        message: 'Congratulations! Your mentor application has been approved by an administrator. You can now accept review requests!',
        link: '/requests',
      });
    }

    return res.status(200).json({
      success: true,
      message: mentor.isApproved
        ? `Mentor ${mentor.name} has been approved successfully.`
        : `Mentor ${mentor.name} approval status has been revoked.`,
      mentor,
    });
  } catch (error) {
    console.error('Admin approveMentor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update mentor approval status.',
      error: error.message,
    });
  }
};

/**
 * Update user general status/role (Admin only)
 * PATCH /api/admin/users/:id/status
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, role, isAvailable } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (isApproved !== undefined) user.isApproved = Boolean(isApproved);
    if (isAvailable !== undefined) user.isAvailable = Boolean(isAvailable);
    if (role && ['student', 'mentor', 'admin'].includes(role)) {
      user.role = role;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.name} updated successfully.`,
      user,
    });
  } catch (error) {
    console.error('Admin updateUserStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
      error: error.message,
    });
  }
};

/**
 * Get platform metrics and statistics (Admin only)
 * GET /api/admin/stats
 */
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalMentors,
      pendingMentors,
      totalRequests,
      openRequests,
      completedRequests,
      totalSessions,
      completedSessions,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'mentor' }),
      User.countDocuments({ role: 'mentor', isApproved: false }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'open' }),
      Request.countDocuments({ status: 'completed' }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'completed' }),
      Review.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          mentors: totalMentors,
          pendingMentors,
        },
        requests: {
          total: totalRequests,
          open: openRequests,
          completed: completedRequests,
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
        },
        reviews: {
          total: totalReviews,
        },
      },
    });
  } catch (error) {
    console.error('Admin getPlatformStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate platform statistics.',
      error: error.message,
    });
  }
};

