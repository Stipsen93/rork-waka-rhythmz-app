import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';


const env = process.env as Record<string, string | undefined>;

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://afeslrqjcpuhhqivyhuz.supabase.co';
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZXNscnFqY3B1aGhxaXZ5aHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTI5NDUsImV4cCI6MjA3ODIyODk0NX0.dNAKNl7pKn9VzOg55NVq22ONbNz-3mTDIcCrUPnccgg';

export const supabase = createClient<any>(
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


