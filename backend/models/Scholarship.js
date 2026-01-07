const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Scholarship title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  organization: {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
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
    }
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [250, 'Short description cannot exceed 250 characters']
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'academic-merit',
      'need-based',
      'athletic',
      'minority',
      'women',
      'international',
      'graduate',
      'undergraduate',
      'research',
      'creative-arts',
      'stem',
      'humanities',
      'social-sciences',
      'business',
      'engineering',
      'medical',
      'law',
      'community-service',
      'leadership',
      'other'
    ]
  },
  
  type: {
    type: String,
    required: [true, 'Scholarship type is required'],
    enum: [
      'full-tuition',
      'partial-tuition',
      'room-board',
      'book-stipend',
      'travel-grant',
      'research-grant',
      'fellowship',
      'bursary',
      'award',
      'prize',
      'Full-tuition',
      'Partial-tuition',
      'Room-board',
      'Book-stipend',
      'Travel-grant',
      'Research-grant',
      'Fellowship',
      'Bursary',
      'Award',
      'Prize',
	  'Partial'
    ]
  },
  
  // Award Details
  awardAmount: {
    type: Number,
    required: [true, 'Award amount is required'],
    min: [0, 'Award amount cannot be negative']
  },
  
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'BDT'],
    default: 'USD'
  },
  
  isRenewable: {
    type: Boolean,
    default: false
  },
  
  renewalConditions: {
    type: String,
    trim: true
  },
  
  numberOfAwards: {
    type: Number,
    default: 1,
    min: [1, 'Number of awards must be at least 1']
  },
  
  // Eligibility Criteria
  eligibility: {
    educationLevel: {
      type: [String],
      enum: [
        'high-school',
        'undergraduate',
        'graduate',
        'phd',
        'postdoc',
        'any'
      ],
      default: ['undergraduate']
    },
    
    nationality: {
      type: [String],
      default: ['any']
    },
    
    residencyStatus: {
      type: [String],
      default: ['any'],
      enum: ['citizen', 'permanent-resident', 'international', 'any']
    },
    
    fieldOfStudy: {
      type: [String],
      default: []
    },
    
    minGPA: {
      type: Number,
      min: 0,
      max: 4.0
    },
    
    ageRange: {
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      }
    },
    
    incomeLevel: {
      type: String,
      enum: ['low-income', 'middle-income', 'high-income', 'any'],
      default: 'any'
    },
    
    disabilities: {
      type: Boolean,
      default: false
    },
    
    firstGeneration: {
      type: Boolean,
      default: false
    },
    
    militaryAffiliation: {
      type: Boolean,
      default: false
    }
  },
  
  // Application Details
  applicationDetails: {
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required']
    },
    
    applicationLink: {
      type: String,
      required: [true, 'Application link is required'],
      trim: true
    },
    
    contactEmail: {
      type: String,
      trim: true,
      default: ''
    },
    
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    
    documentsRequired: {
      type: [String],
      default: []
    },
    
    essayTopics: {
      type: [String],
      default: []
    },
    
    recommendationLetters: {
      type: Number,
      default: 0,
      min: [0, 'Cannot have negative recommendation letters']
    },
    
    interviewRequired: {
      type: Boolean,
      default: false
    },
    
    instructions: {
      type: String,
      trim: true,
      default: ''
    },
    
    selectionProcess: {
      type: String,
      trim: true,
      default: ''
    }
  },
  
  // Important Dates
  dates: {
    applicationOpen: {
      type: Date,
      default: Date.now
    },
    
    applicationClose: {
      type: Date
    },
    
    semiFinalistsAnnounced: {
      type: Date
    },
    
    finalistsAnnounced: {
      type: Date
    },
    
    winnersAnnounced: {
      type: Date
    },
    
    fundsDisbursed: {
      type: Date
    }
  },
  
  // Selection Criteria
  selectionCriteria: {
    type: [String],
    default: []
  },
  
  // Benefits Beyond Money
  additionalBenefits: {
    type: [String],
    default: []
  },
  
  // Statistics & Tracking
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
  
  // Status & Settings
  status: {
    type: String,
    enum: ['draft', 'Draft', 'active', 'Active', 'closed', 'Closed', 'archived', 'Archived'],
    default: 'draft'
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isEligibleForCredit: {
    type: Boolean,
    default: false
  },
  
  isNeedBased: {
    type: Boolean,
    default: false
  },
  
  isMeritBased: {
    type: Boolean,
    default: false
  },
  
  // Meta Information
  tags: {
    type: [String],
    default: []
  },
  
  keywords: {
    type: [String],
    default: []
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
scholarshipSchema.index({ title: 'text', description: 'text', 'organization.name': 'text' });
scholarshipSchema.index({ category: 1 });
scholarshipSchema.index({ type: 1 });
scholarshipSchema.index({ status: 1 });
scholarshipSchema.index({ 'applicationDetails.deadline': 1 });
scholarshipSchema.index({ isFeatured: 1 });
scholarshipSchema.index({ awardAmount: 1 });
scholarshipSchema.index({ currency: 1 });

// Virtual for days remaining
scholarshipSchema.virtual('daysRemaining').get(function() {
  if (!this.applicationDetails?.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.applicationDetails.deadline);
  const diffTime = deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for application status
scholarshipSchema.virtual('applicationStatus').get(function() {
  if (!this.applicationDetails?.deadline) return 'open';
  const now = new Date();
  const deadline = new Date(this.applicationDetails.deadline);
  return now > deadline ? 'closed' : 'open';
});

// Virtual for formatted award amount
scholarshipSchema.virtual('formattedAward').get(function() {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(this.awardAmount || 0);
});

// Currency symbol mapping
scholarshipSchema.virtual('currencySymbol').get(function() {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'BDT': '৳'
  };
  return symbols[this.currency] || '$';
});

// 🔥 SIMPLIFIED PRE-SAVE MIDDLEWARE (NO next() ERROR)
scholarshipSchema.pre('save', function() {
  // Only generate keywords if title or organization name exists
  if (this.title || this.organization?.name) {
    this.keywords = [
      this.title,
      this.organization?.name,
      this.category,
      this.type,
      ...(this.tags || [])
    ]
    .filter(Boolean)
    .map(keyword => String(keyword).toLowerCase().trim())
    .filter(keyword => keyword.length > 0);
  }
  
  // Set applicationClose date if not set
  if (!this.dates?.applicationClose && this.applicationDetails?.deadline) {
    if (!this.dates) this.dates = {};
    this.dates.applicationClose = this.applicationDetails.deadline;
  }
});

module.exports = mongoose.model('Scholarship', scholarshipSchema);