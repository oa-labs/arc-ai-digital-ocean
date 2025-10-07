# iChat KB Manager

A modern, secure file management web application for S3-compatible object storage (DigitalOcean Spaces) with Supabase authentication.

## Features

- 🔐 **Secure Authentication** - Supabase Auth with email/password
- 📤 **File Upload** - Drag-and-drop interface with progress tracking
- 📥 **File Download** - Secure presigned URLs for file access
- ✏️ **File Rename** - Rename files while preserving extensions
- 🗑️ **File Delete** - Safe deletion with confirmation dialogs
- 📋 **File List** - View all files with metadata (size, date)
- ✅ **File Validation** - Type and size restrictions enforced
- 🎨 **Modern UI** - Built with Tailwind CSS and Lucide icons

## Supported File Types

- PDF (`.pdf`)
- Text (`.txt`)
- HTML (`.html`, `.htm`)

**Maximum file size:** 10MB

## Tech Stack

- **Frontend Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth
- **Storage:** AWS S3 SDK (DigitalOcean Spaces compatible)
- **State Management:** React Query
- **Routing:** React Router v6
- **Icons:** Lucide React

## Prerequisites

- Node.js 22+
- Supabase account and project
- DigitalOcean Spaces (or S3-compatible storage)

## Setup Instructions

### 1. Install Dependencies

```bash
cd web
pnpm install
```

**Note:** Make sure you're in the `web/` directory before running install commands.

### 2. Configure Environment Variables

Create a `.env` file in the `web/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# S3 Configuration (DigitalOcean Spaces)
VITE_S3_REGION=nyc3
VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_S3_BUCKET=your-bucket-name
VITE_S3_ACCESS_KEY_ID=your-access-key-id
VITE_S3_SECRET_ACCESS_KEY=your-secret-access-key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable Email authentication in Authentication > Providers
3. Copy your project URL and anon key to `.env`

### 4. DigitalOcean Spaces Setup

1. Create a Space in your DigitalOcean account
2. Generate API keys (Spaces access keys)
3. Note your Space name and region
4. Update `.env` with your credentials

**Important:** Ensure your Space has appropriate CORS settings:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

### 5. Run Development Server

```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
pnpm run build
```

The production build will be in the `dist/` directory.

## Project Structure

```
web/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── FileUpload.tsx
│   │   ├── FileList.tsx
│   │   ├── FileItem.tsx
│   │   ├── DeleteConfirmation.tsx
│   │   ├── RenameModal.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/           # Page components
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── services/        # API services
│   │   └── s3Service.ts
│   ├── types/           # TypeScript types
│   │   └── file.ts
│   ├── config/          # Configuration
│   │   └── env.ts
│   ├── lib/             # Libraries
│   │   └── supabase.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Usage

### Sign Up / Sign In

1. Navigate to the application
2. Create an account or sign in with existing credentials
3. Verify your email (if signing up)

### Upload Files

1. Drag and drop files onto the upload area, or click to select
2. Only PDF, Text, and HTML files up to 10MB are accepted
3. Upload progress is displayed in real-time
4. Files appear in the list after successful upload

### Manage Files

- **Download:** Click the download icon on any file
- **Rename:** Click the edit icon, enter new name (extension preserved)
- **Delete:** Click the trash icon and confirm deletion
- **Refresh:** Click the refresh icon in the header to reload the file list

## Security Considerations

- All S3 credentials are stored in environment variables
- Files are stored with private ACL (not publicly accessible)
- Download URLs are presigned and expire after 1 hour
- Authentication is required for all file operations
- File type and size validation on client side

## Troubleshooting

### CORS Errors

If you see CORS errors in the console:
1. Check your DigitalOcean Space CORS configuration
2. Ensure your development URL is in AllowedOrigins
3. Verify AllowedMethods includes all required methods

### Authentication Issues

If authentication fails:
1. Verify Supabase URL and anon key in `.env`
2. Check that email authentication is enabled in Supabase
3. Ensure email verification is configured correctly

### Upload Failures

If uploads fail:
1. Verify S3 credentials in `.env`
2. Check bucket name and region are correct
3. Ensure API keys have write permissions
4. Verify file meets size and type requirements

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

