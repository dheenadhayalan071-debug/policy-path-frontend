import { createClient } from '@supabase/supabase-js';

// Vite exposes only explicitly prefixed client-side environment variables.
// Keep the current public project settings as fallbacks for existing deployments.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ilrwioxxrdzbmtpbxxjg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlscndpb3h4cmR6Ym10cGJ4eGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTk4ODUsImV4cCI6MjA4NTg3NTg4NX0.sHhGEfUGQC2';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Persist sessions across reloads, refresh tokens automatically, and handle OAuth redirects.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
