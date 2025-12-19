const mongoose = require('mongoose');

const courseContentSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: [true, 'Course code is required'],
        uppercase: true,
        trim: true,
        index: true
    },
    courseName: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true
    },
    programCode: {
        type: String,
        required: [true, 'Program code is required'],
        uppercase: true,
        trim: true,
        index: true
    },
    programName: {
        type: String,
        required: [true, 'Program name is required'],
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
        max: new Date().getFullYear() + 1
    },
    contentType: {
        type: String,
        required: true,
        enum: ['syllabus', 'lecture_notes', 'assignment', 'lab_manual', 'exam', 'textbook', 'other'],
        default: 'other'
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required']
    },
    fileName: {
        type: String,
        required: [true, 'File name is required']
    },
    fileSize: {
        type: Number,
        required: true,
        min: 0
    },
    fileType: {
        type: String,
        required: true,
        default: 'application/pdf'
    },
    uploadedBy: {
        type: String,
        required: true,
        trim: true
    },
    uploadedByEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    uploadedByRole: {
        type: String,
        required: true,
        enum: ['student', 'instructor', 'admin'],
        default: 'student'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    isApproved: {
        type: Boolean,
        default: false // Students uploads need approval
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    reports: [{
        reportedBy: String,
        reportedByEmail: String,
        reason: String,
        date: { type: Date, default: Date.now }
    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    version: {
        type: String,
        default: '1.0'
    },
    isLatest: {
        type: Boolean,
        default: true
    },
    replaces: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseContent'
    },
    comments: [{
        userEmail: String,
        userName: String,
        comment: String,
        date: { type: Date, default: Date.now },
        isEdited: { type: Boolean, default: false }
    }],
    metadata: {
        pages: Number,
        author: String,
        publisher: String,
        edition: String,
        isbn: String
    }
}, {
    timestamps: true
});

// Remove problematic middleware - handle sync in controller instead
// courseContentSchema.pre('save', function(next) {
//     if (this.isModified('isApproved')) {
//         this.status = this.isApproved ? 'approved' : 'pending';
//     }
//     next();
// });

// Indexes for efficient querying
courseContentSchema.index({ courseCode: 1, contentType: 1, createdAt: -1 });
courseContentSchema.index({ programCode: 1, semester: 1, year: 1 });
courseContentSchema.index({ uploadedByEmail: 1, createdAt: -1 });
courseContentSchema.index({ tags: 1 });
courseContentSchema.index({ isApproved: 1 });
courseContentSchema.index({ status: 1 });
courseContentSchema.index({ uploadedByRole: 1 });

const CourseContent = mongoose.model('CourseContent', courseContentSchema);

module.exports = CourseContent;