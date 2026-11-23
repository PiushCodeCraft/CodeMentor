import crypto from 'node:crypto';
import mongoose from 'mongoose';

const paymentOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TokenPackage',
      required: true,
    },
    tokens: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      default: () => `idem_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      set: (v) => (!v ? `idem_${Date.now()}_${crypto.randomBytes(8).toString('hex')}` : v),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

paymentOrderSchema.pre('validate', function (next) {
  if (!this.idempotencyKey) {
    this.idempotencyKey = `idem_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  next();
});

paymentOrderSchema.index({ user: 1, createdAt: -1 });
paymentOrderSchema.index({ status: 1 });

const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);

export default PaymentOrder;
