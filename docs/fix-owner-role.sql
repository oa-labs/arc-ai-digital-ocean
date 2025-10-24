-- Fix Owner Role Script
-- This script ensures the role is set correctly in BOTH raw_user_meta_data and user_metadata

-- Step 1: Check current state
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as raw_role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'joelreed@openarc.net';

-- Step 2: Update BOTH raw_user_meta_data (this is what gets copied to JWT)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"owner"'
)
WHERE email = 'joelreed@openarc.net';

-- Step 3: Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'joelreed@openarc.net';

-- Step 4: IMPORTANT - Force a token refresh by updating the user's updated_at
-- This will invalidate old tokens
UPDATE auth.users
SET updated_at = NOW()
WHERE email = 'joelreed@openarc.net';

-- Step 5: Final verification
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  updated_at
FROM auth.users
WHERE email = 'joelreed@openarc.net';

-- After running this script:
-- 1. User MUST sign out completely
-- 2. Clear browser local storage (F12 -> Application -> Local Storage -> Clear All)
-- 3. Sign back in
-- 4. The new JWT token will include the owner role

