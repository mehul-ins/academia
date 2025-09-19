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