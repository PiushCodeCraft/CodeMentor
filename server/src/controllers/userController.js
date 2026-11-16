import User from '../models/User.js';

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * Update current user profile and skills
 */
export const updateMe = async (req, res) => {
  try {
    const { name, bio, skills, avatar, isAvailable } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (avatar !== undefined) user.avatar = avatar;
    if (isAvailable !== undefined) user.isAvailable = isAvailable;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
};

/**
 * List mentors with skill and availability filtering
 */
export const getMentors = async (req, res) => {
  try {
    const { skill, available, search } = req.query;
    const filter = { role: 'mentor' };

    if (skill) {
      filter.skills = { $in: [new RegExp(skill, 'i')] };
    }

    if (available === 'true') {
      filter.isAvailable = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const mentors = await User.find(filter)
      .select('name email skills bio avatar isApproved isAvailable ratingAvg ratingCount reputation badges createdAt')
      .sort({ ratingAvg: -1, reputation: -1 });

    return res.status(200).json({
      success: true,
      count: mentors.length,
      mentors,
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch mentors.',
      error: error.message,
    });
  }
};

/**
 * Get single mentor profile by ID
 */
export const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;

    const mentor = await User.findOne({ _id: id, role: 'mentor' }).select(
      'name email skills bio avatar isApproved isAvailable ratingAvg ratingCount reputation badges createdAt'
    );

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      mentor,
    });
  } catch (error) {
    console.error('Get mentor by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mentor profile.',
      error: error.message,
    });
  }
};
