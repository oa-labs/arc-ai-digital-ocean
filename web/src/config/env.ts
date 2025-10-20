import { z } from 'zod';

// Extend Window interface to include runtime ENV
declare global {
  interface Window {
    ENV?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_S3_REGION?: string;
      VITE_S3_ENDPOINT?: string;
      VITE_S3_BUCKET?: string;
      VITE_S3_ACCESS_KEY_ID?: string;
      VITE_S3_SECRET_ACCESS_KEY?: string;
      VITE_APP_URL?: string;
    };
  }
}

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_S3_REGION: z.string().min(1),
  VITE_S3_ENDPOINT: z.string().url(),
  VITE_S3_BUCKET: z.string().min(1),
  VITE_S3_ACCESS_KEY_ID: z.string().min(1),
  VITE_S3_SECRET_ACCESS_KEY: z.string().min(1),
  VITE_APP_URL: z.string().url().optional(),
});

function getEnvValue(key: keyof typeof envSchema.shape): string | undefined {
  // First try runtime config (window.ENV), then fall back to build-time (import.meta.env)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  return import.meta.env[key];
}

function validateEnv() {
  try {
    const envValues = {
      VITE_SUPABASE_URL: getEnvValue('VITE_SUPABASE_URL'),
      VITE_SUPABASE_ANON_KEY: getEnvValue('VITE_SUPABASE_ANON_KEY'),
      VITE_S3_REGION: getEnvValue('VITE_S3_REGION'),
      VITE_S3_ENDPOINT: getEnvValue('VITE_S3_ENDPOINT'),
      VITE_S3_BUCKET: getEnvValue('VITE_S3_BUCKET'),
      VITE_S3_ACCESS_KEY_ID: getEnvValue('VITE_S3_ACCESS_KEY_ID'),
      VITE_S3_SECRET_ACCESS_KEY: getEnvValue('VITE_S3_SECRET_ACCESS_KEY'),
      VITE_APP_URL: getEnvValue('VITE_APP_URL'),
    };
    return envSchema.parse(envValues);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables. Please check your .env file or runtime config.');
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
  app: {
    url: env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  },
} as const;

