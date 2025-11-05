# ArcAI Usage Guide

This guide explains how to use ArcAI's main components: the web portal, Slack bot, and CLI tools.

## Web Portal

The ArcAI web portal provides a user-friendly interface for managing agents, files, and system configuration.

### Getting Started

1. **Access the Portal**: Navigate to your deployed ArcAI web application URL
2. **Sign In**: Use your email and password or create a new account
3. **Dashboard**: View system overview and recent activity

### Key Features

#### Agent Management
- **View Agents**: See all configured AI agents with their status and settings
- **Create Agents**: Add new AI agents with custom configurations
- **Edit Agents**: Modify existing agent settings, prompts, and parameters
- **Delete Agents**: Remove agents that are no longer needed
- **Agent Analytics**: Monitor usage metrics, response times, and token consumption

#### File Management
- **Upload Documents**: Drag-and-drop files for RAG (Retrieval-Augmented Generation)
- **Supported Formats**: PDF (.pdf), Text (.txt), HTML (.html, .htm)
- **File Size Limit**: 10MB per file
- **Download Files**: Securely download stored documents
- **Rename Files**: Update file names while preserving extensions
- **Delete Files**: Remove documents with confirmation dialogs

#### User Administration
- **User List**: View all registered users
- **User Roles**: Assign roles (admin, user) with different permission levels
- **User Settings**: Manage individual user preferences and access

### Common Workflows

#### Adding a New Agent
1. Navigate to the "Agents" page
2. Click "Add Agent" button
3. Configure agent settings:
   - Name and description
   - AI provider (OpenAI, DigitalOcean)
   - Model selection
   - System prompt
   - Temperature and token limits
4. Configure S3 sources for document retrieval
5. Save the agent

#### Uploading Documents for RAG
1. Go to the "Files" or "Dashboard" page
2. Click "Upload Files" or drag files to the upload area
3. Select files from your computer
4. Files are automatically processed and made available to agents
5. Monitor upload progress in real-time

#### Monitoring Agent Performance
1. Navigate to the "Agents" page
2. Click on an agent to view its analytics
3. Review metrics:
   - Total messages processed
   - Average response time
   - Token usage statistics
   - Error rates
4. Filter by date range (24h, 7d, 30d, 90d)

## Slack Bot

The ArcAI Slack bot brings AI assistance directly into your Slack workspace for seamless team collaboration.

### Setup and Configuration

#### Prerequisites
- Slack workspace with admin access
- Slack app created with required permissions
- Bot token and signing secret configured

#### Required Slack Permissions
- `chat:write` - Send messages to channels
- `channels:read` - Read channel information
- `groups:read` - Read private channel information
- `users:read` - Read user information
- `commands` - Handle slash commands

### Core Features

#### Direct Mentions
- **@arc-ai**: Mention the bot in any channel to ask questions
- **Context-Aware Responses**: Bot maintains conversation context within threads
- **RAG Integration**: Automatically retrieves relevant documents from configured S3 sources
- **Multi-Agent Support**: Different channels can use different AI agents

#### Slash Commands
- `/agent list` - Show all available agents
- `/agent select <agent-name>` - Assign an agent to the current channel (admin only)
- `/agent info` - Show current agent information for the channel
- `/agent help` - Display help information

#### Thread Context
- **Conversation Memory**: Bot remembers context within message threads
- **Follow-up Questions**: Ask clarifying questions in the same thread
- **Document References**: Bot cites sources when using RAG

### Usage Examples

#### Basic Interaction
```
User: @arc-ai What are the safety protocols for working at heights?
Bot: Based on our safety documentation, here are the key protocols for working at heights:
1. Always use appropriate fall protection equipment
2. Ensure guardrails are in place when working above 6 feet
3. Use ladders and scaffolding that meet OSHA standards
...
```

#### Agent Management
```
User: /agent list
Bot: Available agents:
• safety-bot - Workplace safety expert
• support-bot - Customer service assistant
• hr-bot - Human resources specialist

User: /agent select safety-bot
Bot: Agent "safety-bot" has been assigned to this channel.
```

#### Threaded Conversations
```
User: @arc-ai What PPE is required for electrical work?
Bot: For electrical work, you need:
- Insulated gloves rated for the voltage level
- Face shield and safety glasses
- Flame-resistant clothing
- Dielectric footwear

User: What about for high voltage work above 600V?
Bot: For high voltage work above 600V, additional PPE includes:
- Arc flash rated clothing (cal/cm² based on incident energy)
- Voltage-rated tools
- Insulated blankets and barriers
- Hot sticks and voltage detectors
```

### Advanced Features

#### Multi-Agent Channels
- Different Slack channels can be assigned different AI agents
- Admins can switch agents per channel using `/agent select`
- Each agent can have access to different document sources

#### Document Integration
- Bot automatically searches uploaded documents for relevant information
- Supports PDF, text, and HTML documents
- Provides source citations when using document information

