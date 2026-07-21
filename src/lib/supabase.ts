import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns a lazily-initialized Supabase client instance.
 * Throws a clear error if environment variables are not configured,
 * preventing startup crashes unless an authenticated action is actually requested.
 */
function getEnvVar(name: string, viteName: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return undefined;
}

export function isSupabaseConfigured(): boolean {
  const supabaseUrl = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabaseUrl = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL')!;
  const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')!;

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server environment: stateless JWT verification
      autoRefreshToken: false,
    },
  });

  return supabaseInstance;
}
