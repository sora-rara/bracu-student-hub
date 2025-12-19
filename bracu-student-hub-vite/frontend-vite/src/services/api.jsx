import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
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

        if (error.response?.status === 401) {
            console.log('🔴 Unauthorized - clearing user data');
            localStorage.removeItem('user');
        }

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
    // ==================== AUTH API ====================
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

    getAllSemesters: async () => {
        try {
            const response = await axiosInstance.get('/api/gpa/semesters');
            return response.data;
        } catch (error) {
            console.error('❌ Get all semesters error:', error);
            throw error;
        }
    },

    getSemester: async (id) => {
        try {
            const response = await axiosInstance.get(`/api/gpa/semesters/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get semester error:', error);
            throw error;
        }
    },

    deleteSemester: async (id) => {
        try {
            const response = await axiosInstance.delete(`/api/gpa/semesters/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete semester error:', error);
            throw error;
        }
    },

    calculateCGPA: async (method = 'accumulated') => {
        try {
            const response = await axiosInstance.get(`/api/gpa/calculate?method=${method}`);
            return response.data;
        } catch (error) {
            console.error('❌ Calculate CGPA error:', error);
            throw error;
        }
    },

    getAcademicStats: async () => {
        try {
            const response = await axiosInstance.get('/api/gpa/stats');
            return response.data;
        } catch (error) {
            console.error('❌ Get academic stats error:', error);
            throw error;
        }
    },

    forceUpdateAcademicStats: async () => {
        try {
            const response = await axiosInstance.post('/api/gpa/stats/update');
            return response.data;
        } catch (error) {
            console.error('❌ Force update stats error:', error);
            throw error;
        }
    },

    calculateGPAPreview: async (courses) => {
        try {
            const response = await axiosInstance.post('/api/gpa/preview', { courses });
            return response.data;
        } catch (error) {
            console.error('❌ Calculate GPA preview error:', error);
            throw error;
        }
    },

    checkRetakes: async (data) => {
        try {
            const response = await axiosInstance.post('/api/gpa/check-retakes', data);
            return response.data;
        } catch (error) {
            console.error('❌ Check retakes error:', error);
            throw error;
        }
    },

    getCourseHistory: async (courseCode) => {
        try {
            const response = await axiosInstance.get(`/api/gpa/course-history?courseCode=${encodeURIComponent(courseCode)}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get course history error:', error);
            throw error;
        }
    },

    getRetakeStats: async () => {
        try {
            const response = await axiosInstance.get('/api/gpa/retake-stats');
            return response.data;
        } catch (error) {
            console.error('❌ Get retake stats error:', error);
            throw error;
        }
    },

    // ==================== FIND MY GROUP API ====================
    // Need Posts API
    createNeedPost: async (postData) => {
        try {
            const response = await axiosInstance.post('/api/need-posts', postData);
            return response.data;
        } catch (error) {
            console.error('❌ Create need post error:', error);
            throw error;
        }
    },

    getAllNeedPosts: async (params = {}) => {
        try {
            const response = await axiosInstance.get('/api/need-posts', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Get all need posts error:', error);
            throw error;
        }
    },

    getNeedPost: async (id) => {
        try {
            const response = await axiosInstance.get(`/api/need-posts/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get need post error:', error);
            throw error;
        }
    },

    getUserNeedPosts: async () => {
        try {
            const response = await axiosInstance.get('/api/need-posts/user/my-posts');
            return response.data;
        } catch (error) {
            console.error('❌ Get user need posts error:', error);
            throw error;
        }
    },

    deleteNeedPost: async (id) => {
        try {
            const response = await axiosInstance.delete(`/api/need-posts/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete need post error:', error);
            throw error;
        }
    },

    expressInterest: async (postId, message = '') => {
        try {
            const response = await axiosInstance.post(`/api/need-posts/${postId}/express-interest`, { message });
            return response.data;
        } catch (error) {
            console.error('❌ Express interest error:', error);
            throw error;
        }
    },

    createGroupFromPost: async (postId, groupData) => {
        try {
            const response = await axiosInstance.post(`/api/need-posts/${postId}/create-group`, groupData);
            return response.data;
        } catch (error) {
            console.error('❌ Create group from post error:', error);
            throw error;
        }
    },

    // Groups API
    getAllGroups: async (params = {}) => {
        try {
            const response = await axiosInstance.get('/api/groups', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Get all groups error:', error);
            throw error;
        }
    },

    getGroup: async (id) => {
        try {
            const response = await axiosInstance.get(`/api/groups/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get group error:', error);
            throw error;
        }
    },

    getUserGroups: async () => {
        try {
            const response = await axiosInstance.get('/api/groups/user/my-groups');
            return response.data;
        } catch (error) {
            console.error('❌ Get user groups error:', error);
            throw error;
        }
    },

    requestToJoinGroup: async (groupId, message = '') => {
        try {
            const response = await axiosInstance.post(`/api/groups/${groupId}/join-request`, { message });
            return response.data;
        } catch (error) {
            console.error('❌ Request to join group error:', error);
            throw error;
        }
    },

    leaveGroup: async (groupId) => {
        try {
            const response = await axiosInstance.delete(`/api/groups/${groupId}/leave`);
            return response.data;
        } catch (error) {
            console.error('❌ Leave group error:', error);
            throw error;
        }
    },

    handleJoinRequest: async (groupId, requestId, action) => {
        try {
            const response = await axiosInstance.put(`/api/groups/${groupId}/requests/${requestId}`, { status: action });
            return response.data;
        } catch (error) {
            console.error('❌ Handle join request error:', error);
            throw error;
        }
    },

    // ✅ FIXED: Add members to group (matches your NeedPostDetail.jsx usage)
    addMembersToGroup: async (groupId, userIds) => {
        try {
            console.log('📤 Adding members to group:', { groupId, userIds });

            // Process userIds to ensure they're in the right format
            let processedUserIds = userIds;

            // If it's already an array of strings, use it
            // If it's an array of objects, extract the IDs
            if (Array.isArray(userIds) && userIds.length > 0) {
                if (typeof userIds[0] === 'object') {
                    processedUserIds = userIds.map(user => {
                        // Handle different possible ID fields
                        if (user.userId) return user.userId.toString();
                        if (user._id) return user._id.toString();
                        if (user.id) return user.id.toString();
                        return user.toString();
                    });
                } else {
                    processedUserIds = userIds.map(id => id.toString());
                }
            }

            console.log('📤 Processed user IDs:', processedUserIds);

            const response = await axiosInstance.post(`/api/groups/${groupId}/add-members`, {
                userIds: processedUserIds
            });
            return response.data;
        } catch (error) {
            console.error('❌ Add members to group error:', error);
            throw error;
        }
    },

    // Admin Group Management API
    adminGetAllNeedPosts: async (params = {}) => {
        try {
            const response = await axiosInstance.get('/api/admin/need-posts', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Admin get need posts error:', error);
            throw error;
        }
    },

    adminUpdatePostStatus: async (postId, status) => {
        try {
            const response = await axiosInstance.put(`/api/admin/need-posts/${postId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('❌ Admin update post status error:', error);
            throw error;
        }
    },

    adminGetAllGroups: async (params = {}) => {
        try {
            const response = await axiosInstance.get('/api/admin/groups', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Admin get groups error:', error);
            throw error;
        }
    },

    adminUpdateGroupStatus: async (groupId, status) => {
        try {
            const response = await axiosInstance.put(`/api/admin/groups/${groupId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('❌ Admin update group status error:', error);
            throw error;
        }
    },

    getGroupAnalytics: async () => {
        try {
            const response = await axiosInstance.get('/api/admin/analytics');
            return response.data;
        } catch (error) {
            console.error('❌ Get group analytics error:', error);
            throw error;
        }
    },

    // Notifications API
    getNotifications: async (params = {}) => {
        try {
            const response = await axiosInstance.get('/api/notifications', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Get notifications error:', error);
            throw error;
        }
    },

    markNotificationAsRead: async (notificationId) => {
        try {
            const response = await axiosInstance.put(`/api/notifications/${notificationId}`, { read: true });
            return response.data;
        } catch (error) {
            console.error('❌ Mark notification as read error:', error);
            throw error;
        }
    },

    markAllNotificationsAsRead: async () => {
        try {
            const response = await axiosInstance.put('/api/notifications/read-all', {});
            return response.data;
        } catch (error) {
            console.error('❌ Mark all notifications as read error:', error);
            throw error;
        }
    },

    deleteNotification: async (notificationId) => {
        try {
            const response = await axiosInstance.delete(`/api/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete notification error:', error);
            throw error;
        }
    },

    // ==================== NEED POST EXTENDED API ====================
    closeNeedPost: async (postId, data = {}) => {
        try {
            const response = await axiosInstance.put(`/api/need-posts/${postId}/close`, data);
            return response.data;
        } catch (error) {
            console.error('❌ Close need post error:', error);
            throw error;
        }
    },

    // ==================== GROUP EXTENDED API ====================
    getGroupsFromPost: async (postId) => {
        try {
            const response = await axiosInstance.get(`/api/groups/from-post/${postId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get groups from post error:', error);
            throw error;
        }
    },

    updateInterestStatus: async (postId, userId, status) => {
        try {
            const response = await axiosInstance.put(`/api/need-posts/${postId}/interests/${userId}`, { status });
            return response.data;
        } catch (error) {
            console.error('❌ Update interest status error:', error);
            throw error;
        }
    },

    // ==================== ALTERNATIVE: Combined API for group management ====================
    approveAndAddUser: async (groupId, userId) => {
        try {
            const response = await axiosInstance.post(`/api/groups/${groupId}/approve-user`, { userId });
            return response.data;
        } catch (error) {
            console.error('❌ Approve and add user error:', error);
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