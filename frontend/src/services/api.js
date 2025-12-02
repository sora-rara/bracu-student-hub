import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to handle auth
axiosInstance.interceptors.request.use(
    (config) => {
        // You can add any headers here if needed
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => {
        // Don't transform successful responses - let each API handle its own structure
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
            // Clear local storage and redirect to login
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        
        // Return a consistent error structure
        return Promise.reject({
            success: false,
            message: error.response?.data?.message || 'Something went wrong',
            error: error.response?.data || error.message,
            status: error.response?.status
        });
    }
);

// GPA API Methods
const apiService = {
    // Semester operations
    addSemesterGrades: async (semesterData) => {
        try {
            const response = await axiosInstance.post('/api/gpa/semester', semesterData);
            // Return the response data directly
            return response.data || { success: true };
        } catch (error) {
            console.error('Add semester API error:', error);
            throw error;
        }
    },
    
    getAllSemesters: async () => {
        try {
            const response = await axiosInstance.get('/api/gpa/semesters');
            return response.data;
        } catch (error) {
            console.error('Get all semesters error:', error);
            throw error;
        }
    },
    
    getSemester: async (id) => {
        try {
            const response = await axiosInstance.get(`/api/gpa/semester/${id}`);
            return response.data;
        } catch (error) {
            console.error('Get semester error:', error);
            throw error;
        }
    },
    
    deleteSemester: async (id) => {
        try {
            const response = await axiosInstance.delete(`/api/gpa/semester/${id}`);
            return response.data;
        } catch (error) {
            console.error('Delete semester error:', error);
            throw error;
        }
    },
    
    calculateCGPA: async (method = 'accumulated') => {
        try {
            const response = await axiosInstance.get(`/api/gpa/calculate?method=${method}`);
            return response.data;
        } catch (error) {
            console.error('Calculate CGPA error:', error);
            throw error;
        }
    },
    
    // Check if user is authenticated
    checkAuth: async () => {
        try {
            const response = await axiosInstance.get('/api/check-auth');
            return response.data;
        } catch (error) {
            console.error('Check auth error:', error);
            throw error;
        }
    },
    
    // Test endpoint
    testConnection: async () => {
        try {
            const response = await axiosInstance.get('/api/health');
            return response.data;
        } catch (error) {
            console.error('Connection test error:', error);
            return { 
                success: false, 
                message: 'Cannot connect to server',
                error: error.message 
            };
        }
    }
};

export default apiService;