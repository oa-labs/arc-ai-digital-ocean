import { supabase } from '@/lib/supabase';

export interface UserSettings {
  id: string;
  user_id: string;
  digitalocean_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsInput {
  digitalocean_token: string | null;
}

class UserSettingsService {
  /**
   * Get current user's settings
   */
  async getUserSettings(): Promise<UserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no settings exist yet, return null (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to get user settings:', error);
      throw new Error(`Failed to get user settings: ${error.message}`);
    }

    return data;
  }

  /**
   * Create or update user settings
   */
  async upsertUserSettings(settings: UserSettingsInput): Promise<UserSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Try to update first
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          digitalocean_token: settings.digitalocean_token,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update user settings:', error);
        throw new Error(`Failed to update user settings: ${error.message}`);
      }

      return data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          digitalocean_token: settings.digitalocean_token,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create user settings:', error);
        throw new Error(`Failed to create user settings: ${error.message}`);
      }

      return data;
    }
  }

  /**
   * Check if user has a DigitalOcean token configured
   */
  async hasDigitalOceanToken(): Promise<boolean> {
    const settings = await this.getUserSettings();
    return !!(settings && settings.digitalocean_token);
  }

  /**
   * Get the DigitalOcean token for the current user
   */
  async getDigitalOceanToken(): Promise<string | null> {
    const settings = await this.getUserSettings();
    return settings?.digitalocean_token || null;
  }
}

export const userSettingsService = new UserSettingsService();

