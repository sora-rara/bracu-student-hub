// routes/adminGroupRoutes.js
const express = require('express');
const router = express.Router();
const {
    adminGetAllNeedPosts,
    adminUpdatePostStatus,
    adminGetAllGroups,
    adminUpdateGroupStatus,
    getGroupAnalytics,
    adminDeletePost  // Make sure this is imported
} = require('../controllers/adminGroupController');
const { requireAdmin } = require('../middleware/adminMiddleware');

// All routes require admin access
router.use(requireAdmin);

// Need Posts Admin Routes
router.get('/need-posts', adminGetAllNeedPosts);
router.put('/need-posts/:id/status', adminUpdatePostStatus);
router.delete('/need-posts/:id', adminDeletePost);  // This should work now

// Groups Admin Routes
router.get('/groups', adminGetAllGroups);
router.put('/groups/:id/status', adminUpdateGroupStatus);

// Analytics
router.get('/analytics', getGroupAnalytics);

module.exports = router;