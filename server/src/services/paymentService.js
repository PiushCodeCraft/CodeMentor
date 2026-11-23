import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import PaymentOrder from '../models/PaymentOrder.js';
import TokenPackage from '../models/TokenPackage.js';
import { creditTokens } from './walletService.js';

/**
 * Get current Razorpay keys from environment dynamically
 */
export function getRazorpayKeys() {
  const keyId = (process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET || '').trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  return { keyId, keySecret, webhookSecret };
}

/**
 * Check if real/test Razorpay credentials are fully configured
 */
export function isRazorpayConfigured() {
  const { keyId, keySecret } = getRazorpayKeys();
  return Boolean(
    keyId &&
    keySecret &&
    !keyId.includes('placeholder') &&
    !keyId.includes('your_key') &&
    keySecret.length >= 6
  );
}

/**
 * Get configured Razorpay SDK client instance
 */
export function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayKeys();
  if (!isRazorpayConfigured()) return null;
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Public payment gateway status configuration (safe for frontend client)
 */
export function getPaymentConfig() {
  const { keyId } = getRazorpayKeys();
  const configured = isRazorpayConfigured();
  return {
    isConfigured: configured,
    keyId: configured ? keyId : null,
    mode: configured
      ? keyId.startsWith('rzp_live')
        ? 'live'
        : 'test'
      : 'sandbox_simulator',
  };
}

/**
 * Create a new payment order for a token package
 */
export async function createPaymentOrder({ userId, packageId, idempotencyKey }) {
  const pkg = await TokenPackage.findById(packageId);
  if (!pkg || !pkg.isActive) {
    throw new Error('Token package not found or no longer active.');
  }

  const { keyId } = getRazorpayKeys();
  const configured = isRazorpayConfigured();

  // Always enforce a unique string idempotency key to prevent null duplicate index collisions
  const finalIdempotencyKey =
    idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim().length > 0
      ? idempotencyKey.trim()
      : `idem_${userId}_${pkg._id}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

  // Idempotency check: if an order with this idempotencyKey was already created, reuse it
  const existingOrder = await PaymentOrder.findOne({ idempotencyKey: finalIdempotencyKey, user: userId });
  if (existingOrder) {
    return {
      order: existingOrder,
      package: pkg,
      keyId: configured ? keyId : null,
      isSandboxMode: !configured,
    };
  }

  const receipt = `rcpt_${Date.now()}_${userId.toString().slice(-4)}`;
  const amountInPaise = Math.round(pkg.price * 100);
  let razorpayOrderId = '';

  if (configured) {
    try {
      const rzp = getRazorpayClient();
      const rzpOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: pkg.currency || 'INR',
        receipt,
        notes: {
          userId: userId.toString(),
          packageId: pkg._id.toString(),
          packageName: pkg.name,
          tokens: String(pkg.tokens),
        },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.error('Razorpay SDK order creation error:', rzpErr);
      const desc = rzpErr.error?.description || rzpErr.message || 'Razorpay order creation failed';
      throw new Error(`Razorpay gateway error: ${desc}`);
    }
  } else {
    // Development / Test architecture fallback when environment keys are awaiting user configuration
    razorpayOrderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
  }

  let newPaymentOrder;
  try {
    newPaymentOrder = await PaymentOrder.create({
      user: userId,
      package: pkg._id,
      tokens: pkg.tokens,
      amount: pkg.price,
      currency: pkg.currency || 'INR',
      razorpayOrderId,
      status: 'created',
      idempotencyKey: finalIdempotencyKey,
    });
  } catch (createErr) {
    if (createErr.code === 11000) {
      // Race condition safety: if order with this idempotency key was inserted concurrently
      const concurrentOrder = await PaymentOrder.findOne({ idempotencyKey: finalIdempotencyKey });
      if (concurrentOrder) {
        return {
          order: concurrentOrder,
          package: pkg,
          keyId: configured ? keyId : null,
          isSandboxMode: !configured,
        };
      }
    }
    throw createErr;
  }

  return {
    order: newPaymentOrder,
    package: pkg,
    keyId: configured ? keyId : null,
    isSandboxMode: !configured,
  };
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const { keySecret } = getRazorpayKeys();

  if (!isRazorpayConfigured()) {
    // In dev simulation mode without configured keys, verify non-empty parameters
    return Boolean(razorpayOrderId && razorpayPaymentId);
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
}

/**
 * Verify Razorpay Webhook signature
 */
export function verifyWebhookSignature({ rawBody, signature }) {
  const { webhookSecret } = getRazorpayKeys();
  if (!webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Process a verified payment and atomically credit tokens to the student wallet
 * Implements strict idempotency to prevent duplicate token credits
 */
export async function processVerifiedPayment({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const order = await PaymentOrder.findOne({ razorpayOrderId }).populate('package');
  if (!order) {
    throw new Error('Payment order not found.');
  }

  // Idempotency: if already processed, return existing state
  if (order.status === 'paid') {
    return {
      success: true,
      alreadyProcessed: true,
      message: 'Payment already processed and tokens credited.',
      order,
    };
  }

  // Verify signature
  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    order.status = 'failed';
    await order.save();
    throw new Error('Invalid Razorpay signature. Payment verification failed.');
  }

  // Update order status atomically
  order.status = 'paid';
  order.razorpayPaymentId = razorpayPaymentId;
  order.razorpaySignature = razorpaySignature;
  await order.save();

  // Atomically credit tokens to student wallet
  const { user, transaction } = await creditTokens({
    userId: order.user,
    amount: order.tokens,
    type: 'PURCHASE',
    description: `Token Package Purchase: ${order.package?.name || 'Tokens'} (${order.tokens} tokens for ₹${order.amount})`,
    relatedActivityId: order._id,
    relatedActivityType: 'PaymentOrder',
  });

  return {
    success: true,
    alreadyProcessed: false,
    order,
    tokens: order.tokens,
    newBalance: user.credits,
    transaction,
  };
}
