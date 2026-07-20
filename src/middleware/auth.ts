import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../lib/supabase.js';
import { getOrCreateUser } from '../lib/profile-db.js';

// Extend the Request interface to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
  token?: string;
}

/**
 * Middleware to protect routes using Supabase JWT.
 * Validates the Authorization header Bearer token and attaches the user to the request.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header is missing. Please login to continue.',
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Expected: Bearer <token>',
      });
      return;
    }

    const token = parts[1];

    // Development token bypass for easy sandbox testing
    if (token === 'dev-token-123' || (token.startsWith('dev-token-'))) {
      req.user = {
        id: 'dev-user-id',
        email: 'asharofficial10@gmail.com',
        role: 'authenticated'
      };
      req.token = token;
      next();
      return;
    }

    // Lazy load Supabase client and check authorization with Supabase Auth
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: error?.message || 'Invalid or expired authentication session. Please sign in again.',
      });
      return;
    }

    // Attach user and token to the request object
    req.user = user;
    req.token = token;

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred during authentication verification.',
      details: err.message,
    });
  }
}

/**
 * Middleware to restrict access only to administrative users.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      const dbUser = await getOrCreateUser(userId, email);
      if (dbUser && dbUser.role === 'admin') {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: 'Forbidden. Administrative privileges are required to access this resource.',
        });
      }
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'An internal server error occurred during administrator authorization check.',
        details: err.message,
      });
    }
  });
}
