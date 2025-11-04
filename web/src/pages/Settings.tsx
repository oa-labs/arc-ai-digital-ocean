import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userSettingsService } from '@/services/userSettingsService';
import { systemPreferencesService, AIModel } from '@/services/systemPreferencesService';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { Cloud, Settings as SettingsIcon, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';

export function Settings() {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [digitalOceanToken, setDigitalOceanToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [defaultInstructions, setDefaultInstructions] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await userSettingsService.getUserSettings();
      if (settings && settings.digitalocean_token) {
        setDigitalOceanToken(settings.digitalocean_token);
        setHasExistingToken(true);
      }

      if (isOwner) {
        setLoadingModels(true);
        try {
          const [models, defaultModel, defaultInstructions] = await Promise.all([
            systemPreferencesService.getAvailableModels(),
            systemPreferencesService.getDefaultModel(),
            systemPreferencesService.getDefaultAgentInstructions(),
          ]);
          setAvailableModels(models);
          if (defaultModel) {
            setSelectedModel(defaultModel);
          }
          if (defaultInstructions) {
            setDefaultInstructions(defaultInstructions);
          }
        } catch (error) {
          console.error('Error loading models:', error);
        } finally {
          setLoadingModels(false);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const promises: Promise<any>[] = [
        userSettingsService.upsertUserSettings({
          digitalocean_token: digitalOceanToken || null,
        })
      ];

      if (isOwner) {
        if (selectedModel) {
          promises.push(
            systemPreferencesService.setDefaultModel(selectedModel)
          );
        }
        if (defaultInstructions) {
          promises.push(
            systemPreferencesService.setDefaultAgentInstructions(defaultInstructions)
          );
        }
      }

      await Promise.all(promises);
      showToast.success('Settings saved successfully');
      setHasExistingToken(!!digitalOceanToken);
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader title="ArcAI Portal" icon={Cloud} currentPage="settings" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 group">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-all duration-200 hover:translate-x-[-2px]"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-[-2px]" />
            <span className="font-medium">Back to Analytics</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Settings Header */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-8 py-6 border-b border-primary-200">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary-600 rounded-lg shadow-sm">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your application preferences</p>
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSave} className="p-8 space-y-8">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Cloud className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    DigitalOcean Configuration
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure your DigitalOcean Personal Access Token to enable importing agents from your DigitalOcean deployment.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="digitalocean_token" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    Personal Access Token
                    <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Required</span>
                  </label>
                  <div className="relative group">
                    <input
                      type={showToken ? 'text' : 'password'}
                      id="digitalocean_token"
                      value={digitalOceanToken}
                      onChange={(e) => setDigitalOceanToken(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 focus:ring-2 sm:text-sm font-mono pr-12 py-3 transition-all duration-200 group-hover:border-gray-400 bg-white"
                      placeholder="dop_v1_..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors duration-200"
                    >
                      {showToken ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 flex items-start">
                      <span className="mr-1">🔒</span>
                      Your Personal Access Token is stored securely and encrypted. It will be used to list and import agents from your DigitalOcean deployment.
                    </p>
                    {hasExistingToken && !digitalOceanToken && (
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                        ⚠️ Leave empty to keep your existing token, or enter a new one to replace it.
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      <a
                        href="https://cloud.digitalocean.com/account/api/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 underline font-medium inline-flex items-center"
                      >
                        Generate a Personal Access Token in DigitalOcean →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Preferences - Only for Owners */}
            {isOwner && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-600 rounded-lg shadow-sm">
                    <SettingsIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      System Preferences
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure system-wide settings that apply to all users.
                    </p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Owner Only</span>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <label htmlFor="default_model" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      Default AI Model
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">System-wide</span>
                    </label>
                    {loadingModels ? (
                      <div className="flex items-center space-x-3 text-gray-500 py-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                        <span className="text-sm font-medium">Loading models...</span>
                      </div>
                    ) : availableModels.length > 0 ? (
                      <>
                        <select
                          id="default_model"
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 focus:ring-2 sm:text-sm py-3 transition-all duration-200 bg-white"
                        >
                          <option value="">Select a model...</option>
                          {availableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} {model.description && `- ${model.description}`}
                            </option>
                          ))}
                        </select>
                        <p className="mt-3 text-xs text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
                          🤖 This model will be used by default for all agents in the system.
                        </p>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 bg-amber-50 p-3 rounded-md border border-amber-200">
                        ⚠️ No models available. Please ensure DigitalOcean API is configured.
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <label htmlFor="default_instructions" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      Default Agent Instructions
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Template</span>
                    </label>
                    <textarea
                      id="default_instructions"
                      value={defaultInstructions}
                      onChange={(e) => setDefaultInstructions(e.target.value)}
                      rows={8}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 focus:ring-2 sm:text-sm font-mono p-3 transition-all duration-200 bg-white resize-none"
                      placeholder="Enter default system instructions for new agents..."
                    />
                    <p className="mt-3 text-xs text-gray-600 bg-green-50 p-3 rounded-md border border-green-100">
                      📝 These instructions will be used as the default system prompt when creating new agents.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-end pt-8 border-t border-gray-200 bg-gray-50 -mx-8 px-8 py-6 -mb-8 rounded-b-xl">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 text-sm font-semibold text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving Settings...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

