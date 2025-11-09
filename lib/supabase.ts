import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://afeslrqjcpuhhqivyhuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZXNscnFqY3B1aGhxaXZ5aHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTI5NDUsImV4cCI6MjA3ODIyODk0NX0.dNAKNl7pKn9VzOg55NVq22ONbNz-3mTDIcCrUPnccgg';

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey);
