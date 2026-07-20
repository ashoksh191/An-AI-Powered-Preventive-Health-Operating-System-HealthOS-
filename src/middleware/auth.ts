import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../lib/supabase.js';

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
