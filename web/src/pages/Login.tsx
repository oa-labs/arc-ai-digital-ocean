import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Cloud, AlertCircle, Bot, Settings, MessageSquare, Database } from 'lucide-react';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // Note: User will be redirected to Google, so we don't set loading to false here
      // The redirect will happen automatically
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left Panel - Login */}
        <div className="flex items-center justify-center p-4 lg:p-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
                <Cloud className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ArcAI Portal
              </h1>
              <p className="text-gray-600">
                Agent and Knowledge Base Management
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8">
              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700">Sign in with Google</span>
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              &copy; OpenArc, LLC 2025. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Panel - Overview */}
        <div className="bg-white lg:bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-8 lg:p-12">
          <div className="max-w-lg w-full text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 lg:text-white mb-6">
              Welcome to ArcAI
            </h2>
            <p className="text-lg text-gray-700 lg:text-gray-200 mb-8">
              Your intelligent agent management platform that bridges AI agents with your team's communication.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 lg:bg-primary-700 rounded-lg flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary-600 lg:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 lg:text-white mb-1">
                    AI Agent Creation
                  </h3>
                  <p className="text-gray-600 lg:text-gray-300">
                    Deploy and manage sophisticated AI agents configured in Digital Ocean
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 lg:bg-primary-700 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-primary-600 lg:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 lg:text-white mb-1">
                    Centralized Management
                  </h3>
                  <p className="text-gray-600 lg:text-gray-300">
                    Monitor and configure all your agents from one intuitive portal
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 lg:bg-primary-700 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary-600 lg:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 lg:text-white mb-1">
                    Slack Integration
                  </h3>
                  <p className="text-gray-600 lg:text-gray-300">
                    Connect agents to any Slack channel for seamless team interaction
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 lg:bg-primary-700 rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-primary-600 lg:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 lg:text-white mb-1">
                    Custom RAG
                  </h3>
                  <p className="text-gray-600 lg:text-gray-300">
                    Each agent gets its own knowledge base for contextual, intelligent responses
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary-50 lg:bg-primary-700 rounded-lg">
              <p className="text-sm text-primary-700 lg:text-primary-200">
                <strong>Perfect for:</strong> Development teams, support automation, knowledge management, and documentation workflows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

