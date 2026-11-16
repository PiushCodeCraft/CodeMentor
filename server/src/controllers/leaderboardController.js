import User from '../models/User.js';

/**
 * Get mentor leaderboard ranked by reputation and rating
 * GET /api/leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { skill, limit = 20 } = req.query;

    const filter = { role: 'mentor' };
    if (skill) {
      filter.skills = { $regex: new RegExp(skill, 'i') };
    }

    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const mentors = await User.find(filter)
      .select('name avatar bio skills ratingAvg ratingCount reputation badges createdAt')
      .sort({ reputation: -1, ratingAvg: -1, ratingCount: -1 })
      .limit(maxLimit)
      .lean();

    // Map ranks (1-indexed)
    const rankedMentors = mentors.map((mentor, index) => ({
      ...mentor,
      rank: index + 1,
    }));

    return res.status(200).json({
      success: true,
      count: rankedMentors.length,
      leaderboard: rankedMentors,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leaderboard.',
      error: error.message,
    });
  }
};

