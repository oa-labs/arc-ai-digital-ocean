import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';
import type { AuthenticatedRequest } from '../types.js';

const updatePreferenceSchema = z.object({
  preference_value: z.record(z.any()),
});

export const systemPreferencesRouter = Router();

async function isOwner(userId: string): Promise<boolean> {
  const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !user) return false;
  const role = user.user?.user_metadata?.role;
  return role === 'owner';
}

systemPreferencesRouter.get('/models', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    // Get user's DigitalOcean token from settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('digitalocean_token')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.digitalocean_token) {
      return res.status(503).json({
        error: 'DigitalOcean API token not configured for user',
        models: []
      });
    }

    const doApiKey = settings.digitalocean_token;

    const response = await fetch('https://api.digitalocean.com/v2/gen-ai/models', {
      headers: {
        'Authorization': `Bearer ${doApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('DigitalOcean API error:', response.status, await response.text());
      return res.status(response.status).json({
        error: 'Failed to fetch models from DigitalOcean',
        models: []
      });
    }

    const data = await response.json();
    return res.json({ models: data.models || [] });
  } catch (err) {
    console.error('Error fetching models:', err);
    return next(err);
  }
});

systemPreferencesRouter.get('/:key', requireAuth, async (req, res, next) => {
  try {
    const { key } = req.params;

    const { data, error } = await supabaseAdmin
      .from('system_preferences')
      .select('*')
      .eq('preference_key', key)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch preference:', error);
      return res.status(500).json({ error: 'Failed to fetch preference' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Preference not found' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Error fetching preference:', err);
    return next(err);
  }
});

systemPreferencesRouter.put('/:key', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const { key } = req.params;
    const body = updatePreferenceSchema.parse(req.body);

    if (!(await isOwner(userId))) {
      return res.status(403).json({ 
        error: 'Only owners can update system preferences' 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('system_preferences')
      .upsert({
        preference_key: key,
        preference_value: body.preference_value,
        updated_by: userId,
      }, {
        onConflict: 'preference_key'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to update preference:', error);
      return res.status(500).json({ error: 'Failed to update preference' });
    }

    return res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request body', details: err.errors });
    }
    console.error('Error updating preference:', err);
    return next(err);
  }
});
