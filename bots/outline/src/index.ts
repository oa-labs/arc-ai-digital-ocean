import * as dotenv from 'dotenv';
import { OutlineClient } from './outline-client.js';
import { S3Storage } from './s3-client.js';
import { SyncService } from './sync-service.js';

dotenv.config();

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  try {
    console.log('Outline → S3 Sync Service');
    console.log('==========================\n');

    const outlineApiUrl = getRequiredEnv('OUTLINE_API_URL');
    const outlineApiToken = getRequiredEnv('OUTLINE_API_TOKEN');

    const s3Region = getRequiredEnv('S3_REGION');
    const s3Endpoint = getRequiredEnv('S3_ENDPOINT');
    const s3Bucket = getRequiredEnv('S3_BUCKET');
    const s3AccessKeyId = getRequiredEnv('S3_ACCESS_KEY_ID');
    const s3SecretAccessKey = getRequiredEnv('S3_SECRET_ACCESS_KEY');

    const collectionBlacklist = process.env.COLLECTION_BLACKLIST
      ?.split(',')
      .map(name => name.trim().toLowerCase())
      .filter(name => name.length > 0) || [];

    if (collectionBlacklist.length > 0) {
      console.log(`Blacklisted collections: ${collectionBlacklist.join(', ')}\n`);
    }

    const outlineClient = new OutlineClient(outlineApiUrl, outlineApiToken);
    const s3Storage = new S3Storage(
      s3Region,
      s3Endpoint,
      s3Bucket,
      s3AccessKeyId,
      s3SecretAccessKey
    );

    const syncService = new SyncService(outlineClient, s3Storage, collectionBlacklist);

    await syncService.syncAll();

    console.log('\n✓ Sync completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Sync failed:', error);
    process.exit(1);
  }
}

main();
