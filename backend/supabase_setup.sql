-- Create profiles table for Supabase Auth integration
-- Run this SQL in your Supabase SQL Editor

-- Create the profiles table
create table if not exists public.profiles (
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

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies for profiles table
-- Users can read their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Users can update their own profile (except verification fields)
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update verification status
create policy "Admins can update verification" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'institution');
  return new;
end;
$$;

-- Create trigger to automatically create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes for better performance
create index if not exists profiles_institute_id_idx on public.profiles(institute_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_verification_status_idx on public.profiles(verification_status);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Create trigger to update updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
    before update on public.profiles
    for each row
    execute procedure update_updated_at_column();

-- Insert admin user (replace with your actual admin email)
-- Note: You'll need to create the auth user first through Supabase Auth
-- Then run this insert with the actual admin user ID
-- insert into public.profiles (id, email, role, verification_status)
-- values ('your-admin-user-uuid', 'admin@academia.com', 'admin', 'verified');

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;

-- Allow public read access to verified institutions
create policy "Public can view verified institutions" on public.profiles
  for select using (verification_status = 'verified' and role = 'institution');