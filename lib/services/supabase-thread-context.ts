import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SlackThreadContext, SlackThreadContextRecord } from '../types/index.js';

export interface ThreadContextStore {
  get(threadTs: string): Promise<SlackThreadContext | undefined>;
  save(threadTs: string, context: SlackThreadContext): Promise<void>;
}

export class SupabaseThreadContextStore implements ThreadContextStore {
  private client: SupabaseClient;
  private tableName = 'slack_thread_contexts';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async get(threadTs: string): Promise<SlackThreadContext | undefined> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('thread_ts', threadTs)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return undefined;
      }
      console.error('[ERROR] Failed to fetch thread context:', error);
      throw new Error(`Failed to fetch thread context: ${error.message}`);
    }

    return data?.context as SlackThreadContext;
  }

  async save(threadTs: string, context: SlackThreadContext): Promise<void> {
    const record: Omit<SlackThreadContextRecord, 'created_at' | 'updated_at'> = {
      thread_ts: threadTs,
      context,
    };

    const { error } = await this.client
      .from(this.tableName)
      .upsert(record, { onConflict: 'thread_ts' });

    if (error) {
      console.error('[ERROR] Failed to save thread context:', error);
      throw new Error(`Failed to save thread context: ${error.message}`);
    }
  }
}

export function createThreadContextStore(
  supabaseUrl?: string,
  supabaseKey?: string
): ThreadContextStore | null {
  const url = supabaseUrl || process.env.SUPABASE_URL;
  // Use service role key for backend services to bypass RLS
  // Fall back to anon key for backward compatibility
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[WARN] Supabase credentials not provided. Thread context storage will be disabled.');
    return null;
  }

  return new SupabaseThreadContextStore(url, key);
}
