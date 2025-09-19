# Supabase Integration Guide
## 🚀 Setup Complete!

Your Academia backend has been successfully integrated with Supabase Auth. Here's what was implemented:

## ✅ What's Done

### Backend Configuration
- **Supabase Client**: `utils/supabaseClient.js` configured with service role key
- **Auth Middleware**: JWT validation using Supabase JWT secret
- **Role Middleware**: Profile-based role checking (admin/institution)
- **Protected Routes**: All routes now require authentication
- **Environment Setup**: `.env` and `.env.example` updated with Supabase variables

### Route Protection
- **Verify Route**: Requires authentication (any logged-in user)
- **Certificates Bulk Upload**: Requires admin role
- **Admin Routes**: All require admin role
- **Old Auth Routes**: Removed (frontend handles auth directly)

### Database Schema
- **SQL Setup Script**: `supabase_setup.sql` ready to run in Supabase
- **Profiles Table**: User profiles with roles and institution data
- **RLS Policies**: Row Level Security configured
- **Auto Profile Creation**: Trigger for new user signup

## 🔧 Configuration Needed

### 1. Get Supabase API Keys
Go to your Supabase Dashboard → Settings → API and get:
- `Project URL` (already set: https://fqvfckxwhhvwlwmqzfkl.supabase.co)
- `anon/public key` 
- `service_role/secret key`
- `JWT Secret`

### 2. Update Environment Variables

**Backend (.env):**
```bash
SUPABASE_URL=https://fqvfckxwhhvwlwmqzfkl.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_KEY=your-actual-service-key
SUPABASE_JWT_SECRET=your-actual-jwt-secret
```

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://fqvfckxwhhvwlwmqzfkl.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

### 3. Run Database Setup
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `backend/supabase_setup.sql`
3. Run the SQL script
4. Create your admin user through Supabase Auth UI or API

## 🧪 Testing

### Test Supabase Connection
```bash
cd backend
npm run test-supabase
```

### Frontend Auth Flow
1. Frontend calls `supabase.auth.signInWithPassword()`
2. Gets JWT access token
3. Sends token in `Authorization: Bearer <token>` header
4. Backend verifies with `authMiddleware`
5. `roleMiddleware` checks user role from profiles table

## 📋 Frontend Integration

Your frontend already has:
- Supabase client setup: `src/lib/supabase.js`
- API interceptors for auth headers: `src/services/api.js`
- Environment variables configured

Example frontend auth:
```javascript
import { supabase } from './lib/supabase';

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// The API service will automatically include the auth token
```

## 🔐 Security Features

- **JWT Verification**: All routes verify Supabase JWT tokens
- **Role-Based Access**: Admin vs Institution permissions
- **Row Level Security**: Database-level security policies
- **Profile Management**: Automatic profile creation on signup
- **Token Refresh**: Handled by Supabase client

## 🚦 Route Access Matrix

| Route | Authentication | Role Required |
|-------|---------------|---------------|
| `/api/verify` | ✅ Required | Any |
| `/api/certificates` (GET) | ✅ Required | Any |
| `/api/certificates/bulk` | ✅ Required | Admin |
| `/api/admin/*` | ✅ Required | Admin |

## 🐛 Troubleshooting

### "Profile not found" error
- Ensure profiles table exists (run SQL setup)
- Check if user has a profile in the profiles table

### "Invalid token" error
- Verify SUPABASE_JWT_SECRET is correct
- Check if frontend is sending the token correctly

### "Forbidden: insufficient role" error
- Check user's role in profiles table
- Ensure admin users have role = 'admin'

### Connection issues
- Verify Supabase URL and keys are correct
- Check if Supabase project is active
- Run `npm run test-supabase` for diagnostics

## 📚 Migration Notes

This integration:
- ✅ Maintains existing API structure
- ✅ Compatible with current frontend
- ✅ Removes old custom auth system
- ✅ Uses Supabase Auth + custom profiles
- ✅ Ready for production deployment

Your app is now fully integrated with Supabase Auth! 🎉