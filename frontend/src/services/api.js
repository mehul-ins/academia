import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:5002/api';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // Optionally redirect to login
        }
        return Promise.reject(error);
    }
);

// API Service methods
export const apiService = {
    // Health check
    health: {
        simple: () => api.get('/health'),
        full: () => api.get('/health'), // Note: full health is at root /health, not /api/health
    },

    // Authentication
    auth: {
        login: (credentials) => api.post('/auth/login', credentials),
        register: (userData) => api.post('/auth/register', userData),
        getProfile: () => api.get('/auth/profile'),
        updateProfile: (profileData) => api.put('/auth/profile', profileData),
        changePassword: (passwordData) => api.put('/auth/password', passwordData),
    },

    // Certificate verification
    verify: {
        uploadCertificate: (formData) =>
            api.post('/verify', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
    },

    // Certificate management
    certificates: {
        list: () => api.get('/certificates'),
        create: (certificateData) => api.post('/certificates', certificateData),
        update: (id, certificateData) => api.put(`/certificates/${id}`, certificateData),
        delete: (id) => api.delete(`/certificates/${id}`),
    },

    // Admin endpoints
    admin: {
        getStats: () => api.get('/admin/stats'),
        getLogs: () => api.get('/admin/logs'),
        getUsers: () => api.get('/admin/users'),
        getBlacklist: () => api.get('/admin/blacklist'),
        addToBlacklist: (entry) => api.post('/admin/blacklist', entry),
        removeFromBlacklist: (id) => api.delete(`/admin/blacklist/${id}`),
    },
};

// Helper functions
export const authHelper = {
    setToken: (token) => {
        localStorage.setItem('authToken', token);
    },

    getToken: () => {
        return localStorage.getItem('authToken');
    },

    removeToken: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('authToken');
    },
};

export default api;