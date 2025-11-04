import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentManagementService, Agent } from '@/services/agentManagementService';
import { userSettingsService } from '@/services/userSettingsService';
import { AddAgentFromDigitalOcean } from '@/components/AddAgentFromDigitalOcean';
import { ChannelMappings } from '@/components/ChannelMappings';
import { AgentAnalytics } from '@/components/AgentAnalytics';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import {
  Bot,
  Activity,
  Settings,
  BarChart3,
  Download,
} from 'lucide-react';
import { showToast } from '@/lib/toast';

type TabType = 'agents' | 'mappings' | 'analytics';

export function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const [showAddFromDigitalOcean, setShowAddFromDigitalOcean] = useState(false);
  const [hasDigitalOceanToken, setHasDigitalOceanToken] = useState(false);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const agentList = await agentManagementService.listAgents();
      setAgents(agentList);
    } catch (error) {
      console.error('Error loading agents:', error);
      showToast.error('Failed to load agents. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const checkDigitalOceanToken = async () => {
    try {
      const hasToken = await userSettingsService.hasDigitalOceanToken();
      setHasDigitalOceanToken(hasToken);
    } catch (error) {
      console.error('Error checking DigitalOcean token:', error);
      setHasDigitalOceanToken(false);
    }
  };

  useEffect(() => {
    loadAgents();
    checkDigitalOceanToken();
  }, []);

  const handleAddFromDigitalOcean = () => {
    setShowAddFromDigitalOcean(true);
  };

  const handleAddFromDigitalOceanClose = () => {
    setShowAddFromDigitalOcean(false);
    loadAgents();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Agent Management" icon={Bot} currentPage="agents" />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('agents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'agents'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Agents</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('mappings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'mappings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Channel Mappings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'agents' && (
          <div className="space-y-6">
            {/* Header with Add Agent Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your AI agents and their configurations. Agents can be attached to slack channels and have their own RAGs via unique S3 buckets.
                </p>
              </div>
              {hasDigitalOceanToken && (
                <button
                  onClick={handleAddFromDigitalOcean}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  <span>Add Agent</span>
                </button>
              )}
            </div>

            {/* Agent List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading agents...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <Bot className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No agents</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding an agent from DigitalOcean.
                </p>
                {hasDigitalOceanToken && (
                  <div className="mt-6">
                    <button
                      onClick={handleAddFromDigitalOcean}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Add Agent
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                          <Bot className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {agent.name}
                            </h3>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {agent.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {agent.is_default && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            Default
                          </span>
                        )}
                        {!agent.is_active && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">URL:</span>
                        <span className="text-gray-900 font-mono text-xs truncate max-w-[150px]">
                          {agent.endpoint || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mappings' && <ChannelMappings />}
        {activeTab === 'analytics' && <AgentAnalytics agents={agents} />}
      </main>

      <Footer />

      {/* Add Agent from DigitalOcean Modal */}
      {showAddFromDigitalOcean && (
        <AddAgentFromDigitalOcean onClose={handleAddFromDigitalOceanClose} />
      )}
    </div>
  );
}

