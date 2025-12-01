import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

const supabaseUrl = 'https://afeslrqjcpuhhqivyhuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZXNscnFqY3B1aGhxaXZ5aHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTI5NDUsImV4cCI6MjA3ODIyODk0NX0.dNAKNl7pKn9VzOg55NVq22ONbNz-3mTDIcCrUPnccgg';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZXNscnFqY3B1aGhxaXZ5aHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY1Mjk0NSwiZXhwIjoyMDc4MjI4OTQ1fQ.G-GPEN7bnDyk_PGdOgiljoTNvjj05lzDg3WNoZJ-EiE';

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
