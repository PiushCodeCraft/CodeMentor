import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: function () {
        return this.to || this.from || null;
      },
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system mint/rewards
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: function () {
        return this.user || null;
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousBalance: {
      type: Number,
      default: 0,
    },
    newBalance: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      default: null,
    },
    relatedActivityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedActivityType: {
      type: String,
      enum: [
        'Request',
        'Challenge',
        'Assignment',
        'LearningTask',
        'Achievement',
        'PaymentOrder',
        'AdminAction',
        'None',
      ],
      default: 'None',
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
    },
    type: {
      type: String,
      enum: [
        // New Token Economy transaction types
        'REGISTRATION_BONUS',
        'PURCHASE',
        'CODING_CHALLENGE_REWARD',
        'ASSIGNMENT_REWARD',
        'LEARNING_TASK_REWARD',
        'ACHIEVEMENT_REWARD',
        'SESSION_USAGE',
        'ADMIN_CREDIT',
        'ADMIN_DEBIT',
        'REFUND',
        // Existing legacy transaction types for 100% backward compatibility
        'bounty_payout',
        'escrow_lock',
        'refund',
        'initial_grant',
        'reward_bonus',
      ],
      default: 'bounty_payout',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });
transactionSchema.index({ request: 1 });
transactionSchema.index({ relatedActivityId: 1 });
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
