/**
 * Converts markdown text to Slack Block Kit format for rich message formatting
 * Uses @tryfabric/mack library for robust markdown to Slack blocks conversion
 */

import { markdownToBlocks as mackMarkdownToBlocks } from '@tryfabric/mack';
import type { KnownBlock } from '@slack/types';

/**
 * Decodes HTML entities in text
 * Handles both named entities (&amp;) and numeric entities (&#123; or &#x7B;)
 */
const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

/**
 * Converts markdown text to Slack Block Kit blocks
 * Uses the mack library which handles code blocks, lists, headings, and regular text
 */
export const markdownToBlocks = async (markdown: string): Promise<KnownBlock[]> => {
  const decoded = decodeHtmlEntities(markdown);
  
  // Debug logging to verify decoding
  if (markdown.includes('&#') && process.env.DEBUG === '1') {
    console.log('[DEBUG] HTML entities detected in markdown');
    console.log('[DEBUG] Before decoding:', markdown.substring(0, 200));
    console.log('[DEBUG] After decoding:', decoded.substring(0, 200));
  }
  
  return await mackMarkdownToBlocks(decoded);
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
