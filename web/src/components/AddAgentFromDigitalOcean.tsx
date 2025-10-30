import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Cloud, Loader2, ChevronRight } from 'lucide-react';
import { digitalOceanService, DigitalOceanAgent, DigitalOceanAgentDetail, DigitalOceanBucket } from '@/services/digitalOceanService';
import { agentManagementService, CreateAgentInput } from '@/services/agentManagementService';
import { userSettingsService } from '@/services/userSettingsService';
import { showToast } from '@/lib/toast';

interface AddAgentFromDigitalOceanProps {
  onClose: () => void;
}

type Step = 'list' | 'form';

export function AddAgentFromDigitalOcean({ onClose }: AddAgentFromDigitalOceanProps) {
  const [step, setStep] = useState<Step>('list');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Agent list state
  const [agents, setAgents] = useState<DigitalOceanAgent[]>([]);
  const [agentDetail, setAgentDetail] = useState<DigitalOceanAgentDetail | null>(null);
  
  // Bucket list state
  const [buckets, setBuckets] = useState<DigitalOceanBucket[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  
  // Knowledge base buckets state
  const [kbBuckets, setKbBuckets] = useState<string[]>([]);
  const [loadingKbBuckets, setLoadingKbBuckets] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateAgentInput>({
    name: '',
    description: '',
    provider: 'digitalocean',
    api_key_env_var: '',
    temperature: 0.7,
    max_tokens: 1000,
    endpoint: '',
    s3_bucket: '',
    system_prompt: '',
    is_active: true,
  });

  // Load stored API token and fetch agents on mount
  useEffect(() => {
    const loadTokenAndAgents = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await userSettingsService.getDigitalOceanToken();
        if (!token) {
          setError('No DigitalOcean Personal Access Token found. Please configure it in Settings.');
          setLoading(false);
          return;
        }

        setApiToken(token);
        const agentList = await digitalOceanService.listAgents(token);
        setAgents(agentList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to DigitalOcean API');
      } finally {
        setLoading(false);
      }
    };

    loadTokenAndAgents();
  }, []);

  const handleAgentSelect = async (agent: DigitalOceanAgent) => {
    setError(null);
    setLoading(true);

    try {
      const detail = await digitalOceanService.getAgent(apiToken, agent.uuid);
      setAgentDetail(detail);
      
      // Pre-populate form with agent details
      setFormData({
        name: detail.name || agent.name,
        description: detail.description || agent.description || '',
        provider: 'digitalocean',
        api_key_env_var: '',
        temperature: 0.7,
        max_tokens: 1000,
        endpoint: detail.endpoint || '',
        s3_bucket: '',
        system_prompt: '',
        is_active: true,
      });
      
      setStep('form');
      
      // Fetch buckets when entering form step
      fetchBuckets();
      fetchKnowledgeBaseBuckets(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuckets = async () => {
    setLoadingBuckets(true);
    try {
      const bucketList = await digitalOceanService.listBuckets(apiToken);
      setBuckets(bucketList);
    } catch (err) {
      console.error('Failed to fetch buckets:', err);
      // Don't set error state, just log - buckets are optional
    } finally {
      setLoadingBuckets(false);
    }
  };

  const fetchKnowledgeBaseBuckets = async (detail: DigitalOceanAgentDetail) => {
    setLoadingKbBuckets(true);
    try {
      const bucketNames = await digitalOceanService.getSpacesBucketsFromAgent(apiToken, detail);
      setKbBuckets(bucketNames);
    } catch (err) {
      console.error('Failed to fetch knowledge base buckets:', err);
      // Don't set error state, just log - knowledge base buckets are optional
    } finally {
      setLoadingKbBuckets(false);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await agentManagementService.createAgent(formData);
      showToast.success('Agent imported successfully!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('list');
      setAgentDetail(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cloud className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Add Agent from DigitalOcean
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
            <p className="text-sm text-gray-600">Loading agents from DigitalOcean...</p>
          </div>
        )}

        {/* Agent List */}
        {!loading && !error && step === 'list' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select an Agent
              </h3>
              <p className="text-sm text-gray-600">
                Choose an agent from your DigitalOcean deployment to import.
              </p>
            </div>

            {agents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Cloud className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No agents found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No agents were found in your DigitalOcean deployment.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {agents.map((agent) => (
                  <button
                    key={agent.uuid}
                    onClick={() => handleAgentSelect(agent)}
                    disabled={loading}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{agent.name}</h4>
                        {agent.description && (
                          <p className="mt-1 text-sm text-gray-600">{agent.description}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 agent-url">{agent.deployment?.url}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Form */}
        {step === 'form' && agentDetail && (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complete Agent Configuration
              </h3>
              <p className="text-sm text-gray-600">
                Review and complete the configuration for <strong>{agentDetail.name}</strong>.
              </p>
            </div>

            {/* Pre-populated fields */}
            <div className="space-y-4">
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
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Manual input fields */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900">Additional Configuration</h4>
              
              <div>
                <label htmlFor="s3_bucket" className="block text-sm font-medium text-gray-700">
                  S3 Bucket Name *
                </label>
                {(loadingBuckets || loadingKbBuckets) ? (
                  <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading buckets...</span>
                  </div>
                ) : (() => {
                  // Combine buckets from both sources
                  const allBucketNames = new Set<string>();
                  
                  // Add buckets from knowledge bases (priority source)
                  kbBuckets.forEach(name => allBucketNames.add(name));
                  
                  // Add buckets from general bucket list
                  buckets.forEach(bucket => allBucketNames.add(bucket.Name));
                  
                  const allBuckets = Array.from(allBucketNames).sort();
                  
                  return allBuckets.length > 0 ? (
                    <>
                      <select
                        id="s3_bucket"
                        name="s3_bucket"
                        required
                        value={formData.s3_bucket}
                        onChange={handleFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Select a bucket...</option>
                        {kbBuckets.length > 0 && (
                          <optgroup label="From Agent Knowledge Bases">
                            {kbBuckets.map((bucketName) => (
                              <option key={`kb-${bucketName}`} value={bucketName}>
                                {bucketName}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {buckets.length > 0 && (
                          <optgroup label="All Available Buckets">
                            {buckets.map((bucket) => (
                              <option key={`all-${bucket.Name}`} value={bucket.Name}>
                                {bucket.Name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {kbBuckets.length > 0 && (
                        <p className="mt-1 text-xs text-primary-600">
                          Found {kbBuckets.length} bucket{kbBuckets.length !== 1 ? 's' : ''} from agent&apos;s knowledge bases
                        </p>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      id="s3_bucket"
                      name="s3_bucket"
                      required
                      value={formData.s3_bucket}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                      placeholder="my-rag-bucket"
                    />
                  );
                })()}
                <p className="mt-1 text-xs text-gray-500">
                  The S3 bucket where RAG documents are stored for this agent.
                </p>
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
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                  placeholder="e.g., AGENT_MY_AGENT_DO_KEY"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The environment variable name containing the API key (not the key itself).
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Import Agent</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

