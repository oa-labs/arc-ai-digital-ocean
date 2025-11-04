# Web UI Guide - Agent Management

This guide describes the web interface for managing AI agents in the multi-agent system.

## Overview

The web UI provides a comprehensive interface for:
- **Creating and editing agents** - Configure AI agents with different providers and settings
- **Viewing channel mappings** - See which agents are assigned to which Slack channels
- **Monitoring analytics** - Track agent usage, performance, and costs
- **Managing RAG documents** - Upload and organize knowledge base documents (via Files page)

## Pages

### 1. Files Page (`/`)

The default landing page for managing RAG documents.

**Features:**
- Upload files to S3 buckets
- View, rename, and delete files
- Organize files by agent-specific prefixes
- Secure file storage with Supabase authentication

**Access:** All authenticated users

### 2. Agents Page (`/agents`)

The main page for agent management with three tabs.

**Access:** All authenticated users (admin features require appropriate permissions)

#### Tab 1: Agents

**Features:**
- **View all agents** - Grid view of all configured agents
- **Add agents from DigitalOcean** - Import agents from your DigitalOcean deployment
- **Edit agents** - Modify existing agent settings
- **Delete agents** - Soft delete (sets `is_active` to false)
- **Agent cards** show:
  - Agent name and description
  - Provider (OpenAI or DigitalOcean)
  - Model name
  - S3 sources (from agent_s3_sources table)
  - Active/inactive status

**Actions:**
- Click "Add Agent" to import an agent from DigitalOcean
- Click on any agent card to view and modify settings
- Click "Delete" to deactivate an agent

#### Tab 2: Channel Mappings

**Features:**
- **View all channel-agent mappings** - Table view of Slack channels and their assigned agents
- **See activation history** - Who activated each agent and when
- **Filter and search** - Find specific channels or agents
- **Real-time updates** - Refresh to see latest mappings

**Information displayed:**
- Channel name and ID
- Assigned agent name and description
- Provider type
- User who activated the agent
- Activation timestamp

**Note:** Channel mappings are created via Slack commands (`/agent select`), not through the web UI.

#### Tab 3: Analytics

**Features:**
- **Summary metrics** - Total messages, tokens, response time, errors
- **Agent performance table** - Detailed stats per agent
- **Recent activity log** - Last 20 usage events
- **Time range selector** - View data for last 24h, 7d, 30d, or 90d
- **Real-time refresh** - Update metrics on demand

**Metrics tracked:**
- Total messages processed
- Total tokens consumed
- Average response time (ms)
- Error count
- Last used timestamp

## Components

### AgentForm

Modal form for creating and editing agents.

**Fields:**

**Basic Information:**
- **Agent Name** (required) - Unique identifier (e.g., "safety-bot")
- **Description** (optional) - Brief description of the agent's purpose

**Provider Configuration:**
- **Provider** (required) - OpenAI or DigitalOcean
- **API Key Environment Variable** (required) - Name of env var containing API key
- **Model** (optional) - Model name (e.g., "gpt-4")
- **API Endpoint** (required for DigitalOcean) - API endpoint URL
- **Temperature** (optional) - 0.0 to 2.0, default 0.7
- **Max Tokens** (optional) - Maximum tokens per response, default 1000

**RAG Configuration:**
- Configured via agent_s3_sources table (can have multiple S3 sources)

**System Prompt:**
- **Custom System Prompt** (optional) - Override default system prompt

**Validation:**
- Required fields are marked with *
- DigitalOcean provider requires endpoint URL
- Temperature must be between 0 and 2
- Max tokens must be positive

### ChannelMappings

Table component showing Slack channel to agent mappings.

**Features:**
- Sortable columns
- Hover effects for better UX
- Displays channel names and IDs
- Shows agent details inline
- Activation metadata (user, timestamp)

### AgentAnalytics

Dashboard component with metrics and charts.

**Sections:**

1. **Summary Cards** - 4 key metrics at a glance
2. **Agent Performance Table** - Detailed stats per agent
3. **Recent Activity** - Last 20 usage logs with status

**Time Range Options:**
- Last 24 hours
- Last 7 days (default)
- Last 30 days
- Last 90 days

## Services

### agentManagementService

TypeScript service for interacting with Supabase.

**Methods:**

**Agent CRUD:**
- `listAgents(activeOnly?)` - Get all agents
- `getAgent(id)` - Get single agent by ID
- `createAgent(input)` - Create new agent
- `updateAgent(id, input)` - Update existing agent
- `deleteAgent(id)` - Soft delete agent

**Channel Mappings:**
- `listChannelAgents()` - Get all channel-agent mappings

**Analytics:**
- `getAgentStats(agentId, days)` - Get usage stats for an agent
- `getAgentUsageLogs(agentId, limit)` - Get recent usage logs
- `getAgentChangeLog(channelId?, limit)` - Get agent change history
- `getAllUsageLogs(days, limit)` - Get all usage logs for analytics

## Navigation

**Header Navigation:**
- **Files** button - Navigate to Files page (from Agents page)
- **Agents** button - Navigate to Agents page (from Files page)
- **Refresh** button - Reload current page data
- **Sign Out** button - Log out of the application

