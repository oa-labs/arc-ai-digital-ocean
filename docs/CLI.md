# ArcAI Ocean CLI

Command line tool for interacting with the ArcAI Ocean agent service.

## Features

- **TypeScript**: Fully typed CLI implementation
- **Multiple Agent Providers**: Supports both OpenAI and DigitalOcean AI providers
- **Interactive Mode**: Chat with the agent in real-time
- **Pipe Support**: Read messages from stdin
- **Custom System Prompts**: Override the default system prompt

## Installation

### Global Installation (Recommended)

```bash
npm install -g @ichat-ocean/cli
```

### Local Installation

```bash
npm install @ichat-ocean/cli
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
ichat-cli "What are the safety protocols for working at heights?"

# Use a custom system prompt
ichat-cli --system "You are a safety expert" "What PPE is required?"

# Short form
ichat-cli -s "You are a safety expert" "What PPE is required?"
```

### Interactive Mode

If no message is provided, the CLI enters interactive mode:

```bash
ichat-cli
```

Exit interactive mode with: `exit`, `quit`, `:q`, or `\q`

### Pipe Input

```bash
echo "What are the emergency procedures?" | ichat-cli

cat question.txt | ichat-cli
```

### Help and Version

```bash
# Show help
ichat-cli --help
ichat-cli -h

# Show version
ichat-cli --version
ichat-cli -v
```

## Configuration

The CLI uses environment variables for configuration. Create a `.env` file in the project root or set these variables:

### OpenAI Provider (Default)

```bash
AGENT_PROVIDER=openai
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000
OPENAI_ORGANIZATION=your-org-id  # Optional
```

### DigitalOcean Provider

```bash
AGENT_PROVIDER=digitalocean
DIGITALOCEAN_API_KEY=your-api-key-here
DIGITALOCEAN_AGENT_ENDPOINT=https://your-endpoint.com
DIGITALOCEAN_MODEL=gpt-3.5-turbo
DIGITALOCEAN_TEMPERATURE=0.7
DIGITALOCEAN_MAX_TOKENS=1000
```

## Commands

### Authentication
```bash
ichat-cli auth login                    # Authenticate with API key
ichat-cli auth logout                   # Clear authentication
```

### Documents
```bash
ichat-cli docs upload <file>            # Upload document
ichat-cli docs list                     # List all documents
ichat-cli docs delete <id>              # Delete document
```

### Users
```bash
ichat-cli users create <email>          # Create user
ichat-cli users list                    # List users
```

### Chat
```bash
ichat-cli chat start                    # Start interactive chat
```

### Queries
```bash
ichat-cli queries list                  # List escalated queries
ichat-cli queries respond <id>          # Respond to escalated query
```

### System
```bash
ichat-cli system status                 # System health check
```

### Configuration
```bash
ichat-cli config set <key> <value>      # Set configuration
ichat-cli config get <key>              # Get configuration
```

## Architecture

The CLI uses the centralized `createAgentService` factory function from the shared library, which:

1. Validates the configuration
2. Determines the appropriate agent provider (OpenAI or DigitalOcean)
3. Creates and returns the correct service instance

This ensures consistency across all ArcAI Ocean applications (CLI, Slack bot, web app).

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
ichat-cli "What are the requirements for confined space entry?"
```

### Custom System Prompt

```bash
ichat-cli -s "You are an OSHA compliance expert" "What are the fall protection requirements?"
```

### Interactive Session

```bash
$ ichat-cli
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
import { parseCliArguments, sendAgentMessage } from '@ichat-ocean/cli';
```

## License

Part of the ArcAI Ocean project.
