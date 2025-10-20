# Citation Reference Handling

## Problem
Agent responses include citation references like `[[C1]]`, `[[C2]]`, `[[C10]]` etc. that should not be displayed to users in their current form.

## Current Solution
Citations are **removed** from the output, with warnings logged to remind us to implement proper hyperlink citations later.

## Implementation

### Citation Pattern
- Format: `[[C` followed by one or more digits followed by `]]`
- Examples: `[[C1]]`, `[[C2]]`, `[[C123]]`
- Regex: `/\[\[C\d+\]\]/g`

### Where Applied
Citations are removed in **both code paths**:

1. **Block Kit Messages** ([`markdown-formatter.ts`](file:///workspaces/arc-ai/bots/slack/markdown-formatter.ts))
   - Used for: DMs, channel messages, app mentions
   - Function: `removeCitations()` called in `markdownToBlocks()`

2. **Assistant Streaming** ([`app.ts`](file:///workspaces/arc-ai/bots/slack/app.ts))
   - Used for: Threaded assistant conversations
   - Function: `removeCitations()` called before streaming

### Warning Logs
When citations are detected and removed, the following warnings are logged:
```
[WARN] Citation references found and removed: [[C1]], [[C2]], [[C3]]
[WARN] TODO: Replace citation references with actual hyperlinks
```

## Testing
Comprehensive tests in [`markdown-formatter.test.ts`](file:///workspaces/arc-ai/bots/slack/markdown-formatter.test.ts):
- ✅ Single citation: `[[C1]]`
- ✅ Multiple citations: `[[C1]]`, `[[C2]]`
- ✅ Multi-digit citations: `[[C123]]`
- ✅ Citations in various positions
- ✅ Invalid patterns are NOT removed: `[C1]`, `[[C]]`, `[[1]]`

All 14 tests pass ✓

## Future Work: Hyperlink Citations

### TODO
Replace citation removal with proper hyperlinks that:
1. Extract citation metadata from agent response
2. Map `[[C1]]` to actual source URLs
3. Format as Slack links: `<URL|text>`
4. Preserve citation context in the message

### Example Future Implementation
```typescript
// Instead of: "This is a fact [[C1]]."
// Output: "This is a fact <https://source.com|[1]>."
```

### What's Needed
1. Citation metadata extraction from agent response
2. Mapping of citation IDs to URLs
3. URL formatting for Slack
4. Decision on citation display format (superscript numbers, inline links, footnotes, etc.)

## Files Changed
- [`bots/slack/markdown-formatter.ts`](file:///workspaces/arc-ai/bots/slack/markdown-formatter.ts) - Added `removeCitations()`
- [`bots/slack/app.ts`](file:///workspaces/arc-ai/bots/slack/app.ts) - Added `removeCitations()`
- [`bots/slack/markdown-formatter.test.ts`](file:///workspaces/arc-ai/bots/slack/markdown-formatter.test.ts) - Added citation tests