**Tab Navigation (Agents page):**
- **Agents** tab - Manage agent configurations
- **Channel Mappings** tab - View channel assignments
- **Analytics** tab - Monitor usage and performance

## Styling

The UI uses Tailwind CSS with a consistent design system:

**Colors:**
- **Primary** - Blue (#3B82F6) for primary actions
- **Success** - Green for successful operations
- **Warning** - Yellow for warnings
- **Error** - Red for errors and delete actions
- **Gray** - Neutral colors for text and backgrounds

**Components:**
- **Cards** - White background with border and shadow on hover
- **Buttons** - Rounded with hover effects
- **Tables** - Striped rows with hover highlighting
- **Forms** - Consistent input styling with focus states
- **Badges** - Colored pills for status and provider types

## Permissions

**Current Implementation:**
- All authenticated users can view all pages
- All authenticated users can create/edit/delete agents
- Channel agent selection is restricted to admins (via Slack commands)

**Future Enhancement:**
- Role-based access control (RBAC)
- Admin-only agent management
- Read-only users for analytics

## Data Flow

### Adding an Agent from DigitalOcean

1. User clicks "Add Agent" button
2. AddAgentFromDigitalOcean modal opens
3. User selects an agent from their DigitalOcean deployment
4. Agent details are fetched and pre-populated in the form
5. User configures S3 bucket and other settings
6. User clicks "Import Agent"
7. agentManagementService.createAgent() called
8. Supabase inserts new row in `agents` table
9. Modal closes and agent list refreshes
10. New agent appears in grid

### Viewing Analytics

1. User navigates to Analytics tab
2. Component loads agents from props
3. For each agent, getAgentStats() is called
4. getAllUsageLogs() fetches recent activity
5. Data is aggregated and displayed
6. User can change time range to refresh data

### Monitoring Channel Mappings

1. User navigates to Channel Mappings tab
2. listChannelAgents() fetches all mappings
3. Table displays channels with agent details
4. User can refresh to see latest changes
5. Mappings are created via Slack commands, not web UI

## Environment Variables

The web UI requires these environment variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# S3 (for file management)
VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_S3_REGION=nyc3
VITE_S3_ACCESS_KEY_ID=your-access-key
VITE_S3_SECRET_ACCESS_KEY=your-secret-key
```

## Development

**Start development server:**
```bash
cd web
pnpm install
pnpm dev
```

**Build for production:**
```bash
cd web
pnpm build
```

**Preview production build:**
```bash
cd web
pnpm preview
```

## Deployment

The web UI is a static React application that can be deployed to:
- **Vercel** - Recommended for easy deployment
- **Netlify** - Alternative static hosting
- **DigitalOcean App Platform** - Integrated with DO services
- **AWS S3 + CloudFront** - Traditional static hosting
- **Any static web server** - Nginx, Apache, etc.

**Build output:**
- Location: `web/dist/`
- Entry point: `index.html`
- Assets: `assets/` folder

## Troubleshooting

### Agents not loading

1. Check Supabase connection:
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Check browser console for errors
   - Verify RLS policies allow read access

2. Check database:
   - Verify `agents` table exists
   - Check if agents exist: `SELECT * FROM agents;`

### Cannot add agent

1. Check DigitalOcean token:
   - Verify token is set in user settings
   - Ensure token has proper permissions
2. Check form validation:
   - All required fields filled
   - Valid values for temperature and max_tokens

2. Check Supabase permissions:
   - RLS policies allow insert
   - User is authenticated

3. Check browser console for errors

### Analytics not showing data

1. Check if agents have been used:
   - Verify messages sent via Slack
   - Check `agent_usage_logs` table

2. Check time range:
   - Try different time ranges
   - Verify data exists in selected range

3. Check Supabase queries:
   - Browser console shows query errors
   - Verify RLS policies allow read access

## Future Enhancements

### Planned Features

1. **RAG Document Management**
   - Upload documents directly to agent-specific S3 buckets
   - Preview document content
   - Bulk upload and delete
   - Document search and filtering

2. **Advanced Analytics**
   - Charts and graphs (line charts, bar charts)
   - Cost tracking per agent
   - User-level analytics
   - Export data to CSV

3. **Agent Templates**
   - Pre-configured agent templates
   - One-click agent creation
   - Template marketplace

4. **Role-Based Access Control**
   - Admin, editor, viewer roles
   - Per-agent permissions
   - Audit logs for all actions

5. **Real-time Updates**
   - WebSocket connection for live updates
   - Real-time analytics dashboard
   - Live channel mapping changes

6. **Agent Testing**
   - Test agent responses in web UI
   - Compare agents side-by-side
   - A/B testing framework

## Support

For issues or questions:
- Check this guide first
- Review browser console for errors
- Check Supabase logs
- Verify environment variables
- Contact development team

## Screenshots

(Screenshots would be added here in a real deployment)

1. Agents page - Grid view
2. Agent form - Create/edit modal
3. Channel mappings - Table view
4. Analytics dashboard - Metrics and charts

