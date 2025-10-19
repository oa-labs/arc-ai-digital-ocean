import {
  OutlineDocument,
  OutlineUser,
  DocumentListResponse,
  DocumentUsersResponse,
  DocumentExportResponse,
} from './types.js';

export class OutlineClient {
  private apiUrl: string;
  private apiToken: string;

  constructor(apiUrl: string, apiToken: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
  }

  private async makeRequest<T>(endpoint: string, body?: Record<string, any>): Promise<T> {
    const url = `${this.apiUrl}/api${endpoint}`;
    
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

  async getAllUsers(): Promise<OutlineUser[]> {
    const response = await this.makeRequest<DocumentUsersResponse>('/documents.users');
    return response.data;
  }

  async getDocumentsForUser(userId: string): Promise<OutlineDocument[]> {
    const allDocuments: OutlineDocument[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.makeRequest<DocumentListResponse>('/documents.list', {
        userId,
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

  async getAllDocuments(): Promise<OutlineDocument[]> {
    const allDocuments: OutlineDocument[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.makeRequest<DocumentListResponse>('/documents.list', {
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
