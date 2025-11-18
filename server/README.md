# ArcAI Server

This is the backend server for ArcAI, providing API endpoints for storage, user management, and system preferences.

## Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Supabase project
- DigitalOcean Spaces or AWS S3 bucket

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp ../.env.example .env
   ```
   
   Edit the `.env` file and configure the following required variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `S3_REGION` - Storage bucket region (e.g., `nyc3`)
   - `S3_ENDPOINT` - Storage endpoint URL
   - `S3_ACCESS_KEY_ID` - Storage access key
   - `S3_SECRET_ACCESS_KEY` - Storage secret key

3. **Optional environment variables:**
   - `PORT` - Server port (default: 4000)
   - `CORS_ORIGIN` - CORS origin for frontend
   - `S3_FORCE_PATH_STYLE` - Set to `true` for DigitalOcean Spaces
   - `STORAGE_DOWNLOAD_URL_TTL` - Download URL TTL in seconds (default: 3600)

## Development

1. **Start the development server:**
   ```bash
   pnpm dev
   ```
   
   The server will start on port 4000 (or your configured PORT).

2. **Type checking:**
   ```bash
   pnpm type-check
   ```

3. **Build:**
   ```bash
   pnpm build
   ```

## API Endpoints

The server provides the following main endpoints:

- `/api/storage/*` - File storage operations
- `/api/users/*` - User management
- `/api/system-preferences/*` - System configuration

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm type-check` - Run TypeScript type checking
- `pnpm clean` - Remove build artifacts

## Docker

The server includes a Dockerfile for containerized deployment. Use the root-level build scripts for container operations.