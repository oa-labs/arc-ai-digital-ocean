# ArcAI  CLI

Command line tool for interacting with the ArcAI  agent service.

## Features

- **TypeScript**: Fully typed CLI implementation
- **DigitalOcean AI Provider**: Supports DigitalOcean AI agents
- **Interactive Mode**: Chat with the agent in real-time
- **Pipe Support**: Read messages from stdin
- **Custom System Prompts**: Override the default system prompt

## Installation

### Global Installation (Recommended)

```bash
npm install -g @arc-ai/cli
```

### Local Installation

```bash
npm install @arc-ai/cli
```

### Development Setup

For development, clone the repository and build from source:

```bash
cd cli
npm install
npm run build
```

For development with auto-rebuild on changes:

```bash
npm run dev
```

## Usage

### Basic Usage

```bash
# Send a single message
arcai-cli "What are the safety protocols for working at heights?"

# Use a custom system prompt
arcai-cli --system "You are a safety expert" "What PPE is required?"

# Short form
arcai-cli -s "You are a safety expert" "What PPE is required?"
```

### Interactive Mode

If no message is provided, the CLI enters interactive mode:

```bash
arcai-cli
```

Exit interactive mode with: `exit`, `quit`, `:q`, or `\q`

### Pipe Input

```bash
echo "What are the emergency procedures?" | arcai-cli

cat question.txt | arcai-cli
```

### Help and Version

```bash
# Show help
arcai-cli --help
arcai-cli -h

# Show version
arcai-cli --version
arcai-cli -v
```

## Configuration

The CLI uses environment variables for configuration. Create a `.env` file in the project root or set these variables:

### DigitalOcean Provider

```bash
DIGITALOCEAN_API_KEY=your-api-key-here
DIGITALOCEAN_AGENT_ENDPOINT=https://your-endpoint.com
DIGITALOCEAN_MODEL=gpt-3.5-turbo
DIGITALOCEAN_TEMPERATURE=0.7
DIGITALOCEAN_MAX_TOKENS=1000
```

## Commands

### Authentication
```bash
arcai-cli auth login                    # Authenticate with API key
arcai-cli auth logout                   # Clear authentication
```

### Documents
```bash
arcai-cli docs upload <file>            # Upload document
arcai-cli docs list                     # List all documents
arcai-cli docs delete <id>              # Delete document
```

### Users
```bash
arcai-cli users create <email>          # Create user
arcai-cli users list                    # List users
```

### Chat
```bash
arcai-cli chat start                    # Start interactive chat
```

### Queries
```bash
arcai-cli queries list                  # List escalated queries
arcai-cli queries respond <id>          # Respond to escalated query
```

### System
```bash
arcai-cli system status                 # System health check
```

### Configuration
```bash
arcai-cli config set <key> <value>      # Set configuration
arcai-cli config get <key>              # Get configuration
```

## Architecture

The CLI uses the centralized `createAgentService` factory function from the shared library, which:

1. Validates the configuration
2. Creates the DigitalOcean agent service instance
3. Returns the configured service

This ensures consistency across all ArcAI  applications (CLI, Slack bot, web app).

## Development

### Project Structure

```
cli/
├── index.ts              # Main CLI implementation (TypeScript)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── dist/                 # Compiled JavaScript output
│   ├── index.js
│   └── index.d.ts
└── README.md            # This file
```

### TypeScript Configuration

The CLI uses TypeScript with path aliases to import from the shared library:

```typescript
import { createAgentService, validateConfig } from '@lib/index.js';
```

This is configured in `tsconfig.json` with the `@lib` alias pointing to `../lib/dist/src/*`.

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm run clean` - Remove compiled files
- `npm run type-check` - Type check without emitting files
- `npm start` - Run the compiled CLI

## Error Handling

The CLI provides clear error messages for common issues:

- Missing API keys
- Invalid configuration
- Network errors
- Empty messages
- Unknown command-line options

## Examples

### Safety Query

```bash
arcai-cli "What are the requirements for confined space entry?"
```

### Custom System Prompt

```bash
arcai-cli -s "You are an OSHA compliance expert" "What are the fall protection requirements?"
```

### Interactive Session

```bash
$ arcai-cli
Entering interactive mode. Type "exit" to quit.
You> What is the proper way to use a fire extinguisher?
Agent> Remember the PASS technique:
- Pull the pin
- Aim at the base of the fire
- Squeeze the handle
- Sweep from side to side

You> exit
Goodbye!
```

## Testing

The CLI exports all functions for testing purposes. You can import and test individual functions:

```typescript
import { parseCliArguments, sendAgentMessage } from '@arc-ai/cli';
```

## License

Part of the ArcAI  project.
