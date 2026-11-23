import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('codementor_access_secret_key_2026'),
  JWT_REFRESH_SECRET: z.string().default('codementor_refresh_secret_key_2026'),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  PISTON_API_URL: z.string().optional().default('https://emkc.org/api/v2/piston'),
  JUDGE0_API_URL: z.string().optional().default(''),
  JUDGE0_API_KEY: z.string().optional().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.warn('⚠️ Environment variable validation warnings:', parsedEnv.error.format());
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      PORT: parseInt(process.env.PORT || '5000', 10),
      NODE_ENV: process.env.NODE_ENV || 'development',
      MONGO_URI: process.env.MONGO_URI || '',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
      JWT_SECRET: process.env.JWT_SECRET || 'codementor_access_secret_key_2026',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'codementor_refresh_secret_key_2026',
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
      PISTON_API_URL: process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston',
      JUDGE0_API_URL: process.env.JUDGE0_API_URL || '',
      JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '',
    };
