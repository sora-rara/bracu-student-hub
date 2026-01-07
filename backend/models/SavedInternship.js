// backend/models/SavedInternship.js
const mongoose = require('mongoose');

const savedInternshipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  },
  notes: String,
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can't save the same internship twice
savedInternshipSchema.index({ user: 1, internship: 1 }, { unique: true });

// Index for quick retrieval of user's saved internships
savedInternshipSchema.index({ user: 1, savedAt: -1 });

module.exports = mongoose.model('SavedInternship', savedInternshipSchema);