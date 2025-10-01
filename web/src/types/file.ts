export interface S3File {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
  url?: string;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/html': ['.html', '.htm'],
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES;

export function isAllowedFileType(file: File): boolean {
  return Object.keys(ALLOWED_FILE_TYPES).includes(file.type);
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  if (!isAllowedFileType(file)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: PDF, Text, HTML`,
    };
  }

  return { valid: true };
}

