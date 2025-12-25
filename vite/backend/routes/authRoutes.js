const express = require("express");
const { signup, login, getCurrentUser } = require("../controllers/authController");
const { requireAdmin, requireAuth } = require("../middleware/adminMiddleware");
const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Check authentication status
router.get("/check", (req, res) => {
    console.log('🔐 /api/auth/check endpoint called');

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Session details:', {
            sessionId: req.session?.id,
            userId: req.session?.userId,
            hasSession: !!req.session,
            hasUserId: !!req.session?.userId
        });
    }

    if (req.session && req.session.userId) {
        res.json({
            success: true,
            loggedIn: true,
            userId: req.session.userId,
            message: 'User is authenticated'
        });
    } else {
        res.json({
            success: true,
            loggedIn: false,
            message: 'User is not authenticated'
        });
    }
});

// Enhanced session debug endpoint
router.get("/session-debug", (req, res) => {
    console.log('🔐 /api/auth/session-debug endpoint called');

    const sessionInfo = {
        hasSession: !!req.session,
        sessionId: req.session?.id,
        sessionKeys: req.session ? Object.keys(req.session) : [],
        userId: req.session?.userId,
        cookie: req.session?.cookie,
        authenticatedUser: req.user || null
    };

    console.log('🔐 Session debug info:', sessionInfo);

    res.json({
        success: true,
        session: sessionInfo,
        headers: {
            cookie: req.headers.cookie,
            'user-agent': req.headers['user-agent']
        }
    });
});

// Test route - requires any authenticated user
router.get("/test-auth", requireAuth, (req, res) => {
    console.log('✅ /api/auth/test-auth - Authentication successful');

    res.json({
        success: true,
        message: 'Authentication successful',
        user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        },
        timestamp: new Date().toISOString()
    });
});

// Test route - requires admin
router.get("/test-admin", requireAdmin, (req, res) => {
    console.log('✅ /api/auth/test-admin - Admin access successful');

    res.json({
        success: true,
        message: 'Admin access successful',
        user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        },
        timestamp: new Date().toISOString()
    });
});

// Direct database test route (bypasses session for debugging)
router.get("/debug-user/:id", async (req, res) => {
    try {
        const User = require("../models/User");
        const user = await User.findById(req.params.id).lean();

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found',
                requestedId: req.params.id
            });
        }

        console.log('🔍 Debug user found:', {
            id: user._id,
            email: user.email,
            role: user.role,
            roleType: typeof user.role,
            isAdmin: user.role === 'admin'
        });

        res.json({
            success: true,
            user: user,
            role: user.role,
            roleType: typeof user.role,
            isAdmin: user.role === 'admin',
            sessionMatch: req.session?.userId === user._id.toString()
        });
    } catch (error) {
        console.error('❌ Debug user error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            requestedId: req.params.id
        });
    }
});

// Check current session user against database
router.get("/verify-session", async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.json({
                success: false,
                message: "No active session",
                loggedIn: false
            });
        }

        const User = require("../models/User");
        const user = await User.findById(req.session.userId).lean();

        if (!user) {
            // Clear invalid session
            if (req.session) {
                req.session.destroy();
            }

            return res.json({
                success: false,
                message: "User not found in database",
                loggedIn: false,
                sessionCleared: true
            });
        }

        console.log('✅ Session verified for user:', {
            id: user._id,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            loggedIn: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            sessionValid: true,
            isAdmin: user.role === 'admin'
        });
    } catch (error) {
        console.error('❌ Session verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Protected route (requires session)
router.get("/me", getCurrentUser);

// Logout endpoint (FIXED - No cookie clearing needed)
router.post("/logout", (req, res) => {
    console.log('🔐 Logout requested');

    const userId = req.session?.userId;

    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to logout'
            });
        }

        console.log('✅ User logged out:', userId);

        // ✅ FIXED: No need to clear cookie manually, session.destroy() handles it
        res.json({
            success: true,
            message: 'Logged out successfully',
            loggedOutUserId: userId
        });
    });
});

module.exports = router;