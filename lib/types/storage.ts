export interface StoredObject {
  key: string;
  name: string;
  size: number;
  lastModified: string;
}

export interface UploadObjectResult {
  file: StoredObject;
}

export interface ListObjectsResult {
  files: StoredObject[];
}

export interface PresignedUrlResult {
  url: string;
  expiresIn: number;
}
