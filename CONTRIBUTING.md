# Contributing to ArcAI

Thank you for your interest in contributing to ArcAI! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- Git
- Docker (optional, for containerized development)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/arc-ai.git
   cd arc-ai
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Build All Packages**
   ```bash
   pnpm run build
   ```

4. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start Development**
   ```bash
   # Start shared library in watch mode
   pnpm run dev
   
   # In another terminal, start specific components:
   pnpm --filter @arc-ai/web-ui dev
   pnpm --filter @arc-ai/slack-bot start:dev
   pnpm --filter @arc-ai/server dev
   ```

## 📁 Project Structure

```
arc-ai/
├── bots/           # Slack and Outline bots
├── cli/            # Command-line interface
├── lib/            # Shared library
├── server/         # Express.js API server
├── web/            # React web application
├── docs/           # Documentation
└── tests/          # Test suites
```

## 🏗️ Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Follow the existing code style and patterns
- Add TypeScript types for new code
- Update documentation as needed
- Ensure all environment variables are documented

### 3. Test Your Changes

```bash
# Build all packages
pnpm run build

# Run AI quality tests
pnpm run test:deepeval

# Test individual components
pnpm --filter @arc-ai/web-ui test
pnpm --filter @arc-ai/slack-bot test
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add new agent management feature
fix: resolve S3 authentication issue
docs: update API documentation
refactor: improve shared library structure
test: add integration tests for CLI
```

### 5. Create a Pull Request

- Provide a clear description of your changes
- Link any relevant issues
- Include screenshots for UI changes
- Ensure all CI checks pass

## 📝 Code Standards

### TypeScript

- Use strict TypeScript configuration
- Provide explicit return types for functions
- Use interfaces for object shapes
- Avoid `any` type when possible

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Include JSDoc comments for public APIs
- Follow existing naming conventions

### Environment Variables

- All new environment variables must be documented in `.env.example`
- Use descriptive variable names with appropriate prefixes
- Mark optional variables with clear comments
- Include example values where helpful

## 🧪 Testing

### AI Quality Tests

ArcAI uses `vitest-evals` and `autoevals` to test AI response quality:

```bash
pnpm run test:deepeval
```

The test suite evaluates:
- **Answer Correctness** - Semantic similarity with expected answers
- **Answer Relevancy** - Relevance to the question asked
- **Factuality** - Grounding in provided context

### Component Testing

Each component should have appropriate tests:

```bash
# Test specific component
pnpm --filter @arc-ai/web-ui test
pnpm --filter @arc-ai/slack-bot test
```

### Test Coverage

- Aim for >80% code coverage on new features
- Test error handling paths
- Include integration tests for cross-component functionality

## 🔧 Development Tips

### Hot Reloading

- Shared library: `pnpm run dev` (watch mode)
- Web app: `pnpm --filter @arc-ai/web-ui dev`
- Slack bot: `pnpm --filter @arc-ai/slack-bot start:dev`

### Debugging

Enable debug logging:
```bash
DEBUG=1 pnpm --filter @arc-ai/slack-bot start
```

### Docker Development

Build and run with Docker:
```bash
# Build all containers
pnpm run build:containers

# Run specific container
docker run -p 5173:5173 --env-file .env arcai-web-frontend
```

## 📖 Documentation

### Updating Documentation

- Keep README files up to date with API changes
- Update environment variable examples
- Document new features in appropriate docs
- Include code examples in documentation

### Documentation Structure

- `README.md` - Project overview and quick start
- `docs/` - Detailed guides and reference
- Component READMEs - Component-specific setup and usage
- Code comments - Implementation details

## 🚨 Security Considerations

- Never commit API keys or secrets
- Use environment variables for sensitive configuration
- Follow secure coding practices
- Report security vulnerabilities privately

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and contribute
- Follow professional communication standards

### Getting Help

- Check existing documentation and issues
- Ask questions in GitHub Discussions
- Join our community channels (if available)
- Review similar implementations in the codebase

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass (`pnpm run build`, `pnpm run test:deepeval`)
- [ ] Documentation is updated
- [ ] Environment variables are documented
- [ ] Commit messages follow conventional commits
- [ ] PR description clearly explains changes
- [ ] No breaking changes without proper documentation

## 🏆 Recognition

Contributors are recognized in:
- README contributors section
- Release notes for significant contributions
- Special thanks in project documentation

## 📧 Contact

For questions about contributing:

- Create an issue for bug reports or feature requests
- Start a discussion for general questions
- Review existing documentation first

Thank you for contributing to ArcAI! 🎉