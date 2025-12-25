
const User = require("../models/User");

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await User.getDashboardStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (err) {
        console.error("Get dashboard stats error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Get all users (with filtering)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;

        // Build query
        let query = {};

        if (role) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error("Get all users error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error("Get user by ID error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role || !['student', 'admin', 'faculty'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Valid role required: student, admin, or faculty"
            });
        }

        // Don't allow self-demotion
        if (req.params.id === req.user._id.toString() && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: "Cannot change your own role from admin"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "User role updated successfully",
            data: user
        });
    } catch (err) {
        console.error("Update user role error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        // Don't allow self-deletion
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete your own account"
            });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Create new user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role = 'student' } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email, and password"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password: password, // You might want to hash this
            role
        });

        // Return user data (without password)
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: userResponse
        });
    } catch (err) {
        console.error("Create user error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res) => {
    try {
        // You can add more statistics here based on your models
        const userStats = await User.getDashboardStats();

        // Example additional stats
        const systemStats = {
            users: userStats,
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
                platform: process.platform
            },
            database: {
                collections: (await User.db.db.listCollections().toArray()).length
            }
        };

        res.json({
            success: true,
            data: systemStats
        });
    } catch (err) {
        console.error("Get system stats error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
