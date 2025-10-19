import { OutlineClient } from './outline-client.js';
import { S3Storage } from './s3-client.js';
import { OutlineDocument, SyncResult } from './types.js';

export class SyncService {
  private outlineClient: OutlineClient;
  private s3Storage: S3Storage;

  constructor(outlineClient: OutlineClient, s3Storage: S3Storage) {
    this.outlineClient = outlineClient;
    this.s3Storage = s3Storage;
  }

  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      uploaded: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: [],
    };

    console.log('Starting sync...');

    try {
      console.log('Fetching all users from Outline...');
      const users = await this.outlineClient.getAllUsers();
      console.log(`Found ${users.length} users`);

      const userEmailMap = new Map<string, string>();
      for (const user of users) {
        userEmailMap.set(user.id, user.email);
      }

      console.log('Fetching all documents from Outline...');
      const documents = await this.outlineClient.getAllDocuments();
      console.log(`Found ${documents.length} documents`);

      const outlineDocumentKeys = new Set<string>();

      for (const doc of documents) {
        try {
          await this.syncDocument(doc, userEmailMap, outlineDocumentKeys, result);
        } catch (error) {
          const errorMsg = `Failed to sync document ${doc.id} (${doc.title}): ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      console.log('Checking for deleted documents in S3...');
      await this.cleanupDeletedDocuments(outlineDocumentKeys, result);

      console.log('Sync complete!');
      this.printSummary(result);

      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      result.errors.push(`Sync failed: ${error}`);
      throw error;
    }
  }

  private async syncDocument(
    doc: OutlineDocument,
    userEmailMap: Map<string, string>,
    outlineDocumentKeys: Set<string>,
    result: SyncResult
  ): Promise<void> {
    const userEmail = userEmailMap.get(doc.createdBy.id) || doc.createdBy.email || 'unknown';
    const sanitizedEmail = this.outlineClient.sanitizeFilename(userEmail);
    const sanitizedTitle = this.outlineClient.sanitizeFilename(doc.title || 'untitled');
    const s3Key = `${sanitizedEmail}/${sanitizedTitle}.md`;

    outlineDocumentKeys.add(s3Key);

    console.log(`Processing: ${s3Key}`);

    const markdown = await this.outlineClient.exportDocument(doc.id);

    const needsUpdate = await this.s3Storage.needsUpdate(s3Key, markdown);

    if (!needsUpdate) {
      console.log(`  ↳ Skipped (no changes)`);
      result.skipped++;
      return;
    }

    const fileExists = await this.s3Storage.fileExists(s3Key);

    await this.s3Storage.uploadFile(s3Key, markdown, doc.id);

    if (fileExists) {
      console.log(`  ↳ Updated`);
      result.updated++;
    } else {
      console.log(`  ↳ Uploaded`);
      result.uploaded++;
    }
  }

  private async cleanupDeletedDocuments(
    outlineDocumentKeys: Set<string>,
    result: SyncResult
  ): Promise<void> {
    const s3Files = await this.s3Storage.listAllFiles();

    for (const file of s3Files) {
      if (!outlineDocumentKeys.has(file.key)) {
        console.log(`Deleting orphaned file: ${file.key}`);
        try {
          await this.s3Storage.deleteFile(file.key);
          result.deleted++;
        } catch (error) {
          const errorMsg = `Failed to delete ${file.key}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }
    }
  }

  private printSummary(result: SyncResult): void {
    console.log('\n=== Sync Summary ===');
    console.log(`Uploaded: ${result.uploaded}`);
    console.log(`Updated: ${result.updated}`);
    console.log(`Deleted: ${result.deleted}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
  }
}
