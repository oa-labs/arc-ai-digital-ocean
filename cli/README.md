# iChat Ocean CLI

Command line tool for interacting with the iChat Ocean agent service.

## Features

- **TypeScript**: Fully typed CLI implementation
- **Multiple Agent Providers**: Supports both OpenAI and DigitalOcean AI providers
- **Interactive Mode**: Chat with the agent in real-time
- **Pipe Support**: Read messages from stdin
- **Custom System Prompts**: Override the default system prompt

## Installation

```bash
cd cli
npm install
```

## Build

The CLI is written in TypeScript and needs to be compiled before running:

```bash
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

## Architecture

The CLI now uses the centralized `createAgentService` factory function from the shared library, which:

1. Validates the configuration
2. Determines the appropriate agent provider (OpenAI or DigitalOcean)
3. Creates and returns the correct service instance

This ensures consistency across all iChat Ocean applications (CLI, Slack bot, web app).

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

Part of the iChat Ocean project.

