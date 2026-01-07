// models/JobApplication.js
const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'submitted', 'reviewed', 'shortlisted', 'interview-scheduled', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  
  applicationData: {
    phoneNumber: String,
    resume: String,
    coverLetter: String,
    availability: String,
    preferredHours: String,
    relevantSkills: [String],
    previousExperience: String,
    references: [{
      name: String,
      email: String,
      phone: String,
      relationship: String
    }],
    additionalInfo: String,
    expectedSalary: Number
  },
  
  academicInfo: {
    currentGPA: Number,
    major: String,
    universityId: String,
    academicAchievements: [String]
  },
  
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  reviewedAt: Date,
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound indexes
jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ studentId: 1 });
jobApplicationSchema.index({ jobId: 1, status: 1 });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;