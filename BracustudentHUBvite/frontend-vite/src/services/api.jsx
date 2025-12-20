import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true, // This sends cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('🔵 API Request:', config.method.toUpperCase(), config.url);
        if (config.data) {
            console.log('Request data:', config.data);
        }
        return config;
    },
    (error) => {
        console.error('🔴 Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('🟢 API Response:', response.config.url, response.status);
        return response;
    },
    (error) => {
        console.error('🔴 API Error for:', error.config?.url);
        console.error('Status:', error.response?.status);
        console.error('Error data:', error.response?.data);

        // Handle authentication errors
        if (error.response?.status === 401) {
            console.log('🔴 Unauthorized - clearing user data');
            localStorage.removeItem('user');
        }

        // Return a consistent error structure
        return Promise.reject({
            success: false,
            message: error.response?.data?.message || error.message || 'Something went wrong',
            error: error.response?.data || error.message,
            status: error.response?.status
        });
    }
);

// API Service
const apiService = {
    // ==================== AUTH API (using your existing endpoints) ====================
    login: async (email, password) => {
        try {
            const response = await axiosInstance.post('/api/auth/login', { email, password });
            return response.data;
        } catch (error) {
            console.error('❌ Login API error:', error);
            throw error;
        }
    },

    signup: async (name, email, password, role = 'student') => {
        try {
            const response = await axiosInstance.post('/api/auth/signup', {
                name,
                email,
                password,
                role
            });
            return response.data;
        } catch (error) {
            console.error('❌ Signup API error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            const response = await axiosInstance.post('/api/auth/logout');
            return response.data;
        } catch (error) {
            console.error('❌ Logout API error:', error);
            throw error;
        }
    },

    checkAuth: async () => {
        try {
            const response = await axiosInstance.get('/api/check-auth');
            return response.data;
        } catch (error) {
            console.error('❌ Check auth error:', error);
            throw error;
        }
    },

    getProfile: async () => {
        try {
            const response = await axiosInstance.get('/api/auth/me');
            return response.data;
        } catch (error) {
            console.error('❌ Get profile error:', error);
            throw error;
        }
    },

    // ==================== GPA API ====================
    // Add semester grades
    addSemesterGrades: async (semesterData) => {
        try {
            console.log('📤 Sending semester data to /api/gpa/semesters');
            const response = await axiosInstance.post('/api/gpa/semesters', semesterData);
            return response.data;
        } catch (error) {
            console.error('❌ Add semester API error:', error);
            throw error;
        }
    },

    // Get all semesters
    getAllSemesters: async () => {
        try {
            const response = await axiosInstance.get('/api/gpa/semesters');
            return response.data;
        } catch (error) {
            console.error('❌ Get all semesters error:', error);
            throw error;
        }
    },

    // Get single semester
    getSemester: async (id) => {
        try {
            const response = await axiosInstance.get(`/api/gpa/semesters/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get semester error:', error);
            throw error;
        }
    },

    // Delete semester
    deleteSemester: async (id) => {
        try {
            const response = await axiosInstance.delete(`/api/gpa/semesters/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete semester error:', error);
            throw error;
        }
    },

    // Calculate CGPA
    calculateCGPA: async (method = 'accumulated') => {
        try {
            const response = await axiosInstance.get(`/api/gpa/calculate?method=${method}`);
            return response.data;
        } catch (error) {
            console.error('❌ Calculate CGPA error:', error);
            throw error;
        }
    },

    // Get academic stats
    getAcademicStats: async () => {
        try {
            const response = await axiosInstance.get('/api/gpa/stats');
            return response.data;
        } catch (error) {
            console.error('❌ Get academic stats error:', error);
            throw error;
        }
    },

    // Force update academic stats
    forceUpdateAcademicStats: async () => {
        try {
            const response = await axiosInstance.post('/api/gpa/stats/update');
            return response.data;
        } catch (error) {
            console.error('❌ Force update stats error:', error);
            throw error;
        }
    },

    // Calculate GPA preview
    calculateGPAPreview: async (courses) => {
        try {
            const response = await axiosInstance.post('/api/gpa/preview', { courses });
            return response.data;
        } catch (error) {
            console.error('❌ Calculate GPA preview error:', error);
            throw error;
        }
    },

    // ==================== TEST API ====================
    testConnection: async () => {
        try {
            const response = await axiosInstance.get('/api/health');
            return response.data;
        } catch (error) {
            console.error('❌ Connection test error:', error);
            return {
                success: false,
                message: 'Cannot connect to server',
                error: error.message
            };
        }
    },

    testAPI: async () => {
        try {
            const response = await axiosInstance.get('/api/test');
            return response.data;
        } catch (error) {
            console.error('❌ Test API error:', error);
            throw error;
        }
    }
};

export default apiService;