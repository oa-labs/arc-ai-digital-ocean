import { useState } from 'react';
import { FileText, Download, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { S3File } from '@/types/file';
import { s3Service } from '@/services/s3Service';

interface FileItemProps {
  file: S3File;
  onDelete: (file: S3File) => void;
  onRename: (file: S3File) => void;
}

export function FileItem({ file, onDelete, onRename }: FileItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const url = await s3Service.getFileUrl(file.key);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <FileText className="h-10 w-10 text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </h3>
          <p className="text-sm text-gray-500">
            {formatFileSize(file.size)} • {formatDate(file.lastModified)}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          onClick={() => onRename(file)}
          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Rename"
        >
          <Edit2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(file)}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

