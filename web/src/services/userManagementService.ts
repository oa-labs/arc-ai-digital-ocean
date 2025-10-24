import { supabase } from '@/lib/supabase';
import { UserRole } from '@/contexts/AuthContext';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
}

class UserManagementService {
  /**
   * List all authenticated users
   * This uses the admin API to fetch users from auth.users
   */
  async listUsers(): Promise<AppUser[]> {
    // We need to call a server-side endpoint since we can't directly query auth.users
    // from the client with the anon key
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.getApiBaseUrl()}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
      throw new Error(error.error || 'Failed to fetch users');
    }

    const { users } = await response.json();
    return users;
  }

  /**
   * Update a user's role
   * Only admins can update roles, and owners cannot be modified
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.getApiBaseUrl()}/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: newRole }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update user role' }));
      throw new Error(error.error || 'Failed to update user role');
    }
  }

  /**
   * Get the API base URL from environment config
   */
  private getApiBaseUrl(): string {
    // Check if we have a custom API base URL in config
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (apiBase) {
      return apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    }
    
    // Default to current origin with /api prefix if not specified
    return `${window.location.origin}/api`;
  }
}

export const userManagementService = new UserManagementService();

