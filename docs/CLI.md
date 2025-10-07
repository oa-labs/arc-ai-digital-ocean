# Command Line Interface

## CLI Framework
- **Language**: TypeScript
- **Runtime**: Node.js
- **Distribution**: npm package or standalone executable
- **Package Manager**: npm for installs and execution

```json
{
  "name": "@ichat/cli",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "commander": "^11.0.0",
    "zod": "^3.22.0"
  }
}
```

## CLI Usage
```bash
# Install CLI globally via npm
npm install -g @ichat/cli

# Or run directly with npx
npx @ichat/cli auth login

# Run CLI commands
ichat-cli auth login                    # Authenticate with API key
ichat-cli auth logout                   # Clear authentication
ichat-cli docs upload <file>            # Upload document
ichat-cli docs list                     # List all documents
ichat-cli docs delete <id>              # Delete document
ichat-cli users create <email>          # Create user
ichat-cli users list                    # List users
ichat-cli chat start                    # Start interactive chat
ichat-cli queries list                  # List escalated queries
ichat-cli queries respond <id>          # Respond to escalated query
ichat-cli system status                 # System health check
ichat-cli config set <key> <value>      # Set configuration
ichat-cli config get <key>              # Get configuration
```

## CLI Commands Structure
```bash
ichat-cli auth login                    # Authenticate with API key
ichat-cli auth logout                   # Clear authentication
ichat-cli docs upload <file>            # Upload document
ichat-cli docs list                     # List all documents
ichat-cli docs delete <id>              # Delete document
ichat-cli users create <email>          # Create user
ichat-cli users list                    # List users
ichat-cli chat start                    # Start interactive chat
ichat-cli queries list                  # List escalated queries
ichat-cli queries respond <id>          # Respond to escalated query
ichat-cli system status                 # System health check
ichat-cli config set <key> <value>      # Set configuration
ichat-cli config get <key>              # Get configuration
```

## CLI Application Structure
```typescript
// src/index.ts - Main entry point
import { Command } from 'commander';
import { configService } from './services/configService';
import { apiClient } from './services/apiClient';
import { authCommands } from './commands/auth';
import { docsCommands } from './commands/docs';
import { usersCommands } from './commands/users';
import { chatCommands } from './commands/chat';
import { queriesCommands } from './commands/queries';
import { systemCommands } from './commands/system';

const program = new Command();

program
  .name('ichat-cli')
  .description('iChat AI Assistant CLI Tool')
  .version('1.0.0');

// Register command groups
authCommands(program);
docsCommands(program);
usersCommands(program);
usersCommands(program);
chatCommands(program);
queriesCommands(program);
systemCommands(program);

// Parse and execute
program.parse();
```
