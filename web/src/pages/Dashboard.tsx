import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from '@/components/FileUpload';
import { FileList } from '@/components/FileList';
import { s3Service } from '@/services/s3Service';
import { S3File } from '@/types/file';
import { Cloud, LogOut, RefreshCw } from 'lucide-react';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fileList = await s3Service.listFiles();
      setFiles(fileList);
    } catch (error) {
      console.error('Error loading files:', error);
      alert('Failed to load files. Please check your S3 configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  S3 File Manager
                </h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Files
            </h2>
            <FileUpload onUploadComplete={loadFiles} />
          </section>

          {/* Files Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Files
                {!loading && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({files.length} {files.length === 1 ? 'file' : 'files'})
                  </span>
                )}
              </h2>
            </div>
            <FileList files={files} onFileChange={loadFiles} loading={loading} />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Secure file storage powered by DigitalOcean Spaces
          </p>
        </div>
      </footer>
    </div>
  );
}

