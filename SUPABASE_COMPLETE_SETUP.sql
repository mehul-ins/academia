-- Complete Supabase Setup for Academia Platform
-- Run this entire SQL in your Supabase SQL Editor

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update verification" ON public.profiles;
DROP POLICY IF EXISTS "Public can view verified institutions" ON public.profiles;

-- Temporarily disable RLS for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create the profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'institution' check (role in ('admin', 'institution')),
  institution_name text,
  institute_id text unique,
  registration_number text,
  established_year integer,
  address text,
  contact_phone text,
  website text,
  accreditation text,
  university text,
  verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  verified_at timestamp with time zone,
  verified_by uuid references auth.users,
  rejection_reason text,
  documents jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid default gen_random_uuid() primary key,
  certificate_id text unique not null,
  student_name text not null,
  institution text not null,
  course_name text,
  grade text,
  issue_date date not null,
  expiry_date date,
  status text default 'active' check (status in ('active', 'expired', 'revoked')),
  blacklisted boolean default false,
  blacklist_reason text,
  blockchain_hash text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create logs table for verification tracking
CREATE TABLE IF NOT EXISTS public.logs (
  id uuid default gen_random_uuid() primary key,
  certificate_id text,
  result text not null check (result in ('verified', 'failed', 'blacklisted', 'unblacklisted')),
  reasons jsonb default '[]'::jsonb,
  ocr_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_institute_id_idx ON public.profiles(institute_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_verification_status_idx ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS certificates_certificate_id_idx ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS certificates_institution_idx ON public.certificates(institution);
CREATE INDEX IF NOT EXISTS certificates_status_idx ON public.certificates(status);
CREATE INDEX IF NOT EXISTS certificates_blacklisted_idx ON public.certificates(blacklisted);
CREATE INDEX IF NOT EXISTS logs_certificate_id_idx ON public.logs(certificate_id);
CREATE INDEX IF NOT EXISTS logs_result_idx ON public.logs(result);
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON public.logs(created_at);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'institution');
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    new.updated_at = now();
    RETURN new;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert admin user directly (bypassing RLS)
INSERT INTO public.profiles (id, email, role, institution_name, verification_status)
VALUES ('50a1d256-6920-4f1c-b446-4e44a08a4ec2', 'admin@academia.com', 'admin', 'Academia Admin', 'verified')
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    verification_status = 'verified',
    institution_name = 'Academia Admin';

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update verification" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view verified institutions" ON public.profiles
  FOR SELECT USING (verification_status = 'verified' AND role = 'institution');

-- Create policies for certificates table
CREATE POLICY "Public can view active certificates" ON public.certificates
  FOR SELECT USING (status = 'active' AND blacklisted = false);

CREATE POLICY "Authenticated users can view certificates" ON public.certificates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for logs table
CREATE POLICY "Public can view logs" ON public.logs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert logs" ON public.logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage logs" ON public.logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.certificates TO anon, authenticated;
GRANT ALL ON public.logs TO anon, authenticated;

-- Add some sample data for testing
INSERT INTO public.certificates (certificate_id, student_name, institution, course_name, grade, issue_date, status)
VALUES 
  ('TEST123', 'John Doe', 'Test University', 'Computer Science', 'A+', '2024-01-15', 'active'),
  ('CERT2025001', 'Jane Smith', 'Demo College', 'Data Science', 'A', '2024-01-20', 'active')
ON CONFLICT (certificate_id) DO NOTHING;

INSERT INTO public.logs (certificate_id, result, reasons, created_at)
VALUES 
  ('TEST123', 'verified', '["Certificate verified successfully"]', now()),
  ('CERT2025001', 'verified', '["Certificate verified successfully"]', now())
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Setup completed successfully!' as status;
SELECT 'Profiles table:' as table_name, count(*) as count FROM public.profiles;
SELECT 'Certificates table:' as table_name, count(*) as count FROM public.certificates;
SELECT 'Logs table:' as table_name, count(*) as count FROM public.logs;
