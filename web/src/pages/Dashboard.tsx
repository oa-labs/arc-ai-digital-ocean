import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BucketList } from '@/components/BucketList';
import { Footer } from '@/components/Footer';
import { agentManagementService, Agent } from '@/services/agentManagementService';
import { Cloud, LogOut, RefreshCw, Bot, Users } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function Dashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const [buckets, setBuckets] = useState<Map<string, Agent[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBuckets = async () => {
    try {
      setLoading(true);
      const bucketMap = await agentManagementService.getS3Buckets();
      setBuckets(bucketMap);
    } catch (error) {
      console.error('Error loading buckets:', error);
      showToast.error('Failed to load S3 buckets. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBuckets();
    setRefreshing(false);
  };

  useEffect(() => {
    loadBuckets();
  }, []);

  const handleSignOut = async () => {
    await signOut();
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
                  ArcAI Portal
                </h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
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
          {/* Header Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              S3 Buckets
            </h2>
            <p className="text-gray-600">
              Manage files in the S3 buckets. Each bucket is associated with one or more AI agents.
            </p>
          </section>

          {/* Buckets Section */}
          <section>
            <BucketList buckets={buckets} loading={loading} />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

