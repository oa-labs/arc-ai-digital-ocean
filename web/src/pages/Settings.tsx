import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userSettingsService } from '@/services/userSettingsService';
import { Footer } from '@/components/Footer';
import { Cloud, LogOut, Settings as SettingsIcon, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [digitalOceanToken, setDigitalOceanToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);

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
      await userSettingsService.upsertUserSettings({
        digitalocean_token: digitalOceanToken || null,
      });
      showToast.success('Settings saved successfully');
      setHasExistingToken(!!digitalOceanToken);
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
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

