# User Management System

## Overview

The ArcAI Portal includes a comprehensive user management system that allows administrators to manage authenticated user accounts and their roles. This system implements a three-tier role hierarchy with proper access controls.

## Features

### 1. Role-Based Access Control (RBAC)

The system implements three user role levels:

- **Regular User** (default)
  - Can only access S3 bucket management (Files pages)
  - Can view and manage files in S3 buckets
  - Cannot access Agents or Users pages
  - No administrative privileges

- **Admin**
  - All regular user privileges
  - Can access and manage Agents
  - Can access the Users management page
  - Can promote users to admin status
  - Can demote admin users to regular status
  - Cannot modify owner accounts

- **Owner**
  - Highest privilege level - can do everything
  - All admin privileges
  - Can access and manage all features (Files, Agents, Users)
  - Protected role that cannot be modified through the UI
  - Can only be assigned or removed via direct database access
  - Multiple owners are allowed for redundancy

### 2. User Management Interface

Administrators can access the user management interface at `/users`, which provides:

- **User List**: Display all authenticated users with their details
  - Email address
  - User ID
  - Current role
  - Account creation date
  - Last sign-in timestamp

- **Role Management**: 
  - Dropdown to change user roles (for non-owner accounts)
  - Visual indicators for different role types
  - Confirmation dialogs before role changes

- **Role Indicators**:
  - Crown icon for owners (purple badge)
  - Shield icon for admins (blue badge)
  - User icon for regular users (gray badge)

### 3. Navigation

The "Users" menu item appears in the top navigation bar on all pages, but only for users with admin or owner roles. It's located alongside "Files" and "Agents" menu items.

## Database Schema

User roles are stored in the `user_metadata` JSONB field of Supabase's `auth.users` table. The role is automatically included in the JWT token when users sign in.

### Helper Functions

Three PostgreSQL functions are available for role checking:

```sql
-- Get the current user's role
get_user_role() RETURNS TEXT

-- Check if current user is admin or owner
is_admin_or_owner() RETURNS BOOLEAN

-- Check if current user is owner
is_owner() RETURNS BOOLEAN
```

### Row Level Security (RLS)

All agent-related tables use RLS policies that check for admin/owner roles:

- `agents` - Admin/owner can read, insert, update, delete
- `slack_channel_agents` - Admin/owner can read, insert, update, delete
- `agent_usage_logs` - Admin/owner can read
- `agent_change_log` - Admin/owner can read

## Setup Instructions

### 1. Run Database Migration

Execute the user roles migration script in your Supabase SQL editor:

```bash
# File: docs/supabase-migration-user-roles.sql
```

This migration:
- Creates helper functions for role checking
- Updates RLS policies to use role-based access control
- Replaces the old `agent_manager_permissions` table approach

### 2. Assign First Owner

Use the standalone SQL script to assign the owner role to your account:

```bash
# File: docs/set-owner.sql
```

Steps:
1. Open the script in Supabase SQL editor
2. Find your user ID by running the query in Step 1
3. Update the email address in Step 2 to match your account
4. Execute the UPDATE statement
5. Verify with the query in Step 3
6. **Sign out and sign back in** for the role to take effect

### 3. Deploy Application

The user management feature is automatically available once:
- Database migration is complete
- At least one owner is assigned
- Application is deployed with the latest code

## API Endpoints

### Server-Side Routes

The server provides two endpoints for user management:

#### GET `/api/users`
- **Authentication**: Required (Bearer token)
- **Authorization**: Admin or owner role required
- **Response**: List of all authenticated users
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "admin",
      "created_at": "2025-01-24T...",
      "last_sign_in_at": "2025-01-24T..."
    }
  ]
}
```

#### PATCH `/api/users/:userId/role`
- **Authentication**: Required (Bearer token)
- **Authorization**: Admin or owner role required
- **Body**: `{ "role": "regular" | "admin" | "owner" }`
- **Restrictions**: Cannot modify owner accounts
- **Response**: Success message
```json
{
  "success": true,
  "message": "User role updated successfully. User must sign out and sign back in for changes to take effect."
}
```

## Security Considerations

### 1. Owner Protection

Owner accounts are protected at multiple levels:

- **UI Level**: Owner accounts show "Protected" instead of role dropdown
- **API Level**: Server rejects any attempts to modify owner roles
- **Database Level**: Only direct SQL access can change owner roles

### 2. Role Persistence

User roles are stored in JWT tokens, which means:

- Role changes require users to sign out and sign back in
- Tokens are automatically refreshed on login
- No additional API calls needed to check roles during session

### 3. Access Control

The system implements defense-in-depth:

- **Frontend**: AdminRoute component blocks non-admin access
- **Backend**: requireAdmin middleware validates roles
- **Database**: RLS policies enforce role-based access

### 4. Audit Trail

Consider implementing:

- Logging of role changes
- Tracking who made role modifications
- Regular audits of admin and owner accounts

## Usage Examples

### Promoting a User to Admin

1. Sign in as an admin or owner
2. Navigate to Users page (top navigation)
3. Find the user in the list
4. Select "Admin" from the role dropdown
5. Confirm the change
6. Notify the user to sign out and back in

### Demoting an Admin to Regular User

1. Sign in as an admin or owner
2. Navigate to Users page
3. Find the admin user in the list
4. Select "Regular" from the role dropdown
5. Confirm the change
6. Notify the user to sign out and back in

### Assigning Additional Owners

Owners can only be assigned via SQL:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"owner"'
)
WHERE email = 'newowner@example.com';
```

## Troubleshooting

### Role Changes Not Taking Effect

**Problem**: User's role was changed but they still have old permissions.

**Solution**: User must sign out and sign back in. The role is stored in the JWT token which is only refreshed on login.

### Cannot Access Users Page

**Problem**: User cannot see or access the Users menu item.

**Solution**: 
1. Verify the user has admin or owner role in the database
2. Ensure they've signed out and back in after role assignment
3. Check browser console for any errors

### Owner Cannot Be Modified

**Problem**: Trying to change an owner's role through the UI.

**Solution**: This is by design. Owner roles can only be changed via direct database access using SQL. Use the `set-owner.sql` script or similar SQL commands.

### API Returns 403 Forbidden

**Problem**: API calls to user management endpoints return 403.

**Solution**:
1. Verify the user has admin or owner role
2. Check that the JWT token is being sent correctly
3. Ensure the user has signed in after role assignment

## Best Practices

1. **Assign Multiple Owners**: Have at least 2-3 owner accounts for redundancy
2. **Regular Audits**: Periodically review admin and owner accounts
3. **Principle of Least Privilege**: Only grant admin access when necessary
4. **Document Changes**: Keep a record of who has admin/owner access
5. **Secure Database Access**: Limit who can execute SQL directly against the database
6. **Test Role Changes**: Verify role changes work as expected in a test environment first

## Future Enhancements

Potential improvements to consider:

- Activity logging for role changes
- Email notifications when roles are modified
- Bulk role management
- Role expiration/temporary admin access
- Integration with external identity providers
- More granular permissions beyond the three-tier system

