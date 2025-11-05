# ArcAI  - Workplace AI Assistant

An AI-powered internal chat agent system for workplace queries, built with a modern monorepo architecture leveraging Supabase, document retrieval, and LLM integration.

## Overview

ArcAI provides intelligent, context-aware responses to workplace questions by combining document retrieval from S3-compatible storage with large language models. The system includes Slack integration, a web-based file manager, CLI tools, and automated document synchronization from Outline.

## Project Structure

```
arc-ai/
├── docs/                    # Project documentation
│   ├── BUSINESS_CASE.md     # Business case and ROI analysis
│   ├── CLI.md              # CLI tool documentation
│   ├── MILESTONES.md       # Project development milestones
│   ├── ASSUMPTIONS.md       # Project assumptions
│   ├── TECHNICAL_STACK.md   # Technical architecture details
│   └── ...
├── bots/
│   ├── slack/              # Slack bot integration (@arc-ai/slack-bot)
│   └── outline/            # Outline to S3 sync bot (@arc-ai/outline-bot)
├── cli/                    # Command-line interface tool (@arc-ai/cli)
├── lib/                    # Shared library package (@arc-ai/shared)
├── server/                 # Express.js API server (@arc-ai/server)
├── web/                    # React web application (@arc-ai/web-ui)
├── tests/                  # Test suites
│   ├── deepeval.test.js    # AI response quality tests (vitest-evals)
│   └── ...
├── scripts/                # Database setup and utility scripts
├── =deploy                 # Deployment script (symlink to .devcontainer/deploy.sh)
├── package.json            # Workspace dependencies (pnpm monorepo)
├── pnpm-workspace.yaml     # pnpm workspace configuration
└── README.md              # This file
```

## Testing

#### Running Tests

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Up Environment Variables**

   Create a `.env` file with required API keys and configuration. The tests support DigitalOcean LLM provider:
   ```bash
   # See .env.example for full configuration options
   DIGITALOCEAN_API_KEY=your_api_key_here
   ```

3. **Run Quality Tests**
   ```bash
   pnpm run test:deepeval
   ```

#### Test Metrics

The test suite evaluates responses using `autoevals` metrics:

- **Answer Correctness** - Measures semantic similarity between expected and actual answers
- **Answer Relevancy** - Ensures the answer is relevant to the question
- **Factuality** - Validates that the answer is grounded in the provided context

#### Interpreting Results

Each test case outputs:
- ✅ Pass/Fail status for each metric
- Score values and thresholds
- Detailed evaluation results

A passing test indicates the AI response meets quality standards for correctness, relevance, and factuality.

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript 5.9+
- **Package Manager**: pnpm workspaces (monorepo)
- **Database**: Supabase PostgreSQL with pgvector extension
- **Storage**: S3-compatible storage (AWS S3, DigitalOcean Spaces)
- **LLM Providers**: DigitalOcean AI
- **Integrations**: Slack Bot API (`@slack/bolt` v4.5+), Outline API
- **Testing**: Vitest with `vitest-evals` and `autoevals` metrics
- **Frontend**: React 18 with Vite 5.0+, Tailwind CSS, TanStack Query v5
- **Backend**: Express.js with TypeScript, CORS, Multer for file uploads
- **Libraries**: `@aws-sdk/client-s3` v3.913+, `@supabase/supabase-js` v2.75+
- **Containerization**: Docker with multi-stage builds for all services
- **Deployment**: Automated container building and pushing via `deploy` script

## Development

### Prerequisites

- Node.js 18+
- pnpm package manager
- Supabase account with PostgreSQL and pgvector
- S3-compatible storage (DigitalOcean Spaces or AWS S3)
- LLM API key (DigitalOcean)
- (Optional) Slack workspace for bot integration
- (Optional) Outline instance for document sync

### Setup

```bash
# Install project dependencies
pnpm install

# Copy and configure environment variables
cp .env.example .env

# Build all packages
pnpm run build

# Run development mode (shared library)
pnpm run dev
```

### Component-Specific Development

```bash
# Slack bot
pnpm --filter @arc-ai/slack-bot start:dev

# Web application
pnpm --filter @arc-ai/web-ui dev

# API server
pnpm --filter @arc-ai/server dev

# CLI tool
pnpm --filter @arc-ai/cli start

# Outline sync bot
pnpm --filter @arc-ai/outline-bot start:dev

# Shared library (watch mode)
pnpm --filter @arc-ai/shared dev
```

### Deployment

The project includes automated deployment via the `deploy` script:

```bash
# Deploy all containers to GitHub Container Registry
deploy

# Or manually:
pnpm build:containers  # Build all Docker containers
pnpm push:containers   # Push containers to registry
```

The deployment script:
1. Bumps the patch version in `package.json`
2. Builds Docker containers for all services (`web`, `server`, `slack-bot`)
3. Tags containers with version and git hash
4. Pushes to GitHub Container Registry (`ghcr.io/oa-labs/arcai-*`)

Container names:
- `ghcr.io/oa-labs/arcai-web-frontend:{version}-{hash}`
- `ghcr.io/oa-labs/arcai-web-backend:{version}-{hash}`
- `ghcr.io/oa-labs/arcai-slack-bot:{version}-{hash}`
- `ghcr.io/oa-labs/arcai-outline-bot:{version}-{hash}`

## Documentation

- [Business Case](docs/BUSINESS_CASE.md) - Value proposition and ROI analysis
- [CLI Documentation](docs/CLI.md) - Command-line interface guide
- [Project Milestones](docs/MILESTONES.md) - Development roadmap and milestones
- [Assumptions](docs/ASSUMPTIONS.md) - Project constraints and assumptions

### Component Documentation

- [Slack Bot](bots/slack/README.md) - Slack integration setup and configuration
- [Outline Sync Bot](bots/outline/README.md) - Automated document sync from Outline to S3
- [Shared Library](lib/README.md) - Common functionality and agent services
- [Web Application](web/README.md) - React-based file management and admin interface
- [API Server](server/) - Express.js backend for storage operations
- [CLI Tool](cli/) - Command-line interface for agent interaction
- [Technical Stack](docs/TECHNICAL_STACK.md) - Detailed architecture and implementation

## Future

- This was built on DigitalOcean, which is a pretty basic platform, and it would be nice to try it on a more feature-rich platform from one of the major cloud vendors.
- It would be nice to have some connectors to get custom information from Ruddr, JIRA, HubSpot, etc.
- It would be nice to have per-channel rag databases.
- It would be nice to have the ability to have scheduled agent posts, for example, to the CS sales channel news on startups that have received funding.
- It would be nice to have a more robust logging and monitoring system.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## Security

For security concerns, please review our [Security Policy](SECURITY.md) and report vulnerabilities responsibly.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/) - Comprehensive guides and API reference
- 🐛 [Issues](https://github.com/your-username/arc-ai/issues) - Bug reports and feature requests
- 💬 [Discussions](https://github.com/your-username/arc-ai/discussions) - Community discussions and questions

---

Built with ❤️ by the ArcAI contributors
