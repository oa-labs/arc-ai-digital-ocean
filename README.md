# ArcAI Ocean - Workplace Safety AI Assistant

An AI-powered internal chat agent system for workplace safety queries, built with modern full-stack architecture leveraging Supabase, RAG (Retrieval-Augmented Generation), and LLM integration.

## Overview

ArcAI Ocean provides intelligent, context-aware responses to workplace safety questions by combining document retrieval with large language models. The system uses vector embeddings for semantic search and evaluation frameworks to ensure response quality.

## Project Structure

```
ichat-ocean/
├── docs/                    # Project documentation
│   ├── BUSINESS_CASE.md     # Business case and ROI analysis
│   ├── CLI.md              # CLI tool documentation
│   ├── MILESTONES.md       # Project development milestones
│   ├── ASSUMPTIONS.md       # Project assumptions
│   └── ...
├── bots/slack/             # Slack bot integration
├── cli/                    # Command-line interface
├── lib/                    # Shared library package
├── web/                    # Web application
├── tests/                  # Test suites
│   └── deepeval.test.js    # DeepEval quality tests
├── package.json            # Project dependencies
└── README.md              # This file
```

## Testing

### DeepEval Test Harness

DeepEval is used to evaluate the quality of AI-generated responses to workplace safety questions. The test suite includes 5 sample workplace safety scenarios covering:

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

   Create a `.env` file with your OpenAI API key (required for DeepEval metrics):
   ```bash
   OPENAI_API_KEY=your_api_key_here
   ```

3. **Run DeepEval Tests**
   ```bash
   pnpm run test:deepeval
   ```

#### Test Metrics

The test suite evaluates responses using three key metrics:

- **Answer Relevancy** (threshold: 0.7) - Measures how relevant the answer is to the question
- **Faithfulness** (threshold: 0.8) - Ensures the answer is grounded in the provided context
- **Contextual Relevancy** (threshold: 0.7) - Validates that the context is relevant to the question

#### Interpreting Results

Each test case outputs:
- ✅ Pass/Fail status for each metric
- Score values for relevancy, faithfulness, and context
- Detailed reasoning for metric evaluations

A passing test indicates the AI response meets quality standards for accuracy, relevance, and adherence to source material.

## Technology Stack

- **Backend**: Node.js with Hono and tRPC
- **Database**: Supabase PostgreSQL with pgvector
- **LLM**: OpenAI GPT-4 / GPT-3.5-turbo
- **Embeddings**: OpenAI text-embedding-ada-002
- **RAG Framework**: LangChain.js
- **Testing**: DeepEval for LLM response quality
- **Frontend**: React with Vite and Tailwind CSS

## Development

### Prerequisites

- Node.js 22+
- Supabase CLI
- OpenAI API key
- PostgreSQL with pgvector (via Supabase)

### Setup

```bash
# Install Supabase CLI
pnpm install -g supabase

# Start local Supabase environment
supabase start

# Install project dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run development server (when packages are set up)
pnpm run dev
```

## Documentation

- [Business Case](docs/BUSINESS_CASE.md) - Value proposition and ROI analysis
- [CLI Documentation](docs/CLI.md) - Command-line interface guide
- [Project Milestones](docs/MILESTONES.md) - Development roadmap and milestones
- [Assumptions](docs/ASSUMPTIONS.md) - Project constraints and assumptions

### Component Documentation

- [Slack Bot](bots/slack/README.md) - Slack integration setup and configuration
- [Shared Library](lib/README.md) - Common functionality and agent services
- [Web Application](web/README.md) - File management web interface

## License

Proprietary - Internal use only

---

For questions or support, contact the development team.
