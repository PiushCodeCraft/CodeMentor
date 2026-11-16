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
    };
