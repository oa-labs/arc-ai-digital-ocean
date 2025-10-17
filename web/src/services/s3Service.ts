import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '@/config/env';
import { S3File } from '@/types/file';

class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: config.s3.region,
      endpoint: config.s3.endpoint,
      credentials: config.s3.credentials,
      forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
    });
    this.bucket = config.s3.bucket;
  }

  /**
   * List all files in the S3 bucket
   */
  async listFiles(): Promise<S3File[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
      });

      const response = await this.client.send(command);

      if (!response.Contents) {
        return [];
      }

      const files: S3File[] = await Promise.all(
        response.Contents.map(async (item) => {
          const key = item.Key || '';
          const name = key.split('/').pop() || key;

          return {
            key,
            name,
            size: item.Size || 0,
            lastModified: item.LastModified || new Date(),
          };
        })
      );

      return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files from S3');
    }
  }

  /**
    * Upload a file to S3
    */
   async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<S3File> {
     try {
       const key = `${Date.now()}-${file.name}`;

       // Convert File to Uint8Array for AWS SDK v3 compatibility
       const fileBuffer = await file.arrayBuffer();
       const uint8Array = new Uint8Array(fileBuffer);

       const command = new PutObjectCommand({
         Bucket: this.bucket,
         Key: key,
         Body: uint8Array,
         ContentType: file.type,
         ACL: 'private',
       });

       await this.client.send(command);

       // Simulate progress for better UX (AWS SDK v3 doesn't provide native progress)
       if (onProgress) {
         onProgress(100);
       }

       return {
         key,
         name: file.name,
         size: file.size,
         lastModified: new Date(),
       };
     } catch (error) {
       console.error('Error uploading file:', error);
       throw new Error(`Failed to upload file: ${file.name}`);
     }
   }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Rename a file in S3 (copy to new key and delete old)
   */
  async renameFile(oldKey: string, newName: string): Promise<S3File> {
    try {
      // Preserve the timestamp prefix if it exists
      const parts = oldKey.split('-');
      const hasTimestamp = parts.length > 1 && /^\d+$/.test(parts[0]);
      const newKey = hasTimestamp ? `${parts[0]}-${newName}` : newName;

      // Copy to new key
      const copyCommand = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${oldKey}`,
        Key: newKey,
      });

      await this.client.send(copyCommand);

      // Delete old key
      await this.deleteFile(oldKey);

      // Get file info
      const files = await this.listFiles();
      const renamedFile = files.find((f) => f.key === newKey);

      if (!renamedFile) {
        throw new Error('File renamed but not found in list');
      }

      return renamedFile;
    } catch (error) {
      console.error('Error renaming file:', error);
      throw new Error('Failed to rename file in S3');
    }
  }

  /**
   * Get a presigned URL for downloading a file
   */
  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating file URL:', error);
      throw new Error('Failed to generate file URL');
    }
  }
}

export const s3Service = new S3Service();

