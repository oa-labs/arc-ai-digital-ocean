/**
 * Service for interacting with DigitalOcean GradientAI Platform API
 * API Documentation: https://docs.digitalocean.com/reference/api/digitalocean/#tag/GradientAI-Platform
 */

export interface DigitalOceanAgent {
  uuid: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  url: string;
  // Add other fields as needed from the API response
}

export interface DigitalOceanAgentDetail extends DigitalOceanAgent {
  // Additional fields that might be in the detail response
  endpoint?: string;
  model?: string;
  [key: string]: any;
}

class DigitalOceanService {
  private readonly baseUrl = 'https://api.digitalocean.com/v2';

  /**
   * List all deployed agents from DigitalOcean
   * GET https://api.digitalocean.com/v2/gen-ai/agents
   */
  async listAgents(apiToken: string): Promise<DigitalOceanAgent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/gen-ai/agents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list DigitalOcean agents (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // The API response structure might be { agents: [...] } or just [...]
      // Adjust based on actual API response
      return data.agents || data || [];
    } catch (error) {
      console.error('Error listing DigitalOcean agents:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific agent
   * GET https://api.digitalocean.com/v2/gen-ai/agents/{agent_id}
   */
  async getAgent(apiToken: string, agentId: string): Promise<DigitalOceanAgentDetail> {
    try {
      const response = await fetch(`${this.baseUrl}/gen-ai/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get DigitalOcean agent (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // The API response structure might be { agent: {...} } or just {...}
      // Adjust based on actual API response
      return data.agent || data;
    } catch (error) {
      console.error('Error getting DigitalOcean agent:', error);
      throw error;
    }
  }

  /**
   * Validate API token by making a test request
   */
  async validateToken(apiToken: string): Promise<boolean> {
    try {
      await this.listAgents(apiToken);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const digitalOceanService = new DigitalOceanService();

