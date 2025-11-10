-- Supabase Migration Script
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  password_changed_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create library table
CREATE TABLE IF NOT EXISTS library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  children_ids TEXT[],
  media JSONB,
  description TEXT,
  tagged_user_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (parent_id) REFERENCES library(id) ON DELETE CASCADE
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_user_ids TEXT[],
  due_date TIMESTAMPTZ,
  media_uri TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'image', 'audio')),
  require_media BOOLEAN DEFAULT FALSE,
  completed_by JSONB DEFAULT '[]'::JSONB,
  submissions JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trainings table
CREATE TABLE IF NOT EXISTS trainings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice_schedule table
CREATE TABLE IF NOT EXISTS practice_schedule (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  regular_days JSONB DEFAULT '[]'::JSONB,
  location TEXT NOT NULL,
  cancelled_dates JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Feestje', 'Verrassingsfeest', 'Huwelijk', 'Verjaardag', 'Overig')),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  member_ids TEXT[],
  created_by TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  news_enabled BOOLEAN DEFAULT TRUE,
  news_hours_advance INTEGER DEFAULT 24,
  assignments_enabled BOOLEAN DEFAULT TRUE,
  training_cancellation_enabled BOOLEAN DEFAULT TRUE,
  training_hours_advance INTEGER DEFAULT 2,
  performances_enabled BOOLEAN DEFAULT TRUE,
  performances_hours_advance INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_library_parent_id ON library(parent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_users ON assignments USING GIN (assigned_user_ids);
CREATE INDEX IF NOT EXISTS idx_trainings_day ON trainings(day_of_week);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);

-- Enable Row Level Security (RLS) - but policies disabled for now since you don't use auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE library ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since you're not using Supabase auth)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON library FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON trainings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON practice_schedule FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON notification_settings FOR ALL USING (true) WITH CHECK (true);
