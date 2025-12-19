// controllers/groupController.js
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const NeedPost = require('../models/NeedPost');          // ✅ ADD THIS
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
// backend/controllers/groupController.js
exports.getGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate('creator', 'name email')
            .populate('members.user', 'name email');

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

        // 🚨 Prevent admins from joining groups
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admins cannot join or interact with groups."
            });
        }

        const { message = '' } = req.body;

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if group is accepting members
        if (group.status === 'full') {
            return res.status(400).json({
                success: false,
                message: "This group is full"
            });
        }

        if (group.status === 'inactive' || group.status === 'archived') {
            return res.status(400).json({
                success: false,
                message: "This group is not active"
            });
        }

        // Check if user is already a member
        if (group.isMember(user._id)) {
            return res.status(400).json({
                success: false,
                message: "You are already a member of this group"
            });
        }

        // Check if user already has a pending request
        if (group.hasPendingRequest(user._id)) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending request to join this group"
            });
        }

        // Check gender restriction
        if (group.genderRestriction !== 'any') {
            // In a real app, you'd check user's gender from profile
            // For now, we'll skip this check
        }

        // Add join request
        group.joinRequests.push({
            user: user._id,
            name: user.name,
            message,
            status: 'pending'
        });

        await group.save();

        // Create notification for group creator
        await Notification.create({
            user: group.creator,
            type: 'group_join_request',
            title: 'New Join Request',
            message: `${user.name} wants to join your group "${group.name}"`,
            relatedTo: {
                modelType: 'Group',
                itemId: group._id
            }
        });

        res.json({
            success: true,
            message: "Join request sent successfully",
            data: group
        });
    } catch (err) {
        console.error("Join request error:", err);
        res.status(500).json({
            success: false,
            message: "Server error sending join request",
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
            member => member.user.toString() === user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Only group members can handle join requests"
            });
        }

        // Find the request
        const requestIndex = group.joinRequests.findIndex(
            req => req._id.toString() === req.params.requestId
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

            // Add user to members
            group.members.push({
                user: request.user,
                name: request.name,
                email: request.email || `${request.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
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

            // Notify group members about new member
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

        const groups = await Group.find({
            $or: [
                { creator: user._id },
                { 'members.user': user._id }
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
exports.leaveGroup = async (req, res) => {
    try {
        const user = req.user;

        // 🚨 Prevent admins from leaving groups (they shouldn't be members)
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admins cannot leave groups."
            });
        }

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is member
        const memberIndex = group.members.findIndex(
            m => m.user.toString() === user._id.toString()
        );

        if (memberIndex === -1) {
            return res.status(400).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        // Cannot leave if you're the creator and group has other members
        if (group.creator.toString() === user._id.toString() && group.members.length > 1) {
            return res.status(400).json({
                success: false,
                message: "Group creator cannot leave. Transfer ownership or delete group first."
            });
        }

        // Remove user from members
        group.members.splice(memberIndex, 1);

        // Update last activity
        group.lastActivity = new Date();

        // If creator leaves and no members left, archive group
        if (group.creator.toString() === user._id.toString() && group.members.length === 0) {
            group.status = 'archived';
        }

        await group.save();

        res.json({
            success: true,
            message: "Left group successfully"
        });
    } catch (err) {
        console.error("Leave group error:", err);
        res.status(500).json({
            success: false,
            message: "Server error leaving group",
            error: err.message
        });
    }
};

exports.createGroupFromPost = async (req, res) => {
    try {
        const user = req.user;

        // 🚨 Prevent admins from creating groups
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admins cannot create or manage groups."
            });
        }

        const { groupName, description, maxMembers = 5, privacy = 'public' } = req.body;

        const post = await NeedPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Need post not found"
            });
        }

        // Check if user is the creator
        if (post.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the post creator can create a group from this post"
            });
        }

        // Check if group already exists
        const existingGroup = await Group.findOne({ createdFromPost: post._id });
        if (existingGroup) {
            return res.status(400).json({
                success: false,
                message: "A group has already been created from this post"
            });
        }

        // Create group with ONLY creator as member
        const group = await Group.create({
            name: groupName || `${post.type} Group for ${post.title}`,
            description: description || post.description,
            type: post.type,
            privacy: post.type === 'transport' ? 'private' : privacy,
            genderRestriction: post.genderPreference,
            createdFromPost: post._id,
            subject: post.subject,
            courseCode: post.courseCode,
            route: post.route,
            vehicleType: post.vehicleType,
            schedule: post.schedule,
            creator: user._id,
            creatorName: user.name,
            creatorRole: 'student',
            members: [{  // ✅ Only creator initially
                user: user._id,
                name: user.name,
                email: user.email
            }],
            maxMembers: Math.max(2, Math.min(maxMembers, 50)),
            status: 'active'
        });

        // ✅ DO NOT close the post - keep it open for more interest
        // post.status = 'closed';  // ❌ REMOVE THIS LINE
        await post.save();

        // ✅ Notify interested users to REQUEST to join (not auto-add)
        for (const interest of post.interestedUsers) {
            if (interest.status === 'pending') {
                await Notification.create({
                    user: interest.userId,
                    type: 'group_created',
                    title: 'Group Created from Post',
                    message: `A group has been created from the post "${post.title}" you expressed interest in. Click to view and request to join.`,
                    relatedTo: {
                        modelType: 'Group',
                        itemId: group._id
                    }
                });
            }
        }

        res.status(201).json({
            success: true,
            message: "Group created successfully! Interested users have been notified to request to join.",
            data: group
        });
    } catch (err) {
        console.error("Create group from post error:", err);
        res.status(500).json({
            success: false,
            message: "Server error creating group",
            error: err.message
        });
    }
};

// @desc    Add members from interested users to group
// @route   POST /api/groups/:id/add-members
// @access  Private (group creator only)
// controllers/groupController.js (UPDATED FUNCTION)

exports.addMembersToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userIds } = req.body;

        console.log('🎯 ADD_MEMBERS_REQUEST:', {
            groupId,
            userIds,
            body: req.body
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
            typeof member.user === 'object' ? member.user.toString() : member.user.toString()
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

        // 🚨 CRITICAL: Update interest status in the original need post
        if (group.createdFromPost) {
            try {
                const post = await NeedPost.findById(group.createdFromPost);
                if (post && post.interestedUsers) {
                    let updatedCount = 0;

                    for (const interest of post.interestedUsers) {
                        const interestUserId = interest.userId.toString();

                        // Check if this user was just added to the group
                        if (userIds.some(id => id.toString() === interestUserId)) {
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

// Add to groupController.js - after the existing methods

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
            member => member.user.toString() === user._id.toString()
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