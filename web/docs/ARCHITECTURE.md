# Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Application (SPA)                   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Login     │  │  Dashboard   │  │  Protected  │  │  │
│  │  │    Page     │  │     Page     │  │   Routes    │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │   Supabase       │              │  DigitalOcean    │     │
│  │   Auth Service   │              │     Spaces       │     │
│  │                  │              │   (S3 Storage)   │     │
│  │  - Sign Up       │              │                  │     │
│  │  - Sign In       │              │  - Upload        │     │
│  │  - Sign Out      │              │  - Download      │     │
│  │  - Session Mgmt  │              │  - Delete        │     │
│  │                  │              │  - List          │     │
│  └──────────────────┘              └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
App.tsx
├── AuthProvider (Context)
│   └── QueryClientProvider
│       └── BrowserRouter
│           └── Routes
│               ├── /login → Login Page
│               └── / → ProtectedRoute
│                   └── Dashboard Page
│                       ├── FileUpload Component
│                       │   └── react-dropzone
│                       └── FileList Component
│                           └── FileItem Components
│                               ├── DeleteConfirmation Modal
│                               └── RenameModal
```

## Data Flow

### Authentication Flow

```
1. User enters credentials
   ↓
2. Login component calls AuthContext.signIn()
   ↓
3. AuthContext calls Supabase Auth API
   ↓
4. Supabase validates credentials
   ↓
5. Returns session + JWT token
   ↓
6. AuthContext updates state
   ↓
7. ProtectedRoute allows access
   ↓
8. User redirected to Dashboard
```

### File Upload Flow

```
1. User drops file on FileUpload
   ↓
2. react-dropzone validates file type
   ↓
3. validateFile() checks size & type
   ↓
4. s3Service.uploadFile() called
   ↓
5. AWS SDK sends file to Spaces
   ↓
6. Progress callback updates UI
   ↓
7. Upload completes
   ↓
8. Dashboard refreshes file list
```

### File Download Flow

```
1. User clicks download button
   ↓
2. FileItem calls s3Service.getFileUrl()
   ↓
3. AWS SDK generates presigned URL
   ↓
4. URL valid for 1 hour
   ↓
5. Browser downloads file
   ↓
6. URL expires automatically
```

### File Rename Flow

```
1. User clicks rename button
   ↓
2. RenameModal shows current name
   ↓
3. User enters new name
   ↓
4. s3Service.renameFile() called
   ↓
5. AWS SDK copies to new key
   ↓
6. AWS SDK deletes old key
   ↓
7. Dashboard refreshes file list
```

### File Delete Flow

```
1. User clicks delete button
   ↓
2. DeleteConfirmation modal shows
   ↓
3. User confirms deletion
   ↓
4. s3Service.deleteFile() called
   ↓
5. AWS SDK deletes from Spaces
   ↓
6. Dashboard refreshes file list
```

## State Management

### Authentication State (AuthContext)

```typescript
{
  user: User | null,
  session: Session | null,
  loading: boolean,
  signIn: (email, password) => Promise,
  signUp: (email, password) => Promise,
  signOut: () => Promise
}
```

### File List State (Dashboard)

```typescript
{
  files: S3File[],
  loading: boolean,
  refreshing: boolean
}
```

### Upload State (FileUpload)

```typescript
{
  uploads: FileUploadProgress[],
  isUploading: boolean
}
```

## API Integration

### Supabase Auth API

```
Endpoint: https://{project}.supabase.co/auth/v1
Methods:
  - POST /signup
  - POST /token (login)
  - POST /logout
  - GET /user
```

### S3 API (DigitalOcean Spaces)

```
Endpoint: https://{region}.digitaloceanspaces.com
Operations:
  - ListObjectsV2 (list files)
  - PutObject (upload)
  - GetObject (download via presigned URL)
  - DeleteObject (delete)
  - CopyObject (rename - copy then delete)
```

## Security Architecture

### Authentication Layer

```
Browser → Supabase Auth → JWT Token → Protected Routes
```

### File Access Layer

```
Browser → Presigned URL → S3 (1 hour expiry)
```

### Environment Variables

```
Client Side (VITE_ prefix):
  - Supabase URL & Key (public)
  - S3 credentials (exposed to client)

Note: For production, consider backend proxy
to hide S3 credentials
```

## File Storage Structure

```
S3 Bucket: {bucket-name}
├── {timestamp}-{filename}.pdf
├── {timestamp}-{filename}.txt
├── {timestamp}-{filename}.html
└── ...

Example:
├── 1696123456789-report.pdf
├── 1696123457890-notes.txt
└── 1696123458991-index.html
```

## Technology Stack Layers

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  React + TypeScript + Tailwind CSS  │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│         Application Layer           │
│   Components + Contexts + Hooks     │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│          Service Layer              │
│   s3Service + Supabase Client       │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│         Integration Layer           │
│   AWS SDK + Supabase SDK            │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│         External Services           │
│   Supabase + DigitalOcean Spaces    │
└─────────────────────────────────────┘
```

## Build & Deployment Pipeline

```
Development:
  Source Code → Vite Dev Server → Browser
  (Hot Module Replacement enabled)

Production:
  Source Code → TypeScript Compiler → Vite Build
  → Optimized Bundle → CDN/Static Host
```

## Performance Optimizations

1. **Code Splitting**
   - React.lazy for route-based splitting
   - Dynamic imports for large components

2. **Asset Optimization**
   - Vite automatic code splitting
   - Tree shaking for unused code
   - Minification in production

3. **Caching**
   - React Query for server state
   - Browser cache for static assets
   - Service worker (optional)

4. **Network**
   - Presigned URLs reduce server load
   - Direct S3 uploads (no proxy)
   - Parallel file uploads

## Scalability Considerations

### Current Architecture
- ✅ Handles 100s of concurrent users
- ✅ Unlimited file storage (S3)
- ✅ Supabase scales automatically
- ✅ Static hosting scales infinitely

### Future Improvements
- [ ] Backend proxy for S3 credentials
- [ ] Server-side file validation
- [ ] Rate limiting
- [ ] CDN for global distribution
- [ ] Database for file metadata
- [ ] Background job processing

## Error Handling

```
User Action
    ↓
Try/Catch Block
    ↓
Error Occurs?
    ├─ Yes → Log to console
    │         ↓
    │      Show user-friendly message
    │         ↓
    │      Revert UI state
    │
    └─ No → Success flow
              ↓
           Update UI
              ↓
           Show success message
```

## Monitoring Points

1. **Client-side**
   - Console errors
   - Network failures
   - Upload/download success rates

2. **Supabase**
   - Auth success/failure rates
   - API response times
   - User activity

3. **DigitalOcean Spaces**
   - Storage usage
   - Bandwidth consumption
   - API call counts

---

**Last Updated:** 2025-10-01

