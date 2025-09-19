# 🔧 Quick Setup Reference

This is a condensed version of the setup process for teammates who want to get started quickly.

## 📋 Essential Steps

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com/dashboard)
- Create new project: `academia-certificates`
- Save your database password!

### 2. Get Your Keys
From **Settings** → **API**:
```
Project URL: https://your-project.supabase.co
Anon Key: eyJhbGci... (public)
Service Role Key: eyJhbGci... (secret!)
```

### 3. Setup Database
Copy and run this SQL in **SQL Editor**:

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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

### 4. Create Environment Files

**backend/.env**:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=any-random-string
PORT=5002
NODE_ENV=development
```

**frontend/.env**:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:5002
```

### 5. Start Development
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start servers (use 2 terminals)
cd backend && npm run dev     # Terminal 1
cd frontend && npm run dev    # Terminal 2
```

### 6. Test Login
- Go to `http://localhost:5173`
- Login with: `admin@academia.com` / `admin123`

## 🆘 Quick Fixes

**"Invalid API Key"**: Check your .env files have correct Supabase keys  
**"Connection Refused"**: Make sure backend is running on port 5002  
**"Admin login fails"**: Run the admin creation SQL from the main setup guide  

**Need help?** Check `SUPABASE_SETUP.md` for detailed instructions.