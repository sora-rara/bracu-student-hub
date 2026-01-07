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


    updateGroup: async (groupId, groupData) => {
        try {
            const response = await axiosInstance.put(`/api/groups/${groupId}`, groupData);
            return response.data;
        } catch (error) {
            console.error('❌ Update group error:', error);
            throw error;
        }
    },

    deleteGroup: async (groupId) => {
        try {
            const response = await axiosInstance.delete(`/api/groups/${groupId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete group error:', error);
            throw error;
        }
    },

    // Get group messages - FIXED: Using axiosInstance instead of undefined 'api'
    getGroupMessages: async (groupId, params = {}) => {
        try {
            const response = await axiosInstance.get(`/api/groups/${groupId}/messages`, { params });
            return response.data;
        } catch (error) {
            console.error('❌ Get group messages error:', error);
            throw error;
        }
    },

    // Post a message - FIXED: Using axiosInstance instead of undefined 'api'
    postGroupMessage: async (groupId, messageData) => {
        try {
            const response = await axiosInstance.post(`/api/groups/${groupId}/messages`, messageData);
            return response.data;
        } catch (error) {
            console.error('❌ Post group message error:', error);
            throw error;
        }
    },

    // Edit a message - FIXED: Using axiosInstance instead of undefined 'api'
    editGroupMessage: async (groupId, messageId, content) => {
        try {
            const response = await axiosInstance.put(`/api/groups/${groupId}/messages/${messageId}`, content);
            return response.data;
        } catch (error) {
            console.error('❌ Edit group message error:', error);
            throw error;
        }
    },

    // Delete a message - FIXED: Using axiosInstance instead of undefined 'api'
    deleteGroupMessage: async (groupId, messageId) => {
        try {
            const response = await axiosInstance.delete(`/api/groups/${groupId}/messages/${messageId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete group message error:', error);
            throw error;
        }
    },

    // Like/unlike a message - FIXED: Using axiosInstance instead of undefined 'api'
    toggleMessageLike: async (groupId, messageId) => {
        try {
            const response = await axiosInstance.post(`/api/groups/${groupId}/messages/${messageId}/like`);
            return response.data;
        } catch (error) {
            console.error('❌ Toggle message like error:', error);
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

    // Add these methods to your apiService object in api.jsx:

    // Admin Group Management API - FIXED PATHS
    adminGetAllNeedPosts: async (params = {}) => {
        try {
            // Correct path based on your adminGroupRoutes.js
            const response = await axiosInstance.get('/api/admin/groups/need-posts', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Admin get need posts error:', error);
            throw error;
        }
    },

    adminUpdatePostStatus: async (postId, statusData) => {
        try {
            // Correct path based on your adminGroupRoutes.js
            const response = await axiosInstance.put(`/api/admin/groups/need-posts/${postId}/status`, statusData);
            return response.data;
        } catch (error) {
            console.error('❌ Admin update post status error:', error);
            throw error;
        }
    },

    // NEW: Admin delete post
    adminDeletePost: async (postId) => {
        try {
            // Need to add this route to adminGroupRoutes.js
            const response = await axiosInstance.delete(`/api/admin/groups/need-posts/${postId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Admin delete post error:', error);
            throw error;
        }
    },

    adminGetAllGroups: async (params = {}) => {
        try {
            // Correct path
            const response = await axiosInstance.get('/api/admin/groups', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Admin get groups error:', error);
            throw error;
        }
    },

    adminUpdateGroupStatus: async (groupId, statusData) => {
        try {
            const response = await axiosInstance.put(`/api/admin/groups/${groupId}/status`, statusData);
            return response.data;
        } catch (error) {
            console.error('❌ Admin update group status error:', error);
            throw error;
        }
    },

    // FIXED: Correct analytics endpoint
    getGroupAnalytics: async () => {
        try {
            const response = await axiosInstance.get('/api/admin/groups/analytics');
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

    // ==================== BUDGET API (Added from Code 2) ====================
    // Get all transactions
    getTransactions: async () => {
        try {
            const response = await axiosInstance.get('/api/budget/transactions');
            return response.data;
        } catch (error) {
            console.error('❌ Get transactions error:', error);
            throw error;
        }
    },

    // Add a transaction
    addTransaction: async (transactionData) => {
        try {
            const response = await axiosInstance.post('/api/budget/transactions', transactionData);
            return response.data;
        } catch (error) {
            console.error('❌ Add transaction error:', error);
            throw error;
        }
    },

    // Update a transaction
    updateTransaction: async (id, transactionData) => {
        try {
            const response = await axiosInstance.put(`/api/budget/transactions/${id}`, transactionData);
            return response.data;
        } catch (error) {
            console.error('❌ Update transaction error:', error);
            throw error;
        }
    },

    // Delete a transaction
    deleteTransaction: async (id) => {
        try {
            const response = await axiosInstance.delete(`/api/budget/transactions/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete transaction error:', error);
            throw error;
        }
    },

    // Get budget summary
    getBudget: async () => {
        try {
            const response = await axiosInstance.get('/api/budget/summary');
            return response.data;
        } catch (error) {
            console.error('❌ Get budget error:', error);
            throw error;
        }
    },

    // Set/update budget
    setBudget: async (budgetData) => {
        try {
            const response = await axiosInstance.post('/api/budget/summary', budgetData);
            return response.data;
        } catch (error) {
            console.error('❌ Set budget error:', error);
            throw error;
        }
    },

    // Get budget stats or analytics
    getBudgetStats: async () => {
        try {
            const response = await axiosInstance.get('/api/budget/insights');
            return response.data;
        } catch (error) {
            console.error('❌ Get budget stats error:', error);
            throw error;
        }
    },

    // Get monthly breakdown
    getMonthlyBreakdown: async () => {
        try {
            const response = await axiosInstance.get('/api/budget/monthly-breakdown');
            return response.data;
        } catch (error) {
            console.error('❌ Get monthly breakdown error:', error);
            throw error;
        }
    },

    // Get category breakdown
    getCategoryBreakdown: async () => {
        try {
            const response = await axiosInstance.get('/api/budget/category-breakdown');
            return response.data;
        } catch (error) {
            console.error('❌ Get category breakdown error:', error);
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