#### Error Handling
- Graceful handling of API failures
- Informative error messages for users
- Automatic retry mechanisms for transient issues

## CLI Tool

The ArcAI command-line interface provides powerful tools for system administration and direct AI interaction.

### Installation

#### Global Installation (Recommended)
```bash
npm install -g @arc-ai/cli
```

#### Local Development
```bash
cd cli
npm install
npm run build
npm start
```

### Core Commands

#### Chat Interface
```bash
# Single query
arcai-cli "What are the emergency procedures?"

# Interactive mode
arcai-cli
You> What safety training is required?
Agent> Based on our documentation...

# Custom system prompt
arcai-cli -s "You are an OSHA compliance expert" "What are fall protection requirements?"
```

#### Document Management
```bash
# Upload documents
arcai-cli docs upload safety-manual.pdf
arcai-cli docs upload procedures.txt

# List documents
arcai-cli docs list

# Delete documents
arcai-cli docs delete doc-123
```

#### User Administration
```bash
# Create new user
arcai-cli users create user@company.com

# List all users
arcai-cli users list

# User management commands
arcai-cli users update <id> --role admin
arcai-cli users delete <id>
```

#### System Management
```bash
# Check system status
arcai-cli system status

# View configuration
arcai-cli config get

# Set configuration
arcai-cli config set AGENT_PROVIDER openai
arcai-cli config set OPENAI_MODEL gpt-4
```

#### Query Management
```bash
# List escalated queries
arcai-cli queries list

# Respond to escalated query
arcai-cli queries respond <query-id> "Response text"
```

### Configuration

#### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# DigitalOcean Configuration
DIGITALOCEAN_API_KEY=your-api-key
DIGITALOCEAN_AGENT_ENDPOINT=https://your-endpoint.com
DIGITALOCEAN_MODEL=gpt-3.5-turbo

# S3 Configuration
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
```

### Advanced Usage

#### Batch Processing
```bash
# Process multiple queries from file
cat queries.txt | arcai-cli

# Pipe output to file
arcai-cli "Generate safety report" > report.txt
```

#### Scripting Integration
```bash
#!/bin/bash
# Automated safety check script
for topic in "fire safety" "electrical safety" "fall protection"; do
    echo "=== $topic ==="
    arcai-cli "What are the key $topic procedures?"
    echo ""
done
```

#### Custom Prompts
```bash
# Industry-specific expertise
arcai-cli -s "You are a construction safety expert" "What are trenching requirements?"

# Role-based assistance
arcai-cli -s "You are a safety trainer" "Create a toolbox talk for ladder safety"
```

### Error Handling and Troubleshooting

#### Common Issues
- **API Key Errors**: Verify environment variables are set correctly
- **Network Issues**: Check internet connectivity and API endpoints
- **Permission Errors**: Ensure user has appropriate permissions
- **Document Upload Failures**: Verify file format and size limits

#### Debug Mode
```bash
# Enable verbose logging
DEBUG=1 arcai-cli "test query"
```

## Integration Examples

### Complete Workflow Example

1. **Setup via Web Portal**:
   - Create a "safety-bot" agent with OSHA expertise
   - Upload safety manuals and procedures to S3
   - Configure agent to use these documents

2. **Configure Slack Integration**:
   - Add bot to #safety channel
   - Assign safety-bot: `/agent select safety-bot`

3. **Daily Usage**:
   - Team members ask questions via Slack: `@arc-ai What are lockout/tagout procedures?`
   - Bot provides answers with document citations
   - Complex questions are escalated for human review

4. **Administration**:
   - Monitor usage via web portal analytics
   - Add new documents as procedures are updated
   - Use CLI for bulk operations and system maintenance

### Multi-Department Setup

```bash
# Create agents for different departments
arcai-cli users create safety@company.com --role admin
arcai-cli users create hr@company.com --role admin

# Upload department-specific documents
arcai-cli docs upload hr-handbook.pdf --agent hr-bot
arcai-cli docs upload safety-manual.pdf --agent safety-bot

# Configure Slack channels
# #safety channel gets safety-bot
# #hr channel gets hr-bot
# #general channel gets general-assistant
```

## Best Practices

### Security
- Use separate API keys for different environments
- Regularly rotate access credentials
- Implement proper user role management
- Monitor access logs and usage patterns

### Performance
- Optimize document size and format for RAG
- Use appropriate model settings for your use case
- Monitor token usage and response times
- Implement caching where appropriate

### User Experience
- Provide clear system prompts for agents
- Organize documents logically in S3
- Train users on proper bot interaction
- Establish escalation procedures for complex queries

## Support and Resources

- **Documentation**: Check the `/docs` directory for detailed guides
- **Troubleshooting**: Review logs and error messages
- **Community**: Join discussions for tips and best practices
- **Issues**: Report bugs and request features via GitHub issues

