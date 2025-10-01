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

## Tests
```bash
bunx vitest run
```
