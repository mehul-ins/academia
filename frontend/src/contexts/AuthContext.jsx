import { createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // Simplified auth context - always treat as authenticated and admin
    const value = {
        user: null,
        login: () => {}, // No-op
        logout: () => {}, // No-op
        isAdmin: () => true, // Always return true for admin functions
        isAuthenticated: true, // Always authenticated
        loading: false
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};