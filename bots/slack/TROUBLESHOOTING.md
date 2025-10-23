# Slack Bot Troubleshooting Guide

## ✅ Migration Status

The OpenAI agent service has been successfully migrated from Chat Completions API to Responses API.

**All integration tests pass successfully!** ✅

## Quick Fix: Restart the Bot

After the Responses API migration, the Slack bot needs to be restarted to pick up the changes:

```bash
cd bots/slack

# Build the bot (already done)
npm run build

# Start the bot
npm run start
```

Or use the development mode with auto-rebuild:
```bash
npm run start:dev
```

## Verification Steps

### 1. Test the Integration (Already Passed ✅)

```bash
cd bots/slack
node test-slack-integration.js
```

Expected output:
```
=== All Tests Passed ✅ ===
```

### 2. Check Environment Configuration

Verify your `.env` file has all required variables:

```bash
cd bots/slack
cat .env
```

Required variables:
- `SLACK_BOT_TOKEN` - Your Slack bot token (xoxb-...)
- `SLACK_SIGNING_SECRET` - Your Slack signing secret
- `SLACK_APP_TOKEN` - Your Slack app token (xapp-...) if using socket mode
- `SLACK_SOCKET_MODE` - Set to `true` for socket mode
- `AGENT_PROVIDER` - Set to `openai`
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model to use (e.g., `gpt-4o-mini`)

### 3. Verify Build Output

Check that the compiled JavaScript is up to date:

```bash
ls -la bots/slack/dist/
```

You should see:
- `app.js` - Main application logic
- `index.js` - Entry point

### 4. Check Shared Library

Verify the shared library is built with the Responses API changes:

```bash
grep -n "responses.create" lib/dist/services/openai-agent-service.js
```

Expected output should show `responses.create` instead of `chat.completions.create`.

## Common Issues and Solutions

### Issue 1: Bot Not Responding

**Symptoms:**
- Bot appears online in Slack
- Messages to the bot receive no response
- No errors in logs

**Solution:**
1. Restart the bot process
2. Verify the bot is using the rebuilt code
3. Check that the shared library (`@arc-ai/shared`) is properly linked

```bash
cd bots/slack
npm run build
npm run start
```

### Issue 2: "Agent service not properly initialized"

**Symptoms:**
- Error message: "Agent service not properly initialized. Check your configuration."

**Solution:**
1. Verify environment variables are set correctly
2. Check that `OPENAI_API_KEY` is valid
3. Ensure `AGENT_PROVIDER=openai` is set

```bash
cd bots/slack
node test-slack-integration.js
```

### Issue 3: API Errors After Migration

**Symptoms:**
- Errors mentioning `max_tokens` or `messages` parameters
- Type errors related to OpenAI API

**Solution:**
The migration has already been completed. If you see these errors:
1. Rebuild the shared library: `cd lib && npm run build`
2. Rebuild the Slack bot: `cd bots/slack && npm run build`
3. Restart the bot

### Issue 4: Model Not Supported

**Symptoms:**
- Error: "Model not found" or similar

**Solution:**
The Responses API supports the same models as Chat Completions. Verify your model name:
- ✅ `gpt-4o-mini` (recommended)
- ✅ `gpt-4o`
- ✅ `gpt-4-turbo`
- ✅ `gpt-3.5-turbo` (legacy, but supported)

Update in `.env`:
```bash
OPENAI_MODEL=gpt-4o-mini
```

## Debugging Commands

### Check if bot is running
```bash
ps aux | grep "node.*slack" | grep -v grep
```

### View bot logs (if running in background)
```bash
cd bots/slack
npm run start 2>&1 | tee bot.log
```

### Test API connection directly
```bash
cd /workspaces/git-main
node test-responses-api.js
```

### Verify Slack app configuration
1. Go to https://api.slack.com/apps
2. Select your app
3. Check:
   - **OAuth & Permissions**: Bot token scopes include `chat:write`, `app_mentions:read`, `im:history`, `im:read`, `im:write`
   - **Event Subscriptions**: Enabled and subscribed to `message.im`, `app_mention`
   - **Socket Mode**: Enabled (if using socket mode)

## What Changed in the Migration

### API Calls
- ✅ `client.chat.completions.create()` → `client.responses.create()`
- ✅ `messages` parameter → `input` parameter
- ✅ `max_tokens` → `max_output_tokens`
- ✅ Added `store: false` for privacy compliance
- ✅ System messages now use `instructions` parameter

### Response Handling
- ✅ `completion.choices[0].message.content` → `response.output_text`
- ✅ `usage.prompt_tokens` → `usage.input_tokens`
- ✅ `usage.completion_tokens` → `usage.output_tokens`

### Backward Compatibility
**100% backward compatible** - All public methods maintain the same signatures:
- `sendMessage(message, context?)`
- `sendSystemMessage(systemPrompt, userMessage)`
- `sendSimpleMessage(message)`

## Files Modified

1. **lib/services/openai-agent-service.ts** - TypeScript source
2. **lib/services/openai-agent-service.js** - Compiled JavaScript
3. **lib/dist/services/openai-agent-service.js** - Distributed build

## Next Steps

1. **Restart the bot** (most important!)
   ```bash
   cd bots/slack
   npm run start
   ```

2. **Test in Slack**
   - Send a DM to the bot
   - Mention the bot in a channel
   - Verify responses are working

3. **Monitor logs**
   - Watch for any errors
   - Verify successful API calls
   - Check token usage

## Support

If issues persist after following this guide:

1. Run the integration test:
   ```bash
   cd bots/slack
   node test-slack-integration.js
   ```

2. Check the migration documentation:
   - `/workspaces/git-main/MIGRATION_SUMMARY.md`
   - `/workspaces/git-main/RESPONSES_API_MIGRATION.md`
   - `/workspaces/git-main/RESPONSES_API_QUICK_REFERENCE.md`

3. Verify OpenAI API status: https://status.openai.com/

## Success Indicators

✅ Integration test passes  
✅ Bot builds without errors  
✅ Bot starts without errors  
✅ Bot responds to DMs  
✅ Bot responds to mentions  
✅ Token usage is tracked correctly  

All of these should work after restarting the bot!

