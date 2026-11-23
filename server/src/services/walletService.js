import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { getIO } from '../sockets/index.js';

/**
 * Broadcast real-time wallet update to the user's socket room
 */
function broadcastWalletUpdate(userId, payload) {
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('wallet:update', payload);
    }
  } catch {
    // Ignore when socket.io is not running (e.g. standalone tests)
  }
}

/**
 * Custom error for insufficient token balances
 */
export class InsufficientTokensError extends Error {
  constructor(message = 'Insufficient token balance', currentBalance = 0, requiredAmount = 0) {
    super(message);
    this.name = 'InsufficientTokensError';
    this.statusCode = 400;
    this.code = 'INSUFFICIENT_TOKENS';
    this.currentBalance = currentBalance;
    this.requiredAmount = requiredAmount;
  }
}

/**
 * Atomically credit tokens to a user's wallet and log transaction
 */
export async function creditTokens({
  userId,
  amount,
  type,
  description = '',
  relatedActivityId = null,
  relatedActivityType = 'None',
  session = null,
}) {
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw new Error('Credit amount must be greater than zero.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const previousBalance = user.credits || 0;

  // Atomic increment in MongoDB
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: numericAmount } },
    { new: true, session }
  );

  const newBalance = updatedUser.credits;

  // Create audit transaction record
  const transactionDocs = await Transaction.create(
    [
      {
        user: userId,
        to: userId,
        from: null,
        amount: numericAmount,
        previousBalance,
        newBalance,
        description: description || `Credited ${numericAmount} tokens via ${type}`,
        type,
        relatedActivityId,
        relatedActivityType,
        status: 'completed',
      },
    ],
    session ? { session } : {}
  );

  const transaction = transactionDocs[0];

  broadcastWalletUpdate(userId, {
    credits: newBalance,
    balance: newBalance,
    availableBalance: newBalance,
    previousBalance,
    amount: numericAmount,
    type,
    description,
    transaction,
  });

  return {
    user: updatedUser,
    transaction,
    previousBalance,
    newBalance,
  };
}

/**
 * Atomically debit tokens from a user's wallet with race-condition prevention
 */
export async function debitTokens({
  userId,
  amount,
  type,
  description = '',
  relatedActivityId = null,
  relatedActivityType = 'None',
  session = null,
}) {
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw new Error('Debit amount must be greater than zero.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const currentBalance = user.credits || 0;
  if (currentBalance < numericAmount) {
    throw new InsufficientTokensError(
      `Insufficient tokens. Available: ${currentBalance}, Required: ${numericAmount}`,
      currentBalance,
      numericAmount
    );
  }

  // Atomic conditional decrement: strictly prevents negative balance even under concurrent requests
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: numericAmount } },
    { $inc: { credits: -numericAmount } },
    { new: true, session }
  );

  if (!updatedUser) {
    throw new InsufficientTokensError(
      `Concurrent balance check failed. Insufficient tokens.`,
      user.credits || 0,
      numericAmount
    );
  }

  const previousBalance = currentBalance;
  const newBalance = updatedUser.credits;

  const transactionDocs = await Transaction.create(
    [
      {
        user: userId,
        from: userId,
        to: null,
        amount: numericAmount,
        previousBalance,
        newBalance,
        description: description || `Debited ${numericAmount} tokens for ${type}`,
        type,
        relatedActivityId,
        relatedActivityType,
        status: 'completed',
      },
    ],
    session ? { session } : {}
  );

  const transaction = transactionDocs[0];

  broadcastWalletUpdate(userId, {
    credits: newBalance,
    balance: newBalance,
    availableBalance: newBalance,
    previousBalance,
    amount: numericAmount,
    type,
    description,
    transaction,
  });

  return {
    user: updatedUser,
    transaction,
    previousBalance,
    newBalance,
  };
}

/**
 * Get comprehensive wallet metrics, statistics, and transaction breakdown
 */
export async function getWalletStats(userId) {
  const user = await User.findById(userId).select('name email role credits');
  if (!user) {
    throw new Error('User not found.');
  }

  const transactions = await Transaction.find({
    $or: [{ user: userId }, { to: userId }, { from: userId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  let totalEarned = 0;
  let totalPurchased = 0;
  let totalSpent = 0;

  for (const t of transactions) {
    const isUserCredit =
      (t.to && t.to.toString() === userId.toString()) ||
      (t.user &&
        t.user.toString() === userId.toString() &&
        !['SESSION_USAGE', 'ADMIN_DEBIT', 'escrow_lock'].includes(t.type));

    if (t.type === 'PURCHASE') {
      totalPurchased += t.amount;
    } else if (
      [
        'REGISTRATION_BONUS',
        'CODING_CHALLENGE_REWARD',
        'ASSIGNMENT_REWARD',
        'LEARNING_TASK_REWARD',
        'ACHIEVEMENT_REWARD',
        'bounty_payout',
        'ADMIN_CREDIT',
        'reward_bonus',
        'REFUND',
      ].includes(t.type)
    ) {
      totalEarned += t.amount;
    } else if (
      ['SESSION_USAGE', 'ADMIN_DEBIT', 'escrow_lock'].includes(t.type) ||
      (!isUserCredit && t.from && t.from.toString() === userId.toString())
    ) {
      totalSpent += t.amount;
    }
  }

  const availableBalance = user.credits || 0;

  return {
    balance: availableBalance,
    currentBalance: availableBalance,
    availableBalance,
    totalEarned,
    totalPurchased,
    totalSpent,
    totalTransactions: transactions.length,
    recentTransactions: transactions.slice(0, 10),
  };
}
