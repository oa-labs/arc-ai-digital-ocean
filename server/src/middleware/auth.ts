import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { supabaseAdmin } from '../supabase.js';
import type { AuthenticatedRequest } from '../types.js';

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
