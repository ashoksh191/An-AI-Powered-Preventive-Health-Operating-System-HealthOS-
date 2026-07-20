import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getSupabaseClient } from './src/lib/supabase.js';
import { requireAuth, AuthenticatedRequest } from './src/middleware/auth.js';

// Load environment variables from .env
dotenv.config();

const PORT = 3000;

async function bootstrap() {
  const app = express();

  // Middleware for parsing JSON bodies
  app.use(express.json());

  // Helper utility to safely execute Supabase operations and return clean error messages
  const handleSupabaseRoute = (
    handler: (req: express.Request, res: express.Response, supabase: any) => Promise<void>
  ) => {
    return async (req: express.Request, res: express.Response) => {
      try {
        const supabase = getSupabaseClient();
        await handler(req, res, supabase);
      } catch (err: any) {
        console.error('API Error:', err);
        if (err.message?.includes('Supabase credentials are not fully configured')) {
          res.status(503).json({
            success: false,
            error: 'Database/Auth service not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your environment variables.',
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'An unexpected error occurred. Please try again.',
            details: err.message,
          });
        }
      }
    };
  };

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  /**
   * Register API
   * POST /api/auth/register
   */
  app.post(
    '/api/auth/register',
    handleSupabaseRoute(async (req, res, supabase) => {
      const { email, password, redirectTo } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required parameters.',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.',
        });
        return;
      }

      // Default redirect URL if none is provided
      const finalRedirectTo = redirectTo || `${process.env.APP_URL || `http://localhost:${PORT}`}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: finalRedirectTo,
        },
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Supabase behavior check: is user already confirmed or is email verification required?
      const isConfirmationRequired = data.user && !data.user.email_confirmed_at && data.session === null;

      res.status(201).json({
        success: true,
        message: isConfirmationRequired
          ? 'Registration successful! Please check your inbox for a verification email.'
          : 'Registration successful and authenticated.',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          created_at: data.user?.created_at,
          email_confirmed_at: data.user?.email_confirmed_at,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
            }
          : null,
      });
    })
  );

  /**
   * Login API
   * POST /api/auth/login
   */
  app.post(
    '/api/auth/login',
    handleSupabaseRoute(async (req, res, supabase) => {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required parameters.',
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          created_at: data.user?.created_at,
          email_confirmed_at: data.user?.email_confirmed_at,
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_in: data.session?.expires_in,
        },
      });
    })
  );

  /**
   * Logout API
   * POST /api/auth/logout
   */
  app.post(
    '/api/auth/logout',
    handleSupabaseRoute(async (req, res, supabase) => {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (token) {
        // Set the active session to the user's token so Supabase knows which session to sign out
        await supabase.auth.setSession({ access_token: token, refresh_token: '' });
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Successfully logged out. Access token invalidated.',
      });
    })
  );

  /**
   * Session Management API
   * GET /api/auth/session
   */
  app.get('/api/auth/session', requireAuth as any, (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      success: true,
      message: 'Active session is valid.',
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        last_sign_in_at: req.user?.last_sign_in_at,
        email_confirmed_at: req.user?.email_confirmed_at,
      },
    });
  });

  /**
   * Email Verification Resend API
   * POST /api/auth/resend-verification
   */
  app.post(
    '/api/auth/resend-verification',
    handleSupabaseRoute(async (req, res, supabase) => {
      const { email, redirectTo } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is a required parameter.',
        });
        return;
      }

      const finalRedirectTo = redirectTo || `${process.env.APP_URL || `http://localhost:${PORT}`}/auth/callback`;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: finalRedirectTo,
        },
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Verification link resent successfully. Please check your email.',
      });
    })
  );

  /**
   * Password Reset Request API
   * POST /api/auth/reset-password-request
   */
  app.post(
    '/api/auth/reset-password-request',
    handleSupabaseRoute(async (req, res, supabase) => {
      const { email, redirectTo } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is a required parameter.',
        });
        return;
      }

      const finalRedirectTo = redirectTo || `${process.env.APP_URL || `http://localhost:${PORT}`}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: finalRedirectTo,
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password reset link sent successfully. Please check your email.',
      });
    })
  );

  /**
   * Password Reset Confirm API
   * POST /api/auth/reset-password-confirm
   */
  app.post(
    '/api/auth/reset-password-confirm',
    requireAuth as any,
    handleSupabaseRoute(async (req: AuthenticatedRequest, res, supabase) => {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          error: 'New password is required.',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.',
        });
        return;
      }

      // Re-establish session context with Supabase using the validated JWT token
      await supabase.auth.setSession({ access_token: req.token!, refresh_token: '' });

      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password updated successfully.',
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      });
    })
  );

  // ==========================================
  // PROTECTED DASHBOARD ROUTES
  // ==========================================

  /**
   * Protected Dashboard Data Route
   * GET /api/dashboard/data
   */
  app.get('/api/dashboard/data', requireAuth as any, (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted to protected dashboard routes.',
      user: {
        id: req.user?.id,
        email: req.user?.email,
      },
      dashboardData: {
        systemStatus: 'Optimal',
        serverTime: new Date().toISOString(),
        metrics: {
          cpuUsage: '14%',
          memoryUsage: '342MB / 512MB',
          activeUsers: 1422,
          apiCallsCount: 94822,
        },
        recentLogs: [
          { timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), type: 'info', message: 'User session verified successfully.' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'info', message: 'Daily stats compiled.' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), type: 'warning', message: 'External service latency spiked.' },
        ],
      },
    });
  });

  // ==========================================
  // FRONTEND INTEGRATION
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    // Integrate Vite as development middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start the listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server Bootstrap Failed]', err);
});
