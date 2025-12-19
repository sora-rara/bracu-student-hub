// middleware/adminMiddleware.js
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
    console.log('🔐 [AUTH MIDDLEWARE] Checking auth...');

    // Check both session and user object for compatibility
    const user = req.session.user || (req.session.userId ? await User.findById(req.session.userId) : null);

    if (!user) {
        console.log('❌ No authenticated user found');
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        let userData;
        if (typeof user === 'object' && user._id) {
            // User is already a user object from session
            userData = user;
        } else {
            // Fetch user from database
            userData = await User.findById(req.session.userId);
            
            if (!userData) {
                console.log('❌ User not found in database');
                req.session.destroy();
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }
        }

        console.log('✅ User authenticated:', {
            id: userData._id,
            email: userData.email,
            role: userData.role,
            isAdmin: userData.role === 'admin'
        });

        // Attach user to request for course controllers compatibility
        req.user = {
            id: userData._id.toString(),
            email: userData.email,
            name: userData.name || userData.email,
            role: userData.role
        };
        
        req.session.user = req.user; // Update session for consistency
        req.userId = userData._id.toString();
        req.isAdmin = userData.role === 'admin';

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

    // Check both session and user object for compatibility
    const user = req.session.user || (req.session.userId ? await User.findById(req.session.userId) : null);

    if (!user) {
        console.log('❌ No authenticated user for admin check');
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        let userData;
        if (typeof user === 'object' && user._id) {
            userData = user;
        } else {
            userData = await User.findById(req.session.userId);
            
            if (!userData) {
                console.log('❌ Admin user not found');
                req.session.destroy();
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }
        }

        if (userData.role !== 'admin') {
            console.log('❌ User is not admin:', {
                id: userData._id,
                email: userData.email,
                role: userData.role
            });
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        console.log('✅ Admin access granted:', {
            id: userData._id,
            email: userData.email,
            role: userData.role
        });

        // Attach user to request for course controllers compatibility
        req.user = {
            id: userData._id.toString(),
            email: userData.email,
            name: userData.name || userData.email,
            role: userData.role
        };
        
        req.session.user = req.user; // Update session
        req.userId = userData._id.toString();
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

// Budget middleware
const checkBudgetOwnership = async (req, res, next) => {
    try {
        const transactionId = req.params.id;
        const userId = req.userId || req.session.userId;
        
        const Budget = require('../models/Budget');
        const transaction = await Budget.findById(transactionId);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        if (transaction.studentId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this transaction'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking budget ownership:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Course Review ownership check middleware
const checkReviewOwnership = async (req, res, next) => {
    try {
        const reviewId = req.params.id;
        const userId = req.userId || req.session.userId;
        const userEmail = req.user?.email || req.session.user?.email;
        
        const CourseReview = require('../models/CourseReview');
        const review = await CourseReview.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Check ownership (by email) or admin role
        const isOwner = review.studentEmail === userEmail;
        const isAdmin = req.user?.role === 'admin' || req.session.user?.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this review'
            });
        }
        
        req.review = review;
        next();
    } catch (error) {
        console.error('Error checking review ownership:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Course Content ownership check middleware
const checkContentOwnership = async (req, res, next) => {
    try {
        const contentId = req.params.id;
        const userEmail = req.user?.email || req.session.user?.email;
        const isAdmin = req.user?.role === 'admin' || req.session.user?.role === 'admin';
        
        const CourseContent = require('../models/CourseContent');
        const content = await CourseContent.findById(contentId);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        // Check ownership (by email) or admin role
        const isOwner = content.uploadedByEmail === userEmail;
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this content'
            });
        }
        
        req.content = content;
        next();
    } catch (error) {
        console.error('Error checking content ownership:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = { 
    requireAuth, 
    requireAdmin, 
    checkBudgetOwnership,
    checkReviewOwnership,
    checkContentOwnership 
};