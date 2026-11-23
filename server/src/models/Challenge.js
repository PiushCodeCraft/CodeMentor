import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    reward: {
      type: Number,
      required: true,
      default: function () {
        if (this.difficulty === 'intermediate') return 10;
        if (this.difficulty === 'advanced') return 20;
        return 5;
      },
      min: [1, 'Reward must be at least 1 token'],
    },
    category: {
      type: String,
      default: 'Algorithms',
      trim: true,
    },
    language: {
      type: String,
      default: 'javascript',
    },
    functionName: {
      type: String,
      required: true,
      default: 'solution',
    },
    starterCode: {
      type: String,
      required: true,
    },
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String, default: '' },
      },
    ],
    constraints: [{ type: String }],
    testCases: [
      {
        input: { type: String, required: true }, // JSON-encoded string or argument list
        expectedOutput: { type: String, required: true }, // JSON-encoded expected return
        isHidden: { type: Boolean, default: false },
      },
    ],
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

challengeSchema.index({ difficulty: 1, isActive: 1 });
challengeSchema.index({ category: 1 });

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
