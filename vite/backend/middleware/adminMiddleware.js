// middleware/adminMiddleware.js
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
    console.log('🔐 [AUTH MIDDLEWARE] Checking auth...');

    if (!req.session || !req.session.userId) {
        console.log('❌ No session or userId found');
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            console.log('❌ User not found in database');
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        console.log('✅ User authenticated:', {
            id: user._id,
            email: user.email,
            role: user.role,
            isAdmin: user.role === 'admin'
        });

        // Attach user to request
        req.user = user;
        req.userId = user._id.toString();
        req.isAdmin = user.role === 'admin';

        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: "Authentication error"
        });
    }
};

const requireAdmin = async (req, res, next) => {
    console.log('👑 [ADMIN MIDDLEWARE] Checking admin access...');

    if (!req.session || !req.session.userId) {
        console.log('❌ No session for admin check');
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            console.log('❌ Admin user not found');
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== 'admin') {
            console.log('❌ User is not admin:', {
                id: user._id,
                email: user.email,
                role: user.role
            });
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        console.log('✅ Admin access granted:', {
            id: user._id,
            email: user.email,
            role: user.role
        });

        req.user = user;
        req.userId = user._id.toString();
        req.isAdmin = true;

        next();
    } catch (error) {
        console.error('❌ Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: "Authorization error"
        });
    }
};

module.exports = { requireAuth, requireAdmin };