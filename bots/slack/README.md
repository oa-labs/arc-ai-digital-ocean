# Slack Bot Setup

## Prerequisites
- Node.js 18+ and Bun installed
- Slack workspace with a Bolt app configured (Bot Token, Signing Secret, optional App Token for Socket Mode)

## Installation
```bash
bun install
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
```bash
bun node bots/slack/index.js
```

The bot will reply `hello` to every message directed at it.

### Debug Mode
To enable detailed debug logging:
```bash
DEBUG=1 bun node bots/slack/index.js
```

### App Home (Home tab)
- In your Slack app settings → App Home → enable the Home tab.
- Ensure the bot token has `chat:write` scope (required for `views.publish`).
- When a user opens the app’s Home, the bot publishes a Home view with a button to open a modal.

## Tests
```bash
bunx vitest run
```
