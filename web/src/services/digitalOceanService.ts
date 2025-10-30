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
  deployment?: {
    uuid: string;
    url: string;
    status: string;
    visibility: string;
    created_at: string;
    updated_at: string;
  };
  // Add other fields as needed from the API response
}

export interface DigitalOceanAgentDetail extends DigitalOceanAgent {
  // Additional fields that might be in the detail response
  endpoint?: string;
  model?: string;
  knowledge_bases?: string[];
  [key: string]: any;
}

export interface DigitalOceanBucket {
  Name: string;
  CreationDate: string;
}

export interface SpacesDataSource {
  bucket_name: string;
  [key: string]: any;
}

export interface KnowledgeBaseDataSource {
  uuid: string;
  type: string;
  spaces_data_source?: SpacesDataSource;
  [key: string]: any;
}

export interface KnowledgeBaseDataSourcesResponse {
  knowledge_base_data_sources: KnowledgeBaseDataSource[];
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
   * List all S3 buckets (Spaces) from DigitalOcean
   * Uses AWS S3 API compatible endpoint
   * Documentation: https://docs.digitalocean.com/reference/api/spaces/#bucket-management
   */
  async listBuckets(apiToken: string): Promise<DigitalOceanBucket[]> {
    try {
      const response = await fetch(`${this.baseUrl}/spaces/buckets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list DigitalOcean buckets (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // AWS S3 API format: { Buckets: [...] }
      return data.Buckets || data.buckets || [];
    } catch (error) {
      console.error('Error listing DigitalOcean buckets:', error);
      throw error;
    }
  }

  /**
   * Get data sources for a specific knowledge base
   * GET https://api.digitalocean.com/v2/genai/knowledge_bases/{knowledge_base_id}/data_sources
   */
  async getKnowledgeBaseDataSources(
    apiToken: string,
    knowledgeBaseId: string
  ): Promise<KnowledgeBaseDataSource[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/genai/knowledge_bases/${knowledgeBaseId}/data_sources`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get knowledge base data sources (${response.status}): ${errorText}`
        );
      }

      const data: KnowledgeBaseDataSourcesResponse = await response.json();
      return data.knowledge_base_data_sources || [];
    } catch (error) {
      console.error('Error getting knowledge base data sources:', error);
      throw error;
    }
  }

  /**
   * Get all Spaces bucket names from knowledge bases associated with an agent
   */
  async getSpacesBucketsFromAgent(
    apiToken: string,
    agentDetail: DigitalOceanAgentDetail
  ): Promise<string[]> {
    try {
      const knowledgeBases = agentDetail.knowledge_bases || [];
      
      if (knowledgeBases.length === 0) {
        return [];
      }

      // Fetch data sources for all knowledge bases in parallel
      const dataSourcesPromises = knowledgeBases.map((kbId) =>
        this.getKnowledgeBaseDataSources(apiToken, kbId)
      );

      const dataSourcesArrays = await Promise.all(dataSourcesPromises);
      
      // Flatten and extract bucket names
      const bucketNames = new Set<string>();
      dataSourcesArrays.forEach((dataSources) => {
        dataSources.forEach((dataSource) => {
          if (dataSource.spaces_data_source?.bucket_name) {
            bucketNames.add(dataSource.spaces_data_source.bucket_name);
          }
        });
      });

      return Array.from(bucketNames);
    } catch (error) {
      console.error('Error getting Spaces buckets from agent:', error);
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

