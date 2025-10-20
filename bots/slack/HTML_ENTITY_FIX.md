# HTML Entity Decoding Fix

## Problem
The Slack bot was displaying HTML entities in messages instead of the actual characters:
- `&#97;&#x6e;&#100;&#x72;&#101;&#x77;&#x62;&#111;&#x65;&#x68;&#109;&#64;&#x6f;&#112;&#x65;&#x6e;&#97;&#x72;&#x63;&#46;&#110;&#101;&#116;`
- Should display as: `andrewboehm@openarc.net`

## Root Cause
The AI agent's responses contained HTML-encoded entities (from the source data or RAG results), and these were being sent to Slack without decoding. There were **two code paths** that needed fixing:

1. **Block Kit path** (DMs, mentions) - Uses `markdownToSlackMessage()`
2. **Assistant streaming path** (threaded conversations) - Directly streams content

## Solution

### 1. Created HTML Entity Decoder
Added a function to decode both numeric and named HTML entities:
- Decimal entities: `&#97;` → `a`
- Hexadecimal entities: `&#x61;` → `a`  
- Named entities: `&amp;` → `&`, `&lt;` → `<`, etc.

### 2. Applied Decoding in Two Places

#### A. Block Kit Messages ([`markdown-formatter.ts`](file:///workspaces/arc-ai/bots/slack/markdown-formatter.ts))
```typescript
export const markdownToBlocks = async (markdown: string): Promise<KnownBlock[]> => {
  const decoded = decodeHtmlEntities(markdown);  // ← Decode before formatting
  return await mackMarkdownToBlocks(decoded);
};
```

#### B. Assistant Streaming ([`app.ts`](file:///workspaces/arc-ai/bots/slack/app.ts))
```typescript
// Decode HTML entities before streaming
const decodedContent = decodeHtmlEntities(response.content);  // ← Decode before streaming

// Stream the markdown content
const chunkSize = 50;
for (let i = 0; i < decodedContent.length; i += chunkSize) {
  const chunk = decodedContent.substring(i, Math.min(i + chunkSize, decodedContent.length));
  await streamer.append({ markdown_text: chunk });
}
```

## Testing
Created comprehensive tests in [`markdown-formatter.test.ts`](file:///workspaces/arc-ai/bots/slack/markdown-formatter.test.ts):
- ✅ Hex entities: `&#x61;` → `a`
- ✅ Decimal entities: `&#97;` → `a`
- ✅ Mixed entities: `&#97;&#x6e;` → `an`
- ✅ Full email: `&#97;&#x6e;...&#116;` → `andrewboehm@openarc.net`
- ✅ Named entities: `&amp;` → `&`
- ✅ Mixed text and entities

All tests pass ✓

## Files Changed
1. [`bots/slack/markdown-formatter.ts`](file:///workspaces/arc-ai/bots/slack/markdown-formatter.ts) - Added decoding in Block Kit path
2. [`bots/slack/app.ts`](file:///workspaces/arc-ai/bots/slack/app.ts) - Added decoding in streaming path
3. [`bots/slack/markdown-formatter.test.ts`](file:///workspaces/arc-ai/bots/slack/markdown-formatter.test.ts) - Comprehensive test suite

## Deployment
After rebuilding (`pnpm build`), the bot will now properly decode HTML entities in all response types.
