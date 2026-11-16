import mongoose from 'mongoose';
import Review from '../models/Review.js';
import User from '../models/User.js';

/**
 * Recompute a mentor's average rating using MongoDB Aggregation
 * @param {string|ObjectId} mentorId
 */
export const recomputeMentorRating = async (mentorId) => {
  const objectId = typeof mentorId === 'string' ? new mongoose.Types.ObjectId(mentorId) : mentorId;

  const stats = await Review.aggregate([
    { $match: { mentor: objectId } },
    {
      $group: {
        _id: '$mentor',
        ratingAvg: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const ratingAvg = stats.length > 0 ? Math.round(stats[0].ratingAvg * 10) / 10 : 0;
  const ratingCount = stats.length > 0 ? stats[0].ratingCount : 0;

  return { ratingAvg, ratingCount };
};

/**
 * Calculate reputation points, credit wallet update, and badges evaluation
 * @param {Object} mentor User document
 * @param {number} rating Rating awarded (1-5)
 * @param {number} price Bounty credits from request
 * @param {number} ratingCount Updated total reviews count
 * @param {number} ratingAvg Updated average rating
 */
export const evaluateMentorRewards = ({
  mentor,
  rating,
  price = 0,
  ratingCount,
  ratingAvg,
}) => {
  // Reputation calculation: +10 base completion + (rating * 2) quality bonus
  const reputationBonus = 10 + Math.round(Number(rating) * 2);
  const newReputation = (mentor.reputation || 0) + reputationBonus;

  // Credit wallet transfer: add bounty credits
  const newCredits = (mentor.credits || 0) + Number(price || 0);

  // Badge evaluation
  const currentBadges = new Set(mentor.badges || []);

  if (ratingCount >= 1) {
    currentBadges.add('First Review');
  }

  if (ratingAvg >= 4.5 && ratingCount >= 3) {
    currentBadges.add('Top Rated');
  }

  if (ratingCount >= 10) {
    currentBadges.add('10 Reviews');
  }

  if (newReputation >= 50) {
    currentBadges.add('Mentor Pro');
  }

  if (ratingCount >= 25) {
    currentBadges.add('Master Reviewer');
  }

  const newBadges = Array.from(currentBadges);

  return {
    newReputation,
    newCredits,
    newBadges,
    reputationBonus,
  };
};

