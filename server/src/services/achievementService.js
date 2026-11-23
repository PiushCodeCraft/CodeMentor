import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import ChallengeSubmission from '../models/ChallengeSubmission.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import TaskCompletion from '../models/TaskCompletion.js';
import { creditTokens } from './walletService.js';

/**
 * Default system achievements definition
 */
export const DEFAULT_ACHIEVEMENTS = [
  {
    code: 'FIRST_CHALLENGE',
    title: 'Code Novice',
    description: 'Solve your first coding challenge successfully.',
    icon: '⚡',
    reward: 10,
    category: 'challenges',
    targetCount: 1,
  },
  {
    code: 'FIVE_CHALLENGES',
    title: 'Algorithm Apprentice',
    description: 'Complete 5 different coding challenges.',
    icon: '🚀',
    reward: 25,
    category: 'challenges',
    targetCount: 5,
  },
  {
    code: 'TEN_CHALLENGES',
    title: 'Algorithm Master',
    description: 'Complete 10 different coding challenges.',
    icon: '🏆',
    reward: 50,
    category: 'challenges',
    targetCount: 10,
  },
  {
    code: 'FIRST_ASSIGNMENT',
    title: 'Project Builder',
    description: 'Have your first real-world assignment approved by a mentor or admin.',
    icon: '🛠️',
    reward: 30,
    category: 'assignments',
    targetCount: 1,
  },
  {
    code: 'ONBOARDING_CHAMP',
    title: 'Platform Pioneer',
    description: 'Complete all initial onboarding learning tasks.',
    icon: '🌟',
    reward: 20,
    category: 'community',
    targetCount: 2,
  },
];

/**
 * Ensure default achievements are seeded in the database
 */
export async function ensureDefaultAchievements() {
  for (const ach of DEFAULT_ACHIEVEMENTS) {
    await Achievement.findOneAndUpdate(
      { code: ach.code },
      { $setOnInsert: ach },
      { upsert: true, new: true }
    );
  }
}

/**
 * Evaluate achievements for a student and claim any newly unlocked rewards
 */
export async function evaluateAndClaimAchievements(userId) {
  await ensureDefaultAchievements();

  const achievements = await Achievement.find({ isActive: true });
  const userClaims = await UserAchievement.find({ user: userId });
  const claimedCodes = new Set(userClaims.map((c) => c.achievementCode));

  // Count student's verified accomplishments
  const passedChallengesCount = await ChallengeSubmission.distinct('challenge', {
    user: userId,
    status: 'passed',
  });

  const approvedAssignmentsCount = await AssignmentSubmission.countDocuments({
    student: userId,
    status: 'APPROVED',
  });

  const completedTasksCount = await TaskCompletion.countDocuments({
    user: userId,
  });

  const newlyUnlocked = [];

  for (const ach of achievements) {
    if (claimedCodes.has(ach.code)) continue;

    let qualifies = false;

    if (ach.code === 'FIRST_CHALLENGE' && passedChallengesCount.length >= 1) qualifies = true;
    else if (ach.code === 'FIVE_CHALLENGES' && passedChallengesCount.length >= 5) qualifies = true;
    else if (ach.code === 'TEN_CHALLENGES' && passedChallengesCount.length >= 10) qualifies = true;
    else if (ach.code === 'FIRST_ASSIGNMENT' && approvedAssignmentsCount >= 1) qualifies = true;
    else if (ach.code === 'ONBOARDING_CHAMP' && completedTasksCount >= ach.targetCount) qualifies = true;

    if (qualifies) {
      try {
        // Record claim with unique index protection to prevent duplicate rewards
        const claimDoc = await UserAchievement.create({
          user: userId,
          achievement: ach._id,
          achievementCode: ach.code,
          tokensAwarded: ach.reward,
        });

        // Credit tokens atomically
        await creditTokens({
          userId,
          amount: ach.reward,
          type: 'ACHIEVEMENT_REWARD',
          description: `Achievement Unlocked: "${ach.title}" (+${ach.reward} tokens)`,
          relatedActivityId: ach._id,
          relatedActivityType: 'Achievement',
        });

        newlyUnlocked.push({
          achievement: ach,
          claim: claimDoc,
          reward: ach.reward,
        });
      } catch (claimErr) {
        // If duplicate key error (11000), skip silently
        if (claimErr.code !== 11000) {
          console.error(`Error claiming achievement ${ach.code}:`, claimErr);
        }
      }
    }
  }

  return newlyUnlocked;
}
