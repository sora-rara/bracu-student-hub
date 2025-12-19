import axios from '../api/axios';

const graduationService = {
    // Initialize graduation plan
    initializePlan: async (program, admissionYear) => {
        try {
            const response = await axios.post('/api/graduation/initialize', {
                program,
                admissionYear
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get graduation progress
    getProgress: async () => {
        try {
            const response = await axios.get('/api/graduation/progress');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Add completed course
    addCompletedCourse: async (courseData, force = false) => {
        try {
            const response = await axios.post('/api/graduation/courses/completed', {
                ...courseData,
                force
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get remaining courses
    getRemainingCourses: async (category = null) => {
        try {
            const params = category ? { category } : {};
            const response = await axios.get('/api/graduation/courses/remaining', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Check course prerequisites
    checkPrerequisites: async (courseCode) => {
        try {
            const response = await axios.get(`/api/graduation/courses/${courseCode}/prerequisites`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get course details
    getCourseDetails: async (courseCode) => {
        try {
            const response = await axios.get(`/api/graduation/courses/${courseCode}/details`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get recommended courses
    getRecommendedCourses: async (category = null) => {
        try {
            const params = category ? { category } : {};
            const response = await axios.get('/api/graduation/courses/recommended', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Plan a course
    planCourse: async (courseData) => {
        try {
            const response = await axios.post('/api/graduation/courses/plan', courseData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get graduation timeline
    getTimeline: async () => {
        try {
            const response = await axios.get('/api/graduation/timeline');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default graduationService;