import { createClient } from "@supabase/supabase-js";

const fallbackUrl = "https://afeslrqjcpuhhqivyhuz.supabase.co";
const fallbackServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZXNscnFqY3B1aGhxaXZ5aHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY1Mjk0NSwiZXhwIjoyMDc4MjI4OTQ1fQ.G-GPEN7bnDyk_PGdOgiljoTNvjj05lzDg3WNoZJ-EiE";

const env = process.env as Record<string, string | undefined>;

const supabaseUrl = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL ?? fallbackUrl;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? fallbackServiceRoleKey;

export const supabaseAdmin = createClient<any>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
