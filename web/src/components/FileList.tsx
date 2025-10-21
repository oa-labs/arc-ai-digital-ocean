import { useState } from 'react';
import { FileItem } from './FileItem';
import { DeleteConfirmation } from './DeleteConfirmation';
import { RenameModal } from './RenameModal';
import { S3File } from '@/types/file';
import { s3Service as defaultS3Service } from '@/services/s3Service';
import { FolderOpen } from 'lucide-react';

interface FileListProps {
  files: S3File[];
  onFileChange: () => void;
  loading: boolean;
  s3Service?: typeof defaultS3Service;
}

export function FileList({ files, onFileChange, loading, s3Service = defaultS3Service }: FileListProps) {
  const [fileToDelete, setFileToDelete] = useState<S3File | null>(null);
  const [fileToRename, setFileToRename] = useState<S3File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      await s3Service.deleteFile(fileToDelete.key);
      setFileToDelete(null);
      onFileChange();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async (newName: string) => {
    if (!fileToRename) return;

    setIsRenaming(true);
    try {
      await s3Service.renameFile(fileToRename.key, newName);
      setFileToRename(null);
      onFileChange();
    } catch (error) {
      console.error('Rename error:', error);
      alert('Failed to rename file');
    } finally {
      setIsRenaming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
        <p className="text-gray-500">Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {files
          .sort((a, b) => a.key.localeCompare(b.key))
          .map((file) => (
            <FileItem
              key={file.key}
              file={file}
              onDelete={setFileToDelete}
              onRename={setFileToRename}
            />
          ))}
      </div>

      {fileToDelete && (
        <DeleteConfirmation
          file={fileToDelete}
          onConfirm={handleDelete}
          onCancel={() => setFileToDelete(null)}
          isDeleting={isDeleting}
        />
      )}

      {fileToRename && (
        <RenameModal
          file={fileToRename}
          onConfirm={handleRename}
          onCancel={() => setFileToRename(null)}
          isRenaming={isRenaming}
        />
      )}
    </>
  );
}

