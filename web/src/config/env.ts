import { z } from 'zod';

// Extend Window interface to include runtime ENV
declare global {
  interface Window {
    ENV?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_APP_URL?: string;
      VITE_API_BASE_URL?: string;
    };
  }
}

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_APP_URL: z.string().url().optional().or(z.literal('')).optional(),
  VITE_API_BASE_URL: z.string().min(1).optional(),
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
      VITE_APP_URL: getEnvValue('VITE_APP_URL'),
      VITE_API_BASE_URL: getEnvValue('VITE_API_BASE_URL'),
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
  app: {
    url: env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  },
  api: {
    baseUrl: env.VITE_API_BASE_URL || '',
  },
} as const;

