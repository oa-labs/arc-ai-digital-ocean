import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
  ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StoredObject } from '../types/storage.js';

export interface StorageConfig {
  region: string;
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

export interface UploadOptions {
  key?: string;
  contentType?: string;
  acl?: 'private' | 'public-read';
}

export class StorageService {
  private client: S3Client;
  private bucket: string;

  constructor(private readonly config: StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? false,
    });
  }

  async listObjects(options: { prefix?: string } = {}): Promise<StoredObject[]> {
    const params: ListObjectsV2CommandInput = {
      Bucket: this.bucket,
      Prefix: options.prefix,
    };

    const command = new ListObjectsV2Command(params);
    const response = await this.client.send(command);

    if (!response.Contents) {
      return [];
    }

    return response.Contents.filter((item) => Boolean(item.Key)).map((item) => {
      const key = item.Key!;
      const name = key.split('/').pop() || key;

      return {
        key,
        name,
        size: item.Size ?? 0,
        lastModified: (item.LastModified || new Date()).toISOString(),
      } satisfies StoredObject;
    });
  }

  async uploadObject(buffer: Buffer | Uint8Array, fileName: string, options: UploadOptions = {}): Promise<StoredObject> {
    const key = options.key || `${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: options.contentType,
      ACL: options.acl ?? 'private',
    });

    await this.client.send(command);

    return {
      key,
      name: fileName,
      size: buffer.length,
      lastModified: new Date().toISOString(),
    } satisfies StoredObject;
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async renameObject(oldKey: string, newName: string): Promise<StoredObject> {
    const parts = oldKey.split('-');
    const hasTimestamp = parts.length > 1 && /^\d+$/.test(parts[0]);
    const newKey = hasTimestamp ? `${parts[0]}-${newName}` : newName;

    const copyCommand = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${oldKey}`,
      Key: newKey,
    });

    await this.client.send(copyCommand);

    await this.deleteObject(oldKey);

    const files = await this.listObjects();
    const renamed = files.find((file) => file.key === newKey);

    if (!renamed) {
      return {
        key: newKey,
        name: newName,
        size: 0,
        lastModified: new Date().toISOString(),
      } satisfies StoredObject;
    }

    return renamed;
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}

export function createStorageService(config: StorageConfig): StorageService {
  return new StorageService(config);
}
