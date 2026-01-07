// models/Faculty.js
const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true
    },

    // ✅ MANUAL initials ONLY (no auto-generation)
    initials: {
      type: String,
      uppercase: true,
      trim: true,
      maxlength: 10,
      required: true,
      unique: true // Initials should be unique for faculty
    },

    department: {
      type: String,
      required: true,
      trim: true
    },

    // Optional fields
    phone: { 
      type: String,
      default: ""
    },
    
    officeLocation: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Reference to user account (if they have one for login)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Rating statistics (updated when ratings change)
    ratingStats: {
      teachingQuality: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
      helpfulness: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
facultySchema.index({ department: 1 });
facultySchema.index({ initials: 1 }, { unique: true });
facultySchema.index({ email: 1 }, { unique: true });

// Update rating stats method
facultySchema.methods.updateRatingStats = function(ratings) {
  if (ratings.length === 0) {
    this.ratingStats = {
      teachingQuality: 0,
      engagement: 0,
      helpfulness: 0,
      overall: 0,
      totalRatings: 0,
      lastUpdated: new Date()
    };
  } else {
    const avgTeaching = ratings.reduce((sum, r) => sum + r.teachingQuality, 0) / ratings.length;
    const avgEngagement = ratings.reduce((sum, r) => sum + r.engagement, 0) / ratings.length;
    const avgHelpfulness = ratings.reduce((sum, r) => sum + r.helpfulness, 0) / ratings.length;
    const overall = (avgTeaching + avgEngagement + avgHelpfulness) / 3;

    this.ratingStats = {
      teachingQuality: parseFloat(avgTeaching.toFixed(2)),
      engagement: parseFloat(avgEngagement.toFixed(2)),
      helpfulness: parseFloat(avgHelpfulness.toFixed(2)),
      overall: parseFloat(overall.toFixed(2)),
      totalRatings: ratings.length,
      lastUpdated: new Date()
    };
  }
  
  return this.save();
};

module.exports = mongoose.model("Faculty", facultySchema);