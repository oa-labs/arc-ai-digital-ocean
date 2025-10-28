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
          const [models, defaultModel] = await Promise.all([
            systemPreferencesService.getAvailableModels(),
            systemPreferencesService.getDefaultModel(),
          ]);
          setAvailableModels(models);
          if (defaultModel) {
            setSelectedModel(defaultModel);
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

      if (isOwner && selectedModel) {
        promises.push(
          systemPreferencesService.setDefaultModel(selectedModel)
        );
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="ArcAI Portal" icon={Cloud} currentPage="settings" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Settings Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                DigitalOcean Configuration
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure your DigitalOcean Personal Access Token to enable importing agents from your DigitalOcean deployment.
              </p>

              <div>
                <label htmlFor="digitalocean_token" className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    id="digitalocean_token"
                    value={digitalOceanToken}
                    onChange={(e) => setDigitalOceanToken(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono pr-10"
                    placeholder="dop_v1_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Your Personal Access Token is stored securely and encrypted. It will be used to list and import agents from your DigitalOcean deployment.
                  {hasExistingToken && !digitalOceanToken && (
                    <span className="block mt-1 text-amber-600">
                      Leave empty to keep your existing token, or enter a new one to replace it.
                    </span>
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  <a
                    href="https://cloud.digitalocean.com/account/api/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Generate a Personal Access Token in DigitalOcean
                  </a>
                </p>
              </div>
            </div>

            {/* System Preferences - Only for Owners */}
            {isOwner && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  System Preferences
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure system-wide settings that apply to all users.
                </p>

                <div>
                  <label htmlFor="default_model" className="block text-sm font-medium text-gray-700 mb-2">
                    Default AI Model
                  </label>
                  {loadingModels ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                      <span className="text-sm">Loading models...</span>
                    </div>
                  ) : availableModels.length > 0 ? (
                    <>
                      <select
                        id="default_model"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Select a model...</option>
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} {model.description && `- ${model.description}`}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-gray-500">
                        This model will be used by default for all agents in the system.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No models available. Please ensure DigitalOcean API is configured.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

