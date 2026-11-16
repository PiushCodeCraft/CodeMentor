import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: [true, 'Request reference is required'],
      unique: true, // 1-to-1 relationship with Request
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor reference is required'],
    },
    codeSnapshot: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'javascript',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
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

sessionSchema.index({ student: 1, createdAt: -1 });
sessionSchema.index({ mentor: 1, createdAt: -1 });
sessionSchema.index({ status: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;

