// controllers/groupController.js
const { Group, GroupMessage } = require('../models/Group');
const Notification = require('../models/Notification');
const NeedPost = require('../models/NeedPost');
const User = require('../models/User');

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
exports.getAllGroups = async (req, res) => {
    try {
        const {
            type,
            status = 'active',
            privacy,
            page = 1,
            limit = 20,
            search
        } = req.query;

        // Build query
        let query = { status: { $in: ['active', 'full'] } };

        if (type && ['study', 'transport'].includes(type)) {
            query.type = type;
        }

        if (privacy && ['public', 'private'].includes(privacy)) {
            query.privacy = privacy;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { route: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const groups = await Group.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('creator', 'name email');

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
        console.error("Get all groups error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching groups",
            error: err.message
        });
    }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate('creator', 'name email')
            .populate('members.user', 'name email')
            .populate('joinRequests.user', 'name email');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        res.json({
            success: true,
            data: group
        });
    } catch (err) {
        console.error("Get group error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching group",
            error: err.message
        });
    }
};


// @desc    Request to join group
// @route   POST /api/groups/:id/join-request
// @access  Private
exports.requestToJoinGroup = async (req, res) => {
    try {
        const user = req.user;

        console.log('🎯 REQUEST TO JOIN GROUP:', {
            userId: user.id,
            userRole: user.role,
            groupId: req.params.groupId, // ✅ Changed from id to groupId
            body: req.body
        });

        // 🚨 Prevent admins from joining groups
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admins cannot join or interact with groups."
            });
        }

        const { message = '' } = req.body;

        const group = await Group.findById(req.params.groupId); // ✅ Changed from id to groupId

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // ... rest of the function remains the same
    } catch (err) {
        console.error("Join request error:", err);
        res.status(500).json({
            success: false,
            message: "Server error sending join request",
            error: err.message
        });
    }
};


