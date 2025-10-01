import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_S3_REGION: z.string().min(1),
  VITE_S3_ENDPOINT: z.string().url(),
  VITE_S3_BUCKET: z.string().min(1),
  VITE_S3_ACCESS_KEY_ID: z.string().min(1),
  VITE_S3_SECRET_ACCESS_KEY: z.string().min(1),
});

function validateEnv() {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables. Please check your .env file.');
  }
}

export const env = validateEnv();

export const config = {
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  },
  s3: {
    region: env.VITE_S3_REGION,
    endpoint: env.VITE_S3_ENDPOINT,
    bucket: env.VITE_S3_BUCKET,
    credentials: {
      accessKeyId: env.VITE_S3_ACCESS_KEY_ID,
      secretAccessKey: env.VITE_S3_SECRET_ACCESS_KEY,
    },
  },
} as const;

