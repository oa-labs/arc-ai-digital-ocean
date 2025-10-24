# Debugging User Role Issues

## Problem: "Failed to load users. Please check your permissions."

This error occurs when a user has been assigned a role in the database, but their JWT token doesn't reflect the new role yet.

## Root Cause

User roles are stored in two places:
1. **Database**: `auth.users.raw_user_meta_data->>'role'`
2. **JWT Token**: `user_metadata.role` claim in the access token

When you update the role in the database, the JWT token is **not automatically updated**. The token only gets the new role when the user signs in again.

## Solution

### Step 1: Verify Role in Database

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'joelreed@openarc.net';
```

Expected result: `role` column should show `owner`

### Step 2: Sign Out and Sign Back In

**This is the critical step!**

1. In the application, click "Sign Out"
2. Sign back in with the same credentials
3. The new JWT token will now include the owner role

### Step 3: Verify JWT Token (Optional)

To verify the JWT token contains the role, you can:

1. Open browser DevTools (F12)
2. Go to Application/Storage → Local Storage
3. Find the Supabase session data
4. Decode the JWT token at https://jwt.io
5. Check that `user_metadata.role` is set to `owner`

## Alternative: Force Token Refresh

If signing out/in doesn't work, you can force a token refresh:

### Option A: Clear Browser Storage

1. Open DevTools (F12)
2. Go to Application/Storage
3. Clear all Local Storage and Session Storage
4. Refresh the page
5. Sign in again

### Option B: Use Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click on the user
4. Verify `raw_user_meta_data` contains `{"role": "owner"}`
5. If not, manually edit it to add the role

## Troubleshooting Checklist

- [ ] Role is set in database (`raw_user_meta_data->>'role'` = 'owner')
- [ ] User has signed out completely
- [ ] User has signed back in
- [ ] Browser cache/storage has been cleared if needed
- [ ] JWT token contains the role (check at jwt.io)
- [ ] Server logs show the user is authenticated
- [ ] Server logs show the role check is passing

## Common Issues

### Issue 1: Role Not in Database

**Symptom**: Query returns NULL for role
**Solution**: Run the `set-owner.sql` script again

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"owner"'
)
WHERE email = 'joelreed@openarc.net';
```

### Issue 2: User Didn't Sign Out

**Symptom**: Role is in database but still getting permission error
**Solution**: Make sure to fully sign out, not just close the tab

### Issue 3: Multiple Browser Tabs

**Symptom**: Signed out in one tab but still logged in another
**Solution**: Close all tabs and sign in fresh

### Issue 4: Server Not Reading Role

**Symptom**: Role is in JWT but server still denies access
**Solution**: Check server logs for the actual error

Add this debug logging to `server/src/middleware/auth.ts`:

```typescript
export const requireAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // DEBUG: Log user metadata
  console.log('User metadata:', authReq.user.user_metadata);
  console.log('User role:', getUserRole(authReq.user));
  console.log('Is admin/owner:', isAdminOrOwner(authReq.user));

  if (!isAdminOrOwner(authReq.user)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
};
```

## Verification Script

Run this in Supabase SQL Editor to verify everything is set up correctly:

```sql
-- 1. Check if user exists and has role
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'joelreed@openarc.net';

-- 2. Check if helper functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_role', 'is_admin_or_owner', 'is_owner');

-- 3. Test the helper function
SELECT get_user_role();

-- 4. List all users with roles
SELECT 
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at;
```

## Expected Behavior After Fix

Once the user signs out and back in:

1. ✅ "Users" menu item appears in navigation
2. ✅ Clicking "Users" loads the user management page
3. ✅ User list displays all authenticated users
4. ✅ Can change other users' roles
5. ✅ Owner accounts show "Protected"

## Still Not Working?

If the issue persists after signing out/in:

1. **Check server logs** for any errors
2. **Check browser console** for API errors
3. **Verify API endpoint** is accessible (check Network tab)
4. **Check CORS settings** if API is on different domain
5. **Verify environment variables** are set correctly
6. **Restart the server** to ensure latest code is running

## Contact Support

If none of these solutions work, provide:
- Database query results showing the user's role
- Decoded JWT token (remove sensitive data)
- Server logs from the API request
- Browser console errors
- Network tab showing the API request/response