// @desc    Update group details
// @route   PUT /api/groups/:id
// @access  Private (group creator only)
// Update Group
exports.updateGroup = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.params; // ✅ Changed from id to groupId
        const { name, description, privacy, maxMembers } = req.body;

        console.log('🔄 UPDATE GROUP:', {
            userId: user.id,
            groupId: groupId,
            updates: req.body
        });

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is the group creator
        // FIX: Compare ObjectId properly
        if (group.creator.toString() !== user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only group creator can update the group"
            });
        }

        // Update fields
        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (maxMembers) group.maxMembers = maxMembers;

        // Only update privacy for study groups
        if (privacy && group.type === 'study') {
            group.privacy = privacy;
        }

        // Transport groups are always private
        if (group.type === 'transport') {
            group.privacy = 'private';
        }

        group.updatedAt = new Date();
        await group.save();

        res.json({
            success: true,
            message: "Group updated successfully",
            data: group
        });

    } catch (err) {
        console.error('🔥 Update group error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update group',
            error: err.message
        });
    }
};
// @desc    Approve/reject join request
// @route   PUT /api/groups/:groupId/requests/:requestId
// @access  Private (group member only)
exports.handleJoinRequest = async (req, res) => {
    try {
        const user = req.user;
        const { status } = req.body;

        console.log('🎯 HANDLE JOIN REQUEST:', {
            userId: user.id,
            groupId: req.params.groupId,
            requestId: req.params.requestId,
            status: status
        });

        // 🚨 Admins cannot handle group requests
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admins cannot manage group requests."
            });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be 'approved' or 'rejected'"
            });
        }

        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is group member
        const isMember = group.members.some(
            member => member.user.toString() === user.id
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Only group members can handle join requests"
            });
        }

        // Find the request
        const requestIndex = group.joinRequests.findIndex(
            request => request._id.toString() === req.params.requestId
        );

        if (requestIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Join request not found"
            });
        }

        const request = group.joinRequests[requestIndex];

        // Update request status
        group.joinRequests[requestIndex].status = status;

        if (status === 'approved') {
            // Check if group has space
            if (group.members.length >= group.maxMembers) {
                return res.status(400).json({
                    success: false,
                    message: "Group is full, cannot approve more members"
                });
            }

            // Get user info for the requester
            const requestUser = await User.findById(request.user);

            // Add user to members
            group.members.push({
                user: request.user,
                name: requestUser?.name || request.name,
                email: requestUser?.email || request.email || `${request.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
            });

            // Update last activity
            group.lastActivity = new Date();

            // Create notification for requester
            await Notification.create({
                user: request.user,
                type: 'request_approved',
                title: 'Join Request Approved',
                message: `Your request to join "${group.name}" has been approved`,
                relatedTo: {
                    modelType: 'Group',
                    itemId: group._id
                }
            });

            // Notify group members about new member (except the new member)
            for (const member of group.members) {
                if (member.user.toString() !== request.user.toString()) {
                    await Notification.create({
                        user: member.user,
                        type: 'new_member',
                        title: 'New Group Member',
                        message: `${request.name} has joined the group "${group.name}"`,
                        relatedTo: {
                            modelType: 'Group',
                            itemId: group._id
                        }
                    });
                }
            }
        } else {
            // Rejected request
            await Notification.create({
                user: request.user,
                type: 'request_rejected',
                title: 'Join Request Rejected',
                message: `Your request to join "${group.name}" has been rejected`,
                relatedTo: {
                    modelType: 'Group',
                    itemId: group._id
                }
            });
        }

        await group.save();

        res.json({
            success: true,
            message: `Join request ${status} successfully`,
            data: group
        });
    } catch (err) {
        console.error("Handle join request error:", err);
        res.status(500).json({
            success: false,
            message: "Server error handling join request",
            error: err.message
        });
    }
};

// @desc    Get user's groups
// @route   GET /api/groups/user/my-groups
// @access  Private
exports.getUserGroups = async (req, res) => {
    try {
        const user = req.user;

        console.log('🎯 GET USER GROUPS:', { userId: user.id });

        // Get full user to get ObjectId
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const groups = await Group.find({
            $or: [
                { creator: fullUser._id },
                { 'members.user': fullUser._id }
            ]
        })
            .sort({ lastActivity: -1 })
            .populate('creator', 'name email');

        res.json({
            success: true,
            data: groups
        });
    } catch (err) {
        console.error("Get user groups error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching user groups",
            error: err.message
        });
    }
};

// @desc    Leave group
// @route   DELETE /api/groups/:id/leave
// @access  Private
// In your groupController.js - Update leaveGroup function
exports.leaveGroup = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.params; // ✅ Changed from id to groupId

        console.log('🎯 LEAVE GROUP:', {
            userId: user.id,
            groupId: groupId
        });

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // ... rest of the function remains the same
    } catch (err) {
        console.error('🔥 Leave group error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to leave group',
            error: err.message
        });
    }
};


// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private (group creator only)
exports.deleteGroup = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.params; // ✅ Changed from id to groupId

        console.log('🗑️ DELETE GROUP:', {
            userId: user.id,
            groupId: groupId
        });

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is the group creator
        if (group.creator.toString() !== user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the group creator can delete the group"
            });
        }

        // ... rest of the function remains the same
    } catch (err) {
        console.error('🔥 Delete group error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete group',
            error: err.message
        });
    }
};


// @desc    Add members from interested users to group
// @route   POST /api/groups/:id/add-members
// @access  Private (group creator only)
exports.addMembersToGroup = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.params;
        const { userIds } = req.body;

        console.log('🎯 ADD_MEMBERS_REQUEST:', {
            userId: user.id,
            groupId: groupId,
            userIds: userIds
        });

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of user IDs'
            });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if current user is the group creator
        if (group.creator.toString() !== user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only group creator can add members'
            });
        }

        // Check capacity
        const currentMemberCount = group.members.length;
        const newTotal = currentMemberCount + userIds.length;

        if (newTotal > group.maxMembers) {
            return res.status(400).json({
                success: false,
                message: `Cannot add ${userIds.length} members. Would exceed maximum capacity (${group.maxMembers})`
            });
        }

        // Get user details
        const users = await User.find({ _id: { $in: userIds } }, 'name email');

        // Filter out already existing members
        const existingMemberIds = group.members.map(member =>
            member.user.toString()
        );

        const usersToAdd = [];

        for (const userId of userIds) {
            const userIdStr = userId.toString();

            // Skip if already a member
            if (existingMemberIds.includes(userIdStr)) {
                console.log(`⚠️ User ${userIdStr} is already a member, skipping`);
                continue;
            }

            const user = users.find(u => u._id.toString() === userIdStr);

            usersToAdd.push({
                user: userId,
                name: user?.name || 'Unknown User',
                email: user?.email || '',
                role: 'member',
                joinedAt: new Date()
            });
        }

        if (usersToAdd.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'All selected users are already members of this group'
            });
        }

        // Add new members
        group.members.push(...usersToAdd);
        await group.save();

        console.log(`✅ Added ${usersToAdd.length} new members to group ${groupId}`);

        // Update interest status in the original need post
        if (group.createdFromPost) {
            try {
                const post = await NeedPost.findById(group.createdFromPost);
                if (post && post.interestedUsers) {
                    let updatedCount = 0;

                    for (const interest of post.interestedUsers) {
                        const interestUserId = interest.userId?.toString();

                        // Check if this user was just added to the group
                        if (interestUserId && userIds.some(id => id.toString() === interestUserId)) {
                            if (interest.status === 'pending') {
                                interest.status = 'approved';
                                interest.updatedAt = new Date();
                                updatedCount++;
                            }
                        }
                    }

                    if (updatedCount > 0) {
                        await post.save();
                        console.log(`✅ Updated ${updatedCount} interest records to 'approved'`);
                    }
                }
            } catch (postErr) {
                console.error('⚠️ Failed to update post interest status:', postErr.message);
                // Don't fail the main request - this is secondary
            }
        }

        res.json({
            success: true,
            message: `Successfully added ${usersToAdd.length} member(s) to "${group.name}"`,
            data: {
                addedCount: usersToAdd.length,
                group: await Group.findById(groupId).populate('members.user', 'name email')
            }
        });

    } catch (err) {
        console.error('🔥 Add members to group error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to add members to group',
            error: err.message
        });
    }
};

// @desc    Get groups created from a specific post
// @route   GET /api/groups/from-post/:postId
// @access  Private
exports.getGroupsFromPost = async (req, res) => {
    try {
        const groups = await Group.find({ createdFromPost: req.params.postId })
            .populate('creator', 'name email')
            .populate('members.user', 'name email');

        res.json({
            success: true,
            data: groups
        });
    } catch (err) {
        console.error("Get groups from post error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching groups",
            error: err.message
        });
    }
};

// @desc    Get join requests for a group
// @route   GET /api/groups/:groupId/requests
// @access  Private (group members only)
exports.getJoinRequests = async (req, res) => {
    try {
        const user = req.user;
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is a member
        const isMember = group.members.some(
            member => member.user.toString() === user.id
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Only group members can view join requests"
            });
        }

        // Populate user info for requests
        await group.populate('joinRequests.user', 'name email');

        res.json({
            success: true,
            data: group.joinRequests
        });
    } catch (err) {
        console.error("Get join requests error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching join requests",
            error: err.message
        });
    }
};

// @desc    Check if user is member of group (helper method)
// @route   N/A
// @access  N/A
exports.isMember = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) return false;

    return group.members.some(
        member => member.user.toString() === userId.toString()
    );
};

// @desc    Check if user has pending request (helper method)
// @route   N/A
// @access  N/A
exports.hasPendingRequest = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) return false;

    return group.joinRequests.some(
        request => request.user.toString() === userId.toString() && request.status === 'pending'
    );
};