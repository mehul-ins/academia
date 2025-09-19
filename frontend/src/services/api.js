import axios from 'axios';
import { supabase } from '../lib/supabase';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, redirect to login
            await supabase.auth.signOut();
            window.location.href = '/login';
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
        getBlacklist: () => api.get('/admin/blacklist'),
        addToBlacklist: (entry) => api.post('/admin/blacklist', entry),
        removeFromBlacklist: (id) => api.delete(`/admin/blacklist/${id}`),
    },
};

export default api;