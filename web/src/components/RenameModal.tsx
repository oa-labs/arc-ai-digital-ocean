import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { S3File, getFileExtension } from '@/types/file';

interface RenameModalProps {
  file: S3File;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
  isRenaming: boolean;
}

export function RenameModal({
  file,
  onConfirm,
  onCancel,
  isRenaming,
}: RenameModalProps) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize with current filename (without extension)
    const extension = getFileExtension(file.name);
    const nameWithoutExt = extension
      ? file.name.slice(0, -extension.length)
      : file.name;
    setNewName(nameWithoutExt);
  }, [file.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = newName.trim();
    
    if (!trimmedName) {
      setError('File name cannot be empty');
      return;
    }

    if (trimmedName.includes('/') || trimmedName.includes('\\')) {
      setError('File name cannot contain / or \\');
      return;
    }

    // Preserve the original file extension
    const extension = getFileExtension(file.name);
    const finalName = extension ? `${trimmedName}${extension}` : trimmedName;

    onConfirm(finalName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Rename File</h2>
          <button
            onClick={onCancel}
            disabled={isRenaming}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="fileName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New file name
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="fileName"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setError('');
                }}
                disabled={isRenaming}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                placeholder="Enter new name"
                autoFocus
              />
              <span className="ml-2 text-gray-600">
                {getFileExtension(file.name)}
              </span>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <p className="mt-2 text-sm text-gray-500">
              Original: {file.name}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isRenaming}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRenaming || !newName.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

