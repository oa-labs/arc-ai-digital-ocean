# Slack Bot Setup

## Prerequisites
- Node.js 18+
- Slack workspace with a Bolt app configured (Bot Token, Signing Secret, optional App Token for Socket Mode)

## Installation
```bash
cd bots/slack
npm install
```

## Build
The bot is written in TypeScript and needs to be compiled before running:
```bash
npm run build
```

For development with auto-rebuild on changes:
```bash
npm run dev
```

### Path Aliases
The project uses TypeScript path mapping with the `@lib` alias to import from the shared library:
```typescript
import { OpenAiAgentService, getConfig, validateConfig } from '@lib/index.js';
```

This is configured in `tsconfig.json` for build-time resolution.

## Configuration
Create a `.env` file in the project root containing:
```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-... # required only when SLACK_SOCKET_MODE=true
SLACK_SOCKET_MODE=true   # optional, defaults to false
SLACK_PORT=3000          # optional
```

## Running the Bot
After building, run the bot with:
```bash
npm run start
```

Or build and run in one command:
```bash
npm run start:dev
```

The bot will reply with AI-generated responses to messages directed at it.

### Debug Mode
To enable detailed debug logging:
```bash
DEBUG=1 npm run start
```

### App Home (Home tab)
- In your Slack app settings → App Home → enable the Home tab.
- Ensure the bot token has `chat:write` scope (required for `views.publish`).
- When a user opens the app’s Home, the bot publishes a Home view with a button to open a modal.

## Tests
```bash
npx vitest run
```
