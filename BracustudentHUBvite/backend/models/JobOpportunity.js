const mongoose = require("mongoose");

const jobOpportunitySchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, "Job title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  company: {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true
    },
    logo: String,
    description: String,
    website: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    isAlumniCompany: {
      type: Boolean,
      default: false
    }
  },
  
  // Job Details
  description: {
    type: String,
    required: [true, "Job description is required"],
    maxlength: [2000, "Description cannot exceed 2000 characters"]
  },
  shortDescription: {
    type: String,
    required: [true, "Short description is required"],
    maxlength: [200, "Short description cannot exceed 200 characters"]
  },
  
  // Categorization
  type: {
    type: String,
    required: true,
    enum: ['part-time', 'full-time', 'contract', 'freelance', 'remote', 'hybrid'],
    default: 'part-time'
  },
  category: {
    type: String,
    required: true,
    enum: [
      'retail', 'food-service', 'tutoring', 'research', 
      'admin', 'tech-support', 'customer-service', 'delivery',
      'on-campus', 'off-campus', 'other'
    ]
  },
  
  // Requirements
  requirements: {
    educationLevel: {
      type: String,
      enum: ['any', 'high-school', 'undergraduate', 'graduate', 'phd'],
      default: 'any'
    },
    skills: [String],
    experience: {
      type: String,
      enum: ['none', '0-1', '1-3', '3-5', '5+'],
      default: 'none'
    },
    minGPA: {
      type: Number,
      min: 0,
      max: 4.0
    }
  },
  
  // Compensation & Hours
  compensation: {
    type: {
      type: String,
      enum: ['hourly', 'salary', 'stipend', 'commission', 'unpaid'],
      default: 'hourly'
    },
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    benefits: [String]
  },
  hoursPerWeek: {
    min: Number,
    max: Number,
    flexible: {
      type: Boolean,
      default: false
    }
  },
  
  // Location & Schedule
  location: {
    type: {
      type: String,
      enum: ['on-site', 'remote', 'hybrid'],
      default: 'on-site'
    },
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  schedule: {
    shifts: [String],
    startDate: Date,
    endDate: Date,
    duration: String // temporary/permanent
  },
  
  // Application Process
  applicationProcess: {
    deadline: Date,
    method: {
      type: String,
      enum: ['email', 'website', 'portal', 'in-person'],
      default: 'website'
    },
    applicationLink: String,
    contactEmail: String,
    documentsRequired: [String],
    instructions: String
  },
  
  // Status & Metadata
  status: {
    type: String,
    enum: ['active', 'filled', 'expired', 'cancelled'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isUrgent: {
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
  
  // Timestamps
  postedBy: {
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
jobOpportunitySchema.index({ title: 'text', description: 'text', 'company.name': 'text' });
jobOpportunitySchema.index({ category: 1, type: 1, status: 1, 'location.type': 1 });
jobOpportunitySchema.index({ 'compensation.amount': -1 });
jobOpportunitySchema.index({ isFeatured: -1, isUrgent: -1, createdAt: -1 });

module.exports = mongoose.model("JobOpportunity", jobOpportunitySchema);