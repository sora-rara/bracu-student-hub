// models/Group.js
const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    attachments: [{
        filename: String,
        url: String,
        fileType: String
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    type: {
        type: String,
        enum: ['study', 'transport'],
        required: true
    },
    privacy: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    genderRestriction: {
        type: String,
        enum: ['any', 'female-only', 'male-only'],
        default: 'any'
    },
    status: {
        type: String,
        enum: ['active', 'full', 'inactive', 'archived', 'suspended'],
        default: 'active'
    },
    createdFromPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NeedPost'
    },
    // Study-specific fields
    subject: String,
    courseCode: String,
    meetingSchedule: String,
    meetingLocation: String,
    // Transport-specific fields
    route: String,
    vehicleType: String,
    schedule: String,
    pickupLocation: String,
    dropoffLocation: String,
    // Members
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorName: String,
    creatorRole: {
        type: String,
        enum: ['student'],
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: String,
        email: String,
        role: {
            type: String,
            enum: ['member', 'moderator'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    joinRequests: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
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
    // Capacity
    maxMembers: {
        type: Number,
        required: true,
        min: 2,
        max: 50
    },
    // Activity tracking
    lastActivity: {
        type: Date,
        default: Date.now
    },
    lastMessageAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual for current member count
groupSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Check if group is full
groupSchema.methods.isFull = function () {
    return this.members.length >= this.maxMembers;
};

// Check if user is member
groupSchema.methods.isMember = function (userId) {
    return this.members.some(member => member.user.toString() === userId.toString());
};

// Check if user has pending request
groupSchema.methods.hasPendingRequest = function (userId) {
    return this.joinRequests.some(request =>
        request.user.toString() === userId.toString() &&
        request.status === 'pending'
    );
};

// Check if user is moderator
groupSchema.methods.isModerator = function (userId) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    return member && member.role === 'moderator';
};

// Update timestamp
groupSchema.pre('save', function () {
    this.updatedAt = new Date();

    // Auto-update status based on capacity
    if (this.members.length >= this.maxMembers) {
        this.status = 'full';
    } else if (this.status === 'full' && this.members.length < this.maxMembers) {
        this.status = 'active';
    }

    // Set privacy based on type - transport groups are always private
    if (this.type === 'transport') {
        this.privacy = 'private';
    }

    // Check inactivity (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (this.lastActivity < thirtyDaysAgo && this.status === 'active') {
        this.status = 'inactive';
    }
});

// Indexes
groupSchema.index({ type: 1, status: 1, createdAt: -1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ status: 1, lastActivity: 1 });
groupSchema.index({ privacy: 1, type: 1 });

const Group = mongoose.model('Group', groupSchema);
const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

module.exports = { Group, GroupMessage };