import { WebClient } from '@slack/web-api';

export interface UserPermissions {
  isChannelAdmin: boolean;
  isWorkspaceAdmin: boolean;
  isOwner: boolean;
}

/**
 * Check if a user has admin permissions in a channel
 */
export async function checkUserPermissions(
  client: WebClient,
  userId: string,
  channelId: string
): Promise<UserPermissions> {
  try {
    // Get channel info to determine if it's a public channel, private channel, or DM
    const channelInfo = await client.conversations.info({
      channel: channelId,
    });

    const channel = channelInfo.channel as any;
    
    // Get user info to check workspace-level permissions
    const userInfo = await client.users.info({
      user: userId,
    });

    const user = userInfo.user as any;

    // Check workspace-level admin status
    const isWorkspaceAdmin = user?.is_admin === true;
    const isOwner = user?.is_owner === true;

    // For DMs, no channel admin concept
    if (channel?.is_im || channel?.is_mpim) {
      return {
        isChannelAdmin: false,
        isWorkspaceAdmin,
        isOwner,
      };
    }

    // For channels, check if user is a channel admin/creator
    let isChannelAdmin = false;

    // Check if user is the channel creator
    if (channel?.creator === userId) {
      isChannelAdmin = true;
    }

    // For private channels, check membership info
    if (channel?.is_private || channel?.is_group) {
      try {
        // In Slack, channel admins are typically workspace admins or channel creators
        // There's no separate "channel admin" role in standard Slack
        // So we consider workspace admins and channel creators as channel admins
        isChannelAdmin = isChannelAdmin || isWorkspaceAdmin || isOwner;
      } catch (error) {
        console.error('[ERROR] Failed to get channel members:', error);
      }
    } else {
      // For public channels, workspace admins can manage
      isChannelAdmin = isWorkspaceAdmin || isOwner || (channel?.creator === userId);
    }

    return {
      isChannelAdmin,
      isWorkspaceAdmin,
      isOwner,
    };
  } catch (error) {
    console.error('[ERROR] Failed to check user permissions:', error);
    // Default to no permissions on error
    return {
      isChannelAdmin: false,
      isWorkspaceAdmin: false,
      isOwner: false,
    };
  }
}

/**
 * Check if user can manage agents in a channel
 * Returns true if user is:
 * - Workspace owner
 * - Workspace admin
 * - Channel creator
 */
export async function canManageAgents(
  client: WebClient,
  userId: string,
  channelId: string
): Promise<boolean> {
  const permissions = await checkUserPermissions(client, userId, channelId);
  return permissions.isOwner || permissions.isWorkspaceAdmin || permissions.isChannelAdmin;
}

/**
 * Format a permission denied message
 */
export function getPermissionDeniedMessage(requiredPermission: string): string {
  return `🔒 Permission denied. Only workspace admins and channel creators can ${requiredPermission}.`;
}

