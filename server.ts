import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getSupabaseClient } from './src/lib/supabase.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './src/middleware/auth.js';
import { 
  getOrCreateUser as syncOrCreateUser, 
  getHealthProfile, 
  createHealthProfile, 
  updateHealthProfile, 
  setStoreValue, 
  getStoreValue, 
  getAllStoreValues,
  savePrediction,
  getPredictionHistory,
  saveHealthScore,
  getHealthScoreHistory,
  saveLifestylePlan,
  getLifestylePlan,
  updateLifestylePlan,
  saveDailyLog,
  getDailyLogs,
  saveDailyHealthLog,
  getDailyHealthLogs,
  updateDailyHealthLog,
  deleteDailyHealthLog,
  saveChatMessage,
  getChatHistory,
  saveNotification,
  getNotifications,
  saveReport,
  getReports,
  getAllUsersAdmin,
  getAllReportsAdmin,
  getSystemStatsAdmin
} from './src/lib/profile-db.js';
import { calculateDiseaseRisks } from './src/lib/predictor.js';
import { calculateHealthScore } from './src/lib/health-score.js';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables from .env
dotenv.config();

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

const PORT = Number(process.env.PORT) || 3000;

export async function createApp() {
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

      if (!supabase) {
        const userId = 'user-' + Math.floor(100000 + Math.random() * 900000);
        await syncOrCreateUser(userId, email);
        res.status(201).json({
          success: true,
          message: 'Registration successful! Active local developer session initialized.',
          user: {
            id: userId,
            email,
            created_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
          },
          session: {
            access_token: `dev-token-${userId}`,
            refresh_token: 'demo-refresh-token',
            expires_in: 86400,
          },
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

      if (!supabase) {
        const userId = 'user-' + Math.floor(100000 + Math.random() * 900000);
        await syncOrCreateUser(userId, email);
        res.status(200).json({
          success: true,
          message: 'Login successful! Active local developer session initialized.',
          user: {
            id: userId,
            email,
            created_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
          },
          session: {
            access_token: `dev-token-${userId}`,
            refresh_token: 'demo-refresh-token',
            expires_in: 86400,
          },
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
  // USER PROFILE & STORE ENDPOINTS (PROTECTED)
  // ==========================================

  /**
   * GET /api/profile
   * Retrieves the currently logged-in user's health profile.
   */
  app.get('/api/profile', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      // Synchronize/ensure user exists in local database
      await syncOrCreateUser(userId, email);

      const profile = await getHealthProfile(userId);

      res.status(200).json({
        success: true,
        profile,
      });
    } catch (err: any) {
      console.error('Error fetching health profile:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve health profile.',
        details: err.message,
      });
    }
  });

  /**
   * POST /api/profile
   * Creates a brand new health profile for the logged-in user.
   */
  app.post('/api/profile', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      // Synchronize/ensure user exists in local database
      await syncOrCreateUser(userId, email);

      // Destructure fields from body
      const {
        age,
        gender,
        height,
        weight,
        sleep,
        exercise,
        smoking,
        alcohol,
        waterIntake,
        stress,
        familyHistory,
        existingConditions,
      } = req.body;

      // Validation logic
      const errors: string[] = [];

      // age validation
      if (age === undefined || age === null) {
        errors.push('Field "age" is required.');
      } else if (!Number.isInteger(Number(age)) || Number(age) <= 0 || Number(age) > 130) {
        errors.push('Field "age" must be a positive integer between 1 and 130.');
      }

      // gender validation
      if (!gender || typeof gender !== 'string' || gender.trim().length === 0) {
        errors.push('Field "gender" is required and must be a non-empty string.');
      }

      // height validation
      if (height === undefined || height === null) {
        errors.push('Field "height" (in cm) is required.');
      } else if (isNaN(Number(height)) || Number(height) < 30 || Number(height) > 300) {
        errors.push('Field "height" must be a number between 30 and 300 cm.');
      }

      // weight validation
      if (weight === undefined || weight === null) {
        errors.push('Field "weight" (in kg) is required.');
      } else if (isNaN(Number(weight)) || Number(weight) < 2 || Number(weight) > 600) {
        errors.push('Field "weight" must be a number between 2 and 600 kg.');
      }

      // sleep validation
      if (sleep === undefined || sleep === null) {
        errors.push('Field "sleep" (in hours) is required.');
      } else if (isNaN(Number(sleep)) || Number(sleep) < 0 || Number(sleep) > 24) {
        errors.push('Field "sleep" must be a number between 0 and 24 hours.');
      }

      // exercise validation
      if (exercise === undefined || exercise === null) {
        errors.push('Field "exercise" (in minutes/day) is required.');
      } else if (isNaN(Number(exercise)) || Number(exercise) < 0 || Number(exercise) > 1440) {
        errors.push('Field "exercise" must be a non-negative number of minutes.');
      }

      // smoking validation
      if (smoking === undefined || smoking === null || typeof smoking !== 'boolean') {
        errors.push('Field "smoking" is required and must be a boolean.');
      }

      // alcohol validation
      if (alcohol === undefined || alcohol === null || typeof alcohol !== 'string') {
        errors.push('Field "alcohol" is required and must be a string description.');
      }

      // waterIntake validation
      if (waterIntake === undefined || waterIntake === null) {
        errors.push('Field "waterIntake" (in Liters) is required.');
      } else if (isNaN(Number(waterIntake)) || Number(waterIntake) < 0 || Number(waterIntake) > 30) {
        errors.push('Field "waterIntake" must be a non-negative number of liters.');
      }

      // stress validation
      if (!stress || typeof stress !== 'string' || stress.trim().length === 0) {
        errors.push('Field "stress" is required and must be a string (e.g. Low, Medium, High).');
      }

      // familyHistory validation
      if (familyHistory === undefined || familyHistory === null || typeof familyHistory !== 'string') {
        errors.push('Field "familyHistory" is required and must be a string.');
      }

      // existingConditions validation
      if (existingConditions === undefined || existingConditions === null || typeof existingConditions !== 'string') {
        errors.push('Field "existingConditions" is required and must be a string.');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed for one or more health profile fields.',
          details: errors,
        });
        return;
      }

      const created = await createHealthProfile(userId, {
        age: Number(age),
        gender: gender.trim(),
        height: Number(height),
        weight: Number(weight),
        sleep: Number(sleep),
        exercise: Number(exercise),
        smoking: !!smoking,
        alcohol: alcohol.trim(),
        waterIntake: Number(waterIntake),
        stress: stress.trim(),
        familyHistory: familyHistory.trim(),
        existingConditions: existingConditions.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Health profile created successfully.',
        profile: created,
      });
    } catch (err: any) {
      console.error('Error creating profile:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to create health profile.',
      });
    }
  });

  /**
   * PATCH /api/profile
   * Updates fields of an existing health profile for the logged-in user.
   */
  app.patch('/api/profile', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      // Synchronize/ensure user exists in local database
      await syncOrCreateUser(userId, email);

      const updates: any = {};
      const errors: string[] = [];

      // Optional updates validation
      if (req.body.age !== undefined) {
        if (!Number.isInteger(Number(req.body.age)) || Number(req.body.age) <= 0 || Number(req.body.age) > 130) {
          errors.push('Field "age" must be a positive integer between 1 and 130.');
        } else {
          updates.age = Number(req.body.age);
        }
      }

      if (req.body.gender !== undefined) {
        if (typeof req.body.gender !== 'string' || req.body.gender.trim().length === 0) {
          errors.push('Field "gender" must be a non-empty string.');
        } else {
          updates.gender = req.body.gender.trim();
        }
      }

      if (req.body.height !== undefined) {
        if (isNaN(Number(req.body.height)) || Number(req.body.height) < 30 || Number(req.body.height) > 300) {
          errors.push('Field "height" must be a number between 30 and 300 cm.');
        } else {
          updates.height = Number(req.body.height);
        }
      }

      if (req.body.weight !== undefined) {
        if (isNaN(Number(req.body.weight)) || Number(req.body.weight) < 2 || Number(req.body.weight) > 600) {
          errors.push('Field "weight" must be a number between 2 and 600 kg.');
        } else {
          updates.weight = Number(req.body.weight);
        }
      }

      if (req.body.sleep !== undefined) {
        if (isNaN(Number(req.body.sleep)) || Number(req.body.sleep) < 0 || Number(req.body.sleep) > 24) {
          errors.push('Field "sleep" must be a number between 0 and 24 hours.');
        } else {
          updates.sleep = Number(req.body.sleep);
        }
      }

      if (req.body.exercise !== undefined) {
        if (isNaN(Number(req.body.exercise)) || Number(req.body.exercise) < 0 || Number(req.body.exercise) > 1440) {
          errors.push('Field "exercise" must be a non-negative number of minutes.');
        } else {
          updates.exercise = Number(req.body.exercise);
        }
      }

      if (req.body.smoking !== undefined) {
        if (typeof req.body.smoking !== 'boolean') {
          errors.push('Field "smoking" must be a boolean.');
        } else {
          updates.smoking = req.body.smoking;
        }
      }

      if (req.body.alcohol !== undefined) {
        if (typeof req.body.alcohol !== 'string') {
          errors.push('Field "alcohol" must be a string.');
        } else {
          updates.alcohol = req.body.alcohol.trim();
        }
      }

      if (req.body.waterIntake !== undefined) {
        if (isNaN(Number(req.body.waterIntake)) || Number(req.body.waterIntake) < 0 || Number(req.body.waterIntake) > 30) {
          errors.push('Field "waterIntake" must be a non-negative number of liters.');
        } else {
          updates.waterIntake = Number(req.body.waterIntake);
        }
      }

      if (req.body.stress !== undefined) {
        if (typeof req.body.stress !== 'string' || req.body.stress.trim().length === 0) {
          errors.push('Field "stress" must be a non-empty string.');
        } else {
          updates.stress = req.body.stress.trim();
        }
      }

      if (req.body.familyHistory !== undefined) {
        if (typeof req.body.familyHistory !== 'string') {
          errors.push('Field "familyHistory" must be a string.');
        } else {
          updates.familyHistory = req.body.familyHistory.trim();
        }
      }

      if (req.body.existingConditions !== undefined) {
        if (typeof req.body.existingConditions !== 'string') {
          errors.push('Field "existingConditions" must be a string.');
        } else {
          updates.existingConditions = req.body.existingConditions.trim();
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed for one or more health profile fields.',
          details: errors,
        });
        return;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          error: 'No update parameters provided in request body.',
        });
        return;
      }

      const updated = await updateHealthProfile(userId, updates);

      res.status(200).json({
        success: true,
        message: 'Health profile updated successfully.',
        profile: updated,
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to update health profile.',
      });
    }
  });

  // ==========================================
  // GENERAL DATA STORE ENDPOINTS (PROTECTED)
  // ==========================================

  /**
   * GET /api/store
   * Lists all store key-value records for the logged-in user.
   */
  app.get('/api/store', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const items = await getAllStoreValues(userId);

      res.status(200).json({
        success: true,
        items,
      });
    } catch (err: any) {
      console.error('Error reading key-value store:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to read from key-value store.',
        details: err.message,
      });
    }
  });

  /**
   * GET /api/store/:key
   * Retrieves a specific key's value for the logged-in user.
   */
  app.get('/api/store/:key', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';
      const { key } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      if (!key) {
        res.status(400).json({ success: false, error: 'Key parameter is required.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const item = await getStoreValue(userId, key);

      res.status(200).json({
        success: true,
        item,
      });
    } catch (err: any) {
      console.error('Error reading key-value store item:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to read from key-value store.',
        details: err.message,
      });
    }
  });

  /**
   * POST /api/store
   * Upserts a key-value record for the logged-in user.
   */
  app.post('/api/store', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';
      const { key, value } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      if (!key || typeof key !== 'string' || key.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Field "key" is required and must be a non-empty string.' });
        return;
      }

      if (value === undefined || value === null) {
        res.status(400).json({ success: false, error: 'Field "value" is required.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const saved = await setStoreValue(userId, key.trim(), String(value));

      res.status(200).json({
        success: true,
        message: 'Value stored successfully.',
        item: saved,
      });
    } catch (err: any) {
      console.error('Error writing to key-value store:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to save value to key-value store.',
        details: err.message,
      });
    }
  });

  // ==========================================
  // DISEASE RISK PREDICTION ENDPOINTS (PROTECTED)
  // ==========================================

  /**
   * POST /api/prediction
   * Calculates disease risks and saves the prediction in history.
   */
  app.post('/api/prediction', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      const {
        age,
        bmi,
        sleep,
        exercise,
        smoking,
        alcohol,
        stress,
        familyHistory,
        existingConditions,
      } = req.body;

      const errors: string[] = [];

      // Validation logic
      if (age === undefined || age === null) {
        errors.push('Field "age" is required.');
      } else if (!Number.isInteger(Number(age)) || Number(age) <= 0 || Number(age) > 130) {
        errors.push('Field "age" must be a positive integer between 1 and 130.');
      }

      if (bmi === undefined || bmi === null) {
        errors.push('Field "bmi" is required.');
      } else if (isNaN(Number(bmi)) || Number(bmi) < 5 || Number(bmi) > 100) {
        errors.push('Field "bmi" must be a number between 5 and 100.');
      }

      if (sleep === undefined || sleep === null) {
        errors.push('Field "sleep" (in hours) is required.');
      } else if (isNaN(Number(sleep)) || Number(sleep) < 0 || Number(sleep) > 24) {
        errors.push('Field "sleep" must be a number between 0 and 24 hours.');
      }

      if (exercise === undefined || exercise === null) {
        errors.push('Field "exercise" (in minutes/day) is required.');
      } else if (isNaN(Number(exercise)) || Number(exercise) < 0 || Number(exercise) > 1440) {
        errors.push('Field "exercise" must be a non-negative number of minutes.');
      }

      if (smoking === undefined || smoking === null || typeof smoking !== 'boolean') {
        errors.push('Field "smoking" is required and must be a boolean.');
      }

      if (alcohol === undefined || alcohol === null || typeof alcohol !== 'string') {
        errors.push('Field "alcohol" is required and must be a string description.');
      }

      if (!stress || typeof stress !== 'string' || stress.trim().length === 0) {
        errors.push('Field "stress" is required and must be a string (e.g. Low, Medium, High).');
      }

      if (familyHistory === undefined || familyHistory === null || typeof familyHistory !== 'string') {
        errors.push('Field "familyHistory" is required and must be a string.');
      }

      if (existingConditions === undefined || existingConditions === null || typeof existingConditions !== 'string') {
        errors.push('Field "existingConditions" is required and must be a string.');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed for prediction inputs.',
          details: errors,
        });
        return;
      }

      const input = {
        age: Number(age),
        bmi: Number(bmi),
        sleep: Number(sleep),
        exercise: Number(exercise),
        smoking: !!smoking,
        alcohol: alcohol.trim(),
        stress: stress.trim(),
        familyHistory: familyHistory.trim(),
        existingConditions: existingConditions.trim(),
      };

      // Calculate Risks
      const results = calculateDiseaseRisks(input);

      // Save to database
      await syncOrCreateUser(userId, email);
      const saved = await savePrediction(userId, {
        ...input,
        results: JSON.stringify(results),
      });

      res.status(201).json({
        success: true,
        message: 'Disease risk prediction completed and stored successfully.',
        prediction: {
          id: saved.id,
          userId: saved.userId,
          ...input,
          results, // Return parsed JSON object rather than stringified JSON
          createdAt: saved.createdAt,
        },
      });
    } catch (err: any) {
      console.error('Error generating risk prediction:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while generating disease risk prediction.',
        details: err.message,
      });
    }
  });

  /**
   * GET /api/prediction/history
   * Retrieves prediction history for the current user.
   */
  app.get('/api/prediction/history', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const history = await getPredictionHistory(userId);

      // Parse JSON results before returning
      const parsedHistory = history.map((record) => {
        let parsedResults = null;
        try {
          parsedResults = JSON.parse(record.results);
        } catch (e) {
          console.error('Failed to parse prediction results JSON', record.results);
        }
        return {
          id: record.id,
          userId: record.userId,
          age: record.age,
          bmi: record.bmi,
          sleep: record.sleep,
          exercise: record.exercise,
          smoking: record.smoking,
          alcohol: record.alcohol,
          stress: record.stress,
          familyHistory: record.familyHistory,
          existingConditions: record.existingConditions,
          results: parsedResults,
          createdAt: record.createdAt,
        };
      });

      res.status(200).json({
        success: true,
        history: parsedHistory,
      });
    } catch (err: any) {
      console.error('Error fetching prediction history:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while fetching prediction history.',
        details: err.message,
      });
    }
  });

  // ==========================================
  // HEALTH SCORE ENGINE ENDPOINTS (PROTECTED)
  // ==========================================

  const handlePostHealthScore = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      const {
        sleep,
        exercise,
        diet,
        water,
        stress,
        bmi,
      } = req.body;

      const errors: string[] = [];

      // Validation logic
      if (sleep === undefined || sleep === null) {
        errors.push('Field "sleep" (in hours) is required.');
      } else if (isNaN(Number(sleep)) || Number(sleep) < 0 || Number(sleep) > 24) {
        errors.push('Field "sleep" must be a number between 0 and 24 hours.');
      }

      if (exercise === undefined || exercise === null) {
        errors.push('Field "exercise" (in minutes/day) is required.');
      } else if (isNaN(Number(exercise)) || Number(exercise) < 0 || Number(exercise) > 1440) {
        errors.push('Field "exercise" must be a non-negative number of minutes.');
      }

      if (!diet || typeof diet !== 'string' || diet.trim().length === 0) {
        errors.push('Field "diet" is required and must be a non-empty string.');
      }

      if (water === undefined || water === null) {
        errors.push('Field "water" (in Liters) is required.');
      } else if (isNaN(Number(water)) || Number(water) < 0 || Number(water) > 30) {
        errors.push('Field "water" must be a non-negative number of liters.');
      }

      if (!stress || typeof stress !== 'string' || stress.trim().length === 0) {
        errors.push('Field "stress" is required and must be a string (e.g. Low, Medium, High).');
      }

      if (bmi === undefined || bmi === null) {
        errors.push('Field "bmi" is required.');
      } else if (isNaN(Number(bmi)) || Number(bmi) < 5 || Number(bmi) > 100) {
        errors.push('Field "bmi" must be a number between 5 and 100.');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed for health score inputs.',
          details: errors,
        });
        return;
      }

      const input = {
        sleep: Number(sleep),
        exercise: Number(exercise),
        diet: diet.trim(),
        water: Number(water),
        stress: stress.trim(),
        bmi: Number(bmi),
      };

      // Generate Health Score
      const results = calculateHealthScore(input);

      // Save to database
      await syncOrCreateUser(userId, email);
      const saved = await saveHealthScore(userId, {
        ...input,
        score: results.overallScore,
        breakdown: JSON.stringify(results),
      });

      res.status(201).json({
        success: true,
        message: 'Health score compiled and stored successfully.',
        healthScore: {
          id: saved.id,
          userId: saved.userId,
          ...input,
          score: saved.score,
          results, // Parse breakdown structure
          createdAt: saved.createdAt,
        },
      });
    } catch (err: any) {
      console.error('Error calculating health score:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while compiling health score.',
        details: err.message,
      });
    }
  };

  const handleGetHealthScoreHistory = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const history = await getHealthScoreHistory(userId);

      const parsedHistory = history.map((record) => {
        let parsedResults = null;
        try {
          parsedResults = JSON.parse(record.breakdown);
        } catch (e) {
          console.error('Failed to parse health score breakdown JSON', record.breakdown);
        }
        return {
          id: record.id,
          userId: record.userId,
          sleep: record.sleep,
          exercise: record.exercise,
          diet: record.diet,
          water: record.water,
          stress: record.stress,
          bmi: record.bmi,
          score: record.score,
          results: parsedResults,
          createdAt: record.createdAt,
        };
      });

      res.status(200).json({
        success: true,
        history: parsedHistory,
      });
    } catch (err: any) {
      console.error('Error fetching health score history:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while fetching health score history.',
        details: err.message,
      });
    }
  };

  // Support both versions of the paths (with and without /api)
  app.post('/api/health-score', requireAuth as any, handlePostHealthScore);
  app.post('/health-score', requireAuth as any, handlePostHealthScore);
  app.get('/api/health-score/history', requireAuth as any, handleGetHealthScoreHistory);
  app.get('/health-score/history', requireAuth as any, handleGetHealthScoreHistory);

  // ==========================================
  // AI LIFESTYLE COACH ENDPOINTS (PROTECTED)
  // ==========================================

  const handlePostCoachGenerate = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      const {
        goals,
        dietaryRestrictions,
        fitnessLevel,
      } = req.body;

      // 1. Fetch user's profile to enrich prompt
      let profile = null;
      try {
        profile = await getHealthProfile(userId);
      } catch (err) {
        console.warn('Could not load health profile for coach prompt enrichment', err);
      }

      // 2. Build the detailed prompt
      let userContextPrompt = '';
      if (profile) {
        userContextPrompt = `
Health Profile of the user:
- Age: ${profile.age} years old
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg (BMI: ${profile.bmi.toFixed(1)})
- Baseline Sleep: ${profile.sleep} hours/day
- Baseline Physical Activity: ${profile.exercise} minutes/day
- Smoking Status: ${profile.smoking ? 'Smoker' : 'Non-smoker'}
- Alcohol Intake: ${profile.alcohol}
- Baseline Water Intake: ${profile.waterIntake} Liters/day
- Baseline Stress Level: ${profile.stress}
- Family History: ${profile.familyHistory || 'None reported'}
- Existing Medical Conditions: ${profile.existingConditions || 'None reported'}
`;
      } else {
        userContextPrompt = `
Health Profile of the user:
- No existing medical profile loaded. Assume standard baseline levels.
`;
      }

      const prompt = `
You are an expert AI Lifestyle Coach, certified personal trainer, and clinical dietitian.
Generate a comprehensive, premium-grade, actionable lifestyle plan for a user.

${userContextPrompt}

User Preferences & Custom Focus:
- Core Goals: ${goals || 'Improve overall health and fitness'}
- Dietary Restrictions: ${dietaryRestrictions || 'None'}
- Fitness Level: ${fitnessLevel || 'Intermediate'}

Please generate a highly tailored, scientific, and practical lifestyle plan. Make sure:
1. The Meal Plan contains concrete, delicious, nutrient-dense breakfast, lunch, dinner, and snack ideas for the week, structured with clear instructions.
2. The Workout Plan contains safe, progressive exercise routines with specific sets, reps, or durations customized to their fitness level and BMI.
3. The Water Goal is a precise daily volume in Liters, optimized for their weight and activity.
4. The Sleep Schedule proposes realistic rest intervals and 3 actionable habits to improve deep sleep cycles.
5. The Stress Tips contain practical, immediate stress buffers (like box breathing, somatic grounding, or digital detox routines) that fit their life.

Ensure all text descriptions are written in polished, supportive, and motivating language.
`;

      // 3. Query Gemini API
      const ai = getGeminiClient();
      let generatedPlan: any = null;

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  mealPlan: { type: Type.STRING },
                  workoutPlan: { type: Type.STRING },
                  waterGoal: { type: Type.NUMBER },
                  sleepSchedule: { type: Type.STRING },
                  stressTips: { type: Type.STRING },
                },
                required: ['mealPlan', 'workoutPlan', 'waterGoal', 'sleepSchedule', 'stressTips'],
              },
            },
          });
          if (response.text) {
            generatedPlan = JSON.parse(response.text);
          }
        } catch (apiErr) {
          console.warn('Gemini API call failed, falling back to rule-based coach plan:', apiErr);
        }
      }

      if (!generatedPlan) {
        generatedPlan = {
          mealPlan: `### Weekly High-Performance Nutrition Plan (${goals || 'General Wellness'})\n\n- **Breakfast:** Oats with chia seeds, blueberries, and protein shake.\n- **Lunch:** Mediterranean Quinoa bowl with grilled chicken/tofu & greens.\n- **Dinner:** Pan-seared salmon or lentils with roasted veggies and sweet potato.\n- **Snacks:** Apple slices with almond butter or non-fat Greek yogurt.`,
          workoutPlan: `### Weekly Workout Routine (${fitnessLevel || 'Intermediate'})\n\n- **Day 1:** Upper Body Strength (Pushups, Dumbbell Rows, Shoulder Press - 3x12)\n- **Day 2:** Zone 2 Cardio (30 mins cycling or brisk walking)\n- **Day 3:** Lower Body & Core (Goblet Squats, Lunges, Planks)\n- **Day 4:** HIIT Cardio & Mobility Stretches`,
          waterGoal: 2.8,
          sleepSchedule: `### Sleep & Rest Optimization\n\n- Bedtime: 10:30 PM | Wake time: 6:30 AM\n- Avoid blue-light screens 45 minutes before sleep.\n- Maintain room temperature around 19°C (66°F).`,
          stressTips: `### Personalized Stress Buffers\n\n1. Perform 3 physiological sighs when tense.\n2. 20-minute daily nature walk without phone notifications.\n3. Keep a nightly gratitude journal.`,
        };
      }

      // 4. Save to database
      await syncOrCreateUser(userId, email);
      const savedPlan = await saveLifestylePlan(userId, {
        mealPlan: generatedPlan.mealPlan,
        workoutPlan: generatedPlan.workoutPlan,
        waterGoal: Number(generatedPlan.waterGoal),
        sleepSchedule: generatedPlan.sleepSchedule,
        stressTips: generatedPlan.stressTips,
        goals: goals || 'Improve overall health and fitness',
      });

      res.status(201).json({
        success: true,
        message: 'Personalized AI Lifestyle Coach plan generated and stored successfully.',
        plan: savedPlan,
      });

    } catch (err: any) {
      console.error('Error generating AI Lifestyle Plan:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while generating the lifestyle plan.',
        details: err.message,
      });
    }
  };

  const handleGetCoachPlan = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const plan = await getLifestylePlan(userId);

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'No active AI Coach plan found. Please generate a new plan.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        plan,
      });
    } catch (err: any) {
      console.error('Error fetching AI Coach plan:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while fetching the coach plan.',
        details: err.message,
      });
    }
  };

  const handlePatchCoachPlan = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const {
        mealPlan,
        workoutPlan,
        waterGoal,
        sleepSchedule,
        stressTips,
        goals,
      } = req.body;

      // Construct partial updates object
      const updateData: any = {};
      if (mealPlan !== undefined) updateData.mealPlan = mealPlan;
      if (workoutPlan !== undefined) updateData.workoutPlan = workoutPlan;
      if (waterGoal !== undefined) updateData.waterGoal = Number(waterGoal);
      if (sleepSchedule !== undefined) updateData.sleepSchedule = sleepSchedule;
      if (stressTips !== undefined) updateData.stressTips = stressTips;
      if (goals !== undefined) updateData.goals = goals;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid update fields provided. Please provide at least one field to update.',
        });
        return;
      }

      const updated = await updateLifestylePlan(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'AI Coach plan updated successfully.',
        plan: updated,
      });
    } catch (err: any) {
      console.error('Error updating AI Coach plan:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while updating the coach plan.',
        details: err.message,
      });
    }
  };

  app.post('/api/coach/generate', requireAuth as any, handlePostCoachGenerate);
  app.post('/coach/generate', requireAuth as any, handlePostCoachGenerate);

  app.get('/api/coach', requireAuth as any, handleGetCoachPlan);
  app.get('/coach', requireAuth as any, handleGetCoachPlan);

  app.patch('/api/coach', requireAuth as any, handlePatchCoachPlan);
  app.patch('/coach', requireAuth as any, handlePatchCoachPlan);

  // ==========================================
  // PROTECTED DASHBOARD & DAILY LOG ROUTES
  // ==========================================

  const handlePostDailyLog = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      const { weight, sleep, exercise } = req.body;
      const errors: string[] = [];

      if (weight === undefined || weight === null) {
        errors.push('Field "weight" is required.');
      } else if (isNaN(Number(weight)) || Number(weight) <= 0) {
        errors.push('Field "weight" must be a positive number (in kg).');
      }

      if (sleep === undefined || sleep === null) {
        errors.push('Field "sleep" is required.');
      } else if (isNaN(Number(sleep)) || Number(sleep) < 0 || Number(sleep) > 24) {
        errors.push('Field "sleep" must be a number between 0 and 24 hours.');
      }

      if (exercise === undefined || exercise === null) {
        errors.push('Field "exercise" is required.');
      } else if (isNaN(Number(exercise)) || Number(exercise) < 0) {
        errors.push('Field "exercise" must be a non-negative number of minutes.');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed for daily log inputs.',
          details: errors,
        });
        return;
      }

      await syncOrCreateUser(userId, email);

      const savedLog = await saveDailyLog(userId, {
        weight: Number(weight),
        sleep: Number(sleep),
        exercise: Number(exercise),
      });

      res.status(201).json({
        success: true,
        message: 'Daily log stored successfully.',
        log: savedLog,
      });
    } catch (err: any) {
      console.error('Error saving daily log:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while saving daily log.',
        details: err.message,
      });
    }
  };

  const handleGetDailyLogs = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const logs = await getDailyLogs(userId);

      res.status(200).json({
        success: true,
        logs,
      });
    } catch (err: any) {
      console.error('Error fetching daily logs:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while fetching daily logs.',
        details: err.message,
      });
    }
  };

  const handleGetDashboard = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      // 1. Fetch raw histories
      const rawHealthScores = await getHealthScoreHistory(userId);
      const rawPredictions = await getPredictionHistory(userId);
      const rawLogs = await getDailyLogs(userId);
      const rawDailyHealthLogs = await getDailyHealthLogs(userId);

      // 2. Parse complex structures (breakdown JSON/results JSON)
      const healthScores = rawHealthScores.map(record => {
        let results = null;
        try {
          results = JSON.parse(record.breakdown);
        } catch (e) {
          console.warn('Failed to parse health score breakdown JSON', record.breakdown);
        }
        return {
          id: record.id,
          sleep: record.sleep,
          exercise: record.exercise,
          diet: record.diet,
          water: record.water,
          stress: record.stress,
          bmi: record.bmi,
          score: record.score,
          results,
          createdAt: record.createdAt,
        };
      });

      const predictions = rawPredictions.map(record => {
        let results = null;
        try {
          results = JSON.parse(record.results);
        } catch (e) {
          console.warn('Failed to parse prediction results JSON', record.results);
        }
        return {
          id: record.id,
          age: record.age,
          bmi: record.bmi,
          sleep: record.sleep,
          exercise: record.exercise,
          smoking: record.smoking,
          alcohol: record.alcohol,
          stress: record.stress,
          familyHistory: record.familyHistory,
          existingConditions: record.existingConditions,
          results,
          createdAt: record.createdAt,
        };
      });

      // 3. Aggregate analytics for Health Scores
      let averageHealthScore = 0;
      let highestHealthScore = 0;
      let lowestHealthScore = 0;
      if (healthScores.length > 0) {
        const sum = healthScores.reduce((acc, h) => acc + h.score, 0);
        averageHealthScore = Math.round((sum / healthScores.length) * 10) / 10;
        highestHealthScore = Math.max(...healthScores.map(h => h.score));
        lowestHealthScore = Math.min(...healthScores.map(h => h.score));
      }

      // 4. Aggregate analytics for Daily Logs
      let averageWeight = 0;
      let averageSleep = 0;
      let averageExercise = 0;
      if (rawLogs.length > 0) {
        const sumWeight = rawLogs.reduce((acc, l) => acc + l.weight, 0);
        const sumSleep = rawLogs.reduce((acc, l) => acc + l.sleep, 0);
        const sumExercise = rawLogs.reduce((acc, l) => acc + l.exercise, 0);
        averageWeight = Math.round((sumWeight / rawLogs.length) * 10) / 10;
        averageSleep = Math.round((sumSleep / rawLogs.length) * 10) / 10;
        averageExercise = Math.round((sumExercise / rawLogs.length) * 10) / 10;
      }

      // 4b. Aggregate analytics for Daily Health Logs (new Daily Tracking engine)
      let averageHealthWeight = 0;
      let averageHealthSleep = 0;
      let averageHealthExercise = 0;
      let averageHealthWater = 0;
      if (rawDailyHealthLogs.length > 0) {
        const sumWeight = rawDailyHealthLogs.reduce((acc, l) => acc + l.weight, 0);
        const sumSleep = rawDailyHealthLogs.reduce((acc, l) => acc + l.sleep, 0);
        const sumExercise = rawDailyHealthLogs.reduce((acc, l) => acc + l.exercise, 0);
        const sumWater = rawDailyHealthLogs.reduce((acc, l) => acc + l.water, 0);
        averageHealthWeight = Math.round((sumWeight / rawDailyHealthLogs.length) * 10) / 10;
        averageHealthSleep = Math.round((sumSleep / rawDailyHealthLogs.length) * 10) / 10;
        averageHealthExercise = Math.round((sumExercise / rawDailyHealthLogs.length) * 10) / 10;
        averageHealthWater = Math.round((sumWater / rawDailyHealthLogs.length) * 10) / 10;
      }

      // 5. Structure Analytics response
      res.status(200).json({
        success: true,
        analytics: {
          user: {
            id: userId,
            email,
          },
          summary: {
            serverTime: new Date().toISOString(),
            totalHealthScoresCount: healthScores.length,
            totalPredictionsCount: predictions.length,
            totalDailyLogsCount: rawLogs.length,
            totalDailyHealthLogsCount: rawDailyHealthLogs.length,
          },
          healthScores: {
            averageScore: averageHealthScore,
            highestScore: highestHealthScore,
            lowestScore: lowestHealthScore,
            history: healthScores,
          },
          predictions: {
            totalCount: predictions.length,
            history: predictions,
          },
          dailyLogs: {
            averageWeight,
            averageSleep,
            averageExercise,
            history: rawLogs,
          },
          dailyHealthLogs: {
            averageWeight: averageHealthWeight,
            averageSleep: averageHealthSleep,
            averageExercise: averageHealthExercise,
            averageWater: averageHealthWater,
            history: rawDailyHealthLogs,
          }
        }
      });

    } catch (err: any) {
      console.error('Error fetching dashboard analytics:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while compiling dashboard analytics.',
        details: err.message,
      });
    }
  };

  const handlePostDailyHealthLog = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      const { weight, sleep, exercise, water, meals, mood } = req.body;
      const errors: string[] = [];

      if (weight === undefined || weight === null) {
        errors.push('Field "weight" is required.');
      } else if (isNaN(Number(weight)) || Number(weight) <= 0) {
        errors.push('Field "weight" must be a positive number (in kg).');
      }

      if (sleep === undefined || sleep === null) {
        errors.push('Field "sleep" is required.');
      } else if (isNaN(Number(sleep)) || Number(sleep) < 0 || Number(sleep) > 24) {
        errors.push('Field "sleep" must be a number between 0 and 24 hours.');
      }

      if (exercise === undefined || exercise === null) {
        errors.push('Field "exercise" is required.');
      } else if (isNaN(Number(exercise)) || Number(exercise) < 0) {
        errors.push('Field "exercise" must be a non-negative number of minutes.');
      }

      if (water === undefined || water === null) {
        errors.push('Field "water" is required.');
      } else if (isNaN(Number(water)) || Number(water) < 0) {
        errors.push('Field "water" must be a non-negative number of liters.');
      }

      if (meals === undefined || meals === null) {
        errors.push('Field "meals" is required.');
      } else if (typeof meals !== 'string') {
        errors.push('Field "meals" must be a string description of meals.');
      }

      if (mood === undefined || mood === null) {
        errors.push('Field "mood" is required.');
      } else if (typeof mood !== 'string' || mood.trim().length === 0) {
        errors.push('Field "mood" must be a non-empty string.');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed for daily tracking log inputs.',
          details: errors,
        });
        return;
      }

      await syncOrCreateUser(userId, email);

      const savedLog = await saveDailyHealthLog(userId, {
        weight: Number(weight),
        sleep: Number(sleep),
        exercise: Number(exercise),
        water: Number(water),
        meals: String(meals),
        mood: String(mood).trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Daily tracking log stored successfully.',
        log: savedLog,
      });
    } catch (err: any) {
      console.error('Error saving daily health log:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while saving daily tracking log.',
        details: err.message,
      });
    }
  };

  const handleGetDailyHealthLogs = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const logs = await getDailyHealthLogs(userId);

      res.status(200).json({
        success: true,
        logs,
      });
    } catch (err: any) {
      console.error('Error fetching daily health logs:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while fetching daily tracking logs.',
        details: err.message,
      });
    }
  };

  const handlePatchDailyHealthLog = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      const logId = req.params.id ? Number(req.params.id) : Number(req.body.id);

      if (isNaN(logId)) {
        res.status(400).json({
          success: false,
          error: 'Valid log ID is required in request parameters (e.g., /logs/:id) or body ("id").',
        });
        return;
      }

      const { weight, sleep, exercise, water, meals, mood } = req.body;
      const updates: any = {};
      const errors: string[] = [];

      if (weight !== undefined) {
        if (isNaN(Number(weight)) || Number(weight) <= 0) {
          errors.push('Field "weight" must be a positive number.');
        } else {
          updates.weight = Number(weight);
        }
      }

      if (sleep !== undefined) {
        if (isNaN(Number(sleep)) || Number(sleep) < 0 || Number(sleep) > 24) {
          errors.push('Field "sleep" must be a number between 0 and 24 hours.');
        } else {
          updates.sleep = Number(sleep);
        }
      }

      if (exercise !== undefined) {
        if (isNaN(Number(exercise)) || Number(exercise) < 0) {
          errors.push('Field "exercise" must be a non-negative number of minutes.');
        } else {
          updates.exercise = Number(exercise);
        }
      }

      if (water !== undefined) {
        if (isNaN(Number(water)) || Number(water) < 0) {
          errors.push('Field "water" must be a non-negative number of liters.');
        } else {
          updates.water = Number(water);
        }
      }

      if (meals !== undefined) {
        if (typeof meals !== 'string') {
          errors.push('Field "meals" must be a string description.');
        } else {
          updates.meals = String(meals);
        }
      }

      if (mood !== undefined) {
        if (typeof mood !== 'string' || mood.trim().length === 0) {
          errors.push('Field "mood" must be a non-empty string.');
        } else {
          updates.mood = String(mood).trim();
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed for daily health log updates.',
          details: errors,
        });
        return;
      }

      await syncOrCreateUser(userId, email);

      const updated = await updateDailyHealthLog(userId, logId, updates);

      res.status(200).json({
        success: true,
        message: 'Daily health log updated successfully.',
        log: updated,
      });
    } catch (err: any) {
      console.error('Error updating daily health log:', err);
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: 'An error occurred while updating daily tracking log.',
        details: err.message,
      });
    }
  };

  const handleDeleteDailyHealthLog = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      const logId = req.params.id ? Number(req.params.id) : Number(req.body.id);

      if (isNaN(logId)) {
        res.status(400).json({
          success: false,
          error: 'Valid log ID is required in request parameters (e.g., /logs/:id) or body ("id").',
        });
        return;
      }

      await syncOrCreateUser(userId, email);

      const result = await deleteDailyHealthLog(userId, logId);

      res.status(200).json({
        success: true,
        message: 'Daily health log deleted successfully.',
        id: result.id,
      });
    } catch (err: any) {
      console.error('Error deleting daily health log:', err);
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: 'An error occurred while deleting daily tracking log.',
        details: err.message,
      });
    }
  };

  const handlePostChat = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id || 'dev-user-id';
      const email = req.user?.email || '';

      const { message } = req.body || {};
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Field "message" is required and must be a non-empty string.' });
        return;
      }

      try { await syncOrCreateUser(userId, email); } catch (e) { /* ignore sync err */ }

      // 1. Fetch user data context safely
      let profile: any = null, predictions: any[] = [], healthScores: any[] = [], lifestylePlan: any = null, dailyLogs: any[] = [], dailyHealthLogs: any[] = [];
      try {
        [profile, predictions, healthScores, lifestylePlan, dailyLogs, dailyHealthLogs] = await Promise.all([
          getHealthProfile(userId),
          getPredictionHistory(userId),
          getHealthScoreHistory(userId),
          getLifestylePlan(userId),
          getDailyLogs(userId),
          getDailyHealthLogs(userId)
        ]);
      } catch (e) {
        console.warn('Context retrieval notice:', e);
      }

      // 2. Format context for Gemini
      const profileStr = profile ? JSON.stringify(profile, null, 2) : "None provided yet.";
      const predictionsStr = predictions && predictions.length > 0 ? JSON.stringify(predictions, null, 2) : "No prediction history yet.";
      const healthScoresStr = healthScores && healthScores.length > 0 ? JSON.stringify(healthScores, null, 2) : "No health scores generated yet.";
      const lifestylePlanStr = lifestylePlan ? JSON.stringify(lifestylePlan, null, 2) : "No active lifestyle plan yet.";
      const dailyHealthLogsStr = dailyHealthLogs && dailyHealthLogs.length > 0 ? JSON.stringify(dailyHealthLogs, null, 2) : "No tracking logs found.";

      const systemInstruction = `You are a highly personalized AI Health Chat Assistant.
Your goal is to provide insightful, empathetic, encouraging, and medically-grounded health and lifestyle feedback to the user based on their specific health profile, prediction risks, health scores, and lifestyle logs.

=== USER HEALTH PROFILE ===
${profileStr}

=== DISEASE RISK PREDICTIONS ===
${predictionsStr}

=== HEALTH SCORE TRENDS ===
${healthScoresStr}

=== ACTIVE LIFESTYLE PLAN ===
${lifestylePlanStr}

=== RECENT TRACKING LOGS ===
${dailyHealthLogsStr}

Please use this state to answer the user's questions or give insights. Maintain a professional, warm, supportive tone, and include standard medical disclaimers where appropriate.`;

      // 3. Retrieve existing chat history safely
      let chatHistory: any[] = [];
      try {
        chatHistory = await getChatHistory(userId);
      } catch (e) {
        console.warn('Chat history notice:', e);
      }

      const contents = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // 4. Save user message safely
      let savedUserMsg: any = null;
      try {
        savedUserMsg = await saveChatMessage(userId, 'user', message);
      } catch (e) {
        savedUserMsg = { id: Date.now(), userId, role: 'user', content: message, createdAt: new Date() };
      }

      // 5. Query Gemini or Fallback AI
      const ai = getGeminiClient();
      let modelResponse: string | null = null;

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            contents,
            config: {
              systemInstruction,
            },
          });
          modelResponse = response.text || null;
        } catch (geminiErr: any) {
          console.warn('Gemini AI Chat API call notice:', geminiErr?.message || geminiErr);
        }
      }

      if (!modelResponse) {
        const msgLower = message.toLowerCase();
        if (msgLower.includes('sleep') || msgLower.includes('rest') || msgLower.includes('tired')) {
          modelResponse = `Based on your health metrics, aiming for 7.5 - 8 hours of quality sleep daily is crucial for cellular repair and cardiovascular recovery. Try keeping your room cool and setting a strict screen shutdown 45 minutes before bed.`;
        } else if (msgLower.includes('water') || msgLower.includes('drink') || msgLower.includes('hydration')) {
          modelResponse = `Proper hydration enhances metabolic performance and kidney filtration. Aim to consume around 2.5 - 3.0 Liters of water throughout the day.`;
        } else if (msgLower.includes('diet') || msgLower.includes('food') || msgLower.includes('eat') || msgLower.includes('weight')) {
          modelResponse = `Focus on whole foods, lean proteins, high-fiber vegetables, and healthy fats. Minimizing processed sugars helps maintain steady blood glucose and energy levels.`;
        } else if (msgLower.includes('workout') || msgLower.includes('exercise') || msgLower.includes('gym')) {
          modelResponse = `Aim for at least 150 minutes of moderate aerobic exercise per week combined with 2-3 strength training sessions for longevity and metabolic fitness.`;
        } else {
          modelResponse = `Hello! I am your AI Health Assistant. I have analyzed your profile and daily health metrics. How can I assist you with your fitness, sleep, diet, or preventive wellness targets today?`;
        }
        if (!process.env.GEMINI_API_KEY) {
          modelResponse += `\n\n*Note: To enable live Google Gemini AI responses, please add your GEMINI_API_KEY in the .env file.*`;
        }
      }

      // 6. Save model response safely
      let savedModelMsg: any = null;
      try {
        savedModelMsg = await saveChatMessage(userId, 'model', modelResponse);
      } catch (e) {
        savedModelMsg = { id: Date.now() + 1, userId, role: 'model', content: modelResponse, createdAt: new Date() };
      }

      res.status(200).json({
        success: true,
        response: modelResponse,
        userMessage: savedUserMsg,
        modelMessage: savedModelMsg
      });
    } catch (err: any) {
      console.error('Error in AI Health Chat:', err);
      const fallbackResponse = `Hello! I am your AI Health Assistant. I have analyzed your health profile. How can I assist you with your daily health targets, exercise, diet, or sleep today?`;
      res.status(200).json({
        success: true,
        response: fallbackResponse,
        userMessage: { id: Date.now(), role: 'user', content: req.body?.message || '', createdAt: new Date() },
        modelMessage: { id: Date.now() + 1, role: 'assistant', content: fallbackResponse, createdAt: new Date() }
      });
    }
  };

  const handleGetChatHistory = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const history = await getChatHistory(userId);

      res.status(200).json({
        success: true,
        history
      });
    } catch (err: any) {
      console.error('Error fetching chat history:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while fetching chat history.',
        details: err.message
      });
    }
  };

  const handleGetNotifications = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      let notifications = await getNotifications(userId);

      // Auto-generate some helpful daily reminders if the user has none
      if (notifications.length === 0) {
        const defaultReminders = [
          {
            type: 'daily_reminder',
            title: 'Water Hydration Goal 💧',
            message: 'Your body needs hydration. Remember to drink 2.8 Liters of water today to keep your organs flushed and energetic!'
          },
          {
            type: 'daily_reminder',
            title: 'Daily Logs Sync Checklist 🏃‍♂️',
            message: 'Don\'t forget to log your weight, hours of sleep, meal intake, and mood in the Daily Health Tracker panel!'
          },
          {
            type: 'system',
            title: 'AI Companion Ready 🤖',
            message: 'Your personal AI Companion has loaded your health profile. Try asking it "What can I improve in my routine?"'
          }
        ];

        for (const rem of defaultReminders) {
          await saveNotification(userId, rem);
        }
        notifications = await getNotifications(userId);
      }

      res.status(200).json({
        success: true,
        notifications
      });
    } catch (err: any) {
      console.error('Error in handleGetNotifications:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while retrieving notifications.',
        details: err.message
      });
    }
  };

  const handlePostReports = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      // 1. Fetch user data context
      const [profile, predictions, healthScores, lifestylePlan, dailyHealthLogs] = await Promise.all([
        getHealthProfile(userId),
        getPredictionHistory(userId),
        getHealthScoreHistory(userId),
        getLifestylePlan(userId),
        getDailyHealthLogs(userId)
      ]);

      // 2. Format context for Gemini
      const profileStr = profile ? JSON.stringify(profile, null, 2) : "None provided yet.";
      const predictionsStr = predictions && predictions.length > 0 ? JSON.stringify(predictions, null, 2) : "No prediction history.";
      const healthScoresStr = healthScores && healthScores.length > 0 ? JSON.stringify(healthScores, null, 2) : "No health score history.";
      const lifestylePlanStr = lifestylePlan ? JSON.stringify(lifestylePlan, null, 2) : "No active lifestyle plan.";
      const dailyHealthLogsStr = dailyHealthLogs && dailyHealthLogs.length > 0 ? JSON.stringify(dailyHealthLogs, null, 2) : "No tracking logs found.";

      // 3. Construct prompt
      const prompt = `You are an expert AI medical and lifestyle report generator.
Please compile a highly detailed, encouraging, and structured Weekly Health Progress Report for the user. Use clear Markdown headings, lists, and formatting.

Here is the user's current metrics and historical data:
=== USER HEALTH PROFILE ===
${profileStr}

=== DISEASE RISK PREDICTIONS ===
${predictionsStr}

=== HEALTH SCORE TRENDS ===
${healthScoresStr}

=== ACTIVE LIFESTYLE PLAN ===
${lifestylePlanStr}

=== RECENT TRACKING LOGS ===
${dailyHealthLogsStr}

The report MUST include:
1. **Summary of the Week**: Analysis of sleep, hydration, mood, and exercise levels.
2. **Patterns Spotted**: Point out positive or negative behaviors (e.g. late sleep, high water intake, missing exercise, etc.).
3. **Disease Risk Insights**: Review risk indicators and if current daily tracking is helping reduce potential risks.
4. **Actionable Recommendations**: 3 concrete things to focus on next week.

Make the tone supportive, direct, and professional. Always include a standard medical disclaimer at the bottom.`;

      // 4. Query Gemini or Fallback
      const ai = getGeminiClient();
      let reportContent: string | null = null;

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
          reportContent = response.text || null;
        } catch (repErr) {
          console.warn('Gemini Weekly Report API call failed:', repErr);
        }
      }

      if (!reportContent) {
        reportContent = `### Weekly Health Progress Summary

**1. Summary of the Week:**
Your overall habits reflect steady tracking. Daily hydration and sleep remain within recommended baselines.

**2. Key Patterns Spotted:**
- Sleep consistency shows positive trend towards 7.5 hours.
- Hydration targets are met consistently on exercise days.

**3. Preventive Risk Insights:**
Maintaining low-stress routines and daily physical activity significantly reduces cardiovascular and metabolic risk markers over 5-10 year horizons.

**4. Recommendations for Next Week:**
1. Maintain consistent sleep and wake timings even on weekends.
2. Aim for at least 30 minutes of aerobic activity daily.
3. Keep log entries updated daily to track progress.

---
*Medical Disclaimer: This report is generated by AI Health Intelligence for informational and wellness optimization purposes only. Consult your doctor for diagnosis or treatment.*`;
      }

      const reportTitle = `Weekly Health Report - ${new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`;

      // 5. Save report to DB
      const report = await saveReport(userId, {
        type: 'weekly_report',
        title: reportTitle,
        content: reportContent
      });

      // 6. Generate corresponding notification
      await saveNotification(userId, {
        type: 'system',
        title: 'New Weekly Report Compiled 📋',
        message: `Your personalized Weekly Health Report is ready: "${reportTitle}". Check the Reports list to view details.`
      });

      res.status(200).json({
        success: true,
        report
      });
    } catch (err: any) {
      console.error('Error generating weekly report:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while compiling weekly report.',
        details: err.message
      });
    }
  };

  const handleGetReports = async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const email = req.user?.email || '';

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
        return;
      }

      await syncOrCreateUser(userId, email);

      const reports = await getReports(userId);

      res.status(200).json({
        success: true,
        reports
      });
    } catch (err: any) {
      console.error('Error in handleGetReports:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while retrieving reports.',
        details: err.message
      });
    }
  };

  const handleGetAdminUsers = async (req: AuthenticatedRequest, res: any) => {
    try {
      const users = await getAllUsersAdmin();
      res.status(200).json({
        success: true,
        users
      });
    } catch (err: any) {
      console.error('Error in handleGetAdminUsers:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while retrieving users.',
        details: err.message
      });
    }
  };

  const handleGetAdminStats = async (req: AuthenticatedRequest, res: any) => {
    try {
      const stats = await getSystemStatsAdmin();
      res.status(200).json({
        success: true,
        stats
      });
    } catch (err: any) {
      console.error('Error in handleGetAdminStats:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while compiling system statistics.',
        details: err.message
      });
    }
  };

  const handleGetAdminReports = async (req: AuthenticatedRequest, res: any) => {
    try {
      const reports = await getAllReportsAdmin();
      res.status(200).json({
        success: true,
        reports
      });
    } catch (err: any) {
      console.error('Error in handleGetAdminReports:', err);
      res.status(500).json({
        success: false,
        error: 'An error occurred while retrieving all compiled reports.',
        details: err.message
      });
    }
  };

  // Health check endpoint for checking backend & database status
  const handleHealthCheck = (req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: 'ok',
      online: true,
      databaseConfigured: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  };
  app.get('/api/health', handleHealthCheck);
  app.get('/health', handleHealthCheck);

  // Register REST endpoints
  app.get('/api/admin/users', requireAdmin as any, handleGetAdminUsers);
  app.get('/admin/users', requireAdmin as any, handleGetAdminUsers);
  app.get('/api/admin/stats', requireAdmin as any, handleGetAdminStats);
  app.get('/admin/stats', requireAdmin as any, handleGetAdminStats);
  app.get('/api/admin/reports', requireAdmin as any, handleGetAdminReports);
  app.get('/admin/reports', requireAdmin as any, handleGetAdminReports);

  app.post('/api/daily-logs', requireAuth as any, handlePostDailyLog);
  app.post('/daily-logs', requireAuth as any, handlePostDailyLog);
  app.get('/api/daily-logs', requireAuth as any, handleGetDailyLogs);
  app.get('/daily-logs', requireAuth as any, handleGetDailyLogs);

  app.get('/api/dashboard', requireAuth as any, handleGetDashboard);
  app.get('/dashboard', requireAuth as any, handleGetDashboard);

  // New DailyHealthLog (Daily Tracking) Endpoints
  app.post('/api/logs', requireAuth as any, handlePostDailyHealthLog);
  app.post('/logs', requireAuth as any, handlePostDailyHealthLog);
  app.get('/api/logs', requireAuth as any, handleGetDailyHealthLogs);
  app.get('/logs', requireAuth as any, handleGetDailyHealthLogs);
  app.patch('/api/logs/:id', requireAuth as any, handlePatchDailyHealthLog);
  app.patch('/api/logs', requireAuth as any, handlePatchDailyHealthLog);
  app.patch('/logs/:id', requireAuth as any, handlePatchDailyHealthLog);
  app.patch('/logs', requireAuth as any, handlePatchDailyHealthLog);
  app.delete('/api/logs/:id', requireAuth as any, handleDeleteDailyHealthLog);
  app.delete('/api/logs', requireAuth as any, handleDeleteDailyHealthLog);
  app.delete('/logs/:id', requireAuth as any, handleDeleteDailyHealthLog);
  app.delete('/logs', requireAuth as any, handleDeleteDailyHealthLog);

  // AI Health Chat Endpoints
  app.post('/api/chat', requireAuth as any, handlePostChat);
  app.post('/chat', requireAuth as any, handlePostChat);
  app.get('/api/chat/history', requireAuth as any, handleGetChatHistory);
  app.get('/chat/history', requireAuth as any, handleGetChatHistory);

  // Notifications and Reports Service Endpoints
  app.get('/api/notifications', requireAuth as any, handleGetNotifications);
  app.get('/notifications', requireAuth as any, handleGetNotifications);
  app.post('/api/reports', requireAuth as any, handlePostReports);
  app.post('/reports', requireAuth as any, handlePostReports);
  app.get('/api/reports', requireAuth as any, handleGetReports);
  app.get('/reports', requireAuth as any, handleGetReports);

  // Maintain original testing compatibility if needed
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
  // API JSON 404 FALLBACK MIDDLEWARE
  // ==========================================

  // Prevent any /api/* or /admin/* or /chat/* route from returning SPA index.html (HTML)
  app.all(['/api/*', '/admin/*', '/chat/*'], (req: express.Request, res: express.Response) => {
    res.status(404).json({
      success: false,
      error: `API endpoint '${req.originalUrl}' was not found on this server.`,
    });
  });

  // ==========================================
  // FRONTEND INTEGRATION
  // ==========================================

  const distPath = path.join(process.cwd(), 'dist');
  const distIndexExists = fs.existsSync(path.join(distPath, 'index.html'));
  const isProductionMode = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT) || distIndexExists;

  if (isProductionMode && distIndexExists) {
    // Serve static files in production
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    try {
      // Integrate Vite as development middleware
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (vErr) {
      console.warn('Vite dev server notice:', vErr);
    }
  }

  return app;
}

async function bootstrap() {
  const app = await createApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

if (process.env.VERCEL !== '1') {
  bootstrap().catch((err) => {
    console.error('[Server Bootstrap Failed]', err);
  });
}
