const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase credentials not found. Using mock mode.');

    // Export a mock client for development
    module.exports = {
        auth: {
            getUser: async (token) => ({ data: { user: null }, error: { message: 'Mock mode' } }),
            admin: {
                createUser: async (userData) => ({ data: { user: { id: 'mock-id', email: userData.email } }, error: null }),
                deleteUser: async (userId) => ({ error: null }),
                generateLink: async (options) => ({ data: { properties: { action_link: 'mock-link' } }, error: null })
            },
            signInWithPassword: async (credentials) => ({
                data: {
                    user: { id: 'mock-id', email: credentials.email },
                    session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
                },
                error: null
            }),
            signOut: async () => ({ error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
        },
        from: (table) => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: { message: 'Mock mode' } })
                })
            }),
            insert: () => ({
                select: () => ({
                    single: async () => ({ data: null, error: { message: 'Mock mode' } })
                })
            }),
            upsert: async () => ({ data: null, error: { message: 'Mock mode' } }),
            update: () => ({
                eq: async () => ({ data: null, error: { message: 'Mock mode' } })
            }),
            delete: () => ({
                eq: async () => ({ data: null, error: { message: 'Mock mode' } })
            })
        })
    };
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

module.exports = supabase;