// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'enterprise'],
      default: 'medium'
    },
    description: {
      type: String,
      trim: true
    }
  },
  
  description: {
    type: String,
    required: true
  },
  
  shortDescription: {
    type: String,
    required: true,
    maxlength: 250
  },
  
  jobType: {
    type: String,
    enum: ['part-time', 'remote', 'on-campus', 'freelance', 'internship'],
    default: 'part-time'
  },
  
  location: {
    type: String,
    default: 'Remote'
  },
  
  salary: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ['USD', 'BDT', 'EUR'],
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'weekly', 'monthly', 'fixed'],
      default: 'hourly'
    }
  },
  
  schedule: {
    type: String,
    enum: ['flexible', 'weekends', 'evenings', 'mornings', 'specific-hours'],
    default: 'flexible'
  },
  
  duration: {
    type: String,
    default: 'Ongoing'
  },
  
  responsibilities: [{
    type: String,
    trim: true
  }],
  
  requirements: [{
    type: String,
    trim: true
  }],
  
  benefits: [{
    type: String,
    trim: true
  }],
  
  deadline: {
    type: Date,
    required: true
  },
  
  contactEmail: {
    type: String,
    trim: true
  },
  
  contactPhone: {
    type: String,
    trim: true
  },
  
  applicationInstructions: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'archived'],
    default: 'draft'
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  applicationsCount: {
    type: Number,
    default: 0
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ title: 'text', description: 'text', 'company.name': 'text' });
jobSchema.index({ status: 1 });
jobSchema.index({ isFeatured: 1 });
jobSchema.index({ deadline: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ location: 1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;