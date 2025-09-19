import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session with timeout
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error getting initial session:', error);
                setLoading(false); // Always set loading to false, even on error
            }
        };

        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.log('Auth timeout - setting loading to false');
            setLoading(false);
        }, 3000);

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                try {
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        await fetchProfile(session.user.id);
                    } else {
                        setProfile(null);
                    }

                    setLoading(false);
                } catch (error) {
                    console.error('Error in auth state change:', error);
                    setLoading(false);
                }
            }
        );

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    // Auto-refresh profile if user exists but profile is missing (e.g., after navigation)
    useEffect(() => {
        if (user && !profile && !loading) {
            fetchProfile(user.id);
        }
    }, [user, profile, loading]);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
                setLoading(false); // Always clear loading on error
                return;
            }

            setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setLoading(false); // Always clear loading on error
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Supabase logout error:', error);
                // Don't throw error, just clear local state
            }
        } catch (err) {
            console.error('Logout error:', err);
            // Don't throw error, just clear local state
        } finally {
            // Always clear local state
            setUser(null);
            setProfile(null);
        }
    };

    const register = async (email, password, profileData) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: profileData
            }
        });

        if (error) throw error;
        return data;
    };

    const isAdmin = () => {
        return profile?.role === 'admin';
    };

    const isAuthenticated = !!user;

    const value = {
        user,
        profile,
        login,
        logout,
        register,
        isAdmin,
        isAuthenticated,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};