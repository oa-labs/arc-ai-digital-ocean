import { createStorageService, type StorageConfig, type StorageService } from '@ichat-ocean/shared';
import { config } from '../env.js';
import { supabaseAdmin } from '../supabase.js';

interface AgentCredentials {
  s3_access_key_id_env_var?: string | null;
  s3_secret_key_env_var?: string | null;
}

interface BucketCacheEntry {
  service: StorageService;
  credentialsHash: string;
}

const bucketCache = new Map<string, BucketCacheEntry>();

function buildCredentialsHash(config: StorageConfig): string {
  return [config.accessKeyId, config.secretAccessKey, config.region, config.endpoint, config.bucket].join('::');
}

function resolveCredentials(agentCredentials: AgentCredentials[]): { accessKeyId: string; secretAccessKey: string } {
  for (const creds of agentCredentials) {
    if (creds.s3_access_key_id_env_var && creds.s3_secret_key_env_var) {
      const accessKeyId = process.env[creds.s3_access_key_id_env_var];
      const secretAccessKey = process.env[creds.s3_secret_key_env_var];

      if (accessKeyId && secretAccessKey) {
        return { accessKeyId, secretAccessKey };
      }
    }
  }

  return {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  };
}

async function loadBucketAgents(bucket: string): Promise<AgentCredentials[]> {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('s3_access_key_id_env_var, s3_secret_key_env_var')
    .eq('s3_bucket', bucket)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to load agent credentials: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Bucket not registered');
  }

  return data as AgentCredentials[];
}

export async function getStorageServiceForBucket(bucket: string): Promise<StorageService> {
  const agents = await loadBucketAgents(bucket);

  const credentials = resolveCredentials(agents);

  const storageConfig: StorageConfig = {
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    bucket,
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
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
