import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin, UserRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';

const updateRoleSchema = z.object({
  role: z.enum(['regular', 'admin', 'owner']),
});

export const usersRouter = Router();

/**
 * List all users
 * Requires admin access
 */
usersRouter.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    // Fetch all users from Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Failed to list users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Map users to our AppUser format
    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role as UserRole) || 'regular',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
    }));

    return res.json({ users });
  } catch (err) {
    console.error('Error listing users:', err);
    return next(err);
  }
});

/**
 * Update a user's role
 * Requires admin access
 * Owners cannot be modified
 */
usersRouter.patch('/:userId/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const body = updateRoleSchema.parse(req.body);

    // Get the target user to check if they're an owner
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if target user is an owner - owners cannot be modified
    const targetRole = (targetUser.user?.user_metadata?.role as UserRole) || 'regular';
    if (targetRole === 'owner') {
      return res.status(403).json({ 
        error: 'Cannot modify owner accounts. Owner roles can only be changed via direct database access.' 
      });
    }

    // Update the user's metadata with the new role
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...targetUser.user?.user_metadata,
        role: body.role,
      },
    });

    if (updateError) {
      console.error('Failed to update user role:', updateError);
      return res.status(500).json({ error: 'Failed to update user role' });
    }

    return res.json({ 
      success: true,
      message: 'User role updated successfully. User must sign out and sign back in for changes to take effect.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request body', details: err.errors });
    }
    console.error('Error updating user role:', err);
    return next(err);
  }
});

