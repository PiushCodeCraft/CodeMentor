import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '🏆',
    },
    reward: {
      type: Number,
      required: true,
      default: 20,
      min: 1,
    },
    category: {
      type: String,
      enum: ['challenges', 'assignments', 'streak', 'community', 'general'],
      default: 'general',
    },
    targetCount: {
      type: Number,
      default: 1,
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

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
