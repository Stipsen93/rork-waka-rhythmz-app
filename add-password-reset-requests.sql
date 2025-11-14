-- Create password_reset_requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  requested_username TEXT NOT NULL,
  device_last_login TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Allow all users to create reset requests
CREATE POLICY "Anyone can create password reset requests"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow all users to read reset requests
CREATE POLICY "Anyone can read password reset requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (true);

-- Allow all users to delete reset requests
CREATE POLICY "Anyone can delete password reset requests"
  ON public.password_reset_requests
  FOR DELETE
  USING (true);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id 
  ON public.password_reset_requests(user_id);
