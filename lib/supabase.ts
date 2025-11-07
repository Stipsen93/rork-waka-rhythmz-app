import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://heeinbtgcgobkonojypj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZWluYnRnY2dvYmtvbm9qeXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjQ1OTMsImV4cCI6MjA3MDQ0MDU5M30.J4gbx4Yz0YFfdWImht4NHSHLFWP7VcW712tAzbfDdaA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
