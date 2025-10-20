# ArcAI Ocean Shared Library

This shared library provides common functionality for both the Slack bot and web projects in the ArcAI Ocean ecosystem.

## Features

- **AI Agent Service**: OpenAI integration with configurable models and parameters
- **Shared Configuration**: Centralized configuration management for all projects
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Modular Architecture**: Easy to extend and maintain

## Installation

The shared library is automatically available to both projects in the monorepo. To build the library:

```bash
npm run build:shared
```

## Usage

### Agent Service

```typescript
import { OpenAiAgentService, getConfig } from '@ichat-ocean/shared';

// Initialize with configuration
const config = getConfig();
const agent = new OpenAiAgentService(config.agent);

// Send a message
const response = await agent.sendMessage("Hello, how can I help?");
console.log(response.content);
```

### Configuration

```typescript
import { getConfig, updateConfig } from '@ichat-ocean/shared';

// Get current configuration
const config = getConfig();

// Update configuration
updateConfig({
  agent: {
    model: 'gpt-4',
    temperature: 0.8,
  },
});
```

## Project Structure

```
lib/
├── src/
│   └── index.ts              # Main entry point
├── types/
│   └── index.ts              # TypeScript definitions
├── services/
│   └── openai-agent-service.ts      # OpenAI agent service implementation
├── config/
│   └── index.ts              # Configuration management
├── package.json              # Library package configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Development

To work on the shared library:

1. Make changes to the source files in `lib/src/`, `lib/types/`, etc.
2. Build the library: `npm run build:shared`
3. The built files will be available in `lib/dist/`

## Environment Variables

The shared library uses the following environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENAI_MODEL`: Model to use (default: gpt-3.5-turbo)
- `OPENAI_TEMPERATURE`: Response temperature (default: 0.7)
- `OPENAI_MAX_TOKENS`: Maximum tokens per response (default: 1000)
- `OPENAI_ORGANIZATION`: OpenAI organization ID (optional)
- `NODE_ENV`: Environment mode (development/production/test)
- `DEBUG`: Enable debug logging (set to '1')

## Integration

### Slack Bot Integration

The Slack bot automatically uses the shared agent service for processing messages. No additional setup required.

### Web Project Integration

Use the provided React hook:

```typescript
import { useAgent } from './hooks/useAgent';

function MyComponent() {
  const { sendMessage, isLoading, response, error } = useAgent();

  const handleSubmit = async (message: string) => {
    const result = await sendMessage(message);
    if (result) {
      console.log('Response:', result.content);
    }
  };

  // ... rest of component
}
```

## Contributing

When adding new shared functionality:

1. Add types to `lib/types/index.ts`
2. Implement functionality in appropriate service files
3. Export from `lib/src/index.ts`
4. Update this README with usage examples
5. Build and test in both projects

## Project Context

This shared library is the core of the ArcAI Ocean ecosystem, providing common functionality used by:

- [Slack Bot](../bots/slack/README.md) - Slack integration for workplace safety queries
- [CLI Tool](../docs/CLI.md) - Command-line interface for AI interactions
- [Web Application](../web/README.md) - File management web interface

## License

Part of the ArcAI Ocean project.