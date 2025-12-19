// controllers/adminGroupController.js
const NeedPost = require('../models/NeedPost');
const Group = require('../models/Group');
const Notification = require('../models/Notification');

// @desc    Admin: Get all posts with moderation features
// @route   GET /api/admin/need-posts
// @access  Private/Admin
exports.adminGetAllNeedPosts = async (req, res) => {
    try {
        const {
            status,
            type,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (type) {
            query.type = type;
        }

        // Admin can see expired posts too
        // query.expirationDate = { $gt: new Date() }; // REMOVED for admin

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const posts = await NeedPost.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email role')
            .populate('interestedUsers.userId', 'name email');

        const total = await NeedPost.countDocuments(query);

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error("Admin get all need posts error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
};

// @desc    Admin: Update post status (moderation)
// @route   PUT /api/admin/need-posts/:id/status
// @access  Private/Admin
exports.adminUpdatePostStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;

        if (!['open', 'closed', 'fulfilled', 'archived', 'flagged'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const post = await NeedPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Store previous status for notification
        const previousStatus = post.status;
        post.status = status;
        post.updatedAt = new Date();

        await post.save();

        // Notify post creator if status changed by admin
        if (previousStatus !== status && post.createdBy) {
            await Notification.create({
                user: post.createdBy,
                type: 'post_moderated',
                title: 'Post Status Updated',
                message: `Your post "${post.title}" status has been changed to ${status} by admin. ${reason ? `Reason: ${reason}` : ''}`,
                relatedTo: {
                    modelType: 'NeedPost',
                    itemId: post._id
                }
            });
        }

        res.json({
            success: true,
            message: "Post status updated successfully",
            data: post
        });
    } catch (err) {
        console.error("Admin update post status error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
};

// @desc    Admin: Get all groups with admin features
// @route   GET /api/admin/groups
// @access  Private/Admin
exports.adminGetAllGroups = async (req, res) => {
    try {
        const {
            status,
            type,
            privacy,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (type) {
            query.type = type;
        }

        if (privacy) {
            query.privacy = privacy;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const groups = await Group.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('creator', 'name email role')
            .populate('members.user', 'name email')
            .populate('joinRequests.user', 'name email');

        const total = await Group.countDocuments(query);

        res.json({
            success: true,
            data: {
                groups,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error("Admin get all groups error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
};

// @desc    Admin: Update group status
// @route   PUT /api/admin/groups/:id/status
// @access  Private/Admin
exports.adminUpdateGroupStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;

        if (!['active', 'inactive', 'archived', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const previousStatus = group.status;
        group.status = status;
        group.updatedAt = new Date();

        await group.save();

        // Notify all group members
        for (const member of group.members) {
            await Notification.create({
                user: member.user,
                type: 'group_moderated',
                title: 'Group Status Updated',
                message: `Your group "${group.name}" status has been changed to ${status} by admin. ${reason ? `Reason: ${reason}` : ''}`,
                relatedTo: {
                    modelType: 'Group',
                    itemId: group._id
                }
            });
        }

        res.json({
            success: true,
            message: "Group status updated successfully",
            data: group
        });
    } catch (err) {
        console.error("Admin update group status error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
};

// @desc    Admin: Get system analytics
// @route   GET /api/admin/groups/analytics
// @access  Private/Admin
exports.getGroupAnalytics = async (req, res) => {
    try {
        // Get total counts
        const totalPosts = await NeedPost.countDocuments();
        const totalGroups = await Group.countDocuments();
        const activePosts = await NeedPost.countDocuments({ status: 'open', expirationDate: { $gt: new Date() } });
        const activeGroups = await Group.countDocuments({ status: 'active' });

        // Get posts by type
        const postsByType = await NeedPost.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get groups by type
        const groupsByType = await Group.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentPosts = await NeedPost.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        const recentGroups = await Group.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Get user engagement stats
        const postsWithInterest = await NeedPost.countDocuments({
            'interestedUsers.0': { $exists: true }
        });

        const groupsWithMembers = await Group.countDocuments({
            'members.1': { $exists: true } // More than 1 member
        });

        res.json({
            success: true,
            data: {
                overview: {
                    totalPosts,
                    totalGroups,
                    activePosts,
                    activeGroups,
                    postsWithInterest,
                    groupsWithMembers,
                    engagementRate: totalPosts > 0 ? (postsWithInterest / totalPosts * 100).toFixed(1) : 0
                },
                byType: {
                    posts: postsByType,
                    groups: groupsByType
                },
                recentActivity: {
                    last7Days: {
                        posts: recentPosts,
                        groups: recentGroups
                    }
                }
            }
        });
    } catch (err) {
        console.error("Get group analytics error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
};