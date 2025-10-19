import {
  OutlineDocument,
  OutlineCollection,
  DocumentListResponse,
  CollectionListResponse,
  DocumentExportResponse,
} from './types.js';

export class OutlineClient {
  private apiUrl: string;
  private apiToken: string;
  private requestDelay: number = 100;

  constructor(apiUrl: string, apiToken: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(endpoint: string, body?: Record<string, any>): Promise<T> {
    const url = `${this.apiUrl}/api${endpoint}`;
    
    await this.sleep(this.requestDelay);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        console.warn(`Rate limit hit, waiting ${waitTime}ms before retry...`);
        await this.sleep(waitTime);
        return this.makeRequest<T>(endpoint, body);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Outline API error (${response.status}): ${errorText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw error;
    }
  }

  async getAllCollections(): Promise<OutlineCollection[]> {
    const allCollections: OutlineCollection[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.makeRequest<CollectionListResponse>('/collections.list', {
        limit,
        offset,
      });

      allCollections.push(...response.data);

      if (!response.pagination || response.data.length < limit) {
        break;
      }

      offset += limit;
    }

    return allCollections;
  }

  async getDocumentsForCollection(collectionId: string): Promise<OutlineDocument[]> {
    const allDocuments: OutlineDocument[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.makeRequest<DocumentListResponse>('/documents.list', {
        collectionId,
        limit,
        offset,
      });

      allDocuments.push(...response.data);

      if (!response.pagination || response.data.length < limit) {
        break;
      }

      offset += limit;
    }

    return allDocuments;
  }

  async exportDocument(documentId: string): Promise<string> {
    const response = await this.makeRequest<DocumentExportResponse>('/documents.export', {
      id: documentId,
    });
    return response.data;
  }

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }
}
