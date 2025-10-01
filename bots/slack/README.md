# Slack Bot Setup

## Prerequisites
- Node.js 18+ or Bun installed
- Slack workspace with a Bolt app configured (Bot Token, Signing Secret, optional App Token for Socket Mode)

## Installation
```bash
cd bots/slack
bun install
```

## Build
The bot is written in TypeScript and needs to be compiled before running:
```bash
bun run build
```

For development with auto-rebuild on changes:
```bash
bun run dev
```

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
bun run start
```

Or build and run in one command:
```bash
bun run start:dev
```

The bot will reply with AI-generated responses to messages directed at it.

### Debug Mode
To enable detailed debug logging:
```bash
DEBUG=1 bun run start
```

### App Home (Home tab)
- In your Slack app settings → App Home → enable the Home tab.
- Ensure the bot token has `chat:write` scope (required for `views.publish`).
- When a user opens the app’s Home, the bot publishes a Home view with a button to open a modal.

## Tests
```bash
bunx vitest run
```
