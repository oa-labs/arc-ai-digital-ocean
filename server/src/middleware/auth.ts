import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { supabaseAdmin } from '../supabase.js';
import type { AuthenticatedRequest } from '../types.js';

export type UserRole = 'regular' | 'admin' | 'owner';

/**
 * Get the user's role from their metadata
 */
function getUserRole(user: any): UserRole {
  const role = user?.user_metadata?.role as UserRole | undefined;
  return role && ['regular', 'admin', 'owner'].includes(role) ? role : 'regular';
}

/**
 * Check if user has admin or owner role
 */
function isAdminOrOwner(user: any): boolean {
  const role = getUserRole(user);
  return role === 'admin' || role === 'owner';
}

export const requireAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accessToken = authHeader.replace('Bearer', '').trim();

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = data.user;
    authReq.accessToken = accessToken;
    next();
  } catch (err) {
    console.error('Auth verification failed', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Middleware to require admin or owner role
 * Must be used after requireAuth
 */
export const requireAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Debug logging
  console.log('=== Admin Check Debug ===');
  console.log('User ID:', authReq.user.id);
  console.log('User email:', authReq.user.email);
  console.log('User metadata:', JSON.stringify(authReq.user.user_metadata, null, 2));
  console.log('Extracted role:', getUserRole(authReq.user));
  console.log('Is admin/owner:', isAdminOrOwner(authReq.user));
  console.log('========================');

  if (!isAdminOrOwner(authReq.user)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
};
