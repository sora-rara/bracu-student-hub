const CourseReview = require('../models/CourseReview');

// @desc    Get all course reviews
// @route   GET /api/course-reviews
// @access  Public
exports.getAllReviews = async (req, res) => {
    try {
        const { courseCode, department, minRating, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        let filter = { isApproved: true, isReported: false };
        
        if (courseCode) {
            filter.courseCode = courseCode.toUpperCase();
        }
        
        if (department) {
            filter.department = department.toUpperCase();
        }
        
        if (minRating) {
            filter.rating = { $gte: parseInt(minRating) };
        }
        
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const reviews = await CourseReview.find(filter)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-studentEmail');
        
        const total = await CourseReview.countDocuments(filter);
        
        res.json({
            success: true,
            count: reviews.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: reviews
        });
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single course review
// @route   GET /api/course-reviews/:id
// @access  Public
exports.getReview = async (req, res) => {
    try {
        const review = await CourseReview.findOne({
            _id: req.params.id,
            isApproved: true,
            isReported: false
        }).select('-studentEmail');
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Error getting review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get course statistics
// @route   GET /api/course-reviews/stats/:courseCode
// @access  Public
exports.getCourseStats = async (req, res) => {
    try {
        const courseCode = req.params.courseCode.toUpperCase();
        
        const stats = await CourseReview.aggregate([
            {
                $match: {
                    courseCode: courseCode,
                    isApproved: true,
                    isReported: false
                }
            },
            {
                $group: {
                    _id: '$courseCode',
                    totalReviews: { $sum: 1 },
                    avgRating: { $avg: '$rating' },
                    avgDifficulty: { $avg: '$difficulty' },
                    avgContent: { $avg: '$contentRating' },
                    avgInstructor: { $avg: '$instructorRating' },
                    avgSatisfaction: { $avg: '$overallSatisfaction' }
                }
            }
        ]);
        
        const recentReviews = await CourseReview.find({
            courseCode: courseCode,
            isApproved: true,
            isReported: false
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('-studentEmail');
        
        const ratingDistribution = await CourseReview.aggregate([
            {
                $match: {
                    courseCode: courseCode,
                    isApproved: true,
                    isReported: false
                }
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                stats: stats[0] || null,
                recentReviews,
                ratingDistribution
            }
        });
    } catch (error) {
        console.error('Error getting course stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all courses with reviews
// @route   GET /api/course-reviews/courses/list
// @access  Public
exports.getAllCoursesWithReviews = async (req, res) => {
    try {
        const courses = await CourseReview.aggregate([
            {
                $match: { isApproved: true, isReported: false }
            },
            {
                $group: {
                    _id: {
                        courseCode: '$courseCode',
                        courseTitle: '$courseTitle'
                    },
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    lastReviewDate: { $max: '$createdAt' }
                }
            },
            {
                $project: {
                    _id: 0,
                    courseCode: '$_id.courseCode',
                    courseTitle: '$_id.courseTitle',
                    avgRating: { $round: ['$avgRating', 1] },
                    totalReviews: 1,
                    lastReviewDate: 1
                }
            },
            {
                $sort: { courseCode: 1 }
            }
        ]);
        
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error getting courses list:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create a course review
// @route   POST /api/course-reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email || !user.name) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        const studentName = user.name;
        
        // Check if user already reviewed this course
        const existingReview = await CourseReview.findOne({
            courseCode: req.body.courseCode.toUpperCase(),
            studentEmail: studentEmail
        });
        
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this course'
            });
        }
        
        const reviewData = {
            ...req.body,
            courseCode: req.body.courseCode.toUpperCase(),
            studentEmail,
            studentName
        };
        
        const review = await CourseReview.create(reviewData);
        
        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });
    } catch (error) {
        console.error('Error creating review:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update a course review
// @route   PUT /api/course-reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        
        let review = await CourseReview.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Check ownership
        if (review.studentEmail !== studentEmail) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }
        
        // Prevent updating certain fields
        const allowedUpdates = [
            'rating', 'difficulty', 'contentRating', 'instructorRating',
            'overallSatisfaction', 'reviewText', 'anonymous', 'semester', 'year'
        ];
        
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        
        review = await CourseReview.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete a course review
// @route   DELETE /api/course-reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        const role = user.role;
        
        const review = await CourseReview.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Check ownership or admin
        if (review.studentEmail !== studentEmail && role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }
        
        await review.deleteOne();
        
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Mark review as helpful
// @route   POST /api/course-reviews/:id/helpful
// @access  Public
exports.markHelpful = async (req, res) => {
    try {
        const review = await CourseReview.findByIdAndUpdate(
            req.params.id,
            { $inc: { helpfulCount: 1 } },
            { new: true }
        );
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Marked as helpful',
            helpfulCount: review.helpfulCount
        });
    } catch (error) {
        console.error('Error marking helpful:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Report a review
// @route   POST /api/course-reviews/:id/report
// @access  Private
exports.reportReview = async (req, res) => {
    try {
        const { reason } = req.body;
        
        const review = await CourseReview.findByIdAndUpdate(
            req.params.id,
            {
                $inc: { reportCount: 1 },
                isReported: true,
                reportReason: reason
            },
            { new: true }
        );
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Review reported successfully'
        });
    } catch (error) {
        console.error('Error reporting review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get user's reviews
// @route   GET /api/course-reviews/user/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        
        const reviews = await CourseReview.find({ studentEmail })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Error getting user reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Get all reviews (including pending/flagged)
// @route   GET /api/course-reviews/admin/all
// @access  Admin
exports.adminGetAllReviews = async (req, res) => {
    try {
        const { status, courseCode, page = 1, limit = 20 } = req.query;
        
        let filter = {};
        
        if (status === 'pending') {
            filter.isApproved = false;
        } else if (status === 'reported') {
            filter.isReported = true;
        } else if (status === 'approved') {
            filter.isApproved = true;
            filter.isReported = false;
        }
        
        if (courseCode) {
            filter.courseCode = courseCode.toUpperCase();
        }
        
        const reviews = await CourseReview.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await CourseReview.countDocuments(filter);
        
        res.json({
            success: true,
            count: reviews.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: reviews
        });
    } catch (error) {
        console.error('Error getting admin reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Approve review
// @route   PUT /api/course-reviews/admin/approve/:id
// @access  Admin
exports.adminApproveReview = async (req, res) => {
    try {
        const review = await CourseReview.findByIdAndUpdate(
            req.params.id,
            { isApproved: true, isReported: false, reportCount: 0 },
            { new: true }
        );
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Review approved',
            data: review
        });
    } catch (error) {
        console.error('Error approving review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Reject review
// @route   DELETE /api/course-reviews/admin/reject/:id
// @access  Admin
exports.adminRejectReview = async (req, res) => {
    try {
        const review = await CourseReview.findByIdAndDelete(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Review rejected and deleted'
        });
    } catch (error) {
        console.error('Error rejecting review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};