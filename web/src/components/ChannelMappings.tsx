import { useState, useEffect } from 'react';
import { agentManagementService, ChannelAgent } from '@/services/agentManagementService';
import { Hash, Bot, User, Calendar, RefreshCw } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function ChannelMappings() {
  const [mappings, setMappings] = useState<ChannelAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const data = await agentManagementService.listChannelAgents();
      setMappings(data);
    } catch (error) {
      console.error('Error loading channel mappings:', error);
      showToast.error('Failed to load channel mappings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMappings();
    setRefreshing(false);
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      digitalocean: 'bg-blue-100 text-blue-800',
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Channel Mappings</h2>
          <p className="mt-1 text-sm text-gray-500">
            View which agents are assigned to which Slack channels
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mappings List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading channel mappings...</p>
        </div>
      ) : mappings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Hash className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No channel mappings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Channels will appear here once agents are assigned via Slack commands.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Channel
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Agent
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Provider
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Activated By
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Activated At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappings.map((mapping) => (
                  <tr key={mapping.channel_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Hash className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {mapping.channel_name || mapping.channel_id}
                          </div>
                          {mapping.channel_name && (
                            <div className="text-xs text-gray-500 font-mono">
                              {mapping.channel_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Bot className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {mapping.agent?.name || 'Unknown'}
                          </div>
                          {mapping.agent?.description && (
                            <div className="text-xs text-gray-500">
                              {mapping.agent.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mapping.agent && (
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getProviderBadge(
                            mapping.agent.provider
                          )}`}
                        >
                          {mapping.agent.provider}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mapping.activated_by && (
                        <div className="flex items-center text-sm text-gray-900">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-mono text-xs">{mapping.activated_by}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-xs">{formatDate(mapping.activated_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Hash className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How to assign agents to channels
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Use the <code className="bg-blue-100 px-1 py-0.5 rounded">/agent select &lt;name&gt;</code> command in any Slack channel to assign an agent.
                Only workspace admins and channel creators can change agents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

