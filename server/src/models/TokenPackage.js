import mongoose from 'mongoose';

const tokenPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tokens: {
      type: Number,
      required: true,
      min: [1, 'Tokens must be at least 1'],
    },
    price: {
      type: Number,
      required: true,
      min: [1, 'Price must be at least 1'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    badge: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
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

tokenPackageSchema.index({ isActive: 1, sortOrder: 1 });

const TokenPackage = mongoose.model('TokenPackage', tokenPackageSchema);

export default TokenPackage;
