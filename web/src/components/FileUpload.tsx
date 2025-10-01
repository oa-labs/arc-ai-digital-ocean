import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { validateFile, FileUploadProgress } from '@/types/file';
import { s3Service } from '@/services/s3Service';

interface FileUploadProps {
  onUploadComplete: () => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);

      // Validate all files first
      const validatedFiles = acceptedFiles.map((file) => ({
        file,
        validation: validateFile(file),
      }));

      // Initialize upload progress for all files
      const initialProgress: FileUploadProgress[] = validatedFiles.map(({ file, validation }) => ({
        fileName: file.name,
        progress: 0,
        status: validation.valid ? 'uploading' : 'error',
        error: validation.error,
      }));

      setUploads(initialProgress);

      // Upload valid files
      for (let i = 0; i < validatedFiles.length; i++) {
        const { file, validation } = validatedFiles[i];

        if (!validation.valid) {
          continue;
        }

        try {
          await s3Service.uploadFile(file, (progress) => {
            setUploads((prev) =>
              prev.map((upload, idx) =>
                idx === i ? { ...upload, progress } : upload
              )
            );
          });

          setUploads((prev) =>
            prev.map((upload, idx) =>
              idx === i ? { ...upload, status: 'success', progress: 100 } : upload
            )
          );
        } catch (error) {
          setUploads((prev) =>
            prev.map((upload, idx) =>
              idx === i
                ? {
                    ...upload,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : upload
            )
          );
        }
      }

      setIsUploading(false);
      
      // Refresh file list if any uploads succeeded
      if (validatedFiles.some(({ validation }) => validation.valid)) {
        setTimeout(() => {
          onUploadComplete();
          setUploads([]);
        }, 2000);
      }
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  });

  const clearUploads = () => {
    setUploads([]);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-primary-600">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-700 mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported: PDF, Text, HTML (max 10MB)
            </p>
          </div>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Upload Progress</h3>
            {!isUploading && (
              <button
                onClick={clearUploads}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {uploads.map((upload, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {upload.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="truncate">{upload.fileName}</span>
                  </div>
                  <span className="text-gray-500 ml-2">
                    {upload.status === 'uploading' && `${upload.progress}%`}
                    {upload.status === 'success' && 'Complete'}
                    {upload.status === 'error' && 'Failed'}
                  </span>
                </div>
                {upload.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.error && (
                  <p className="text-xs text-red-600">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

