import mongoose from 'mongoose';

const learningTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
    },
    type: {
      type: String,
      enum: ['tutorial', 'module', 'weekly_goal', 'onboarding'],
      default: 'onboarding',
    },
    reward: {
      type: Number,
      required: true,
      default: 10,
      min: [1, 'Reward must be at least 1 token'],
    },
    externalUrl: {
      type: String,
      default: '',
    },
    actionLabel: {
      type: String,
      default: 'Complete Task',
    },
    estimatedMinutes: {
      type: Number,
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
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

learningTaskSchema.index({ type: 1, isActive: 1 });

const LearningTask = mongoose.model('LearningTask', learningTaskSchema);

export default LearningTask;
