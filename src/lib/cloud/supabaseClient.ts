/**
 * Supabase Client Configuration
 * Backend for cloud sync with email/password authentication
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database schema types
export interface CloudRecord {
  id: string;
  user_id: string;
  encrypted_data: string;
  last_synced: string;
  created_at: string;
  updated_at: string;
}
