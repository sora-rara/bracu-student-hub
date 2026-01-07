// controllers/needPostController.js
const NeedPost = require('../models/NeedPost');
const { Group } = require('../models/Group');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a new need post
// @route   POST /api/need-posts
// @access  Private
exports.createNeedPost = async (req, res) => {
    try {
        const user = req.user;

        console.log('🎯 CREATE NEED POST REQUEST:', {
            userId: user.id,
            userRole: user.role,
            body: req.body
        });

        // 🚨 Prevent admins from creating posts
        if (user.role === 'admin') {
            console.log('❌ Admin trying to create post');
            return res.status(403).json({
                success: false,
                message: "Admins cannot create need posts. Use moderation features instead."
            });
        }

        // Get the full user from database to get ObjectId
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const {
            title,
            description,
            type,
            genderPreference = 'any',
            subject,
            courseCode,
            meetingFrequency,
            route,
            vehicleType,
            schedule,
            maxMembers = 1
        } = req.body;

        // Validation
        if (!title || !description || !type) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and type are required"
            });
        }

        if (!['study', 'transport'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be either 'study' or 'transport'"
            });
        }

        // Convert maxMembers to number
        const maxMembersNum = parseInt(maxMembers) || 1;

        // Create the post with fullUser._id for Mongoose
        const needPost = await NeedPost.create({
            title,
            description,
            type,
            createdBy: fullUser._id, // ✅ Use the ObjectId from database
            createdByName: fullUser.name,
            createdByEmail: fullUser.email,
            createdByRole: 'student',
            genderPreference,
            subject: type === 'study' ? subject : undefined,
            courseCode: type === 'study' ? courseCode : undefined,
            meetingFrequency: type === 'study' ? meetingFrequency : undefined,
            route: type === 'transport' ? route : undefined,
            vehicleType: type === 'transport' ? vehicleType : undefined,
            schedule: type === 'transport' ? schedule : undefined,
            maxMembers: maxMembersNum,
            currentMembers: 1
        });

        res.status(201).json({
            success: true,
            message: "Need post created successfully",
            data: needPost
        });
    } catch (err) {
        console.error("Create need post error:", err);
        res.status(500).json({
            success: false,
            message: "Server error creating need post",
            error: err.message
        });
    }
};

// @desc    Get all need posts
// @route   GET /api/need-posts
// @access  Private
exports.getAllNeedPosts = async (req, res) => {
    try {
        const {
            type,
            status = 'open',
            page = 1,
            limit = 20,
            search,
            gender
        } = req.query;

        // Build query
        let query = { status: 'open' };

        if (type && ['study', 'transport'].includes(type)) {
            query.type = type;
        }

        if (gender && ['any', 'female-only', 'male-only'].includes(gender)) {
            query.genderPreference = gender;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { route: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter out expired posts
        query.expirationDate = { $gt: new Date() };

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const posts = await NeedPost.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email');

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
        console.error("Get all need posts error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching need posts",
            error: err.message
        });
    }
};

// @desc    Get single need post
// @route   GET /api/need-posts/:id
// @access  Private
exports.getNeedPost = async (req, res) => {
    try {
        const post = await NeedPost.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('interestedUsers.userId', 'name email');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Need post not found"
            });
        }

        res.json({
            success: true,
            data: post
        });
    } catch (err) {
        console.error("Get need post error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching need post",
            error: err.message
        });
    }
};

// @desc    Express interest in a need post
// @route   POST /api/need-posts/:id/express-interest
// @access  Private
exports.expressInterest = async (req, res) => {
    try {
        const user = req.user;

        console.log('🎯 EXPRESS INTEREST REQUEST:', {
            userId: user.id,
            userRole: user.role,
            postId: req.params.id,
            body: req.body
        });

        // 🚨 Prevent admins from expressing interest
        if (user.role === 'admin') {
            console.log('❌ Admin trying to express interest');
            return res.status(403).json({
                success: false,
                message: "Admins cannot express interest in posts."
            });
        }

        const { message = '' } = req.body;
        console.log('📝 Message:', message);

        const post = await NeedPost.findById(req.params.id);

        if (!post) {
            console.log('❌ Post not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: "Need post not found"
            });
        }

        console.log('📌 Found post:', {
            id: post._id,
            title: post.title,
            status: post.status,
            createdBy: post.createdBy,
            interestedUsersCount: post.interestedUsers?.length || 0
        });

        // Check if post is open
        if (post.status !== 'open') {
            console.log('❌ Post is not open:', post.status);
            return res.status(400).json({
                success: false,
                code: 'POST_CLOSED',
                message: "This post is no longer accepting interest"
            });
        }

        // Check if user is the creator
        if (post.createdBy.toString() === user.id) {
            console.log('❌ User is trying to express interest in their own post');
            return res.status(400).json({
                success: false,
                code: 'OWN_POST',
                message: "You cannot express interest in your own post"
            });
        }

        // ✅ FIXED: Check if already expressed interest - add null check
        const alreadyInterested = post.interestedUsers?.some(interest => {
            // ✅ Check if interest.userId exists before calling toString()
            if (!interest.userId) {
                console.log('⚠️ Found interest without userId:', interest);
                return false; // Skip entries without userId
            }
            return interest.userId.toString() === user.id;
        });

        if (alreadyInterested) {
            console.log('❌ User already expressed interest');
            return res.status(400).json({
                success: false,
                code: 'ALREADY_INTERESTED',
                message: "You have already expressed interest in this post"
            });
        }

        // Check if post has reached max members
        if (post.currentMembers >= post.maxMembers) {
            console.log('❌ Post reached max members:', {
                current: post.currentMembers,
                max: post.maxMembers
            });
            return res.status(400).json({
                success: false,
                code: 'POST_FULL',
                message: "This post has reached its maximum number of members"
            });
        }

        // Get full user info from database
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Add interest
        const newInterest = {
            userId: fullUser._id,
            name: fullUser.name,
            email: fullUser.email,
            message: message || '',
            status: 'pending',
            requestedAt: new Date()
        };

        console.log('➕ Adding interest:', newInterest);

        if (!post.interestedUsers) {
            post.interestedUsers = [];
        }

        post.interestedUsers.push(newInterest);
        await post.save();

        console.log('✅ Interest added successfully');

        // Create notification for post creator
        await Notification.create({
            user: post.createdBy,
            type: 'post_interest',
            title: 'New Interest in Your Post',
            message: `${fullUser.name} has expressed interest in your post: "${post.title}"`,
            relatedTo: {
                modelType: 'NeedPost',
                itemId: post._id
            }
        });

        console.log('📧 Notification created for post creator');

        res.json({
            success: true,
            message: "Interest expressed successfully",
            data: {
                _id: post._id,
                title: post.title,
                interestedUsers: post.interestedUsers
            }
        });

    } catch (err) {
        console.error("🔥 Express interest error:", err);
        console.error("🔥 Error stack:", err.stack);
        res.status(500).json({
            success: false,
            message: "Server error expressing interest",
            error: err.message
        });
    }
};

