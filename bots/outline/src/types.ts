export interface OutlineCollection {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutlineDocument {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  collectionId: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CollectionListResponse {
  data: OutlineCollection[];
  pagination?: {
    offset: number;
    limit: number;
  };
}

export interface DocumentListResponse {
  data: OutlineDocument[];
  pagination?: {
    offset: number;
    limit: number;
  };
}

export interface DocumentExportResponse {
  data: string;
}

export interface S3FileMetadata {
  key: string;
  hash: string;
  documentId: string;
  lastModified: Date;
}

export interface SyncResult {
  uploaded: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: string[];
}
