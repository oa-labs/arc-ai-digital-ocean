# ArcAI Ocean - Workplace Safety AI Assistant

An AI-powered internal chat agent system for workplace safety queries, built with a modern monorepo architecture leveraging Supabase, document retrieval, and LLM integration.

## Overview

ArcAI Ocean provides intelligent, context-aware responses to workplace questions by combining document retrieval from S3-compatible storage with large language models. The system includes Slack integration, a web-based file manager, CLI tools, and automated document synchronization from Outline.

## Project Structure

```
arc-ai/
├── docs/                    # Project documentation
│   ├── BUSINESS_CASE.md     # Business case and ROI analysis
│   ├── CLI.md              # CLI tool documentation
│   ├── MILESTONES.md       # Project development milestones
│   ├── ASSUMPTIONS.md       # Project assumptions
│   └── ...
├── bots/
│   ├── slack/              # Slack bot integration
│   └── outline/            # Outline to S3 sync bot
├── cli/                    # Command-line interface tool
├── lib/                    # Shared library package (@ichat-ocean/shared)
├── web/                    # Web-based file manager (s3-file-manager)
├── tests/                  # Test suites
│   └── deepeval.test.js    # AI response quality tests (vitest-evals)
├── package.json            # Workspace dependencies
└── README.md              # This file
```

## Testing

### AI Response Quality Tests

The project uses `vitest-evals` with `autoevals` metrics to evaluate the quality of AI-generated responses to workplace safety questions. The test suite includes 5 sample workplace safety scenarios covering:

1. **Fire Extinguisher Usage** - Testing PASS method knowledge
2. **Personal Protective Equipment (PPE)** - Warehouse safety requirements
3. **Emergency Evacuation** - Fire alarm response procedures
4. **Chemical Spill Response** - Hazmat incident handling
5. **Workplace Injury Reporting** - Incident documentation process

#### Running Tests

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Up Environment Variables**

   Create a `.env` file with required API keys and configuration. The tests support multiple LLM providers (OpenAI, DigitalOcean, etc.):
   ```bash
   # See .env.example for full configuration options
   OPENAI_API_KEY=your_api_key_here
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

- **Runtime**: Node.js 18+ with TypeScript
- **Package Manager**: pnpm workspaces (monorepo)
- **Database**: Supabase PostgreSQL with pgvector
- **Storage**: S3-compatible storage (AWS S3, DigitalOcean Spaces)
- **LLM Providers**: OpenAI, DigitalOcean (configurable)
- **Integrations**: Slack Bot API (`@slack/bolt`), Outline API
- **Testing**: Vitest with `vitest-evals` and `autoevals` metrics
- **Frontend**: React 18 with Vite, Tailwind CSS, TanStack Query
- **Libraries**: `@aws-sdk/client-s3`, `@supabase/supabase-js`, OpenAI SDK

## Development

### Prerequisites

- Node.js 18+
- pnpm package manager
- Supabase account with PostgreSQL and pgvector
- S3-compatible storage (DigitalOcean Spaces or AWS S3)
- LLM API key (OpenAI or DigitalOcean)
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
pnpm --filter @ichat-ocean/slack-bot start:dev

# Web file manager
pnpm --filter s3-file-manager dev

# CLI tool
pnpm --filter @ichat-ocean/cli start

# Outline sync bot
pnpm --filter @ichat-ocean/outline-bot start
```

## Documentation

- [Business Case](docs/BUSINESS_CASE.md) - Value proposition and ROI analysis
- [CLI Documentation](docs/CLI.md) - Command-line interface guide
- [Project Milestones](docs/MILESTONES.md) - Development roadmap and milestones
- [Assumptions](docs/ASSUMPTIONS.md) - Project constraints and assumptions

### Component Documentation

- [Slack Bot](bots/slack/README.md) - Slack integration setup and configuration
- [Outline Sync Bot](bots/outline/README.md) - Automated document sync from Outline to S3
- [Shared Library](lib/README.md) - Common functionality and agent services
- [Web File Manager](web/README.md) - S3 file management web interface
- [CLI Tool](cli/) - Command-line interface for agent interaction

## License

Proprietary - Internal use only

---

For questions or support, contact the development team.
