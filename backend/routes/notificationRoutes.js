// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/adminMiddleware');

// All routes require authentication
router.use(requireAuth);

router.route('/')
    .get(getNotifications);

router.put('/read-all', markAllAsRead);

router.route('/:id')
    .put(markAsRead)
    .delete(deleteNotification);

module.exports = router;