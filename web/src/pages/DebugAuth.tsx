import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/env';

export function DebugAuth() {
  const { user, userRole, isAdmin, isOwner } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkServerDebug = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setDebugInfo({ error: 'No session found' });
        return;
      }

      const apiBase = config.api.baseUrl || `${window.location.origin}/api`;
      const url = `${apiBase}/users/me/debug`;

      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        setDebugInfo({
          error: `HTTP ${response.status}: ${response.statusText}`,
          url: url,
          responseText: errorText
        });
        return;
      }

      const data = await response.json();
      setDebugInfo({ ...data, _fetchedFrom: url });
    } catch (err) {
      setDebugInfo({
        error: err instanceof Error ? err.message : 'Unknown error',
        url: config.api.baseUrl || `${window.location.origin}/api`,
        stack: err instanceof Error ? err.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Information</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Frontend (AuthContext)</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>User ID:</strong> {user?.id || 'Not logged in'}</div>
            <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
            <div><strong>Role (from context):</strong> {userRole}</div>
            <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
            <div><strong>Is Owner:</strong> {isOwner ? 'Yes' : 'No'}</div>
            <div className="mt-4">
              <strong>User Metadata:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(user?.user_metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Backend (Server)</h2>
          <button
            onClick={checkServerDebug}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 mb-4"
          >
            {loading ? 'Loading...' : 'Check Server Debug Info'}
          </button>

          {debugInfo && (
            <div className="font-mono text-sm">
              <strong>Server Response:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-yellow-900 mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-800">
            <li>Run <code className="bg-yellow-100 px-1 rounded">fix-owner-role.sql</code> in Supabase SQL Editor</li>
            <li>Clear browser Local Storage (F12 → Application → Local Storage → Clear All)</li>
            <li>Sign out completely</li>
            <li>Sign back in</li>
            <li>Return to this page and click "Check Server Debug Info"</li>
            <li>Compare Frontend and Backend role values - they should match</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

