import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Auth and cloud persistence are disabled. Copy .env.example to .env and fill in your credentials.',
  );
}

// Create client only when configured; otherwise export a dummy that will never be called
// (all consumers guard on `supabaseConfigured` first)
export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Use cookie-based storage to avoid navigator.locks AbortError on Vercel
        flowType: 'pkce',
      },
    })
  : (null as unknown as SupabaseClient);
