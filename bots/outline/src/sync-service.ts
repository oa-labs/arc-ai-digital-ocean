import { OutlineClient } from './outline-client.js';
import { S3Storage } from './s3-client.js';
import { OutlineDocument, OutlineCollection, SyncResult } from './types.js';

export class SyncService {
  private outlineClient: OutlineClient;
  private s3Storage: S3Storage;
  private collectionBlacklist: string[];

  constructor(outlineClient: OutlineClient, s3Storage: S3Storage, collectionBlacklist: string[] = []) {
    this.outlineClient = outlineClient;
    this.s3Storage = s3Storage;
    this.collectionBlacklist = collectionBlacklist;
  }

  private isCollectionBlacklisted(collectionName: string): boolean {
    const normalizedName = collectionName.toLowerCase();
    return this.collectionBlacklist.includes(normalizedName);
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
      console.log('Fetching all collections from Outline...');
      const collections = await this.outlineClient.getAllCollections();
      console.log(`Found ${collections.length} collections`);

      const collectionMap = new Map<string, string>();
      for (const collection of collections) {
        collectionMap.set(collection.id, collection.name);
      }

      const outlineDocumentKeys = new Set<string>();

      for (const collection of collections) {
        if (this.isCollectionBlacklisted(collection.name)) {
          console.log(`\nSkipping blacklisted collection: ${collection.name}`);
          continue;
        }

        console.log(`\nProcessing collection: ${collection.name}`);
        
        try {
          const documents = await this.outlineClient.getDocumentsForCollection(collection.id);
          console.log(`  Found ${documents.length} documents`);

          for (const doc of documents) {
            try {
              await this.syncDocument(doc, collection, outlineDocumentKeys, result);
            } catch (error) {
              const errorMsg = `Failed to sync document ${doc.id} (${doc.title}): ${error}`;
              console.error(errorMsg);
              result.errors.push(errorMsg);
            }
          }
        } catch (error) {
          const errorMsg = `Failed to fetch documents for collection ${collection.name}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      console.log('\nChecking for deleted documents in S3...');
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
    collection: OutlineCollection,
    outlineDocumentKeys: Set<string>,
    result: SyncResult
  ): Promise<void> {
    const sanitizedCollection = this.outlineClient.sanitizeFilename(collection.name);
    const sanitizedTitle = this.outlineClient.sanitizeFilename(doc.title || 'untitled');
    const s3Key = `${sanitizedCollection}/${sanitizedTitle}.md`;

    outlineDocumentKeys.add(s3Key);

    console.log(`  Processing: ${s3Key}`);

    const markdown = await this.outlineClient.exportDocument(doc.id);

    const needsUpdate = await this.s3Storage.needsUpdate(s3Key, markdown);

    if (!needsUpdate) {
      console.log(`    ↳ Skipped (no changes)`);
      result.skipped++;
      return;
    }

    const fileExists = await this.s3Storage.fileExists(s3Key);

    await this.s3Storage.uploadFile(s3Key, markdown, doc.id);

    if (fileExists) {
      console.log(`    ↳ Updated`);
      result.updated++;
    } else {
      console.log(`    ↳ Uploaded`);
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
