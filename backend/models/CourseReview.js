const mongoose = require('mongoose');

const courseReviewSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: [true, 'Course code is required'],
        uppercase: true,
        trim: true
    },
    courseTitle: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true
    },
    semester: {
        type: String,
        required: true,
        enum: ['Spring', 'Summer', 'Fall']
    },
    year: {
        type: Number,
        required: true,
        min: 2000,
        max: new Date().getFullYear()
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    difficulty: {
        type: Number,
        required: [true, 'Difficulty rating is required'],
        min: 1,
        max: 5
    },
    contentRating: {
        type: Number,
        required: [true, 'Content rating is required'],
        min: 1,
        max: 5
    },
    instructorRating: {
        type: Number,
        required: [true, 'Instructor rating is required'],
        min: 1,
        max: 5
    },
    overallSatisfaction: {
        type: Number,
        required: [true, 'Overall satisfaction is required'],
        min: 1,
        max: 5
    },
    reviewText: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [10, 'Review must be at least 10 characters'],
        maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    anonymous: {
        type: Boolean,
        default: false
    },
    studentEmail: {
        type: String,
        required: [true, 'Student email is required'],
        lowercase: true,
        trim: true
    },
    studentName: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    program: {
        type: String,
        enum: ['CSE', 'EEE', 'ECO', 'ENG', 'MAT', 'PHY', 'CHE', 'BIO', 'BUS', 'MBA', 'LAW', 'PHARM', 'ARCH', 'ENV', 'OTHERS'],
        default: 'OTHERS'
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    reportCount: {
        type: Number,
        default: 0
    },
    reportReason: {
        type: String,
        default: null
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isReported: {
        type: Boolean,
        default: false
    },
    rejectionReason: {
        type: String,
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for search optimization
courseReviewSchema.index({ courseCode: 1, createdAt: -1 });
courseReviewSchema.index({ studentEmail: 1, courseCode: 1 });
courseReviewSchema.index({ rating: 1 });
courseReviewSchema.index({ isApproved: 1, isReported: 1 });

// Virtual property to get review status
courseReviewSchema.virtual('status').get(function() {
    if (this.rejectionReason) return 'rejected';
    if (!this.isApproved) return 'pending';
    if (this.isReported) return 'reported';
    return 'approved';
});

// Instance method to approve review
courseReviewSchema.methods.approve = function() {
    this.isApproved = true;
    this.isReported = false;
    this.reportCount = 0;
    this.reportReason = null;
    this.rejectionReason = null;
    this.rejectedAt = null;
    return this.save();
};

// Instance method to reject review
courseReviewSchema.methods.reject = function(reason) {
    this.isApproved = false;
    this.rejectionReason = reason;
    this.rejectedAt = new Date();
    return this.save();
};

// Instance method to report review
courseReviewSchema.methods.report = function(reason) {
    this.isReported = true;
    this.reportReason = reason;
    this.reportCount += 1;
    return this.save();
};

// FIXED: Use async function for pre-save middleware - no next parameter needed
courseReviewSchema.pre('save', async function() {
    // If review is rejected, ensure it's not approved
    if (this.rejectionReason) {
        this.isApproved = false;
    }
    
    // If review is approved, clear rejection data
    if (this.isApproved) {
        this.rejectionReason = null;
        this.rejectedAt = null;
    }
    
    // If review is reported but being approved, clear report data
    if (this.isApproved && this.isReported) {
        this.isReported = false;
        this.reportCount = 0;
        this.reportReason = null;
    }
    
    // Ensure courseCode is uppercase
    if (this.courseCode && typeof this.courseCode === 'string') {
        this.courseCode = this.courseCode.toUpperCase().trim();
    }
    
    // Ensure studentEmail is lowercase
    if (this.studentEmail && typeof this.studentEmail === 'string') {
        this.studentEmail = this.studentEmail.toLowerCase().trim();
    }
    
    // Ensure program has a default
    if (!this.program) {
        this.program = 'OTHERS';
    }
    
    // Ensure courseTitle has a default if not provided
    if (!this.courseTitle && this.courseCode) {
        this.courseTitle = `Course ${this.courseCode}`;
    }
    
    // Continue with save - no need to call next()
});

// REMOVED: The problematic pre-validate middleware
// Instead, we handle all transformations in pre-save

// Static method to get review statistics
courseReviewSchema.statics.getStats = async function(courseCode = null) {
    const match = {};
    if (courseCode) {
        match.courseCode = courseCode.toUpperCase();
    }
    
    return await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { 
                    $sum: { 
                        $cond: [
                            { $and: [
                                { $eq: ['$isApproved', false] },
                                { $eq: ['$rejectionReason', null] }
                            ]}, 
                            1, 
                            0 
                        ]
                    }
                },
                approved: { 
                    $sum: { 
                        $cond: [
                            { $and: [
                                { $eq: ['$isApproved', true] },
                                { $eq: ['$isReported', false] }
                            ]}, 
                            1, 
                            0 
                        ]
                    }
                },
                reported: { 
                    $sum: { 
                        $cond: [
                            { $eq: ['$isReported', true] }, 
                            1, 
                            0 
                        ]
                    }
                },
                rejected: { 
                    $sum: { 
                        $cond: [
                            { $ne: ['$rejectionReason', null] }, 
                            1, 
                            0 
                        ]
                    }
                }
            }
        }
    ]);
};

// Static method to get course statistics
courseReviewSchema.statics.getCourseStats = async function(courseCode) {
    if (!courseCode) return null;
    
    return await this.aggregate([
        {
            $match: {
                courseCode: courseCode.toUpperCase(),
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
                avgSatisfaction: { $avg: '$overallSatisfaction' },
                lastUpdated: { $max: '$updatedAt' }
            }
        }
    ]);
};

const CourseReview = mongoose.model('CourseReview', courseReviewSchema);

module.exports = CourseReview;