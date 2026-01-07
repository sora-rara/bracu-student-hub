// models/SavedScholarship.js
const mongoose = require('mongoose');

const savedScholarshipSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scholarshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique combination of student and scholarship
savedScholarshipSchema.index({ studentId: 1, scholarshipId: 1 }, { unique: true });

module.exports = mongoose.model('SavedScholarship', savedScholarshipSchema);