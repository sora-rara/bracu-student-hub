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
  
  // Type & Duration
  type: {
    type: String,
    enum: ['summer', 'fall', 'winter', 'spring', 'year-round', 'co-op', 'virtual'],
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
  
  // Categorization
  category: {
    type: String,
    required: true,
    enum: [
      'engineering', 'computer-science', 'business', 'marketing',
      'finance', 'healthcare', 'education', 'research',
      'non-profit', 'government', 'media', 'design',
      'data-science', 'cybersecurity', 'other'
    ]
  },
  majors: [String], // Targeted majors
  
  // Requirements
  requirements: {
    educationLevel: {
      type: String,
      enum: ['undergraduate', 'graduate', 'phd', 'any'],
      default: 'undergraduate'
    },
    yearInSchool: [String], // freshman, sophomore, junior, senior
    minGPA: Number,
    skills: [String],
    prerequisites: [String]
  },
  
  // Compensation
  compensation: {
    type: {
      type: String,
      enum: ['paid', 'unpaid', 'stipend', 'academic-credit', 'housing-provided'],
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
      enum: ['on-site', 'remote', 'hybrid'],
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
    enum: ['active', 'filled', 'expired', 'closed'],
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