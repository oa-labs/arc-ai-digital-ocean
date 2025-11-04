import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Cloud, Loader2, ChevronRight, CheckCircle, Info, Settings, Database, Key } from 'lucide-react';
import { digitalOceanService, DigitalOceanAgent, DigitalOceanAgentDetail } from '@/services/digitalOceanService';
import { agentManagementService, CreateAgentInput } from '@/services/agentManagementService';
import { userSettingsService } from '@/services/userSettingsService';
import { showToast } from '@/lib/toast';

interface AddAgentFromDigitalOceanProps {
  onClose: () => void;
}

type Step = 'list' | 'form';

interface FormSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isRequired: boolean;
}

export function AddAgentFromDigitalOcean({ onClose }: AddAgentFromDigitalOceanProps) {
  const [step, setStep] = useState<Step>('list');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Agent list state
  const [agents, setAgents] = useState<DigitalOceanAgent[]>([]);
  const [agentDetail, setAgentDetail] = useState<DigitalOceanAgentDetail | null>(null);
  
  // S3 sources state
  const [s3Sources, setS3Sources] = useState<{ bucket_name: string; prefix?: string }[]>([]);
  const [loadingS3Sources, setLoadingS3Sources] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateAgentInput>({
    name: '',
    description: '',
    provider: 'digitalocean',
    api_key_env_var: '',
    temperature: 0.7,
    max_tokens: 1000,
    endpoint: '',
    system_prompt: '',
    is_active: true,
  });

  // Form sections for progress tracking
  const [formSections, setFormSections] = useState<FormSection[]>([
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Agent name, description, and instructions',
      icon: <Settings className="h-4 w-4" />,
      isCompleted: false,
      isRequired: true,
    },
    {
      id: 'storage',
      title: 'Storage Configuration',
      description: 'S3 bucket for RAG documents',
      icon: <Database className="h-4 w-4" />,
      isCompleted: false,
      isRequired: true,
    },
    {
      id: 'api',
      title: 'API Configuration',
      description: 'Environment variable for API key',
      icon: <Key className="h-4 w-4" />,
      isCompleted: false,
      isRequired: true,
    },
  ]);

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
        endpoint: agent.deployment?.url || '',
        system_prompt: '',
        is_active: true,
      });
      
      setStep('form');
      
      // Fetch S3 sources from knowledge bases
      fetchS3Sources(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent details');
    } finally {
      setLoading(false);
    }
  };

  const fetchS3Sources = async (detail: DigitalOceanAgentDetail) => {
    setLoadingS3Sources(true);
    try {
      const sources = await digitalOceanService.getSpacesSourcesFromAgent(apiToken, detail);
      setS3Sources(sources);
    } catch (err) {
      console.error('Failed to fetch S3 sources:', err);
      setS3Sources([]);
    } finally {
      setLoadingS3Sources(false);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    };
    setFormData(newFormData);
    
    // Update form sections completion status
    updateFormSections(newFormData);
  };

  const updateFormSections = (data: CreateAgentInput) => {
    setFormSections(prev => prev.map(section => {
      switch (section.id) {
        case 'basic':
          return {
            ...section,
            isCompleted: !!(data.name.trim() && (data.description || '').trim())
          };
        case 'storage':
          return {
            ...section,
            isCompleted: !!(data.s3_sources && data.s3_sources.length > 0)
          };
        case 'api':
          return {
            ...section,
            isCompleted: !!data.api_key_env_var.trim()
          };
        default:
          return section;
      }
    }));
  };

  const getOverallProgress = () => {
    const completedSections = formSections.filter(section => section.isCompleted).length;
    return Math.round((completedSections / formSections.length) * 100);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await agentManagementService.createAgent({
        ...formData,
        s3_sources: s3Sources.length > 0 ? s3Sources : undefined,
      });
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
            {/* Progress Header */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Complete Agent Configuration
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure <strong>{agentDetail.name}</strong> for deployment
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">{getOverallProgress()}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getOverallProgress()}%` }}
                />
              </div>

              {/* Section Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {formSections.map((section) => (
                  <div 
                    key={section.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg border ${
                      section.isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${
                      section.isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {section.isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        section.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium ${
                        section.isCompleted ? 'text-green-800' : 'text-gray-700'
                      }`}>
                        {section.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {section.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 ${
                    formSections.find(s => s.id === 'basic')?.isCompleted 
                      ? 'text-green-600' 
                      : 'text-gray-500'
                  }`}>
                    {formSections.find(s => s.id === 'basic')?.isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Settings className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Basic Information</h4>
                    <p className="text-sm text-gray-600">Configure agent identity and behavior</p>
                  </div>
                  {formSections.find(s => s.id === 'basic')?.isRequired && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      Required
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="name" className="flex items-center space-x-1 text-sm font-medium text-gray-700 mb-2">
                    <span>Agent Name</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="e.g., safety-bot, support-assistant"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Brief description of this agent's purpose and capabilities"
                  />
                </div>

                <div>
                  <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Instructions
                  </label>
                  <textarea
                    id="system_prompt"
                    name="system_prompt"
                    rows={6}
                    value={formData.system_prompt}
                    onChange={handleFormChange}
                    placeholder="Enter specific instructions for how this agent should behave, respond, and handle different types of requests..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                  />
                  <div className="mt-2 flex items-start space-x-2">
                    <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">
                      These instructions guide the agent&apos;s behavior and response style in conversations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* S3 Sources Display */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900">Storage Sources</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  S3 Buckets (Auto-Discovered)
                </label>
                {loadingS3Sources ? (
                  <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Discovering S3 sources from knowledge bases...</span>
                  </div>
                ) : s3Sources.length > 0 ? (
                  <div className="space-y-2">
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Database className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary-900">
                            {s3Sources.length} storage source{s3Sources.length !== 1 ? 's' : ''} discovered
                          </p>
                          <div className="mt-2 space-y-1">
                            {s3Sources.map((source, index) => (
                              <div key={index} className="text-sm text-primary-700 font-mono bg-white rounded px-2 py-1">
                                {source.bucket_name}
                                {source.prefix && <span className="text-primary-500">/{source.prefix}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      These sources were automatically discovered from the agent&apos;s knowledge bases.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">No storage sources found</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          No S3 buckets were found in the agent&apos;s knowledge bases. The agent will be created without storage sources.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="api_key_env_var" className="flex items-center space-x-1 text-sm font-medium text-gray-700 mb-2">
                    <span>API Key Environment Variable</span>
                    <span className="text-red-500">*</span>
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
                  <div className="mt-2 flex items-start space-x-2">
                    <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">
                      The environment variable name containing the API key (not the key itself).
                    </p>
                  </div>
                </div>
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

