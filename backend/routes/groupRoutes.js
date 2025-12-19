// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { requireAuth } = require('../middleware/adminMiddleware');

// ==================== GROUP ROUTES ====================

// Get all groups
router.get('/', requireAuth, groupController.getAllGroups);

// Get user's groups
router.get('/user/my-groups', requireAuth, groupController.getUserGroups);

// Get single group
router.get('/:groupId', requireAuth, groupController.getGroup);

// Join group (request to join) - THIS EXISTS
router.post('/:groupId/join-request', requireAuth, groupController.requestToJoinGroup);

// Leave group - THIS EXISTS
router.delete('/:groupId/leave', requireAuth, groupController.leaveGroup);

// ✅ CRITICAL: Add members to group - THIS EXISTS
router.post('/:groupId/add-members', requireAuth, groupController.addMembersToGroup);

// Handle join request - THIS EXISTS
router.put('/:groupId/requests/:requestId', requireAuth, groupController.handleJoinRequest);

// Get join requests for a group - THIS MIGHT NOT EXIST
// Comment out if it doesn't exist
router.get('/:groupId/requests', requireAuth, groupController.getJoinRequests);

// Get groups from post - THIS EXISTS
router.get('/from-post/:postId', requireAuth, groupController.getGroupsFromPost);

module.exports = router;