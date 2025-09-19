# 🚀 Supabase Setup Guide for Academia Certificate Verification Platform

This guide will help teammates set up the complete Supabase integration for the Academia platform. The project has been migrated from a local database to Supabase PostgreSQL with authentication.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Authentication Setup](#authentication-setup)
6. [Testing the Setup](#testing-the-setup)
7. [Troubleshooting](#troubleshooting)
8. [Current System Status](#current-system-status)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Supabase account (free tier is sufficient)

## 🏗️ Supabase Project Setup

### Step 1: Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Set project details:
   - **Name**: `academia-certificates` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project initialization (2-3 minutes)

### Step 2: Get Your Project Credentials
Once your project is ready:
1. Go to **Settings** → **API**
2. Copy these values (you'll need them for environment variables):
   - **Project URL** (something like `https://your-project.supabase.co`)
   - **API Key (anon public)** (starts with `eyJhbGci...`)
   - **API Key (service_role)** (starts with `eyJhbGci...`) - Keep this secret!

### Step 3: Get Database Connection Details
Go to **Settings** → **Database** and note:
- **Host**: `db.your-project.supabase.co`
- **Database name**: `postgres`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: The password you set during project creation

## 🗄️ Database Configuration

### Step 1: Create Required Tables
1. Go to **SQL Editor** in your Supabase dashboard
2. Run the following SQL to create the profiles table:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    full_name TEXT,
    institute_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) - IMPORTANT!
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
```

### Step 2: Create Demo Admin Account
Run this SQL to create the demo admin account:

```sql
-- Insert demo admin (this bypasses normal auth flow for testing)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
) VALUES (
    gen_random_uuid(),
    'admin@academia.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Insert corresponding profile
INSERT INTO public.profiles (id, email, role, full_name, institute_name)
SELECT id, email, 'admin', 'Demo Admin', 'Academia Platform'
FROM auth.users WHERE email = 'admin@academia.com'
ON CONFLICT (email) DO NOTHING;
```

## 🔐 Environment Variables

### Backend Environment (.env)
Create or update `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Configuration (for direct connections if needed)
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5002
NODE_ENV=development

# API Keys (if you have them)
OPENAI_API_KEY=your-openai-key-if-available
BLOCKCHAIN_RPC_URL=your-blockchain-rpc-if-available
```

### Frontend Environment (.env)
Create or update `frontend/.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_BASE_URL=http://localhost:5002
VITE_PUBLIC_VERIFICATION_URL=http://localhost:5002/api/verify
```

## 🔧 Authentication Setup

### Step 1: Configure Auth Settings
1. Go to **Authentication** → **Settings** in Supabase dashboard
2. Under **Site URL**, add: `http://localhost:5173` (for development)
3. Under **Redirect URLs**, add:
   - `http://localhost:5173`
   - `http://localhost:5173/dashboard`
   - `http://localhost:5173/login`

### Step 2: Enable Auth Providers (Optional)
For this project, email/password is sufficient, but you can enable:
- Google OAuth
- GitHub OAuth
- Other providers as needed

## 🚀 Testing the Setup

### Step 1: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Start the Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Step 3: Test Demo Admin Login
1. Go to `http://localhost:5173`
2. Click "Login"
3. Use credentials:
   - **Email**: `admin@academia.com`
   - **Password**: `admin123`
4. You should be redirected to the admin dashboard

### Step 4: Test Certificate Verification
1. Go to `http://localhost:5173` (no login required)
2. Upload any image file
3. Enter any certificate ID (e.g., "CERT123")
4. Click "Verify Certificate"
5. You should see mock verification results

## 🔍 Troubleshooting

### Common Issues

#### 1. "Invalid API Key" Error
- Double-check your Supabase URL and API keys
- Ensure no extra spaces in environment variables
- Verify the keys are from the correct project

#### 2. Database Connection Failed
- Check your database password
- Verify the database host URL
- Ensure your IP is whitelisted (Supabase allows all by default)

#### 3. Admin Login Not Working
- Verify the demo admin was created in the database
- Check the profiles table has the admin record
- Ensure RLS policies are correctly set

#### 4. Frontend Can't Connect to Backend
- Verify backend is running on port 5002
- Check CORS settings in backend
- Ensure API base URL is correct in frontend .env

### Useful Supabase Dashboard Sections
- **SQL Editor**: Run custom queries
- **Table Editor**: View and edit data directly
- **Authentication**: Manage users
- **API**: Test API endpoints
- **Logs**: Debug issues

## 📊 Current System Status

### What's Working
✅ **Authentication**: Login/logout with demo admin  
✅ **Database**: Supabase PostgreSQL with profiles table  
✅ **Backend API**: Certificate verification endpoint with mock data  
✅ **Frontend**: Verification page and admin dashboard  
✅ **Error Handling**: Comprehensive error handling throughout  

### What Needs Implementation
🔄 **Real AI Analysis**: Replace mock AI score with actual AI service  
🔄 **Blockchain Integration**: Implement actual blockchain verification  
🔄 **Real Certificate Data**: Replace mock data with actual certificate database  
🔄 **Email Verification**: Set up email templates and SMTP  
🔄 **File Upload**: Implement proper file storage (Supabase Storage)  

### Mock Data Currently Used
- Certificate verification returns hardcoded "valid" certificates
- AI analysis returns random scores between 85-95%
- Blockchain verification always returns "valid"

## 🎯 Next Steps for Development

1. **Implement Real AI Service**: Connect to actual AI service for certificate analysis
2. **Add Blockchain Layer**: Implement smart contract interaction for certificate verification
3. **Certificate Management**: Build admin interface for certificate CRUD operations
4. **File Storage**: Set up Supabase Storage for certificate images
5. **Email System**: Configure email verification and notifications
6. **Production Deployment**: Set up production Supabase project and deployment

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Check the existing setup scripts in `backend/scripts/`
4. Review the commit messages for implementation details

---

**Created by**: GitHub Copilot  
**Last Updated**: September 19, 2025  
**Version**: 1.0 - Initial Supabase Integration