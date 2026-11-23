import mongoose from 'mongoose';

const challengeSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'javascript',
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'error'],
      required: true,
    },
    passCount: {
      type: Number,
      default: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
    },
    testResults: [
      {
        testIndex: Number,
        passed: Boolean,
        actual: String,
        expected: String,
        error: String,
        isHidden: { type: Boolean, default: false },
      },
    ],
    tokensAwarded: {
      type: Number,
      default: 0,
    },
    executionTimeMs: {
      type: Number,
      default: 0,
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

challengeSubmissionSchema.index({ user: 1, challenge: 1 });
challengeSubmissionSchema.index({ user: 1, status: 1 });
challengeSubmissionSchema.index({ challenge: 1, status: 1 });

const ChallengeSubmission = mongoose.model('ChallengeSubmission', challengeSubmissionSchema);

export default ChallengeSubmission;
