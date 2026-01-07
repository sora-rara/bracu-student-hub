// models/NeedPost.js
const mongoose = require('mongoose');

const needPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: false,
        trim: true,
        maxlength: 500
    },
    type: {
        type: String,
        enum: ['study', 'transport'],
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'CreatedBy is required'] // ✅ Better error message
    },
    createdByName: {
        type: String,
        required: [true, 'CreatedByName is required']
    },
    createdByEmail: {
        type: String,
        required: [true, 'CreatedByEmail is required']
    },
    createdByRole: {
        type: String,
        enum: ['student'],
        required: true
    },
    genderPreference: {
        type: String,
        enum: ['any', 'female-only', 'male-only'],
        default: 'any'
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'fulfilled', 'archived', 'flagged'],
        default: 'open'
    },
    // Study-specific fields
    subject: {
        type: String,
        trim: true
    },
    courseCode: {
        type: String,
        trim: true
    },
    meetingFrequency: {
        type: String,
        enum: ['once', 'weekly', 'bi-weekly', 'monthly', 'flexible']
    },
    // Transport-specific fields
    route: {
        type: String,
        trim: true
    },
    vehicleType: {
        type: String,
        enum: ['car', 'motorcycle', 'bus', 'rickshaw', 'cng', 'any']
    },
    schedule: {
        type: String,
        enum: ['daily', 'weekdays', 'weekends', 'specific-days']
    },
    // Common fields
    maxMembers: {
        type: Number,
        default: 1,
        min: 1,
        max: 8
    },
    currentMembers: {
        type: Number,
        default: 1
    },
    expirationDate: {
        type: Date,
        default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    interestedUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        email: String,
        message: String,
        requestedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
needPostSchema.pre('save', function () {
    this.updatedAt = new Date();
});

// Index for better queries
needPostSchema.index({ type: 1, status: 1, createdAt: -1 });
needPostSchema.index({ createdBy: 1 });
needPostSchema.index({ status: 1, expirationDate: 1 });

const NeedPost = mongoose.model('NeedPost', needPostSchema);
module.exports = NeedPost;