const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // ========================
  // 🔥 CORE EVENT FIELDS
  // ========================
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  start: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function (value) {
        return value >= this.start;
      },
      message: 'End date must be after start date'
    }
  },

  // ========================
  // 🏷️ EVENT TYPE & CATEGORY
  // ========================
  // This is for categorization (academic, personal, etc.)
  eventType: {
    type: String,
    enum: ['academic', 'club', 'exam', 'holiday', 'workshop', 'personal', 'general'],
    default: 'general'
  },

  // This is for event ownership type - CRITICAL FIELD
  eventOwnerType: {
    type: String,
    enum: ['university', 'personal'],
    default: 'personal',
    required: true
  },

  category: {
    type: String,
    default: 'General'
  },

  // ========================
  // 📍 EVENT DETAILS
  // ========================
  location: {
    type: String,
    default: ''
  },
  organizer: {
    type: String,
    default: ''
  },
  isImportant: {
    type: Boolean,
    default: false
  },

  // ========================
  // 👤 OWNERSHIP & PERMISSIONS
  // ========================
  // 🔥 CRITICAL: Who owns this event?
  // University events: userId = null
  // Personal events: userId = actual user ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  userEmail: {
    type: String,
    default: ''
  },

  // Who created this event?
  createdBy: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true
  },

  // ========================
  // 📊 METADATA
  // ========================
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // For soft delete if needed
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  // Add virtuals when converting to JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========================
// 🎯 VIRTUAL PROPERTIES
// ========================
// Virtual for easy access (replaces isUniversityEvent/isPersonalEvent)
eventSchema.virtual('isUniversityEvent').get(function () {
  return this.eventOwnerType === 'university';
});

eventSchema.virtual('isPersonalEvent').get(function () {
  return this.eventOwnerType === 'personal';
});

// Virtual for permission checks
eventSchema.virtual('canView').get(function () {
  // Everyone can view university events
  // Only owner can view personal events
  return this.eventOwnerType === 'university' || this.userId;
});

// ========================
// 🔍 INDEXES
// ========================
eventSchema.index({ start: 1 });
eventSchema.index({ eventOwnerType: 1, start: 1 });
eventSchema.index({ userId: 1, start: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ createdAt: -1 });

// ========================
// 🔧 STATIC METHODS
// ========================
eventSchema.statics.getUniversityEvents = function () {
  return this.find({ eventOwnerType: 'university', isDeleted: false });
};

eventSchema.statics.getPersonalEventsForUser = function (userId) {
  return this.find({
    eventOwnerType: 'personal',
    userId: userId,
    isDeleted: false
  });
};

eventSchema.statics.getEventsForUser = function (userId) {
  return this.find({
    $or: [
      { eventOwnerType: 'university' },
      { userId: userId }
    ],
    isDeleted: false
  });
};

// ========================
// 🎭 INSTANCE METHODS
// ========================
eventSchema.methods.canEdit = function (userId, isAdmin) {
  if (this.eventOwnerType === 'university') {
    return isAdmin; // Only admins can edit university events
  } else {
    // Personal events - only owner can edit
    return this.userId && this.userId.toString() === userId;
  }
};

eventSchema.methods.canDelete = function (userId, isAdmin) {
  if (this.eventOwnerType === 'university') {
    return isAdmin; // Only admins can delete university events
  } else {
    // Personal events - only owner can delete
    return this.userId && this.userId.toString() === userId;
  }
};

eventSchema.methods.isOwnedBy = function (userId) {
  return this.userId && this.userId.toString() === userId;
};

module.exports = mongoose.model('Event', eventSchema);