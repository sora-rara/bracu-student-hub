
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance for auth with credentials
const authAxios = axios.create({
    baseURL: API_URL,
    withCredentials: true, // CRITICAL: This sends cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

const authService = {
    // Login user
    login: async (email, password) => {
        try {
            const response = await authAxios.post('/api/auth/login', { email, password });
            
            if (response.data.success && response.data.user) {
                // Store user info in localStorage
                localStorage.setItem('user', JSON.stringify(response.data.user));
                return response.data;
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    // Signup user
    signup: async (userData) => {
        try {
            const response = await authAxios.post('/api/auth/signup', userData);
            
            if (response.data.success && response.data.user) {
                // Store user info in localStorage
                localStorage.setItem('user', JSON.stringify(response.data.user));
                return response.data;
            }
            return response.data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },
    
    // Logout user
    logout: async () => {
        try {
            await authAxios.post('/api/auth/logout');
            // Clear local storage
            localStorage.removeItem('user');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('user'); // Clear anyway
            return { success: false, error: error.message };
        }
    },
    
    // Get current user from localStorage
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    
    // Check if user is authenticated
    isAuthenticated: () => {
        const user = authService.getCurrentUser();
        return !!user;
    },
    
    // Check auth status with server
    checkAuthStatus: async () => {
        try {
            const response = await authAxios.get('/api/check-auth');
            return response.data;
        } catch (error) {
            console.error('Auth check error:', error);
            return { loggedIn: false };
        }
    },
    
    // Get user profile
    getProfile: async () => {
        try {
            const response = await authAxios.get('/api/auth/me');
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }
};

export default authService;
