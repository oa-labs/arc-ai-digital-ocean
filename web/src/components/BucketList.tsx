import { useNavigate } from 'react-router-dom';
import { Database, ChevronRight, Users } from 'lucide-react';
import { Agent } from '@/services/agentManagementService';

interface BucketListProps {
  buckets: Map<string, Agent[]>;
  loading: boolean;
}

export function BucketList({ buckets, loading }: BucketListProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (buckets.size === 0) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No S3 Buckets</h3>
        <p className="text-gray-500">Create an agent with an S3 bucket to get started</p>
      </div>
    );
  }

  const bucketEntries = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bucketEntries.map(([bucketName, agents]) => (
        <button
          key={bucketName}
          onClick={() => navigate(`/buckets/${encodeURIComponent(bucketName)}`)}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                <Database className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {bucketName}
                </h3>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {agents.slice(0, 3).map((agent) => (
                <span
                  key={agent.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {agent.name}
                </span>
              ))}
              {agents.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{agents.length - 3} more
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

