# Outline to S3 Sync Bot

Synchronizes Outline documents to S3-compatible storage (DigitalOcean Spaces, AWS S3) with automatic deduplication and cleanup.

## Features

- ✅ Fetches all collections and documents from Outline
- ✅ Exports documents as Markdown using Outline's `documents.export` API
- ✅ Organizes files by collection: `{collection-name}/{doc-title}.md`
- ✅ Collection blacklist support (skip specific collections by name)
- ✅ Smart deduplication using MD5 content hashing
- ✅ Updates only changed documents
- ✅ Deletes orphaned documents from S3 when removed from Outline
- ✅ Rate limit handling with automatic retry
- ✅ One-shot execution suitable for systemd timers
- ✅ Production-ready Docker container

## Prerequisites

- Node.js 20+ or Docker
- Outline API token with read access
- S3-compatible storage (DigitalOcean Spaces, AWS S3, etc.)
- S3 access credentials

## Setup

### 1. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Outline API Configuration
OUTLINE_API_URL=https://your-outline-instance.com
OUTLINE_API_TOKEN=ol_api_xxxxxxxxxxxxxxxxxxxxx

# Collection Filtering (optional)
# Comma-separated list of collection names to skip (case-insensitive)
COLLECTION_BLACKLIST=ops,private,temp

# S3 Configuration (same as web project)
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=DO00XXXXXXXXXXXXX
S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 3. Build

```bash
pnpm --filter @ichat-ocean/outline-bot build
```

## Usage

### Local Development

```bash
cd bots/outline
pnpm start
```

Or from monorepo root:

```bash
pnpm --filter @ichat-ocean/outline-bot start
```

### Docker

Build the container:

```bash
docker build -f bots/outline/Dockerfile -t outline-sync:latest .
```

Run the sync:

```bash
docker run --rm --env-file bots/outline/.env outline-sync:latest
```

## Production Deployment with systemd Timer

### 1. Create systemd Service

Create `/etc/systemd/system/outline-sync.service`:

```ini
[Unit]
Description=Outline to S3 Document Sync
After=network.target

[Service]
Type=oneshot
User=www-data
Group=www-data
WorkingDirectory=/opt/outline-sync
ExecStart=/usr/bin/docker run --rm --env-file /opt/outline-sync/.env outline-sync:latest
StandardOutput=journal
StandardError=journal
SyslogIdentifier=outline-sync

[Install]
WantedBy=multi-user.target
```

### 2. Create systemd Timer

Create `/etc/systemd/system/outline-sync.timer`:

```ini
[Unit]
Description=Run Outline sync every hour
Requires=outline-sync.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=1h
Unit=outline-sync.service

[Install]
WantedBy=timers.target
```

### 3. Enable and Start Timer

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable timer to start on boot
sudo systemctl enable outline-sync.timer

# Start timer immediately
sudo systemctl start outline-sync.timer

# Check timer status
sudo systemctl status outline-sync.timer

# View logs
sudo journalctl -u outline-sync.service -f
```

### 4. Manual Trigger

```bash
sudo systemctl start outline-sync.service
```

## How It Works

1. **Fetch Collections**: Retrieves all collections via Outline's `collections.list` API
2. **Filter Collections**: Skips any blacklisted collections (case-insensitive matching)
3. **Fetch Documents**: For each collection, gets all documents via `documents.list` API with `collectionId` filter
4. **Export & Upload**: For each document:
   - Exports as Markdown using `documents.export`
   - Calculates MD5 hash of content
   - Checks if S3 file exists with same hash
   - Uploads only if new or changed
5. **Cleanup**: Deletes S3 files for documents removed from Outline
6. **Rate Limiting**: Adds 100ms delay between API calls and handles 429 responses with automatic retry

## Sync Output

```
Outline → S3 Sync Service
==========================

Blacklisted collections: ops, private

Fetching all collections from Outline...
Found 8 collections

Skipping blacklisted collection: Ops

Processing collection: Engineering
  Found 25 documents
  Processing: engineering/project-roadmap.md
    ↳ Uploaded
  Processing: engineering/technical-spec.md
    ↳ Skipped (no changes)
  Processing: engineering/meeting-notes.md
    ↳ Updated

Processing collection: Marketing
  Found 12 documents
  Processing: marketing/campaign-strategy.md
    ↳ Uploaded

Checking for deleted documents in S3...
Deleting orphaned file: old-collection/deleted-doc.md

=== Sync Summary ===
Uploaded: 15
Updated: 8
Deleted: 3
Skipped: 16
Errors: 0

✓ Sync completed successfully
```

## File Organization

Documents are stored in S3 organized by collection:

```
s3://your-bucket/
├── engineering/
│   ├── project-roadmap.md
│   ├── technical-specifications.md
│   └── meeting-notes-2025-01-15.md
├── marketing/
│   ├── campaign-strategy.md
│   └── brand-guidelines.md
├── product/
│   ├── feature-specs.md
│   └── roadmap-q1-2025.md
└── ...
```

Collections in the blacklist are skipped entirely and their documents are not synced.

## Deduplication

The bot uses MD5 content hashing to detect changes:
- Each file's hash is stored in S3 metadata
- Before uploading, the bot compares hashes
- Only changed documents are uploaded
- Unchanged documents are skipped (fast sync)

## Error Handling

- Network errors are logged and retried per-document
- Individual document failures don't stop the entire sync
- All errors are reported in the final summary
- Exit code 0 for success, 1 for failure

## Monitoring

View sync logs:

```bash
# Real-time logs
sudo journalctl -u outline-sync.service -f

# Last sync run
sudo journalctl -u outline-sync.service -n 100

# Today's syncs
sudo journalctl -u outline-sync.service --since today
```

## Troubleshooting

### Authentication Errors

```
Error: Outline API error (401): Unauthorized
```

- Verify `OUTLINE_API_TOKEN` is correct
- Ensure token has read permissions
- Check `OUTLINE_API_URL` points to correct instance

### S3 Connection Issues

```
Error: Failed to upload file
```

- Verify S3 credentials (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`)
- Check bucket exists and is accessible
- Confirm endpoint URL is correct

### No Documents Synced

- Verify users have documents in Outline
- Check Outline API permissions
- Review sync output for errors

## Development

### Type Check

```bash
pnpm --filter @ichat-ocean/outline-bot type-check
```

### Watch Mode

```bash
pnpm --filter @ichat-ocean/outline-bot dev
```

## Architecture

- **outline-client.ts**: Outline API wrapper
- **s3-client.ts**: S3 storage operations with deduplication
- **sync-service.ts**: Core sync logic and orchestration
- **index.ts**: Entry point and configuration
- **types.ts**: TypeScript interfaces

## License

Part of the ArcAI Ocean monorepo.
