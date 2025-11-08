-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  password_changed_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create library categories table
CREATE TABLE library_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES library_categories(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create media items table
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES library_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'image', 'text')),
  title TEXT NOT NULL,
  uri TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create media comments table
CREATE TABLE media_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  media_uri TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'image', 'audio')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment members junction table
CREATE TABLE assignment_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- Create assignment submissions table
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trainings table
CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cancelled practices table
CREATE TABLE cancelled_practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Feestje', 'Verrassingsfeest', 'Huwelijk', 'Verjaardag', 'Overig')),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointment members junction table
CREATE TABLE appointment_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id, user_id)
);

-- Create notification settings table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  news_enabled BOOLEAN DEFAULT TRUE,
  news_hours_advance INTEGER DEFAULT 24,
  assignments_enabled BOOLEAN DEFAULT TRUE,
  training_cancellation_enabled BOOLEAN DEFAULT TRUE,
  training_hours_advance INTEGER DEFAULT 2,
  performances_enabled BOOLEAN DEFAULT TRUE,
  performances_hours_advance INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancelled_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies (all authenticated users can read, admin can write)
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Library policies (authenticated users can read, admins can write)
CREATE POLICY "Users can view library categories" ON library_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view media items" ON media_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view media comments" ON media_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create media comments" ON media_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Assignments policies
CREATE POLICY "Users can view assignments" ON assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view assignment members" ON assignment_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view assignment submissions" ON assignment_submissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own submissions" ON assignment_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Training policies
CREATE POLICY "Users can view trainings" ON trainings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view cancelled practices" ON cancelled_practices FOR SELECT USING (auth.uid() IS NOT NULL);

-- Announcements policies
CREATE POLICY "Users can view announcements" ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);

-- Appointments policies
CREATE POLICY "Users can view appointments" ON appointments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view appointment members" ON appointment_members FOR SELECT USING (auth.uid() IS NOT NULL);

-- Notification settings policies
CREATE POLICY "Users can view own notification settings" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification settings" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_library_categories_updated_at BEFORE UPDATE ON library_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_items_updated_at BEFORE UPDATE ON media_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (will need to create auth user separately)
-- The password will be stored in Supabase Auth, not in this table
INSERT INTO profiles (id, email, role, password_changed_by_user) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@wakarythmz.com', 'admin', true);

-- Insert example trainings
INSERT INTO trainings (name, day_of_week, time, location) VALUES
  ('Groep 1', 2, '18:30', 'De Zaalon'),
  ('Groep 2', 2, '19:30', 'De Zaalon');

-- Insert example appointment
INSERT INTO appointments (name, category, date, time, location, created_by) VALUES
  ('Optreden FC Eindhoven', 'Feestje', '2025-12-20', '21:30', 'FC Eindhoven', '00000000-0000-0000-0000-000000000001');

-- Insert example library categories
INSERT INTO library_categories (id, name, description) VALUES
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Beats', 'Beat library'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Rudiments', 'Rudiment library');

INSERT INTO library_categories (id, name, parent_id, description) VALUES
  ('c1a1c1a1-c1a1-c1a1-c1a1-c1a1c1a1c1a1', 'Afro', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Afro grooves'),
  ('c1d1c1d1-c1d1-c1d1-c1d1-c1d1c1d1c1d1', 'Dancehall', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', NULL);

-- Insert example media items
INSERT INTO media_items (category_id, type, title, uri, notes) VALUES
  ('c1a1c1a1-c1a1-c1a1-c1a1-c1a1c1a1c1a1', 'video', 'Groove A - Intro', 'https://cdn.coverr.co/videos/coverr-drums-1450/1080p.mp4', 'Focus op rechterhand accent.'),
  ('c1a1c1a1-c1a1-c1a1-c1a1-c1a1c1a1c1a1', 'image', 'Stick Grip', 'https://images.unsplash.com/photo-1518131678677-a90f9f3a5e83?q=80&w=1600&auto=format&fit=crop', NULL),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'video', 'Groove A - Intro', 'https://cdn.coverr.co/videos/coverr-drums-1450/1080p.mp4', 'Focus op rechterhand accent.');
