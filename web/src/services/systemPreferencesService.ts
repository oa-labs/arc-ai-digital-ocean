import { config } from '@/config/env';

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  provider?: string;
}

export interface SystemPreference {
  id: string;
  preference_key: string;
  preference_value: Record<string, any>;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

class SystemPreferencesService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  async getAvailableModels(): Promise<AIModel[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.api.baseUrl}/api/system-preferences/models`, {
        headers,
      });

      if (!response.ok) {
        console.error('Failed to fetch models:', await response.text());
        return [];
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  async getPreference(key: string): Promise<SystemPreference | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.api.baseUrl}/api/system-preferences/${key}`, {
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch preference');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching preference:', error);
      throw error;
    }
  }

  async updatePreference(key: string, value: Record<string, any>): Promise<SystemPreference> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.api.baseUrl}/api/system-preferences/${key}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ preference_value: value }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update preference');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  }

  async getDefaultModel(): Promise<string | null> {
    const pref = await this.getPreference('default_ai_model');
    return pref?.preference_value?.model_id || null;
  }

  async setDefaultModel(modelId: string): Promise<void> {
    await this.updatePreference('default_ai_model', { model_id: modelId });
  }

  async getDefaultAgentInstructions(): Promise<string | null> {
    const pref = await this.getPreference('default_agent_instructions');
    return pref?.preference_value?.instructions || null;
  }

  async setDefaultAgentInstructions(instructions: string): Promise<void> {
    await this.updatePreference('default_agent_instructions', { instructions });
  }
}

export const systemPreferencesService = new SystemPreferencesService();
