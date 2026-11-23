import mongoose from 'mongoose';

const taskCompletionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningTask',
      required: true,
    },
    tokensAwarded: {
      type: Number,
      required: true,
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

// Enforce single completion per task per user
taskCompletionSchema.index({ user: 1, task: 1 }, { unique: true });

const TaskCompletion = mongoose.model('TaskCompletion', taskCompletionSchema);

export default TaskCompletion;
