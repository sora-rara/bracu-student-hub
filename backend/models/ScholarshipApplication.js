const mongoose = require('mongoose');

const scholarshipApplicationSchema = new mongoose.Schema({
  // Scholarship Reference
  scholarshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true
  },
  
  // Applicant Information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Application Data (from form)
  applicationData: {
    // Contact Information
    phoneNumber: String,
    universityId: String,
    department: String,
    major: String,
    semester: String,
    year: String,
    cgpa: Number,
    expectedGraduation: Date,
    additionalInfo: String
  },
  
  // Academic Information
  academicInfo: {
    universityId: String,
    major: String,
    currentGPA: Number,
    academicAchievements: [String],
    honors: [String]
  },
  
  // Extracurricular Activities
  extracurriculars: [{
    activityType: {
      type: String,
      enum: ['work', 'volunteer', 'leadership', 'sports', 'arts', 'other']
    },
    organization: String,
    position: String,
    description: String,
    startDate: Date,
    endDate: Date,
    hoursPerWeek: Number
  }],
  
  // Work Experience
  workExperience: [{
    company: String,
    position: String,
    description: String,
    startDate: Date,
    endDate: Date,
    isRelevant: Boolean
  }],
  
  // Essays
  essays: [{
    question: String,
    response: String,
    wordCount: Number
  }],
  
  // References
  references: [{
    name: String,
    email: String,
    phone: String,
    relationship: String,
    organization: String
  }],
  
  // Research Projects
  researchProjects: [{
    title: String,
    description: String,
    role: String,
    duration: String,
    outcome: String
  }],
  
  // Application Status
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under-review',
      'shortlisted',
      'interview-scheduled',
      'interview-completed',
      'accepted',
      'rejected',
      'withdrawn'
    ],
    default: 'submitted'
  },
  
  // Review Information
  review: {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scores: {
      academic: Number,
      extracurricular: Number,
      essay: Number,
      interview: Number,
      overall: Number
    },
    comments: String,
    recommendation: {
      type: String,
      enum: ['accept', 'reject', 'waitlist', 'need-more-info']
    },
    reviewDate: Date
  },
  
  // Timeline
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  reviewedAt: Date,
  decisionDate: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to prevent duplicate applications
scholarshipApplicationSchema.index(
  { scholarshipId: 1, studentId: 1 },
  { unique: true }
);

// Index for status queries
scholarshipApplicationSchema.index({ status: 1 });
scholarshipApplicationSchema.index({ scholarshipId: 1, status: 1 });
scholarshipApplicationSchema.index({ studentId: 1 });
scholarshipApplicationSchema.index({ submittedAt: -1 });

// Virtual for formatted submitted date
scholarshipApplicationSchema.virtual('formattedSubmittedAt').get(function() {
  return this.submittedAt ? this.submittedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
});

// Virtual for scholarship title
scholarshipApplicationSchema.virtual('scholarshipTitle', {
  ref: 'Scholarship',
  localField: 'scholarshipId',
  foreignField: '_id',
  justOne: true
});

// Virtual for student name
scholarshipApplicationSchema.virtual('studentName', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);