import { useState, useEffect } from 'react';
import { agentManagementService, Agent, CreateAgentInput } from '@/services/agentManagementService';
import { X, Save, AlertCircle } from 'lucide-react';

interface AgentFormProps {
  agent: Agent | null;
  onClose: () => void;
}

export function AgentForm({ agent, onClose }: AgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAgentInput & { is_active?: boolean; is_default?: boolean }>({
    name: '',
    description: '',
    provider: 'openai',
    api_key_env_var: '',
    model: '',
    temperature: 0.7,
    max_tokens: 1000,
    endpoint: '',
    organization: '',
    s3_bucket: '',
    s3_prefix: '',
    system_prompt: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description || '',
        provider: agent.provider,
        api_key_env_var: agent.api_key_env_var,
        model: agent.model || '',
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 1000,
        endpoint: agent.endpoint || '',
        organization: agent.organization || '',
        s3_bucket: agent.s3_bucket,
        s3_prefix: agent.s3_prefix || '',
        system_prompt: agent.system_prompt || '',
        is_active: agent.is_active,
        is_default: agent.is_default || false,
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (agent) {
        await agentManagementService.updateAgent(agent.id, formData);
      } else {
        await agentManagementService.createAgent(formData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {agent ? 'Edit Agent' : 'Create New Agent'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Agent Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="e.g., safety-bot"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Brief description of this agent's purpose"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active (visible in <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/agent list</code>)
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
              <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                Set as Default (fallback when no channel-specific agent is configured)
              </label>
            </div>
          </div>

          {/* Provider Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Provider Configuration</h3>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                Provider *
              </label>
              <select
                id="provider"
                name="provider"
                required
                value={formData.provider}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="openai">OpenAI</option>
                <option value="digitalocean">DigitalOcean</option>
              </select>
            </div>

            <div>
              <label htmlFor="api_key_env_var" className="block text-sm font-medium text-gray-700">
                API Key Environment Variable *
              </label>
              <input
                type="text"
                id="api_key_env_var"
                name="api_key_env_var"
                required
                value={formData.api_key_env_var}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                placeholder="e.g., AGENT_SAFETY_OPENAI_KEY"
              />
              <p className="mt-1 text-xs text-gray-500">
                The environment variable name containing the API key (not the key itself)
              </p>
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Model
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                placeholder="e.g., gpt-4 or gpt-5-nano-2025-08-07"
              />
            </div>

            {formData.provider === 'digitalocean' && (
              <div>
                <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700">
                  API Endpoint *
                </label>
                <input
                  type="url"
                  id="endpoint"
                  name="endpoint"
                  required={formData.provider === 'digitalocean'}
                  value={formData.endpoint}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                  placeholder="https://api.digitalocean.com/v2/ai/chat/completions"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  Temperature
                </label>
                <input
                  type="number"
                  id="temperature"
                  name="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="max_tokens" className="block text-sm font-medium text-gray-700">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="max_tokens"
                  name="max_tokens"
                  min="1"
                  value={formData.max_tokens}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* RAG Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">RAG Configuration</h3>

            <div>
              <label htmlFor="s3_bucket" className="block text-sm font-medium text-gray-700">
                S3 Bucket *
              </label>
              <input
                type="text"
                id="s3_bucket"
                name="s3_bucket"
                required
                value={formData.s3_bucket}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                placeholder="my-rag-bucket"
              />
            </div>

            <div>
              <label htmlFor="s3_prefix" className="block text-sm font-medium text-gray-700">
                S3 Prefix (Optional)
              </label>
              <input
                type="text"
                id="s3_prefix"
                name="s3_prefix"
                value={formData.s3_prefix}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                placeholder="safety-docs/"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional folder path within the bucket
              </p>
            </div>

          </div>
          <p className="mt-2 text-xs text-gray-500">
            S3 credentials are managed on the backend. Provide the environment variable names when configuring the server if this bucket requires custom access keys.
          </p>

          {/* System Prompt */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">System Prompt</h3>

            <div>
              <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700">
                Custom System Prompt
              </label>
              <textarea
                id="system_prompt"
                name="system_prompt"
                rows={4}
                value={formData.system_prompt}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                placeholder="You are a helpful AI assistant..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use the default system prompt
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

