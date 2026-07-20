import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns a lazily-initialized Supabase client instance.
 * Throws a clear error if environment variables are not configured,
 * preventing startup crashes unless an authenticated action is actually requested.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-supabase-anon-key')) {
    throw new Error(
      'Supabase credentials are not fully configured. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your environment.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server environment: stateless JWT verification
      autoRefreshToken: false,
    },
  });

  return supabaseInstance;
}
