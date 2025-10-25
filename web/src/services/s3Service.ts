import type { StoredObject } from '@arc-ai/shared';
import { config } from '@/config/env';
import { supabase } from '@/lib/supabase';
import { S3File } from '@/types/file';

export interface S3Config {
  bucket: string;
  baseUrl?: string;
}

export class S3Service {
  private bucket?: string;
  private readonly apiBaseUrl: string;

  constructor(config?: S3Config) {
    this.bucket = config?.bucket;
    const base = config?.baseUrl ?? configEnvApiBase();
    this.apiBaseUrl = this.buildApiBaseUrl(base);
  }

  /**
   * Build the API base URL with /api prefix
   */
  private buildApiBaseUrl(base: string): string {
    const normalized = normalizeBaseUrl(base);
    if (normalized) {
      // If a custom API base URL is configured, append /api prefix
      return `${normalized}/api`;
    }
    // Default to current origin with /api prefix if not specified
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/api`;
  }

  setBucket(bucket: string) {
    this.bucket = bucket;
  }

  async listFiles(): Promise<S3File[]> {
    const bucket = this.ensureBucket();
    const response = await this.request<{ files: StoredObject[] }>(
      `/storage/buckets/${encodeURIComponent(bucket)}/objects`,
      { method: 'GET' }
    );

    return (response.files || []).map(mapStoredObjectToS3File).sort((a, b) => {
      return b.lastModified.getTime() - a.lastModified.getTime();
    });
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<S3File> {
    const bucket = this.ensureBucket();
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.request<{ file: StoredObject }>(
      `/storage/buckets/${encodeURIComponent(bucket)}/objects`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (onProgress) {
      onProgress(100);
    }

    return mapStoredObjectToS3File(response.file);
  }

  async deleteFile(key: string): Promise<void> {
    const bucket = this.ensureBucket();
    await this.request(
      `/storage/buckets/${encodeURIComponent(bucket)}/objects`,
      {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      }
    );
  }

  async renameFile(oldKey: string, newName: string): Promise<S3File> {
    const bucket = this.ensureBucket();
    const response = await this.request<{ file: StoredObject }>(
      `/storage/buckets/${encodeURIComponent(bucket)}/rename`,
      {
        method: 'POST',
        body: JSON.stringify({ key: oldKey, newName }),
      }
    );

    return mapStoredObjectToS3File(response.file);
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const bucket = this.ensureBucket();
    const params = new URLSearchParams({ key, expiresIn: String(expiresIn) });
    const response = await this.request<{ url: string }>(
      `/storage/buckets/${encodeURIComponent(bucket)}/presign?${params.toString()}`,
      { method: 'GET' }
    );

    if (!response.url) {
      throw new Error('Failed to generate download URL');
    }

    return response.url;
  }

  private async request<T = unknown>(path: string, init: RequestInit): Promise<T> {
    const accessToken = await this.getAccessToken();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);

    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    if (!isFormData && init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(this.buildUrl(path), {
      ...init,
      headers,
    });

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) {
          message = errorBody.error;
        }
      } catch (err) {
        console.error('Failed to parse error response', err);
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  private async getAccessToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      throw new Error('User session not found');
    }

    return token;
  }

  private ensureBucket(): string {
    if (!this.bucket) {
      throw new Error('Bucket is not configured for storage operations');
    }
    return this.bucket;
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBaseUrl}${normalizedPath}`;
  }
}

function mapStoredObjectToS3File(object: StoredObject): S3File {
  return {
    key: object.key,
    name: object.name,
    size: object.size,
    lastModified: new Date(object.lastModified),
  };
}

function normalizeBaseUrl(base: string): string {
  if (!base) {
    return '';
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function configEnvApiBase(): string {
  return config.api.baseUrl || '';
}

export const s3Service = new S3Service();

export function createS3Service(s3Config: S3Config): S3Service {
  return new S3Service(s3Config);
}

