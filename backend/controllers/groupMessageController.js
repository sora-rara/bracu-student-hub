// controllers/groupMessageController.js
const { Group, GroupMessage } = require('../models/Group');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Post a message in group
// @route   POST /api/groups/:groupId/messages
// @access  Private (group members only)
exports.postMessage = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.params;
        const { content, attachments = [] } = req.body;

        console.log('🎯 POST GROUP MESSAGE:', {
            userId: user.id,
            groupId: groupId,
            contentLength: content?.length
        });

        // Get full user info
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is a member of the group
        const isMember = group.members.some(
            member => member.user.toString() === fullUser._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Only group members can post messages"
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Message content is required"
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Message cannot exceed 1000 characters"
            });
        }

        // Create the message
        const message = await GroupMessage.create({
            group: group._id,
            user: fullUser._id,
            userName: fullUser.name,
            content: content.trim(),
            attachments: attachments.map(att => ({
                filename: att.filename,
                url: att.url,
                fileType: att.fileType
            }))
        });

        // Update group's last activity and last message time
        group.lastActivity = new Date();
        group.lastMessageAt = new Date();
        await group.save();

        // Populate user info
        await message.populate('user', 'name email');

        // Create notifications for other group members (except the sender)
        const otherMembers = group.members.filter(
            member => member.user.toString() !== fullUser._id.toString()
        );

        // Only notify members who have been active recently (optional)
        for (const member of otherMembers) {
            await Notification.create({
                user: member.user,
                type: 'group_message',
                title: 'New Message in Group',
                message: `${fullUser.name} posted a message in "${group.name}"`,
                relatedTo: {
                    modelType: 'Group',
                    itemId: group._id
                }
            });
        }

        res.status(201).json({
            success: true,
            message: "Message posted successfully",
            data: message
        });

    } catch (err) {
        console.error('🔥 Post group message error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to post message',
            error: err.message
        });
    }
};

// @desc    Get group messages
// @route   GET /api/groups/:groupId/messages
// @access  Private (group members only)
// controllers/groupMessageController.js - in getMessages function
// controllers/groupMessageController.js - Fix getMessages function

exports.getMessages = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        console.log('🎯 GET GROUP MESSAGES:', {
            userId: user.id,
            groupId: groupId
        });

        // Check if user exists (simplified)
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check membership
        const isMember = group.members.some(
            member => member.user.toString() === user.id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Only group members can view messages"
            });
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get messages with proper population
        const messages = await GroupMessage.find({ group: groupId })
            .populate({
                path: 'user',
                select: 'name email profilePicture'
            })
            .populate({
                path: 'likes.user',
                select: 'name'
            })
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limitNum)
            .lean(); // Convert to plain objects

        const totalMessages = await GroupMessage.countDocuments({ group: groupId });

        // Transform the data for frontend
        const transformedMessages = messages.map(message => ({
            ...message,
            _id: message._id.toString(),
            user: message.user ? {
                _id: message.user._id.toString(),
                name: message.user.name,
                email: message.user.email,
                profilePicture: message.user.profilePicture
            } : null,
            likes: message.likes.map(like => ({
                ...like,
                user: like.user ? {
                    _id: like.user._id.toString(),
                    name: like.user.name
                } : null,
                _id: like._id ? like._id.toString() : null
            }))
        }));

        console.log(`Found ${transformedMessages.length} messages for group ${groupId}`);

        res.json({
            success: true,
            data: {
                messages: transformedMessages,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalMessages,
                    pages: Math.ceil(totalMessages / limitNum)
                }
            }
        });

    } catch (err) {
        console.error('🔥 Get group messages error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get messages',
            error: err.message
        });
    }
};
// @desc    Like/unlike a message
// @route   POST /api/groups/:groupId/messages/:messageId/like
// @access  Private (group members only)
exports.toggleLike = async (req, res) => {
    try {
        const user = req.user;
        const { groupId, messageId } = req.params;

        console.log('🎯 TOGGLE MESSAGE LIKE:', {
            userId: user.id,
            groupId: groupId,
            messageId: messageId
        });

        // Get full user info
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is a member of the group
        const isMember = group.members.some(
            member => member.user.toString() === fullUser._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Only group members can like messages"
            });
        }

        const message = await GroupMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        // Check if message belongs to this group
        if (message.group.toString() !== groupId) {
            return res.status(400).json({
                success: false,
                message: "Message does not belong to this group"
            });
        }

        // Check if user already liked the message
        const existingLikeIndex = message.likes.findIndex(
            like => like.user.toString() === fullUser._id.toString()
        );

        let action;
        if (existingLikeIndex > -1) {
            // Unlike
            message.likes.splice(existingLikeIndex, 1);
            action = 'unliked';
        } else {
            // Like
            message.likes.push({
                user: fullUser._id,
                createdAt: new Date()
            });
            action = 'liked';
        }

        await message.save();
        await message.populate('likes.user', 'name');

        res.json({
            success: true,
            message: `Message ${action} successfully`,
            data: {
                likes: message.likes,
                likeCount: message.likes.length
            }
        });

    } catch (err) {
        console.error('🔥 Toggle message like error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle like',
            error: err.message
        });
    }
};