// @desc    Create group from need post
// @route   POST /api/need-posts/:id/create-group
// @access  Private (only post creator)
// In needPostController.js - update createGroupFromPost
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
        if (post.createdBy.toString() !== user.id) {
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

        // Get full user info
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Determine privacy: transport groups are always private
        const groupPrivacy = post.type === 'transport' ? 'private' : privacy;

        // Create group
        const group = await Group.create({
            name: groupName || `${post.type} Group for ${post.title}`,
            description: description || post.description,
            type: post.type,
            privacy: groupPrivacy,
            genderRestriction: post.genderPreference,
            createdFromPost: post._id,
            subject: post.subject,
            courseCode: post.courseCode,
            route: post.route,
            vehicleType: post.vehicleType,
            schedule: post.schedule,
            creator: fullUser._id,
            creatorName: fullUser.name,
            creatorRole: 'student',
            members: [{
                user: fullUser._id,
                name: fullUser.name,
                email: fullUser.email,
                role: 'moderator' // Creator is a moderator
            }],
            maxMembers: Math.max(2, Math.min(maxMembers, 50)),
            status: 'active'
        });

        // Notify interested users
        for (const interest of post.interestedUsers) {
            if (interest.status === 'pending' && interest.userId) {
                await Notification.create({
                    user: interest.userId,
                    type: 'group_created',
                    title: 'Group Created from Post',
                    message: `A ${groupPrivacy} group has been created from the post "${post.title}" you expressed interest in. ${groupPrivacy === 'private' ? 'You need to request to join.' : 'You can join directly.'}`,
                    relatedTo: {
                        modelType: 'Group',
                        itemId: group._id
                    }
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Group created successfully! ${groupPrivacy === 'private' ? 'Interested users have been notified to request to join.' : 'Group is open for joining.'}`,
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

// @desc    Get user's need posts
// @route   GET /api/need-posts/user/my-posts
// @access  Private
exports.getUserNeedPosts = async (req, res) => {
    try {
        const user = req.user;

        // Get full user to get ObjectId
        const fullUser = await User.findById(user.id);
        if (!fullUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const posts = await NeedPost.find({ createdBy: fullUser._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: posts
        });
    } catch (err) {
        console.error("Get user need posts error:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching user posts",
            error: err.message
        });
    }
};

// @desc    Delete need post
// @route   DELETE /api/need-posts/:id
// @access  Private
exports.deleteNeedPost = async (req, res) => {
    try {
        const user = req.user;
        const post = await NeedPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check if user is creator or admin
        if (post.createdBy.toString() !== user.id && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this post"
            });
        }

        await post.deleteOne();

        res.json({
            success: true,
            message: "Post deleted successfully"
        });
    } catch (err) {
        console.error("Delete post error:", err);
        res.status(500).json({
            success: false,
            message: "Server error deleting post",
            error: err.message
        });
    }
};

// @desc    Close need post manually
// @route   PUT /api/need-posts/:id/close
// @access  Private (post creator or admin)
exports.closeNeedPost = async (req, res) => {
    try {
        const user = req.user;
        const { reason = '' } = req.body;

        const post = await NeedPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check if user is creator or admin
        if (post.createdBy.toString() !== user.id && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Only post creator or admin can close this post"
            });
        }

        // Check if post is already closed
        if (post.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: `Post is already ${post.status}`
            });
        }

        post.status = 'closed';
        post.updatedAt = new Date();
        await post.save();

        res.json({
            success: true,
            message: "Post closed successfully",
            data: post
        });
    } catch (err) {
        console.error("Close post error:", err);
        res.status(500).json({
            success: false,
            message: "Server error closing post",
            error: err.message
        });
    }
};