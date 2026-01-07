// models/Internship.js - UPDATED VERSION
const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, "Internship title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  organization: {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true
    },
    logo: String,
    description: String,
    website: String,
    industry: String,
    size: String, // small, medium, large
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Internship Details
  description: {
    type: String,
    required: [true, "Internship description is required"],
    maxlength: [3000, "Description cannot exceed 3000 characters"]
  },
  shortDescription: {
    type: String,
    required: [true, "Short description is required"],
    maxlength: [250, "Short description cannot exceed 250 characters"]
  },
  
  // Type & Duration - EXPANDED ENUMS
  type: {
    type: String,
    enum: [
      'summer', 'Summer', 'summer-internship', 'Summer Internship',
      'fall', 'Fall', 'fall-internship', 'Fall Internship', 
      'winter', 'Winter', 'winter-internship', 'Winter Internship',
      'spring', 'Spring', 'spring-internship', 'Spring Internship',
      'year-round', 'Year-Round', 'year-round-internship', 'Year Round Internship',
      'co-op', 'Co-op', 'co-op-program', 'Co-op Program',
      'virtual', 'Virtual', 'virtual/remote', 'Virtual/Remote',
      'part-time', 'Part-Time', 'part-time-internship',
      'full-time', 'Full-Time', 'full-time-internship',
      'project-based', 'Project-Based'
    ],
    default: 'summer'
  },
  duration: {
    startDate: Date,
    endDate: Date,
    months: Number,
    hoursPerWeek: {
      min: Number,
      max: Number
    }
  },
  
  // Categorization - EXPANDED ENUMS
  category: {
    type: String,
    required: true,
    enum: [
      'engineering', 'Engineering',
      'computer-science', 'Computer Science',
      'business', 'Business',
      'marketing', 'Marketing',
      'finance', 'Finance',
      'healthcare', 'Healthcare',
      'education', 'Education',
      'research', 'Research',
      'non-profit', 'Non-Profit',
      'government', 'Government',
      'media', 'Media',
      'design', 'Design',
      'data-science', 'Data Science',
      'cybersecurity', 'Cybersecurity',
      'other', 'Other'
    ]
  },
  majors: [String],
  
  // Requirements
  requirements: {
    educationLevel: {
      type: String,
      enum: ['undergraduate', 'Undergraduate', 'graduate', 'Graduate', 'phd', 'PhD', 'any', 'Any'],
      default: 'undergraduate'
    },
    yearInSchool: [String],
    minGPA: Number,
    skills: [String],
    prerequisites: [String]
  },
  
  // Compensation
  compensation: {
    type: {
      type: String,
      enum: [
        'paid', 'Paid',
        'unpaid', 'Unpaid',
        'stipend', 'Stipend',
        'academic-credit', 'Academic Credit',
        'housing-provided', 'Housing Provided'
      ],
      default: 'unpaid'
    },
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    benefits: [String]
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['on-site', 'On-Site', 'remote', 'Remote', 'hybrid', 'Hybrid'],
      default: 'on-site'
    },
    address: String,
    city: String,
    state: String,
    country: String
  },
  
  // Application Details
  applicationDetails: {
    deadline: Date,
    applicationLink: String,
    contactEmail: String,
    documentsRequired: [String],
    interviewProcess: String,
    startAcceptingDate: Date
  },
  
  // Learning & Development
  learningOutcomes: [String],
  mentorship: {
    provided: Boolean,
    details: String
  },
  skillsGained: [String],
  
  // Status & Metadata
  status: {
    type: String,
    enum: ['active', 'Active', 'draft', 'Draft', 'closed', 'Closed', 'filled', 'Filled', 'expired', 'Expired'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isEligibleForCredit: {
    type: Boolean,
    default: false
  },
  
  // Tracking
  views: {
    type: Number,
    default: 0
  },
  applicationsCount: {
    type: Number,
    default: 0
  },
  savesCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
internshipSchema.index({ title: 'text', description: 'text', 'organization.name': 'text' });
internshipSchema.index({ category: 1, type: 1, status: 1, 'location.type': 1 });
internshipSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 });
internshipSchema.index({ isFeatured: -1, createdAt: -1 });

module.exports = mongoose.model("Internship", internshipSchema);