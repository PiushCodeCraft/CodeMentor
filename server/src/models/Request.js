import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    code: {
      type: String,
      required: [true, 'Code snippet is required'],
    },
    repoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    tech: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price in credits cannot be negative'],
    },
    status: {
      type: String,
      enum: ['open', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    aiSummary: {
      type: String,
      default: '',
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

// Indexes defined in Section 9.3
requestSchema.index({ status: 1, tech: 1, createdAt: -1 });
requestSchema.index({ title: 'text', description: 'text' });
requestSchema.index({ student: 1 });
requestSchema.index({ mentor: 1 });

const Request = mongoose.model('Request', requestSchema);

export default Request;

