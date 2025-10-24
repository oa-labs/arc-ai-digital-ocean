import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.string().optional(),
  STORAGE_DOWNLOAD_URL_TTL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missingKeys = parsed.error.errors
    .filter(err => err.message === 'Required')
    .map(err => err.path.join('.'))
    .filter(key => key); // Ensure non-empty keys

  console.error('Invalid environment configuration');
  if (missingKeys.length > 0) {
    console.error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
  console.error('Please check your .env file in the server directory and ensure all required variables are set.');
  console.error('You can use .env.example in the root directory as a reference to set up your environment variables.');
  throw new Error('Invalid environment configuration');
}

const env = parsed.data;

const forcePathStyle = env.S3_FORCE_PATH_STYLE ? env.S3_FORCE_PATH_STYLE.toLowerCase() === 'true' : false;
const downloadUrlTtl = env.STORAGE_DOWNLOAD_URL_TTL ? Number(env.STORAGE_DOWNLOAD_URL_TTL) : 3600;

export const config = {
  port: env.PORT ? Number(env.PORT) : 4000,
  corsOrigin: env.CORS_ORIGIN,
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  s3: {
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    forcePathStyle,
  },
  storage: {
    downloadUrlTtl: Number.isFinite(downloadUrlTtl) && downloadUrlTtl > 0 ? downloadUrlTtl : 3600,
  },
} as const;
