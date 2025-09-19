// API utility functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

// API request helper
const apiRequest = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

// Auth API
export const authAPI = {
    login: async (email, password) => {
        return apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    register: async (username, email, password, role = 'user') => {
        return apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, role }),
        });
    },
};

// Certificate Verification API
export const verificationAPI = {
    verifyCertificate: async (fileOrId) => {
        if (typeof fileOrId === 'string') {
            // Certificate ID verification
            return apiRequest('/api/verify', {
                method: 'POST',
                body: JSON.stringify({ certificateId: fileOrId }),
            });
        } else {
            // File upload verification
            const formData = new FormData();
            formData.append('certificate', fileOrId);

            return apiRequest('/api/verify', {
                method: 'POST',
                headers: {}, // Remove Content-Type to let browser set it for FormData
                body: formData,
            });
        }
    },
};

// Certificate Management API
export const certificateAPI = {
    bulkUpload: async (csvFile) => {
        const formData = new FormData();
        formData.append('csvFile', csvFile);

        return apiRequest('/api/certificates/bulk', {
            method: 'POST',
            headers: {}, // Remove Content-Type to let browser set it for FormData
            body: formData,
        });
    },

    getCertificates: async () => {
        return apiRequest('/api/certificates');
    },

    deleteCertificate: async (certificateId) => {
        return apiRequest(`/api/certificates/${certificateId}`, {
            method: 'DELETE',
        });
    },
};

// Admin API
export const adminAPI = {
    // Dashboard statistics
    getStats: async () => {
        return apiRequest('/api/admin/stats');
    },

    // Verification logs with pagination and filters
    getLogs: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/api/admin/logs${queryString ? `?${queryString}` : ''}`);
    },

    // User management
    getUsers: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/api/admin/users${queryString ? `?${queryString}` : ''}`);
    },

    deleteUser: async (userId) => {
        return apiRequest(`/api/admin/users/${userId}`, {
            method: 'DELETE',
        });
    },

    // Certificate management
    getCertificates: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/api/admin/certificates${queryString ? `?${queryString}` : ''}`);
    },

    toggleBlacklist: async (certificateId, blacklisted, reason = '') => {
        return apiRequest(`/api/admin/certificates/${certificateId}/blacklist`, {
            method: 'PUT',
            body: JSON.stringify({ blacklisted, reason }),
        });
    },
};

// Health check
export const healthAPI = {
    check: async () => {
        return apiRequest('/api/health');
    },
};

export default {
    authAPI,
    verificationAPI,
    certificateAPI,
    adminAPI,
    healthAPI,
};