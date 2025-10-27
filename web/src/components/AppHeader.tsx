import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Cloud, LogOut, Settings, Bot, Users } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  icon: LucideIcon;
  currentPage?: 'dashboard' | 'agents' | 'users' | 'settings';
}

export function AppHeader({ title, icon: Icon, currentPage }: AppHeaderProps) {
  const { user, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Dashboard Link - show on all pages except dashboard */}
            {currentPage !== 'dashboard' && (
              <Link
                to="/"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Cloud className="h-5 w-5" />
                <span className="hidden sm:inline">Files</span>
              </Link>
            )}

            {/* Agents Link - show for admins on all pages except agents */}
            {isAdmin && currentPage !== 'agents' && (
              <Link
                to="/agents"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Bot className="h-5 w-5" />
                <span className="hidden sm:inline">Agents</span>
              </Link>
            )}

            {/* Users Link - show for admins on all pages except users */}
            {isAdmin && currentPage !== 'users' && (
              <Link
                to="/users"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Users className="h-5 w-5" />
                <span className="hidden sm:inline">Users</span>
              </Link>
            )}

            {/* Settings Link - show on all pages except settings */}
            {currentPage !== 'settings' && (
              <Link
                to="/settings"
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
            )}

            {/* Sign Out Button - always show */}
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
  );
}