// @desc    Delete a message
// @route   DELETE /api/groups/:groupId/messages/:messageId
// @access  Private (message owner or group moderator)
exports.deleteMessage = async (req, res) => {
    try {
        const user = req.user;
        const { groupId, messageId } = req.params;

        console.log('🎯 DELETE GROUP MESSAGE:', {
            userId: user.id,
            groupId: groupId,
            messageId: messageId
        });

        // Get full user info
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is a member of the group
        const isMember = group.members.some(
            member => member.user.toString() === fullUser._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Only group members can delete messages"
            });
        }

        const message = await GroupMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        // Check if message belongs to this group
        if (message.group.toString() !== groupId) {
            return res.status(400).json({
                success: false,
                message: "Message does not belong to this group"
            });
        }

        // Check if user is the message owner or a moderator
        const isOwner = message.user.toString() === fullUser._id.toString();
        const isModerator = group.members.some(
            member => member.user.toString() === fullUser._id.toString() &&
                member.role === 'moderator'
        );

        if (!isOwner && !isModerator) {
            return res.status(403).json({
                success: false,
                message: "Only message owner or group moderators can delete messages"
            });
        }

        await message.deleteOne();

        res.json({
            success: true,
            message: "Message deleted successfully"
        });

    } catch (err) {
        console.error('🔥 Delete group message error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: err.message
        });
    }
};

// @desc    Edit a message
// @route   PUT /api/groups/:groupId/messages/:messageId
// @access  Private (message owner only)
exports.editMessage = async (req, res) => {
    try {
        const user = req.user;
        const { groupId, messageId } = req.params;
        const { content } = req.body;

        console.log('🎯 EDIT GROUP MESSAGE:', {
            userId: user.id,
            groupId: groupId,
            messageId: messageId
        });

        // Get full user info
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is a member of the group
        const isMember = group.members.some(
            member => member.user.toString() === fullUser._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Only group members can edit messages"
            });
        }

        const message = await GroupMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        // Check if message belongs to this group
        if (message.group.toString() !== groupId) {
            return res.status(400).json({
                success: false,
                message: "Message does not belong to this group"
            });
        }

        // Check if user is the message owner
        if (message.user.toString() !== fullUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only message owner can edit messages"
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Message content is required"
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Message cannot exceed 1000 characters"
            });
        }

        // Update the message
        message.content = content.trim();
        message.isEdited = true;
        message.editedAt = new Date();

        await message.save();

        res.json({
            success: true,
            message: "Message updated successfully",
            data: message
        });

    } catch (err) {
        console.error('🔥 Edit group message error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to edit message',
            error: err.message
        });
    }
};