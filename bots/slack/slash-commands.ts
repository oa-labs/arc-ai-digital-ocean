import { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';
import { canManageAgents, getPermissionDeniedMessage } from './permissions.js';
import { AgentManager, createAgentManager, createRAGService, RAGService } from '@arc-ai/shared';

// Create singleton instances
const ragService = createRAGService();
const agentManager = createAgentManager(ragService);

const debug = (...args: any[]): void => {
  if (process.env.DEBUG === '1') {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * Handle /agent command
 */
export async function handleAgentCommand({
  command,
  ack,
  say,
  client,
}: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  await ack();

  const userId = command.user_id;
  const channelId = command.channel_id;
  const text = command.text.trim();
  const args = text.split(/\s+/);
  const subcommand = args[0]?.toLowerCase();

  debug('Agent command received:', { userId, channelId, subcommand, args });

  if (!agentManager) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '❌ Agent management is not configured. Please contact your administrator.',
    });
    return;
  }

  try {
    switch (subcommand) {
      case 'list':
        await handleAgentList({ client, userId, channelId });
        break;

      case 'select':
        await handleAgentSelect({ client, userId, channelId, agentName: args[1], say });
        break;

      case 'info':
        await handleAgentInfo({ client, userId, channelId });
        break;

      case 'help':
      default:
        await handleAgentHelp({ client, userId, channelId });
        break;
    }
  } catch (error) {
    console.error('[ERROR] Failed to handle agent command:', error);
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '❌ An error occurred while processing your command. Please try again.',
    });
  }
}

/**
 * List all available agents
 * Available to all users
 */
async function handleAgentList({
  client,
  userId,
  channelId,
}: {
  client: any;
  userId: string;
  channelId: string;
}): Promise<void> {
  if (!agentManager) return;

  const agents = await agentManager.listAgents();

  if (agents.length === 0) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '📋 No agents configured yet.',
    });
    return;
  }

  const agentList = agents
    .map((agent) => {
      const activeEmoji = agent.is_active ? '✅' : '⏸️';
      return `${activeEmoji} 🌊 *${agent.name}* - ${agent.description || 'No description'}`;
    })
    .join('\n');

  await client.chat.postEphemeral({
    channel: channelId,
    user: userId,
    text: `📋 *Available Agents:*\n\n${agentList}\n\n_Use \`/agent select <name>\` to switch agents (admin only)_`,
  });
}

/**
 * Select an agent for the current channel
 * ADMIN ONLY - Requires workspace admin or channel creator permissions
 */
async function handleAgentSelect({
  client,
  userId,
  channelId,
  agentName,
  say,
}: {
  client: any;
  userId: string;
  channelId: string;
  agentName: string;
  say: any;
}): Promise<void> {
  if (!agentManager) return;

  // Check permissions FIRST
  const hasPermission = await canManageAgents(client, userId, channelId);

  if (!hasPermission) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: getPermissionDeniedMessage('change the agent for this channel'),
    });
    return;
  }

  // Validate agent name provided
  if (!agentName) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '❌ Please specify an agent name. Usage: `/agent select <agent-name>`',
    });
    return;
  }

  // Get channel info for logging
  let channelName = channelId;
  let teamId: string | undefined;

  try {
    const channelInfo = await client.conversations.info({ channel: channelId });
    channelName = (channelInfo.channel as any)?.name || channelId;
    teamId = (channelInfo.channel as any)?.context_team_id;
  } catch (error) {
    debug('Failed to get channel info:', error);
  }

  // Attempt to select the agent
  const result = await agentManager.selectAgentForChannel(
    channelId,
    agentName,
    userId,
    channelName,
    teamId
  );

  if (!result.success) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: `❌ ${result.error}`,
    });
    return;
  }

  // Success - post public message to channel
  await say({
    text: `✅ This channel now uses the *${result.agent?.name}* agent`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🌊 *Agent Changed*\n\nThis channel now uses the *${result.agent?.name}* agent.\n\n*Changed by:* <@${userId}>`,
        },
      },
    ],
  });

  console.log('[INFO] Agent changed:', {
    channelId,
    channelName,
    agentName: result.agent?.name,
    changedBy: userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Show info about the current channel's agent
 * Available to all users
 */
async function handleAgentInfo({
  client,
  userId,
  channelId,
}: {
  client: any;
  userId: string;
  channelId: string;
}): Promise<void> {
  if (!agentManager) return;

  const agentInfo = await agentManager.getChannelAgent(channelId);

  if (!agentInfo) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '❌ No agent configured for this channel. Ask an admin to use `/agent select <name>` to set one.',
    });
    return;
  }

  // Build RAG sources info with last updated dates
  let ragInfo = 'No S3 sources configured';
  if (agentInfo.s3_sources && agentInfo.s3_sources.length > 0) {
    const ragSources: string[] = [];
    for (const source of agentInfo.s3_sources) {
      const sourcePath = `s3://${source.bucket_name}${source.prefix ? '/' + source.prefix : ''}`;
      let lastUpdated = 'Unknown';

      if (ragService) {
        try {
          const latestModified = await (ragService as any).getLatestModified(source.bucket_name, source.prefix);
          if (latestModified) {
            lastUpdated = latestModified.toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            });
          }
        } catch (error) {
          console.error('[AgentInfo] Failed to get last modified for RAG source:', error);
        }
      }

      ragSources.push(`${sourcePath} (Last updated: ${lastUpdated})`);
    }
    ragInfo = ragSources.join('\n');
  }

  const systemPrompt = agentInfo.system_prompt || 'Default prompt';

  await client.chat.postEphemeral({
    channel: channelId,
    user: userId,
    text: `🌊 *Current Agent: ${agentInfo.name}*\n\n*RAG Sources:*\n${ragInfo}\n\n*System Prompt:*\n${systemPrompt}\n\n_Use \`/agent list\` to see all available agents_`,
  });
}

/**
 * Show help for agent commands
 * Available to all users
 */
async function handleAgentHelp({
  client,
  userId,
  channelId,
}: {
  client: any;
  userId: string;
  channelId: string;
}): Promise<void> {
  const helpText = `
🤖 *Agent Management Commands*

*Available to everyone:*
• \`/agent list\` - List all available agents
• \`/agent info\` - Show current channel's agent details
• \`/agent help\` - Show this help message

*Admin only (workspace admins & channel creators):*
• \`/agent select <name>\` - Change the agent for this channel

*Examples:*
\`/agent list\`
\`/agent select safety-bot\`
\`/agent info\`
  `.trim();

  await client.chat.postEphemeral({
    channel: channelId,
    user: userId,
    text: helpText,
  });
}

