#!/bin/bash

# Database Setup Script for Multi-Agent System
# This script helps you set up the Supabase database migration

set -e

echo "🚀 Multi-Agent System - Database Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if migration file exists
MIGRATION_FILE="docs/supabase-migration-multi-agent-system.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file not found at $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Migration file found${NC}"
echo ""

# Ask user for setup method
echo "Choose your setup method:"
echo "1) Supabase Dashboard (Recommended - easiest)"
echo "2) Direct database connection (requires psql)"
echo "3) Show instructions only"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}📋 Supabase Dashboard Setup${NC}"
        echo "======================================"
        echo ""
        echo "Follow these steps:"
        echo ""
        echo "1. Open your Supabase project dashboard:"
        echo "   https://supabase.com/dashboard"
        echo ""
        echo "2. Click on 'SQL Editor' in the left sidebar"
        echo ""
        echo "3. Click 'New query' button"
        echo ""
        echo "4. Copy the migration file content:"
        echo -e "   ${YELLOW}cat $MIGRATION_FILE | pbcopy${NC}  (macOS)"
        echo -e "   ${YELLOW}cat $MIGRATION_FILE | xclip -selection clipboard${NC}  (Linux)"
        echo ""
        echo "5. Paste into the SQL Editor and click 'Run'"
        echo ""
        read -p "Press Enter to copy the migration file to clipboard (macOS/Linux)..."
        
        if command -v pbcopy &> /dev/null; then
            cat "$MIGRATION_FILE" | pbcopy
            echo -e "${GREEN}✓ Migration copied to clipboard (macOS)${NC}"
        elif command -v xclip &> /dev/null; then
            cat "$MIGRATION_FILE" | xclip -selection clipboard
            echo -e "${GREEN}✓ Migration copied to clipboard (Linux)${NC}"
        else
            echo -e "${YELLOW}⚠ Clipboard tool not found. Please manually copy the file.${NC}"
            echo "File location: $MIGRATION_FILE"
        fi
        echo ""
        echo "Now paste into Supabase SQL Editor and run!"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}🔌 Direct Database Connection${NC}"
        echo "======================================"
        echo ""
        
        # Check if psql is installed
        if ! command -v psql &> /dev/null; then
            echo -e "${RED}❌ Error: psql is not installed${NC}"
            echo "Please install PostgreSQL client tools:"
            echo "  macOS: brew install postgresql"
            echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
            echo "  Windows: Download from https://www.postgresql.org/download/"
            exit 1
        fi
        
        echo -e "${GREEN}✓ psql found${NC}"
        echo ""
        
        # Get database connection details
        echo "Enter your Supabase database connection details:"
        echo "(You can find these in Supabase Dashboard → Settings → Database)"
        echo ""
        
        read -p "Project Reference (e.g., abcdefghijklmnop): " PROJECT_REF
        read -sp "Database Password: " DB_PASSWORD
        echo ""
        
        if [ -z "$PROJECT_REF" ] || [ -z "$DB_PASSWORD" ]; then
            echo -e "${RED}❌ Error: Project reference and password are required${NC}"
            exit 1
        fi
        
        # Construct connection string
        DB_URL="postgresql://postgres:$DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres"
        
        echo ""
        echo "Running migration..."
        echo ""
        
        # Run the migration
        if psql "$DB_URL" -f "$MIGRATION_FILE"; then
            echo ""
            echo -e "${GREEN}✅ Migration completed successfully!${NC}"
            echo ""
            
            # Verify tables
            echo "Verifying tables..."
            psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers');"
            
        else
            echo ""
            echo -e "${RED}❌ Migration failed${NC}"
            echo "Please check the error messages above."
            exit 1
        fi
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}📖 Setup Instructions${NC}"
        echo "======================================"
        echo ""
        echo "Migration file location:"
        echo "  $MIGRATION_FILE"
        echo ""
        echo "For detailed instructions, see:"
        echo "  docs/DATABASE_MIGRATION_GUIDE.md"
        echo ""
        echo "Quick methods:"
        echo ""
        echo "1. Supabase Dashboard:"
        echo "   - Go to SQL Editor"
        echo "   - Copy/paste the migration file"
        echo "   - Click Run"
        echo ""
        echo "2. Using psql:"
        echo "   psql \"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\" -f $MIGRATION_FILE"
        echo ""
        echo "3. Using Supabase CLI:"
        echo "   supabase db push"
        echo ""
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📝 Next Steps${NC}"
echo "======================================"
echo ""
echo "1. Verify the migration in Supabase Dashboard"
echo "2. Create your first agent (see docs/DATABASE_MIGRATION_GUIDE.md)"
echo "3. Configure environment variables:"
echo "   - Copy .env.example to .env"
echo "   - Copy web/.env.example to web/.env"
echo "   - Fill in your Supabase URL and keys"
echo "4. Start the web UI: cd web && pnpm dev"
echo "5. Configure Slack bot slash commands"
echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""

