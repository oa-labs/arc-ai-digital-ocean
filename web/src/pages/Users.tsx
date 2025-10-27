import { useState, useEffect } from 'react';
import { UserRole } from '@/contexts/AuthContext';
import { userManagementService, AppUser } from '@/services/userManagementService';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import {
  Users as UsersIcon,
  Shield,
  ShieldCheck,
  User,
  Crown,
} from 'lucide-react';
import { showToast } from '@/lib/toast';

export function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await userManagementService.listUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast.error('Failed to load users. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setUpdatingUserId(userId);
      await userManagementService.updateUserRole(userId, newRole);
      showToast.success('User role updated successfully. The user must sign out and sign back in for changes to take effect.');
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      showToast.error(error.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="User Management" icon={UsersIcon} currentPage="users" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Authenticated Users</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage user roles and permissions
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Admin Access</span>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Role Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Owner:</strong> Has all admin privileges. Cannot be modified through the UI (database access required).</li>
                    <li><strong>Admin:</strong> Can manage users and agents. Can promote/demote other admins. Manages agents, S3 bucket files, and users.</li>
                    <li><strong>Regular:</strong> Default role with no admin privileges. Can add/remove files from any S3 bucket used by the agents.</li>
                  </ul>
                  <p className="mt-2 text-xs">
                    Note: Users must sign out and sign back in for role changes to take effect.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No authenticated users in the system.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Sign In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((appUser) => (
                    <tr key={appUser.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{appUser.email}</div>
                            <div className="text-xs text-gray-500">{appUser.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(appUser.role)}`}>
                          {getRoleIcon(appUser.role)}
                          <span className="capitalize">{appUser.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(appUser.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(appUser.last_sign_in_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {appUser.role === 'owner' ? (
                          <span className="text-gray-400 italic">Protected</span>
                        ) : (
                          <select
                            value={appUser.role}
                            onChange={(e) => handleRoleChange(appUser.id, e.target.value as UserRole)}
                            disabled={updatingUserId === appUser.id}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:opacity-50"
                          >
                            <option value="regular">Regular</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

