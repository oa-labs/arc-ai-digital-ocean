import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import { S3FileMetadata } from './types.js';

export class S3Storage {
  private client: S3Client;
  private bucket: string;

  constructor(region: string, endpoint: string, bucket: string, accessKeyId: string, secretAccessKey: string) {
    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });
    this.bucket = bucket;
  }

  async listAllFiles(prefix?: string): Promise<S3FileMetadata[]> {
    const files: S3FileMetadata[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.client.send(command);

      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key && item.ETag) {
            const metadata = await this.getFileMetadata(item.Key);
            if (metadata) {
              files.push(metadata);
            }
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return files;
  }

  async getFileMetadata(key: string): Promise<S3FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        hash: response.ETag?.replace(/"/g, '') || '',
        documentId: response.Metadata?.['document-id'] || '',
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  async uploadFile(key: string, content: string, documentId: string): Promise<void> {
    const hash = this.calculateHash(content);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: Buffer.from(content, 'utf-8'),
      ContentType: 'text/markdown',
      Metadata: {
        'document-id': documentId,
        'content-hash': hash,
      },
    });

    await this.client.send(command);
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(key);
    return metadata !== null;
  }

  calculateHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  async needsUpdate(key: string, newContent: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(key);
    
    if (!metadata) {
      return true;
    }

    const newHash = this.calculateHash(newContent);
    return metadata.hash !== newHash && metadata.hash !== `"${newHash}"`;
  }
}
