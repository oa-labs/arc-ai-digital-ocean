import { createStorageService, type StorageConfig, type StorageService } from '@arc-ai/shared';
import { config } from '../env.js';
import { supabaseAdmin } from '../supabase.js';

interface BucketCacheEntry {
  service: StorageService;
  credentialsHash: string;
}

const bucketCache = new Map<string, BucketCacheEntry>();

function buildCredentialsHash(config: StorageConfig): string {
  return [config.accessKeyId, config.secretAccessKey, config.region, config.endpoint, config.bucket].join('::');
}

async function verifyBucketRegistered(bucket: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('s3_bucket', bucket)
    .eq('is_active', true)
    .limit(1);

  if (error) {
    throw new Error(`Failed to verify bucket registration: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Bucket not registered');
  }
}

export async function getStorageServiceForBucket(bucket: string): Promise<StorageService> {
  await verifyBucketRegistered(bucket);

  const storageConfig: StorageConfig = {
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    bucket,
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
    forcePathStyle: config.s3.forcePathStyle,
  };

  const hash = buildCredentialsHash(storageConfig);
  const cached = bucketCache.get(bucket);

  if (cached && cached.credentialsHash === hash) {
    return cached.service;
  }

  const service = createStorageService(storageConfig);
  bucketCache.set(bucket, { service, credentialsHash: hash });
  return service;
}
