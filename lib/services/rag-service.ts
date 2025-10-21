import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { RAGDocument, RAGSearchResult } from '../types/agent-types.js';

/**
 * Configuration for RAG service
 */
export interface RAGServiceConfig {
  s3Region: string;
  s3Endpoint: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
}

/**
 * Service for managing RAG (Retrieval-Augmented Generation) documents from S3
 */
export class RAGService {
  private client: S3Client;

  constructor(config: RAGServiceConfig) {
    this.client = new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey,
      },
      forcePathStyle: false,
    });
  }

  /**
   * Load all documents from an S3 bucket/prefix
   */
  async loadDocuments(bucket: string, prefix?: string): Promise<RAGDocument[]> {
    try {
      const documents: RAGDocument[] = [];

      // List all objects in the bucket/prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || '',
      });

      const listResponse = await this.client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log(`[RAG] No documents found in s3://${bucket}/${prefix || ''}`);
        return documents;
      }

      console.log(`[RAG] Found ${listResponse.Contents.length} documents in s3://${bucket}/${prefix || ''}`);

      // Load content for each document
      for (const item of listResponse.Contents) {
        if (!item.Key) continue;

        // Skip directories (keys ending with /)
        if (item.Key.endsWith('/')) continue;

        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: item.Key,
          });

          const getResponse = await this.client.send(getCommand);

          if (!getResponse.Body) {
            console.warn(`[RAG] No content for ${item.Key}`);
            continue;
          }

          // Convert stream to string
          const content = await this.streamToString(getResponse.Body);

          documents.push({
            key: item.Key,
            content,
            metadata: {
              lastModified: item.LastModified,
              size: item.Size,
              contentType: getResponse.ContentType,
            },
          });

          console.log(`[RAG] Loaded document: ${item.Key} (${item.Size} bytes)`);
        } catch (error) {
          console.error(`[RAG] Failed to load document ${item.Key}:`, error);
        }
      }

      console.log(`[RAG] Successfully loaded ${documents.length} documents`);
      return documents;
    } catch (error) {
      console.error('[RAG] Failed to load documents from S3:', error);
      throw new Error(`Failed to load RAG documents: ${error}`);
    }
  }

  /**
   * Search documents for relevant content
   * Currently uses simple keyword matching - can be enhanced with embeddings
   */
  async searchDocuments(
    documents: RAGDocument[],
    query: string,
    topK: number = 5
  ): Promise<RAGSearchResult[]> {
    if (documents.length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2);

    if (queryTerms.length === 0) {
      // No valid search terms, return top documents by size
      return documents
        .slice(0, topK)
        .map(doc => ({
          document: doc,
          relevanceScore: 0.5,
          excerpt: this.extractExcerpt(doc.content, 200),
        }));
    }

    // Score each document based on keyword matches
    const scoredDocuments = documents.map(doc => {
      const contentLower = doc.content.toLowerCase();
      let score = 0;

      // Count occurrences of each query term
      for (const term of queryTerms) {
        const regex = new RegExp(term, 'gi');
        const matches = contentLower.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      // Boost score if document key/name matches query
      const keyLower = doc.key.toLowerCase();
      for (const term of queryTerms) {
        if (keyLower.includes(term)) {
          score += 5; // Boost for filename match
        }
      }

      // Normalize score by document length
      const normalizedScore = score / (doc.content.length / 1000);

      return {
        document: doc,
        relevanceScore: normalizedScore,
        excerpt: this.extractRelevantExcerpt(doc.content, queryTerms, 300),
      };
    });

    // Sort by relevance score and return top K
    const results = scoredDocuments
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);

    console.log(`[RAG] Search for "${query}" returned ${results.length} results`);

    return results;
  }

  /**
   * Build context string from search results for AI prompt
   */
  buildContext(searchResults: RAGSearchResult[], maxLength: number = 4000): string {
    if (searchResults.length === 0) {
      return '';
    }

    const contextParts: string[] = [];
    let currentLength = 0;

    for (const result of searchResults) {
      const header = `\n--- Document: ${result.document.key} (Relevance: ${result.relevanceScore.toFixed(2)}) ---\n`;
      const content = result.excerpt || result.document.content;

      const part = header + content;

      if (currentLength + part.length > maxLength) {
        // Truncate to fit
        const remaining = maxLength - currentLength;
        if (remaining > 100) {
          contextParts.push(part.substring(0, remaining) + '\n...[truncated]');
        }
        break;
      }

      contextParts.push(part);
      currentLength += part.length;
    }

    return contextParts.join('\n');
  }

  /**
   * Extract a relevant excerpt from content based on query terms
   */
  private extractRelevantExcerpt(content: string, queryTerms: string[], maxLength: number): string {
    const contentLower = content.toLowerCase();

    // Find the first occurrence of any query term
    let firstMatchIndex = -1;
    for (const term of queryTerms) {
      const index = contentLower.indexOf(term);
      if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
        firstMatchIndex = index;
      }
    }

    if (firstMatchIndex === -1) {
      // No match found, return beginning
      return this.extractExcerpt(content, maxLength);
    }

    // Extract context around the match
    const start = Math.max(0, firstMatchIndex - maxLength / 2);
    const end = Math.min(content.length, start + maxLength);

    let excerpt = content.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) {
      excerpt = '...' + excerpt;
    }
    if (end < content.length) {
      excerpt = excerpt + '...';
    }

    return excerpt;
  }

  /**
   * Extract a simple excerpt from the beginning of content
   */
  private extractExcerpt(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Convert a readable stream to string
   */
  private async streamToString(stream: any): Promise<string> {
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    return buffer.toString('utf-8');
  }
}

/**
 * Create a RAG service instance from environment variables
 */
export function createRAGService(): RAGService | null {
  const s3Region = process.env.S3_REGION || process.env.VITE_S3_REGION;
  const s3Endpoint = process.env.S3_ENDPOINT || process.env.VITE_S3_ENDPOINT;
  const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.VITE_S3_ACCESS_KEY_ID;
  const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.VITE_S3_SECRET_ACCESS_KEY;

  if (!s3Region || !s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey) {
    console.warn('[RAG] S3 credentials not configured. RAG service will be disabled.');
    return null;
  }

  return new RAGService({
    s3Region,
    s3Endpoint,
    s3AccessKeyId,
    s3SecretAccessKey,
  });
}

