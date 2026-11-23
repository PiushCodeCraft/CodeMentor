import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: 150,
    },
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
    },
    reward: {
      type: Number,
      required: true,
      default: 15,
      min: [1, 'Reward must be at least 1 token'],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    category: {
      type: String,
      default: 'Full Stack',
      trim: true,
    },
    deliverables: {
      type: String,
      default: 'GitHub repository URL and optional live deployment or detailed project notes',
    },
    deadline: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

assignmentSchema.index({ difficulty: 1, isActive: 1 });
assignmentSchema.index({ category: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
