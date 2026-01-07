// models/Application.js
const mongoose = require('mongoose');

const workExperienceSchema = new mongoose.Schema({
  company: String,
  position: String,
  duration: String,
  description: String
});

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  technologies: [String],
  link: String
});

const applicationSchema = new mongoose.Schema({
  internshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
    opportunityType: {
    type: String,
    required: true,
    enum: ['internship', 'scholarship', 'part-time-job', 'event'],
    default: 'internship'
  },
  // Personal Information
  phoneNumber: String,
  cgpa: Number,
  semester: String,
  department: String,
  major: String,
  year: String,
  expectedGraduation: Date,
  universityId: String,
  
  // Documents
  resume: String,
  coverLetterFile: String,
  transcript: String,
  portfolio: String,
  otherDocuments: [String],
  
  // Application Content
  coverLetterText: String,
  additionalInfo: String,
  
  // Skills and Experience
  skills: [String],
  workExperience: [workExperienceSchema],
  projects: [projectSchema],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  
  // Meta
  appliedAt: {
    type: Date,
    default: Date.now
  },
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
});

module.exports = mongoose.model('Application', applicationSchema);