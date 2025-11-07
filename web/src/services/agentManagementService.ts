import { supabase } from '@/lib/supabase';

export interface AgentS3Source {
  id?: string;
  agent_id?: string;
  provider: 'digitalocean' | 'aws' | 'gcs';
  bucket_name: string;
  prefix?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  provider: 'digitalocean';
  api_key_env_var: string;
  temperature?: number;
  max_tokens?: number;
  endpoint?: string;
  s3_sources?: AgentS3Source[];
  system_prompt?: string;
  is_active: boolean;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  provider: 'digitalocean';
  api_key_env_var: string;
  temperature?: number;
  max_tokens?: number;
  endpoint?: string;
  s3_sources?: { bucket_name: string; prefix?: string }[];
  system_prompt?: string;
  is_active?: boolean;
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {}

export interface ChannelAgent {
  channel_id: string;
  agent_id: string;
  team_id?: string;
  channel_name?: string;
  activated_by?: string;
  activated_at: string;
  created_at: string;
  updated_at: string;
  agent?: Agent;
}

export interface AgentUsageLog {
  id: string;
  agent_id: string;
  channel_id: string;
  user_id?: string;
  message_ts?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  response_time_ms: number;
  error_message?: string;
  created_at: string;
  agent?: Agent;
}

export interface AgentChangeLog {
  id: string;
  channel_id: string;
  previous_agent_id?: string;
  new_agent_id: string;
  changed_by: string;
  changed_at: string;
  team_id?: string;
  channel_name?: string;
  previous_agent?: Agent;
  new_agent?: Agent;
}

export interface AgentStats {
  total_messages: number;
  total_tokens: number;
  avg_response_time_ms: number;
  error_count: number;
  last_used_at?: string;
}

class AgentManagementService {
  /**
   * List all agents
   */
  async listAgents(activeOnly = false): Promise<Agent[]> {
    let query = supabase.from('agents').select('*').order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to list agents:', error);
      throw new Error(`Failed to list agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get agent by ID
   */
  async getAgent(id: string): Promise<Agent | null> {
    const { data, error } = await supabase.from('agents').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to get agent:', error);
      throw new Error(`Failed to get agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new agent
   */
  async createAgent(input: CreateAgentInput): Promise<Agent> {
    const { s3_sources, ...agentData } = input;
    
    const { data, error } = await supabase
      .from('agents')
      .insert({
        ...agentData,
        is_active: agentData.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create agent:', error);
      throw new Error(`Failed to create agent: ${error.message}`);
    }

    if (s3_sources && s3_sources.length > 0) {
      const s3SourcesData = s3_sources.map((source) => ({
        agent_id: data.id,
        provider: input.provider as 'digitalocean' | 'aws' | 'gcs',
        bucket_name: source.bucket_name,
        prefix: source.prefix || '',
      }));

      const { error: s3Error } = await supabase
        .from('agent_s3_sources')
        .insert(s3SourcesData);

      if (s3Error) {
        console.error('Failed to create S3 sources:', s3Error);
        await this.permanentlyDeleteAgent(data.id);
        throw new Error(`Failed to create S3 sources: ${s3Error.message}`);
      }

      const { data: s3Data, error: s3FetchError } = await supabase
        .from('agent_s3_sources')
        .select('*')
        .eq('agent_id', data.id);

      if (!s3FetchError && s3Data) {
        data.s3_sources = s3Data;
      }
    }

    return data;
  }

  /**
   * Update an agent
   */
  async updateAgent(id: string, input: UpdateAgentInput): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update agent:', error);
      throw new Error(`Failed to update agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an agent (soft delete by setting is_active to false)
   */
  async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete agent:', error);
      throw new Error(`Failed to delete agent: ${error.message}`);
    }
  }

  /**
   * Permanently delete an agent (hard delete - removes the record)
   * Also removes related channel mappings and usage logs
   */
  async permanentlyDeleteAgent(id: string): Promise<void> {
    // First, delete related channel mappings (due to RESTRICT constraint)
    const { error: channelError } = await supabase
      .from('slack_channel_agents')
      .delete()
      .eq('agent_id', id);

    if (channelError) {
      console.error('Failed to delete channel mappings:', channelError);
      throw new Error(`Failed to delete channel mappings: ${channelError.message}`);
    }

    // Then delete the agent (usage logs will be deleted via CASCADE)
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete agent:', error);
      throw new Error(`Failed to delete agent: ${error.message}`);
    }
  }

  /**
   * Set an agent as the default
   */
  async setDefaultAgent(id: string): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to set default agent:', error);
      throw new Error(`Failed to set default agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Get the default agent
   */
  async getDefaultAgent(): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to get default agent:', error);
      throw new Error(`Failed to get default agent: ${error.message}`);
    }

    return data;
  }

  /**
   * List channel-agent mappings
   */
  async listChannelAgents(): Promise<ChannelAgent[]> {
    const { data, error } = await supabase
      .from('slack_channel_agents')
      .select('*, agent:agents(*)')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to list channel agents:', error);
      throw new Error(`Failed to list channel agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get agent usage statistics
   */
  async getAgentStats(agentId: string, days = 7): Promise<AgentStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('agent_usage_logs')
      .select('*')
      .eq('agent_id', agentId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get agent stats:', error);
      throw new Error(`Failed to get agent stats: ${error.message}`);
    }

    const logs = data || [];

    return {
      total_messages: logs.length,
      total_tokens: logs.reduce((sum, log) => sum + log.total_tokens, 0),
      avg_response_time_ms:
        logs.length > 0
          ? logs.reduce((sum, log) => sum + log.response_time_ms, 0) / logs.length
          : 0,
      error_count: logs.filter((log) => log.error_message).length,
      last_used_at: logs.length > 0 ? logs[0].created_at : undefined,
    };
  }

  /**
   * Get recent usage logs for an agent
   */
  async getAgentUsageLogs(agentId: string, limit = 50): Promise<AgentUsageLog[]> {
    const { data, error } = await supabase
      .from('agent_usage_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get usage logs:', error);
      throw new Error(`Failed to get usage logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get agent change history
   */
  async getAgentChangeLog(channelId?: string, limit = 50): Promise<AgentChangeLog[]> {
    let query = supabase
      .from('agent_change_log')
      .select('*, previous_agent:agents!agent_change_log_previous_agent_id_fkey(*), new_agent:agents!agent_change_log_new_agent_id_fkey(*)')
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get change log:', error);
      throw new Error(`Failed to get change log: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all usage logs with agent info (for analytics)
   */
  async getAllUsageLogs(days = 7, limit = 100): Promise<AgentUsageLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('agent_usage_logs')
      .select('*, agent:agents(*)')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get all usage logs:', error);
      throw new Error(`Failed to get all usage logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all S3 sources with agent info
   */
  async getAllS3Sources(): Promise<(AgentS3Source & { agent: Agent })[]> {
    const { data, error } = await supabase
      .from('agent_s3_sources')
      .select('*, agent:agents(*)')
      .order('bucket_name', { ascending: true });

    if (error) {
      console.error('Failed to get all S3 sources:', error);
      throw new Error(`Failed to get all S3 sources: ${error.message}`);
    }

    return data || [];
  }


}

export const agentManagementService = new AgentManagementService();

