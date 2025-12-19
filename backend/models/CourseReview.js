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
    department: {
        type: String,
        enum: ['CSE', 'EEE', 'ECO', 'ENG', 'MAT', 'PHY', 'BUS', 'LAW', 'OTHERS'],
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
    isApproved: {
        type: Boolean,
        default: true
    },
    isReported: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for search optimization
courseReviewSchema.index({ courseCode: 1, createdAt: -1 });
courseReviewSchema.index({ studentEmail: 1, courseCode: 1 });
courseReviewSchema.index({ rating: 1 });

const CourseReview = mongoose.model('CourseReview', courseReviewSchema);

module.exports = CourseReview;