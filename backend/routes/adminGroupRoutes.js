// routes/adminGroupRoutes.js
const express = require('express');
const router = express.Router();
const {
    adminGetAllNeedPosts,
    adminUpdatePostStatus,
    adminGetAllGroups,
    adminUpdateGroupStatus,
    getGroupAnalytics
} = require('../controllers/adminGroupController');
const { requireAdmin } = require('../middleware/adminMiddleware');

// All routes require admin access
router.use(requireAdmin);

// Need Posts Admin Routes
router.get('/need-posts', adminGetAllNeedPosts);
router.put('/need-posts/:id/status', adminUpdatePostStatus);

// Groups Admin Routes
router.get('/groups', adminGetAllGroups);
router.put('/groups/:id/status', adminUpdateGroupStatus);

// Analytics
router.get('/analytics', getGroupAnalytics);

module.exports = router;