import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use environment variables from .env.example if not configured
const defaultUrl = 'https://ftdfgpthawrcmcfjnwtw.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0ZGZncHRoYXdyY21jZmpud3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTQ0NjcsImV4cCI6MjA3NDQ3MDQ2N30.DqHTBJOuJOC6kPZwn_Tf_VukCwrF8LmyqQieXGNiYmg';

const finalUrl = supabaseUrl || defaultUrl;
const finalKey = supabaseAnonKey || defaultKey;

if (!finalUrl || !finalKey) {
  console.warn('⚠️ Supabase environment variables not configured properly');
}

// Log connection details for debugging
console.log('🔧 Supabase Configuration:', {
  url: finalUrl,
  hasKey: !!finalKey,
  keyLength: finalKey?.length || 0
});

export const supabase = createClient(finalUrl, finalKey);
