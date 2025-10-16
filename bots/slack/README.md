# iChat Ocean Slack Bot

Slack bot integration for the iChat Ocean workplace safety AI assistant.

## Prerequisites
- Node.js 22+
- Slack workspace with a Bolt app configured (Bot Token, Signing Secret, optional App Token for Socket Mode)

## Installation
```bash
cd bots/slack
pnpm install
```

## Build
The bot is written in TypeScript and needs to be compiled before running:
```bash
pnpm run build
```

For development with auto-rebuild on changes:
```bash
pnpm run dev
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
pnpm run start
```

Or build and run in one command:
```bash
pnpm run start:dev
```

The bot will reply with AI-generated responses to messages directed at it.

### Debug Mode
To enable detailed debug logging:
```bash
DEBUG=1 pnpm run start
```

### App Home (Home tab)
- In your Slack app settings → App Home → enable the Home tab.
- Ensure the bot token has `chat:write` scope (required for `views.publish`).
- When a user opens the app’s Home, the bot publishes a Home view with a button to open a modal.

## Docker

### Building the Docker Image
Build the production Docker image:
```bash
docker build -t ichat-slack-bot .
```

### Running the Container
Run the container with your environment variables:
```bash
    docker run -d \
    --name ichat-slack-bot \
    -p 3000:3000 \
    --env-file .env \
    ichat-slack-bot
```

### Environment Variables for Docker
Ensure your `.env` file contains the required Slack configuration:
```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-... # required only when SLACK_SOCKET_MODE=true
SLACK_SOCKET_MODE=true   # optional, defaults to false
SLACK_PORT=3000          # optional
```

### Health Check
The container includes a health check that monitors the `/health` endpoint every 30 seconds. You can check the container's health status with:
```bash
docker ps
# or for detailed health status:
docker inspect ichat-slack-bot
```

### Logs and Debugging
View container logs:
```bash
docker logs ichat-slack-bot
# Follow logs in real-time:
docker logs -f ichat-slack-bot
```

### Stopping the Container
Stop and remove the container:
```bash
docker stop ichat-slack-bot
docker rm ichat-slack-bot
```

## Project Context

This Slack bot is part of the iChat Ocean ecosystem. For more information about the overall project:

- [Main Project README](../README.md) - Overview of the complete iChat Ocean system
- [Business Case](../docs/BUSINESS_CASE.md) - Project justification and ROI analysis
- [Shared Library](../lib/README.md) - Common functionality and agent services

## Tests
```bash
pnpm dlx vitest run
```
