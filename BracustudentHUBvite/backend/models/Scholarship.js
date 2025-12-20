const mongoose = require(mongoose);

const scholarshipSchema = new mongoose.Schema({
   Basic Info
  name {
    type String,
    required [true, Scholarship name is required],
    trim true,
    maxlength [150, Name cannot exceed 150 characters]
  },
  provider {
    name {
      type String,
      required [true, Provider name is required],
      trim true
    },
    type {
      type String,
      enum ['university', 'government', 'corporate', 'non-profit', 'private', 'alumni'],
      default 'university'
    },
    logo String,
    description String,
    website String,
    isVerified {
      type Boolean,
      default true
    }
  },
  
   Scholarship Details
  description {
    type String,
    required [true, Scholarship description is required],
    maxlength [2000, Description cannot exceed 2000 characters]
  },
  shortDescription {
    type String,
    required [true, Short description is required],
    maxlength [200, Short description cannot exceed 200 characters]
  },
  
   Award Details
  award {
    type {
      type String,
      enum ['tuition', 'stipend', 'research-grant', 'travel', 'full-ride', 'partial'],
      default 'tuition'
    },
    amount Number,
    currency {
      type String,
      default 'USD'
    },
    renewable {
      type Boolean,
      default false
    },
    duration String  one-time, annual, etc.
  },
  
   Eligibility Criteria
  eligibility {
     Academic
    minGPA Number,
    requiredMajors [String],
    requiredCourses [String],
    academicLevel {
      type [String],
      enum ['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'phd'],
      default ['freshman', 'sophomore', 'junior', 'senior']
    },
    
     Demographic
    citizenship [String],
    residency [String],
    ethnicity [String],
    gender {
      type String,
      enum ['any', 'male', 'female', 'non-binary']
    },
    
     Financial
    financialNeed {
      type Boolean,
      default false
    },
    incomeBracket {
      min Number,
      max Number
    },
    
     Other
    activities [String],  extracurriculars
    essaysRequired Boolean,
    recommendationsRequired Number,
    testScores {
      sat {
        min Number,
        max Number
      },
      act {
        min Number,
        max Number
      }
    }
  },
  
   Application Process
  application {
    deadline Date,
    openDate Date,
    applicationLink String,
    contactEmail String,
    documentsRequired [String],
    instructions String,
    notificationDate Date
  },
  
   Categorization
  category {
    type String,
    required true,
    enum [
      'academic-merit', 'athletic', 'need-based', 'minority',
      'field-specific', 'leadership', 'community-service', 
      'creative-arts', 'research', 'study-abroad', 'other'
    ]
  },
  tags [String],
  
   Status & Metadata
  status {
    type String,
    enum ['active', 'closed', 'awarded', 'suspended'],
    default 'active'
  },
  isFeatured {
    type Boolean,
    default false
  },
  isExclusive {
    type Boolean,
    default false
  },
  
   Statistics
  totalAwards Number,  total number of awards available
  applicantsCount {
    type Number,
    default 0
  },
  views {
    type Number,
    default 0
  },
  
   Timestamps
  postedBy {
    type mongoose.Schema.Types.ObjectId,
    ref 'User'
  },
  createdAt {
    type Date,
    default Date.now
  },
  updatedAt {
    type Date,
    default Date.now
  }
}, {
  timestamps true
});

 Indexes
scholarshipSchema.index({ name 'text', description 'text', 'provider.name' 'text' });
scholarshipSchema.index({ category 1, 'eligibility.academicLevel' 1, status 1 });
scholarshipSchema.index({ 'award.amount' -1, 'application.deadline' 1 });
scholarshipSchema.index({ isFeatured -1, isExclusive -1, createdAt -1 });

module.exports = mongoose.model(Scholarship, scholarshipSchema);