// services/auth.js - UPDATE THIS FILE
import apiService from './api';

const authService = {
    // Login user
    login: async (email, password) => {
        try {
            const response = await apiService.login(email, password);

            if (response.success && response.user) {
                // Store minimal user info in localStorage
                const userData = {
                    id: response.user.id,
                    name: response.user.name,
                    email: response.user.email,
                    role: response.user.role,
                    isAdmin: response.user.isAdmin || response.user.role === 'admin'
                };
                localStorage.setItem('user', JSON.stringify(userData));
            }

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Signup user
    signup: async (name, email, password, role = 'student') => {
        try {
            const response = await apiService.signup(name, email, password, role);

            if (response.success && response.user) {
                const userData = {
                    id: response.user.id,
                    name: response.user.name,
                    email: response.user.email,
                    role: response.user.role,
                    isAdmin: response.user.isAdmin || response.user.role === 'admin'
                };
                localStorage.setItem('user', JSON.stringify(userData));
            }

            return response;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    // Logout user
    logout: async () => {
        try {
            await apiService.logout();
            localStorage.removeItem('user');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('user');
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

    // Check if user is authenticated (SYNC - from localStorage)
    isAuthenticated: () => {
        const user = authService.getCurrentUser();
        return !!user;
    },

    // Check auth status with server (ASYNC - verifies session)
    checkAuthStatus: async () => {
        try {
            const response = await apiService.checkAuth();

            if (response.loggedIn) {
                // Session is valid
                const user = authService.getCurrentUser();

                // If localStorage doesn't match session, fetch fresh data
                if (!user || user.id !== response.userId) {
                    try {
                        const profileResponse = await apiService.getProfile();
                        if (profileResponse.success && profileResponse.user) {
                            const userData = {
                                id: profileResponse.user.id,
                                name: profileResponse.user.name,
                                email: profileResponse.user.email,
                                role: profileResponse.user.role,
                                isAdmin: profileResponse.user.isAdmin || profileResponse.user.role === 'admin'
                            };
                            localStorage.setItem('user', JSON.stringify(userData));
                        }
                    } catch (profileError) {
                        console.error('Profile fetch error:', profileError);
                    }
                }
                return { loggedIn: true, userId: response.userId };
            } else {
                // Session expired
                localStorage.removeItem('user');
                return { loggedIn: false };
            }
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('user');
            return { loggedIn: false };
        }
    },

    // Check if user is admin
    isAdmin: () => {
        const user = authService.getCurrentUser();
        return user ? (user.role === 'admin' || user.isAdmin === true) : false;
    }
};

export default authService;