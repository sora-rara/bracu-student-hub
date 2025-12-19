// controllers/notificationController.js
const Notification = require('../models/Notification');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const user = req.user;
        const { limit = 20, unreadOnly = false } = req.query;

        let query = { user: user._id };

        if (unreadOnly === 'true') {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({
            user: user._id,
            read: false
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (err) {
        console.error("Get notifications error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching notifications",
            error: err.message
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const user = req.user;

        const notification = await Notification.findOne({
            _id: req.params.id,
            user: user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (err) {
        console.error("Mark as read error:", err);
        res.status(500).json({
            success: false,
            message: "Server error marking notification",
            error: err.message
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        const user = req.user;

        await Notification.updateMany(
            { user: user._id, read: false },
            {
                $set: {
                    read: true,
                    readAt: new Date()
                }
            }
        );

        res.json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (err) {
        console.error("Mark all as read error:", err);
        res.status(500).json({
            success: false,
            message: "Server error marking notifications",
            error: err.message
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const user = req.user;

        const result = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: user._id
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (err) {
        console.error("Delete notification error:", err);
        res.status(500).json({
            success: false,
            message: "Server error deleting notification",
            error: err.message
        });
    }
};