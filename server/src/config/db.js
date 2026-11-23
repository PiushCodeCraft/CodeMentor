import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { env } from './env.js';

export const migrateLegacyPaymentOrders = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const collection = db.collection('paymentorders');
    const cursor = collection.find({
      $or: [{ idempotencyKey: null }, { idempotencyKey: { $exists: false } }],
    });
    const orders = await cursor.toArray();
    for (const order of orders) {
      await collection.updateOne(
        { _id: order._id },
        {
          $set: {
            idempotencyKey: `idem_legacy_${order._id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          },
        }
      );
    }
  } catch {
    // Non-blocking migration
  }
};

export const connectDB = async () => {
  const uri = env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is missing in environment variables. Please check your .env file.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await migrateLegacyPaymentOrders();
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

