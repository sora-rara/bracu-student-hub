
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

// @desc    Get reviews for specific course
// @route   GET /api/course-reviews/course/:courseCode
// @access  Public
exports.getCourseReviews = async (req, res) => {
    try {
        const courseCode = req.params.courseCode.toUpperCase();
        
        const reviews = await CourseReview.find({
            courseCode: courseCode,
            isApproved: true,
            isReported: false
        })
        .sort({ createdAt: -1 })
        .select('-studentEmail');
        
        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Error getting course reviews:', error);
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
        console.log('Session data:', req.session);
        console.log('User data from request:', req.user);
        console.log('Request body:', req.body);
        
        // FIXED: Check for user data in session OR request
        let user = req.session.user || req.user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
        }
        
        // Debug: Log user info
        console.log('Creating review for user:', {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });
        
        const studentEmail = user.email;
        const studentName = user.name;
        
        // Prevent admins from submitting reviews
        if (user.role === 'admin' || user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admins cannot submit reviews. Please use a student account.'
            });
        }
        
        // FIXED: Course code is required
        if (!req.body.courseCode) {
            return res.status(400).json({
                success: false,
                message: 'Course code is required'
            });
        }
        
        // FIXED: Better duplicate checking - allow updates instead of blocking
        const existingReview = await CourseReview.findOne({
            courseCode: req.body.courseCode.toUpperCase(),
            studentEmail: studentEmail
        });
        
        if (existingReview) {
            // Instead of blocking, we'll update the existing review
            console.log('Existing review found, updating instead...');
            
            // Update the existing review
            const updatedReview = await CourseReview.findByIdAndUpdate(
                existingReview._id,
                {
                    ...req.body,
                    courseCode: req.body.courseCode.toUpperCase(),
                    studentEmail,
                    studentName,
                    isApproved: false, // Reset approval status since it's updated
                    isReported: false,
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            );
            
            return res.status(200).json({
                success: true,
                message: 'Review updated successfully! It will be visible after admin approval.',
                data: updatedReview
            });
        }
        
        // All reviews need admin approval by default
        const reviewData = {
            ...req.body,
            courseCode: req.body.courseCode.toUpperCase(),
            studentEmail,
            studentName,
            studentId: user._id || user.id,
            isApproved: false, // Require admin approval
            isReported: false,
            reportCount: 0,
            helpfulCount: 0
        };
        
        // FIXED: Ensure required fields are present
        if (!reviewData.courseTitle) {
            reviewData.courseTitle = `Course ${reviewData.courseCode}`;
        }
        
        if (!reviewData.program) {
            reviewData.program = 'OTHERS';
        }
        
        console.log('Creating review with data:', reviewData);
        
        const review = await CourseReview.create(reviewData);
        
        console.log('Review created successfully:', review._id);
        
        res.status(201).json({
            success: true,
            message: 'Review submitted successfully! It will be visible after admin approval.',
            data: review
        });
    } catch (error) {
        console.error('Error creating review:', error);
        console.error('Error details:', error.message);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
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
            'overallSatisfaction', 'reviewText', 'anonymous', 'semester', 'year',
            'courseTitle', 'program' // FIXED: Allow updating these fields too
        ];
        
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        
        // FIXED: Also reset approval status when updating
        updates.isApproved = false;
        
        review = await CourseReview.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Review updated successfully! It will be visible after admin approval.',
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

// @desc    Get user's review for specific course
// @route   GET /api/course-reviews/user-review/:courseCode
// @access  Private
exports.getUserReview = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const courseCode = req.params.courseCode.toUpperCase();
        const studentEmail = user.email;
        
        const review = await CourseReview.findOne({
            courseCode: courseCode,
            studentEmail: studentEmail
        });
        
        res.json({
            success: true,
            data: review || null
        });
    } catch (error) {
        console.error('Error getting user review:', error);
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
            filter.rejectionReason = null; // Only show truly pending, not rejected
        } else if (status === 'reported') {
            filter.isReported = true;
        } else if (status === 'approved') {
            filter.isApproved = true;
            filter.isReported = false;
        } else if (status === 'rejected') {
            filter.rejectionReason = { $ne: null };
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
            { 
                isApproved: true, 
                isReported: false, 
                reportCount: 0,
                reportReason: null,
                rejectionReason: null,
                rejectedAt: null
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
            message: 'Review approved successfully',
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

// @desc    Admin: Reject review (mark as rejected with reason, not delete)
// @route   PUT /api/course-reviews/admin/reject/:id
// @access  Admin
exports.adminRejectReview = async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required (at least 5 characters)'
            });
        }
        
        const review = await CourseReview.findByIdAndUpdate(
            req.params.id,
            { 
                isApproved: false, 
                rejectionReason: reason,
                rejectedAt: new Date(),
                isReported: false // Clear report status if it was reported
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
            message: 'Review rejected successfully',
            data: review
        });
    } catch (error) {
        console.error('Error rejecting review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Delete review permanently
// @route   DELETE /api/course-reviews/admin/:id
// @access  Admin
exports.adminDeleteReview = async (req, res) => {
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
            message: 'Review deleted permanently'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
