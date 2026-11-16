import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session reference is required'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    line: {
      type: Number,
      required: [true, 'Line number is required'],
      min: [1, 'Line number must be at least 1'],
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
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

// Compound index defined in Section 9.3
commentSchema.index({ session: 1, createdAt: 1 });
commentSchema.index({ session: 1, line: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

