/**
 * Converts markdown text to Slack Block Kit format for rich message formatting
 * Uses @tryfabric/mack library for robust markdown to Slack blocks conversion
 */

import { markdownToBlocks as mackMarkdownToBlocks } from '@tryfabric/mack';
import type { KnownBlock } from '@slack/types';

/**
 * Converts markdown text to Slack Block Kit blocks
 * Uses the mack library which handles code blocks, lists, headings, and regular text
 */
export const markdownToBlocks = async (markdown: string): Promise<KnownBlock[]> => {
  return await mackMarkdownToBlocks(markdown);
};

/**
 * Converts markdown to a Slack message payload with blocks
 * Includes a fallback text for notifications
 */
export const markdownToSlackMessage = async (markdown: string): Promise<{ text: string; blocks: KnownBlock[] }> => {
  const blocks = await markdownToBlocks(markdown);
  
  // Create a plain text fallback (for notifications)
  const fallbackText = markdown
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .substring(0, 150);

  return {
    text: fallbackText,
    blocks
  };
}
