import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().default('aajori_super_secret_jwt_key_district_assam_2026'),
  JWT_EXPIRES_IN: z.string().default('30d'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  PAYMENT_GATEWAY_PROVIDER: z.string().default('MOCK'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().default('aajori_whatsapp_verify_token_2026'),
  AI_PROVIDER: z.string().default('MOCK'),
  DEFAULT_DISTRICT: z.string().default('Kamrup Metropolitan'),
  DEFAULT_CITY: z.string().default('Guwahati'),
  DEFAULT_LAT: z.coerce.number().default(26.1550),
  DEFAULT_LNG: z.coerce.number().default(91.7690),
});

export const env = envSchema.parse(process.env);
