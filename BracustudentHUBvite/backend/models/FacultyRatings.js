// models/FacultyRating.js
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  teachingQuality: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  engagement: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  helpfulness: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate ratings from same student for same faculty
ratingSchema.index({ facultyId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);