import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from '@/components/FileUpload';
import { FileList } from '@/components/FileList';
import { createS3Service, type S3Config } from '@/services/s3Service';
import { agentManagementService, Agent } from '@/services/agentManagementService';
import { S3File } from '@/types/file';
import { Cloud, LogOut, RefreshCw, Bot, ArrowLeft, AlertCircle, Users } from 'lucide-react';
import { config } from '@/config/env';

export function BucketDetail() {
  const { bucketName } = useParams<{ bucketName: string }>();
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const decodedBucketName = bucketName ? decodeURIComponent(bucketName) : '';

  const s3Service = useMemo(() => {
    if (!decodedBucketName) return null;

    const s3Config: S3Config = {
      bucket: decodedBucketName,
      baseUrl: config.api.baseUrl,
    };

    return createS3Service(s3Config);
  }, [decodedBucketName]);

  useEffect(() => {
    const loadBucketInfo = async () => {
      if (!decodedBucketName) {
        setError('Bucket name is required');
        setLoading(false);
        return;
      }

      try {
        // Load agents that use this bucket
        const buckets = await agentManagementService.getS3Buckets();
        const bucketAgents = buckets.get(decodedBucketName);

        if (!bucketAgents || bucketAgents.length === 0) {
          setError('No agents found for this bucket');
          setLoading(false);
          return;
        }

        setAgents(bucketAgents);
      } catch (err) {
        console.error('Error loading bucket info:', err);
        setError('Failed to load bucket information');
      } finally {
        setLoading(false);
      }
    };

    loadBucketInfo();
  }, [decodedBucketName]);

  const loadFiles = async () => {
    if (!s3Service) return;

    try {
      setLoading(true);
      setError(null);
      const fileList = await s3Service.listFiles();
      setFiles(fileList);
    } catch (err) {
      console.error('Error loading files:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files. Please check your S3 configuration.';
      setError(errorMessage);
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
    if (s3Service && agents.length > 0) {
      loadFiles();
    }
  }, [s3Service, agents]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  if (error && !s3Service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {decodedBucketName}
                </h1>
                <p className="text-sm text-gray-500">
                  {agents.length} {agents.length === 1 ? 'agent' : 'agents'} using this bucket
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Link
                  to="/agents"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Bot className="h-5 w-5" />
                  <span className="hidden sm:inline">Agents</span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/users"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Users className="h-5 w-5" />
                  <span className="hidden sm:inline">Users</span>
                </Link>
              )}
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
          {/* Agents using this bucket */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agents Using This Bucket</h2>
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  to={`/agents/${agent.id}`}
                  className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-sm hover:bg-gray-200 transition-colors"
                >
                  <span className="font-medium text-gray-900">{agent.name}</span>
                  <span className="ml-2 text-gray-500">({agent.provider})</span>
                  {agent.s3_prefix && (
                    <span className="ml-2 text-xs text-gray-400 font-mono">
                      /{agent.s3_prefix}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Upload Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Files
            </h2>
            {s3Service && <FileUpload onUploadComplete={loadFiles} s3Service={s3Service} />}
          </section>

          {/* Files Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Files
                {!loading && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({files.length} {files.length === 1 ? 'file' : 'files'})
                  </span>
                )}
              </h2>
            </div>
            {s3Service && <FileList files={files} onFileChange={loadFiles} loading={loading} s3Service={s3Service} />}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2025 OpenArc, LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

