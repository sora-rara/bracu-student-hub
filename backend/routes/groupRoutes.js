// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const groupMessageController = require('../controllers/groupMessageController');
const { requireAuth } = require('../middleware/adminMiddleware');

// ==================== STATIC ROUTES FIRST ====================

// Get all groups
router.get('/', requireAuth, groupController.getAllGroups);

// Get user's groups
router.get('/user/my-groups', requireAuth, groupController.getUserGroups);

// Get groups from post
router.get('/from-post/:postId', requireAuth, groupController.getGroupsFromPost);

// ==================== SPECIFIC ROUTES (MUST COME BEFORE GENERIC :id) ====================

// 🚨 IMPORTANT: All routes with additional path segments must come before simple :id routes

// Add members to group 
router.post('/:groupId/add-members', requireAuth, groupController.addMembersToGroup);

// Handle join request
router.put('/:groupId/requests/:requestId', requireAuth, groupController.handleJoinRequest);

// Get join requests for a group
router.get('/:groupId/requests', requireAuth, groupController.getJoinRequests);

// Join group (request to join)
router.post('/:groupId/join-request', requireAuth, groupController.requestToJoinGroup);

// Leave group
router.delete('/:groupId/leave', requireAuth, groupController.leaveGroup);


// ==================== GROUP MESSAGE ROUTES (SPECIFIC) ====================

// Get group messages
router.get('/:groupId/messages', requireAuth, groupMessageController.getMessages);

// Post a message
router.post('/:groupId/messages', requireAuth, groupMessageController.postMessage);

// Like/unlike a message
router.post('/:groupId/messages/:messageId/like', requireAuth, groupMessageController.toggleLike);

// Edit a message
router.put('/:groupId/messages/:messageId', requireAuth, groupMessageController.editMessage);

// Delete a message
router.delete('/:groupId/messages/:messageId', requireAuth, groupMessageController.deleteMessage);

// ==================== GENERIC GROUP ROUTES (SHOULD BE LAST) ====================

// Update group details
router.put('/:groupId', requireAuth, groupController.updateGroup);

// Delete group
router.delete('/:groupId', requireAuth, groupController.deleteGroup);

// Get single group - THIS SHOULD BE LAST (CATCH-ALL)
router.get('/:groupId', requireAuth, groupController.getGroup);



module.exports = router;