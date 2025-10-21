import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { agentManagementService, Agent } from '@/services/agentManagementService';
import { Cloud, LogOut, Bot, ArrowLeft, AlertCircle, Trash2, Save } from 'lucide-react';

export function AgentEdit() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    provider: 'openai' | 'digitalocean';
    model: string;
    api_key_env_var: string;
    s3_bucket: string;
    s3_prefix: string;
    endpoint: string;
    s3_access_key_id_env_var: string;
    s3_secret_key_env_var: string;
    is_active: boolean;
    is_default: boolean;
  }>({
    name: '',
    description: '',
    provider: 'openai',
    model: '',
    api_key_env_var: '',
    s3_bucket: '',
    s3_prefix: '',
    endpoint: '',
    s3_access_key_id_env_var: '',
    s3_secret_key_env_var: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    const loadAgent = async () => {
      if (!agentId) {
        setError('Agent ID is required');
        setLoading(false);
        return;
      }

      try {
        const agents = await agentManagementService.listAgents();
        const foundAgent = agents.find(a => a.id === agentId);

        if (!foundAgent) {
          setError('Agent not found');
          setLoading(false);
          return;
        }

        setAgent(foundAgent);
        setFormData({
          name: foundAgent.name,
          description: foundAgent.description || '',
          provider: foundAgent.provider,
          model: foundAgent.model || '',
          api_key_env_var: foundAgent.api_key_env_var,
          s3_bucket: foundAgent.s3_bucket,
          s3_prefix: foundAgent.s3_prefix || '',
          endpoint: foundAgent.endpoint || '',
          s3_access_key_id_env_var: foundAgent.s3_access_key_id_env_var || '',
          s3_secret_key_env_var: foundAgent.s3_secret_key_env_var || '',
          is_active: foundAgent.is_active,
          is_default: foundAgent.is_default || false,
        });
      } catch (err) {
        console.error('Error loading agent:', err);
        setError('Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [agentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    try {
      setSaving(true);
      await agentManagementService.updateAgent(agent.id, formData);
      navigate('/agents');
    } catch (err) {
      console.error('Error updating agent:', err);
      alert('Failed to update agent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agent) return;

    if (!confirm(`Are you sure you want to delete agent "${agent.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await agentManagementService.deleteAgent(agent.id);
      navigate('/agents');
    } catch (err) {
      console.error('Error deleting agent:', err);
      alert('Failed to delete agent. Please try again.');
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      openai: 'bg-green-100 text-green-800',
      digitalocean: 'bg-blue-100 text-blue-800',
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error || 'Agent not found'}</p>
          <button
            onClick={() => navigate('/agents')}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Agents
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
                onClick={() => navigate('/agents')}
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Back to Agents"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Edit Agent: {agent.name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderBadge(agent.provider)}`}
                  >
                    {agent.provider}
                  </span>
                  {agent.is_default && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Cloud className="h-5 w-5" />
                <span className="hidden sm:inline">Files</span>
              </Link>
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                    Provider *
                  </label>
                  <select
                    id="provider"
                    name="provider"
                    required
                    value={formData.provider}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="digitalocean">DigitalOcean</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g., gpt-4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="api_key_env_var" className="block text-sm font-medium text-gray-700 mb-2">
                    API Key Environment Variable *
                  </label>
                  <input
                    type="text"
                    id="api_key_env_var"
                    name="api_key_env_var"
                    required
                    value={formData.api_key_env_var}
                    onChange={handleChange}
                    placeholder="e.g., AGENT_SAFETY_OPENAI_KEY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Endpoint URL
                  </label>
                  <input
                    type="text"
                    id="endpoint"
                    name="endpoint"
                    value={formData.endpoint}
                    onChange={handleChange}
                    placeholder="e.g., https://api.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* S3 Configuration */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">S3 Configuration</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="s3_bucket" className="block text-sm font-medium text-gray-700 mb-2">
                    S3 Bucket *
                  </label>
                  <input
                    type="text"
                    id="s3_bucket"
                    name="s3_bucket"
                    required
                    value={formData.s3_bucket}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="s3_prefix" className="block text-sm font-medium text-gray-700 mb-2">
                    S3 Prefix
                  </label>
                  <input
                    type="text"
                    id="s3_prefix"
                    name="s3_prefix"
                    value={formData.s3_prefix}
                    onChange={handleChange}
                    placeholder="e.g., documents/"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="s3_access_key_id_env_var" className="block text-sm font-medium text-gray-700 mb-2">
                    Access Key ID Env Var
                  </label>
                  <input
                    type="text"
                    id="s3_access_key_id_env_var"
                    name="s3_access_key_id_env_var"
                    value={formData.s3_access_key_id_env_var}
                    onChange={handleChange}
                    placeholder="e.g., S3_ACCESS_KEY_ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="s3_secret_key_env_var" className="block text-sm font-medium text-gray-700 mb-2">
                    Secret Key Env Var
                  </label>
                  <input
                    type="text"
                    id="s3_secret_key_env_var"
                    name="s3_secret_key_env_var"
                    value={formData.s3_secret_key_env_var}
                    onChange={handleChange}
                    placeholder="e.g., S3_SECRET_KEY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                    Set as default agent
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
                <span>Delete Agent</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/agents')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </form>
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
