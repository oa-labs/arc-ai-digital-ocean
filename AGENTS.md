# Agent Development Guide

## Commands

- **Build all**: `pnpm build` (builds all workspace packages via TypeScript)
- **Type check**: `pnpm -r type-check` (or `tsc --noEmit` in individual packages)
- **Lint**: `pnpm --filter <package> lint` (web and cli have linting configured)
- **Test**: `pnpm test:deepeval` (runs vitest-evals test suite for AI response quality using autoevals scorers)
- **Run single test**: `vitest run <test-file>` (e.g., `vitest run tests/cli-tool.test.js`)
- **Dev mode**: `pnpm dev` (watches lib package) or per-package: `pnpm--filter <package> dev`

## Architecture

- **Monorepo**: pnpm workspace with 4 packages: `lib` (shared), `cli`, `bots/slack`, `web`
- **lib** (`@ichat-ocean/shared`): Core agent services (OpenAI, DigitalOcean adapters), thread context storage, shared types
- **cli** (`@ichat-ocean/cli`): Command-line tool for querying the agent service
- **bots/slack** (`@ichat-ocean/slack-bot`): Slack Bot with Assistant integration (Bolt v4.5.0+), supports threaded conversations with streaming responses and feedback buttons
- **web** (`s3-file-manager`): React + Vite app for file management UI with Tailwind CSS
- **Database**: Supabase PostgreSQL with pgvector for RAG (embeddings via OpenAI ada-002) and slack_thread_contexts table for Assistant thread storage
- **Testing**: Vitest for unit tests, vitest-evals + autoevals for LLM quality evaluation

## Code Style

- **Language**: TypeScript with ES modules (`"type": "module"` in all packages)
- **Strict mode**: TypeScript strict mode enabled across all packages
- **Imports**: Use `.js` extensions in imports for compiled TS (e.g., `from '../types/index.js'`)
- **Path aliases**: `@/*` maps to `src/*` in web package
- **Formatting**: Follow existing patterns; web uses ESLint with React hooks/refresh plugins
- **Error handling**: Throw errors with descriptive messages; async functions use try-catch
- **Naming**: camelCase for variables/functions, PascalCase for types/components
